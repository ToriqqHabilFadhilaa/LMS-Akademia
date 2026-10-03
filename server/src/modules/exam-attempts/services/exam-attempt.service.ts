import crypto from "node:crypto";

import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../../config/database.js";

import {
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "../../../errors/app-error.js";

import {
    expireAttemptIfNeeded,
} from "./exam-attempt-status.service.js";

import type { CreateExamAttemptInput } from "../validators/exam-attempt.validator.js";

const EXAM_ATTEMPT_SELECT = {
    id: true,
    examId: true,
    studentId: true,
    attemptNumber: true,
    startedAt: true,
    submittedAt: true,
    status: true,
    createdAt: true,
    updatedAt: true,

    exam: {
        select: {
            id: true,
            title: true,
            durationMinutes: true,
            startAt: true,
            endAt: true,
            maxAttempts: true,
            shuffleQuestions: true,
            shuffleAnswers: true,
        },
    },

    student: {
        select: {
            id: true,
            name: true,
            email: true,
        },
    },

    questions: {
        select: {
            id: true,
            questionId: true,
            orderNumber: true,
            questionTextSnapshot: true,
            optionsSnapshot: true,
            shuffledOptions: true,
            pointsSnapshot: true,
        },
        orderBy: {
            orderNumber: "asc",
        },
    },
} satisfies Prisma.ExamAttemptSelect;

interface StartAttemptMeta {
    ipAddress?: string;
    userAgent?: string;
}

const shuffleArray = <T>(items: T[]): T[] => {
    const result = [...items];

    for (let i = result.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));

        [result[i], result[j]] = [
            result[j] as T,
            result[i] as T,
        ];
    }

    return result;
};

const toPrismaJson = (
    value: unknown
): Prisma.InputJsonValue | typeof Prisma.JsonNull => {
    if (value === null) {
        return Prisma.JsonNull;
    }

    return value as Prisma.InputJsonValue;
};

export const createExamAttempt = async (
    studentId: string,
    input: CreateExamAttemptInput,
    meta: StartAttemptMeta
) => {
    const student = await prisma.user.findFirst({
        where: {
            id: studentId,
            role: "STUDENT",
            status: "ACTIVE",
            deletedAt: null,
        },
    });

    if (!student) {
        throw new NotFoundError(
            "Student tidak ditemukan atau tidak aktif"
        );
    }

    const exam = await prisma.exam.findUnique({
        where: {
            id: input.examId,
        },
    });

    if (!exam) {
        throw new NotFoundError(
            "Exam tidak ditemukan"
        );
    }

    const member = await prisma.courseMember.findUnique({
        where: {
            courseOfferingId_userId: {
                courseOfferingId: exam.courseOfferingId,
                userId: studentId,
            },
        },
    });

    if (!member || member.role !== "STUDENT") {
        throw new ConflictError(
            "Student tidak terdaftar pada course offering exam ini"
        );
    }

    const now = new Date();

    if (now < exam.startAt) {
        throw new ConflictError(
            "Exam belum dimulai"
        );
    }

    if (now > exam.endAt) {
        throw new ConflictError(
            "Waktu exam sudah berakhir"
        );
    }

    const activeAttempt =
        await prisma.examAttempt.findFirst({
            where: {
                examId: input.examId,
                studentId,
                status: "IN_PROGRESS",
            },
        });

    if (activeAttempt) {
        const durationEndsAt = new Date(
            activeAttempt.startedAt.getTime() +
            exam.durationMinutes * 60 * 1000
        );

        const effectiveEndAt =
            durationEndsAt < exam.endAt
                ? durationEndsAt
                : exam.endAt;

        if (now > effectiveEndAt) {
            await prisma.examAttempt.update({
                where: {
                    id: activeAttempt.id,
                },
                data: {
                    status: "EXPIRED",
                },
            });
        } else {
            throw new ConflictError(
                "Anda masih memiliki attempt yang sedang berlangsung"
            );
        }
    }

    const retakeGrant =
        await prisma.examAttempt.findFirst({
            where: {
                examId: input.examId,
                studentId,
                status: "BLOCKED",
                retakeGrantedAt: {
                    not: null,
                },
                retakeConsumedAt: null,
            },
            orderBy: {
                retakeGrantedAt: "desc",
            },
        });

    if (!retakeGrant) {
        const blockedAttempt =
            await prisma.examAttempt.findFirst({
                where: {
                    examId: input.examId,
                    studentId,
                    status: "BLOCKED",
                },
            });

        if (blockedAttempt) {
            throw new ConflictError(
                "Attempt exam Anda telah diblokir. Hubungi Admin untuk dapat mengikuti exam kembali."
            );
        }
    }

    const attemptHistory =
        await getMyExamAttemptsByExamId(
            input.examId,
            studentId
        );

    if (
        attemptHistory.bestScore !== null &&
        attemptHistory.bestScore >= exam.passingScore
    ) {
        throw new ConflictError(
            `Anda sudah mencapai KKM dengan nilai ${attemptHistory.bestScore}`
        );
    }

    const attemptCount =
        await prisma.examAttempt.count({
            where: {
                examId: input.examId,
                studentId,
            },
        });

    if (
        attemptCount >= exam.maxAttempts &&
        !retakeGrant
    ) {
        throw new ConflictError(
            "Jumlah percobaan exam sudah mencapai batas maksimal"
        );
    }

    const attemptNumber = attemptCount + 1;

    const examQuestions =
        await prisma.examQuestion.findMany({
            where: {
                examId: input.examId,
            },
            orderBy: {
                orderNumber: "asc",
            },
            select: {
                questionId: true,

                question: {
                    select: {
                        id: true,
                        questionType: true,
                        questionText: true,
                        options: true,
                        correctAnswer: true,
                        points: true,
                    },
                },
            },
        });

    if (examQuestions.length === 0) {
        throw new ConflictError(
            "Exam belum memiliki question"
        );
    }

    const orderedQuestions = exam.shuffleQuestions
        ? shuffleArray(examQuestions)
        : examQuestions;

    try {
        const result = await prisma.$transaction(
            async (tx) => {
                if (retakeGrant) {
                    const consumed =
                        await tx.examAttempt.updateMany({
                            where: {
                                id: retakeGrant.id,
                                status: "BLOCKED",
                                retakeGrantedAt: {
                                    not: null,
                                },
                                retakeConsumedAt: null,
                            },
                            data: {
                                retakeConsumedAt: now,
                            },
                        });

                    if (consumed.count !== 1) {
                        throw new ConflictError(
                            "Izin retake sudah digunakan"
                        );
                    }
                }
                const attempt =
                    await tx.examAttempt.create({
                        data: {
                            examId: input.examId,
                            studentId,
                            attemptNumber,
                            startedAt: now,
                            sessionId: crypto.randomUUID(),

                            ...(meta.ipAddress !== undefined && {
                                ipAddress: meta.ipAddress,
                            }),

                            ...(meta.userAgent !== undefined && {
                                userAgent: meta.userAgent,
                            }),

                            questions: {
                                create: orderedQuestions.map(
                                    (item, index) => {
                                        const originalOptions =
                                            item.question.options;

                                        let shuffledOptions =
                                            originalOptions;

                                        if (
                                            exam.shuffleAnswers &&
                                            Array.isArray(
                                                originalOptions
                                            )
                                        ) {
                                            shuffledOptions =
                                                shuffleArray(
                                                    originalOptions
                                                );
                                        }

                                        return {
                                            questionId: item.question.id,

                                            orderNumber: index + 1,

                                            questionTextSnapshot:
                                                item.question.questionText,

                                            optionsSnapshot:
                                                toPrismaJson(originalOptions),

                                            shuffledOptions:
                                                toPrismaJson(shuffledOptions),

                                            correctAnswerSnapshot:
                                                item.question.correctAnswer,

                                            pointsSnapshot:
                                                item.question.points,
                                        };
                                    }
                                ),
                            },
                        },
                    });

                return tx.examAttempt.findUnique({
                    where: {
                        id: attempt.id,
                    },
                    select: EXAM_ATTEMPT_SELECT,
                });
            }
        );

        if (!result) {
            throw new NotFoundError(
                "Exam attempt gagal dibuat"
            );
        }

        return result;
    } catch (error) {
        if (
            error instanceof
            Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            throw new ConflictError(
                "Attempt exam sudah dibuat"
            );
        }

        throw error;
    }
};

export const getExamAttemptById = async (
    attemptId: string,
    studentId: string
) => {
    const attempt = await prisma.examAttempt.findUnique({
        where: {
            id: attemptId,
        },
        select: EXAM_ATTEMPT_SELECT,
    });

    if (!attempt) {
        throw new NotFoundError(
            "Exam attempt tidak ditemukan"
        );
    }

    if (attempt.studentId !== studentId) {
        throw new ForbiddenError(
            "Anda tidak dapat melihat attempt milik student lain"
        );
    }

    if (attempt.status === "IN_PROGRESS") {
        const durationEndsAt = new Date(
            attempt.startedAt.getTime() +
            attempt.exam.durationMinutes * 60 * 1000
        );

        const effectiveEndAt =
            durationEndsAt < attempt.exam.endAt
                ? durationEndsAt
                : attempt.exam.endAt;

        if (new Date() > effectiveEndAt) {
            const expiredAttempt =
                await prisma.examAttempt.update({
                    where: {
                        id: attemptId,
                    },
                    data: {
                        status: "EXPIRED",
                    },
                    select: EXAM_ATTEMPT_SELECT,
                });

            return expiredAttempt;
        }
    }

    return attempt;
};

export const getExamAttemptsByExamId = async (
    examId: string,
    requesterId: string,
    requesterRole: "ADMIN" | "LECTURER"
) => {
    const exam = await prisma.exam.findUnique({
        where: {
            id: examId,
        },
        select: {
            id: true,
            title: true,

            courseOffering: {
                select: {
                    id: true,
                    lecturerId: true,

                    course: {
                        select: {
                            id: true,
                            code: true,
                            name: true,
                        },
                    },
                },
            },
        },
    });

    if (!exam) {
        throw new NotFoundError(
            "Exam tidak ditemukan"
        );
    }

    if (
        requesterRole === "LECTURER" &&
        exam.courseOffering.lecturerId !== requesterId
    ) {
        throw new ForbiddenError(
            "Anda tidak memiliki akses ke attempt exam ini"
        );
    }

    const attempts = await prisma.examAttempt.findMany({
        where: {
            examId,
        },
        select: {
            id: true,
            studentId: true,
            attemptNumber: true,
            startedAt: true,
            submittedAt: true,
            status: true,
            retakeGrantedAt: true,
            retakeConsumedAt: true,

            student: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },

            riskScore: {
                select: {
                    score: true,
                    riskLevel: true,
                    calculatedAt: true,
                    updatedAt: true,
                },
            },
        },
        orderBy: [
            {
                student: {
                    name: "asc",
                },
            },
            {
                attemptNumber: "asc",
            },
        ],
    });

    return {
        exam: {
            id: exam.id,
            title: exam.title,
            courseOffering: exam.courseOffering,
        },
        attempts,
    };
};

export const grantExamRetake = async (
    attemptId: string,
    adminId: string
) => {
    const admin = await prisma.user.findUnique({
        where: {
            id: adminId,
        },
        select: {
            id: true,
            role: true,
            status: true,
            deletedAt: true,
        },
    });

    if (
        !admin ||
        admin.role !== "ADMIN" ||
        admin.status !== "ACTIVE" ||
        admin.deletedAt !== null
    ) {
        throw new ForbiddenError(
            "Anda tidak memiliki akses untuk memberikan izin retake"
        );
    }

    const attempt =
        await prisma.examAttempt.findUnique({
            where: {
                id: attemptId,
            },
            select: {
                id: true,
                examId: true,
                studentId: true,
                status: true,
                retakeGrantedAt: true,
            },
        });

    if (!attempt) {
        throw new NotFoundError(
            "Exam attempt tidak ditemukan"
        );
    }

    if (attempt.status !== "BLOCKED") {
        throw new ConflictError(
            "Hanya attempt dengan status BLOCKED yang dapat diberikan izin retake"
        );
    }

    if (attempt.retakeGrantedAt !== null) {
        throw new ConflictError(
            "Attempt ini sudah diberikan izin retake"
        );
    }

    return prisma.examAttempt.update({
        where: {
            id: attempt.id,
        },
        data: {
            retakeGrantedAt: new Date(),
        },
        select: {
            id: true,
            examId: true,
            studentId: true,
            attemptNumber: true,
            status: true,
            retakeGrantedAt: true,
        },
    });
};

export const getMyExamAttemptsByExamId = async (
    examId: string,
    studentId: string
) => {
    const exam = await prisma.exam.findUnique({
        where: {
            id: examId,
        },
        select: {
            id: true,
            courseOfferingId: true,
        },
    });

    if (!exam) {
        throw new NotFoundError(
            "Exam tidak ditemukan"
        );
    }

    const member =
        await prisma.courseMember.findUnique({
            where: {
                courseOfferingId_userId: {
                    courseOfferingId:
                        exam.courseOfferingId,
                    userId: studentId,
                },
            },
        });

    if (
        !member ||
        member.role !== "STUDENT"
    ) {
        throw new ForbiddenError(
            "Student tidak terdaftar pada course offering exam ini"
        );
    }

    const attempts =
        await prisma.examAttempt.findMany({
            where: {
                examId,
                studentId,
                status: {
                    in: [
                        "IN_PROGRESS",
                        "SUBMITTED",
                        "EXPIRED",
                        "BLOCKED",
                    ],
                },
            },
            orderBy: {
                attemptNumber: "asc",
            },
            select: {
                id: true,
                attemptNumber: true,
                startedAt: true,
                submittedAt: true,
                status: true,
                retakeGrantedAt: true,
                retakeConsumedAt: true,

                questions: {
                    select: {
                        pointsSnapshot: true,

                        answer: {
                            select: {
                                points: true,
                            },
                        },
                    },
                },
            },
        });

    const mappedAttempts =
        attempts.map((attempt) => {
            const maximumPoints =
                attempt.questions.reduce(
                    (total, question) =>
                        total +
                        question.pointsSnapshot,
                    0
                );

            const earnedPoints =
                attempt.questions.reduce(
                    (total, question) =>
                        total +
                        (question.answer?.points ?? 0),
                    0
                );

            const percentage =
                attempt.status === "IN_PROGRESS"
                    ? null
                    : maximumPoints > 0
                        ? Math.round(
                            Math.min(
                                100,
                                Math.max(
                                    0,
                                    (earnedPoints /
                                        maximumPoints) *
                                    100
                                )
                            ) * 100
                        ) / 100
                        : null;

            return {
                id: attempt.id,
                attemptNumber: attempt.attemptNumber,
                startedAt: attempt.startedAt,
                submittedAt: attempt.submittedAt,
                status: attempt.status,
                retakeGrantedAt: attempt.retakeGrantedAt,
                retakeConsumedAt: attempt.retakeConsumedAt,
                percentage,
            };
        });

    const validScores =
        mappedAttempts
            .map((attempt) => attempt.percentage)
            .filter(
                (
                    score
                ): score is number =>
                    score !== null
            );

    const bestScore =
        validScores.length > 0
            ? Math.max(...validScores)
            : null;

    return {
        attempts: mappedAttempts,
        bestScore,
    };
};

export const submitExamAttempt = async (
    attemptId: string,
    studentId: string
) => {
    const attempt =
        await prisma.examAttempt.findUnique({
            where: {
                id: attemptId,
            },
            include: {
                exam: true,
            },
        });

    if (!attempt) {
        throw new NotFoundError(
            "Exam attempt tidak ditemukan"
        );
    }

    if (attempt.studentId !== studentId) {
        throw new ForbiddenError(
            "Anda tidak dapat mengumpulkan attempt milik student lain"
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

    const submittedAt = new Date();

    return prisma.examAttempt.update({
        where: {
            id: attemptId,
        },
        data: {
            status: "SUBMITTED",
            submittedAt,
        },
        select: EXAM_ATTEMPT_SELECT,
    });
};