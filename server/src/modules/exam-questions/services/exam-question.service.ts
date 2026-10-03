import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../../config/database.js";

import {
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "../../../errors/app-error.js";

import type {
    CreateExamQuestionInput,
    UpdateExamQuestionInput,
} from "../validators/exam-question.validator.js";

const ensureExamAccess = async (
    examId: string,
    requesterId: string,
    requesterRole: "ADMIN" | "LECTURER"
) => {
    const exam = await prisma.exam.findUnique({
        where: { id: examId },
        select: {
            id: true,
            courseOffering: { select: { lecturerId: true } },
        },
    });

    if (!exam) {
        throw new NotFoundError("Exam tidak ditemukan");
    }

    if (
        requesterRole === "LECTURER" &&
        exam.courseOffering.lecturerId !== requesterId
    ) {
        throw new ForbiddenError("Anda tidak memiliki akses ke exam ini");
    }
};

const EXAM_QUESTION_SELECT = {
    id: true,
    examId: true,
    questionId: true,
    orderNumber: true,

    exam: {
        select: {
            id: true,
            title: true,
            durationMinutes: true,
            startAt: true,
            endAt: true,
        },
    },

    question: {
        select: {
            id: true,
            questionType: true,
            questionText: true,
            options: true,
            points: true,
            isActive: true,
        },
    },
} satisfies Prisma.ExamQuestionSelect;

export const createExamQuestion = async (
    input: CreateExamQuestionInput,
    requesterId: string,
    requesterRole: "ADMIN" | "LECTURER"
) => {
    await ensureExamAccess(input.examId, requesterId, requesterRole);

    const question = await prisma.question.findFirst({
        where: {
            id: input.questionId,
            isActive: true,
        },
    });

    if (!question) {
        throw new NotFoundError(
            "Question tidak ditemukan atau tidak aktif"
        );
    }

    try {
        return await prisma.examQuestion.create({
            data: {
                examId: input.examId,
                questionId: input.questionId,
                orderNumber: input.orderNumber,
            },
            select: EXAM_QUESTION_SELECT,
        });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError
        ) {
            if (error.code === "P2002") {
                throw new ConflictError(
                    "Question sudah ada di exam atau nomor urut sudah digunakan"
                );
            }
        }

        throw error;
    }
};

export const getExamQuestions = async (
    examId: string,
    requesterId: string,
    requesterRole: "ADMIN" | "LECTURER"
) => {
    await ensureExamAccess(examId, requesterId, requesterRole);

    return prisma.examQuestion.findMany({
        where: {
            examId,
        },
        select: EXAM_QUESTION_SELECT,
        orderBy: {
            orderNumber: "asc",
        },
    });
};

export const getExamQuestionById = async (
    id: string,
    requesterId: string,
    requesterRole: "ADMIN" | "LECTURER"
) => {
    const examQuestion =
        await prisma.examQuestion.findUnique({
            where: {
                id,
            },
            select: EXAM_QUESTION_SELECT,
        });

    if (!examQuestion) {
        throw new NotFoundError(
            "Exam question tidak ditemukan"
        );
    }

    await ensureExamAccess(
        examQuestion.examId,
        requesterId,
        requesterRole
    );

    return examQuestion;
};

export const updateExamQuestion = async (
    id: string,
    input: UpdateExamQuestionInput,
    requesterId: string,
    requesterRole: "ADMIN" | "LECTURER"
) => {
    const existing =
        await prisma.examQuestion.findUnique({
            where: {
                id,
            },
        });

    if (!existing) {
        throw new NotFoundError(
            "Exam question tidak ditemukan"
        );
    }

    await ensureExamAccess(existing.examId, requesterId, requesterRole);

    try {
        return await prisma.examQuestion.update({
            where: {
                id,
            },
            data: {
                orderNumber: input.orderNumber,
            },
            select: EXAM_QUESTION_SELECT,
        });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            throw new ConflictError(
                "Nomor urut tersebut sudah digunakan dalam exam"
            );
        }

        throw error;
    }
};

export const deleteExamQuestion = async (
    id: string,
    requesterId: string,
    requesterRole: "ADMIN" | "LECTURER"
) => {
    try {
        const existing = await prisma.examQuestion.findUnique({
            where: { id },
            select: { examId: true },
        });
        if (!existing) {
            throw new NotFoundError("Exam question tidak ditemukan");
        }
        await ensureExamAccess(existing.examId, requesterId, requesterRole);

        await prisma.examQuestion.delete({
            where: {
                id,
            },
        });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2025"
        ) {
            throw new NotFoundError(
                "Exam question tidak ditemukan"
            );
        }

        throw error;
    }
};