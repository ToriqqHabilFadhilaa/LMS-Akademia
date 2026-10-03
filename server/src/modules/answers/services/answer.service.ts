import { Prisma } from "../../../generated/prisma/client.js";

import { prisma } from "../../../config/database.js";

import {
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "../../../errors/app-error.js";

import type {
    CreateAnswerInput,
    UpdateAnswerInput,
    GradeAnswerInput,
} from "../validators/answer.validator.js";

import {
    expireAttemptIfNeeded,
} from "../../exam-attempts/services/exam-attempt-status.service.js";

const ANSWER_SELECT = {
    id: true,
    attemptId: true,
    attemptQuestionId: true,
    answer: true,
    isCorrect: true,
    points: true,
    attemptQuestion: {
        select: {
            id: true,
            orderNumber: true,
            questionTextSnapshot: true,
            optionsSnapshot: true,
            shuffledOptions: true,
            correctAnswerSnapshot: true,
            pointsSnapshot: true,
            question: {
                select: {
                    id: true,
                    questionType: true,
                },
            },
        },
    },
} satisfies Prisma.AnswerSelect;

const ANSWER_STUDENT_SELECT = {
    id: true,
    attemptId: true,
    attemptQuestionId: true,
    answer: true,
} satisfies Prisma.AnswerSelect;

export const gradeAnswer = async (
    answerId: string,
    graderId: string,
    graderRole: "ADMIN" | "LECTURER",
    input: GradeAnswerInput
) => {
    const answer = await prisma.answer.findUnique({
        where: { id: answerId },
        include: {
            attemptQuestion: {
                include: {
                    question: { select: { questionType: true } },
                },
            },
            attempt: {
                include: {
                    exam: {
                        include: {
                            courseOffering: { select: { lecturerId: true } },
                        },
                    },
                },
            },
        },
    });

    if (!answer) {
        throw new NotFoundError("Answer tidak ditemukan");
    }

    const questionType = answer.attemptQuestion.question.questionType;

    if (questionType !== "ESSAY" && questionType !== "SHORT_ANSWER") {
        throw new ConflictError(
            "Hanya jawaban ESSAY dan SHORT_ANSWER yang dapat dinilai secara manual"
        );
    }

    if (
        graderRole === "LECTURER" &&
        answer.attempt.exam.courseOffering.lecturerId !== graderId
    ) {
        throw new ForbiddenError(
            "Anda tidak memiliki akses untuk menilai jawaban ini"
        );
    }

    const maxPoints = answer.attemptQuestion.pointsSnapshot;

    if (input.points > maxPoints) {
        throw new ConflictError(
            `Poin tidak boleh melebihi poin maksimal soal (${maxPoints})`
        );
    }

    return prisma.answer.update({
        where: { id: answerId },
        data: {
            points: input.points,
            isCorrect: input.points > 0,
        },
        select: ANSWER_SELECT,
    });
};

export const getAttemptAnswersForGrading = async (
    attemptId: string,
    graderId: string,
    graderRole: "ADMIN" | "LECTURER"
) => {
    const attempt = await prisma.examAttempt.findUnique({
        where: { id: attemptId },
        include: {
            exam: {
                include: {
                    courseOffering: { select: { lecturerId: true } },
                },
            },
            student: { select: { id: true, name: true, email: true } },
        },
    });

    if (!attempt) {
        throw new NotFoundError("Exam attempt tidak ditemukan");
    }

    if (
        graderRole === "LECTURER" &&
        attempt.exam.courseOffering.lecturerId !== graderId
    ) {
        throw new ForbiddenError(
            "Anda tidak memiliki akses ke attempt ini"
        );
    }

    const answers = await prisma.answer.findMany({
        where: { attemptId },
        select: ANSWER_SELECT,
        orderBy: { attemptQuestion: { orderNumber: "asc" } },
    });

    return { attempt, answers };
};

export const createAnswer = async (
    studentId: string,
    input: CreateAnswerInput
) => {
    const attemptQuestion =
        await prisma.attemptQuestion.findUnique({
            where: {
                id: input.attemptQuestionId,
            },
            include: {
                attempt: {
                    include: {
                        exam: true,
                    },
                },
                question: {
                    select: {
                        id: true,
                        questionType: true,
                    },
                },
            },
        });

    if (!attemptQuestion) {
        throw new NotFoundError(
            "Attempt question tidak ditemukan"
        );
    }

    const attempt = attemptQuestion.attempt;

    if (attempt.studentId !== studentId) {
        throw new ForbiddenError(
            "Anda tidak dapat menjawab attempt milik student lain"
        );
    }

    if (attempt.status !== "IN_PROGRESS") {
        throw new ConflictError(
            "Attempt exam sudah tidak aktif"
        );
    }

    const expired = await expireAttemptIfNeeded(
        attempt,
        attempt.exam.durationMinutes,
        attempt.exam.endAt
    );

    if (expired) {
        throw new ConflictError(
            "Waktu pengerjaan exam sudah habis"
        );
    }

    const existingAnswer =
        await prisma.answer.findUnique({
            where: {
                attemptQuestionId:
                    input.attemptQuestionId,
            },
        });

    if (existingAnswer) {
        throw new ConflictError(
            "Jawaban untuk question ini sudah dikirim"
        );
    }

    let isCorrect: boolean | null = null;
    let points: number | null = null;

    // Gunakan snapshot, bukan Question master
    const correctAnswer =
        attemptQuestion.correctAnswerSnapshot;

    const questionType =
        attemptQuestion.question.questionType;

    if (
        correctAnswer !== null &&
        (
            questionType === "MULTIPLE_CHOICE" ||
            questionType === "TRUE_FALSE" ||
            questionType === "SHORT_ANSWER"
        )
    ) {
        const submittedAnswer =
            input.answer?.trim().toLowerCase();

        const expectedAnswer =
            correctAnswer.trim().toLowerCase();

        isCorrect =
            submittedAnswer === expectedAnswer;

        points = isCorrect
            ? attemptQuestion.pointsSnapshot
            : 0;
    }

    try {
        return await prisma.answer.create({
            data: {
                attemptId: attempt.id,
                attemptQuestionId:
                    input.attemptQuestionId,
                answer: input.answer ?? null,
                isCorrect,
                points,
            },
            select: ANSWER_STUDENT_SELECT,
        });
    } catch (error) {
        if (
            error instanceof
            Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            throw new ConflictError(
                "Jawaban untuk question ini sudah dikirim"
            );
        }

        throw error;
    }
};

export const getAnswersByAttemptId = async (
    studentId: string,
    attemptId: string
) => {
    const attempt =
        await prisma.examAttempt.findUnique({
            where: {
                id: attemptId,
            },
            select: {
                id: true,
                studentId: true,
            },
        });

    if (!attempt) {
        throw new NotFoundError(
            "Exam attempt tidak ditemukan"
        );
    }

    if (attempt.studentId !== studentId) {
        throw new ForbiddenError(
            "Anda tidak dapat melihat jawaban attempt milik student lain"
        );
    }

    return prisma.answer.findMany({
        where: {
            attemptId,
        },
        select: {
            id: true,
            attemptId: true,
            attemptQuestionId: true,
            answer: true,
        },
        orderBy: {
            attemptQuestion: {
                orderNumber: "asc",
            },
        },
    });
};

export const updateAnswer = async (
    answerId: string,
    studentId: string,
    input: UpdateAnswerInput
) => {
    const existingAnswer =
        await prisma.answer.findUnique({
            where: {
                id: answerId,
            },
            include: {
                attempt: {
                    include: {
                        exam: true,
                    },
                },
                attemptQuestion: {
                    include: {
                        question: {
                            select: {
                                id: true,
                                questionType: true,
                            },
                        },
                    },
                },
            },
        });

    if (!existingAnswer) {
        throw new NotFoundError(
            "Answer tidak ditemukan"
        );
    }

    const attempt = existingAnswer.attempt;

    if (attempt.studentId !== studentId) {
        throw new ForbiddenError(
            "Anda tidak dapat mengubah jawaban student lain"
        );
    }

    if (attempt.status !== "IN_PROGRESS") {
        throw new ConflictError(
            "Attempt exam sudah tidak aktif"
        );
    }

    const expired = await expireAttemptIfNeeded(
        attempt,
        attempt.exam.durationMinutes,
        attempt.exam.endAt
    );

    if (expired) {
        throw new ConflictError(
            "Waktu pengerjaan exam sudah habis"
        );
    }

    let isCorrect: boolean | null = null;
    let points: number | null = null;

    // Gunakan snapshot, bukan Question master
    const correctAnswer =
        existingAnswer.attemptQuestion.correctAnswerSnapshot;

    const questionType =
        existingAnswer.attemptQuestion.question.questionType;

    if (
        correctAnswer !== null &&
        (
            questionType === "MULTIPLE_CHOICE" ||
            questionType === "TRUE_FALSE" ||
            questionType === "SHORT_ANSWER"
        )
    ) {
        const submittedAnswer =
            input.answer?.trim().toLowerCase();

        const expectedAnswer =
            correctAnswer.trim().toLowerCase();

        isCorrect =
            submittedAnswer === expectedAnswer;

        points = isCorrect
            ? existingAnswer.attemptQuestion.pointsSnapshot
            : 0;
    }

    return prisma.answer.update({
        where: {
            id: answerId,
        },
        data: {
            answer: input.answer ?? null,
            isCorrect,
            points,
        },
        select: ANSWER_STUDENT_SELECT,
    });
};