import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../../config/database.js";
import type { UserRole } from "../../../generated/prisma/client.js";

import {
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "../../../errors/app-error.js";

import type {
    CreateQuestionInput,
    UpdateQuestionInput,
} from "../validators/question.validator.js";

const QUESTION_SELECT = {
    id: true,
    createdById: true,
    questionType: true,
    questionText: true,
    options: true,
    correctAnswer: true,
    points: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,

    createdBy: {
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        },
    },
} satisfies Prisma.QuestionSelect;

const QUESTION_STUDENT_SELECT = {
    id: true,
    createdById: true,
    questionType: true,
    questionText: true,
    options: true,
    points: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,

    createdBy: {
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        },
    },
} satisfies Prisma.QuestionSelect;

export const createQuestion = async (
    createdById: string,
    input: CreateQuestionInput
) => {
    const user = await prisma.user.findFirst({
        where: {
            id: createdById,
            status: "ACTIVE",
            deletedAt: null,
            role: {
                in: ["ADMIN", "LECTURER"],
            },
        },
    });

    if (!user) {
        throw new NotFoundError(
            "User pembuat soal tidak ditemukan atau tidak aktif"
        );
    }

    return prisma.question.create({
        data: {
            createdById,
            questionType: input.questionType,
            questionText: input.questionText,

            ...(input.options !== undefined && {
                options:
                    input.options === null
                        ? Prisma.JsonNull
                        : input.options,
            }),

            ...(input.correctAnswer !== undefined && {
                correctAnswer: input.correctAnswer,
            }),

            ...(input.points !== undefined && {
                points: input.points,
            }),

            ...(input.isActive !== undefined && {
                isActive: input.isActive,
            }),
        },
        select: QUESTION_SELECT,
    });
};

export const getQuestions = async (
    role: UserRole,
    requesterId: string
) => {
    if (role === "STUDENT") {
        return prisma.question.findMany({
            where: { isActive: true },
            select: QUESTION_STUDENT_SELECT,
            orderBy: { createdAt: "desc" },
        });
    }

    const where =
        role === "LECTURER"
            ? { isActive: true, createdById: requesterId }
            : { isActive: true };

    return prisma.question.findMany({
        where,
        select: QUESTION_SELECT,
        orderBy: { createdAt: "desc" },
    });
};

export const getQuestionById = async (
    id: string,
    role: UserRole,
    requesterId: string
) => {
    const question =
        role === "STUDENT"
            ? await prisma.question.findUnique({
                where: { id },
                select: QUESTION_STUDENT_SELECT,
            })
            : await prisma.question.findUnique({
                where: { id },
                select: QUESTION_SELECT,
            });

    if (!question) {
        throw new NotFoundError("Question tidak ditemukan");
    }

    if (
        role === "LECTURER" &&
        question.createdById !== requesterId
    ) {
        throw new ForbiddenError(
            "Anda tidak memiliki akses ke question ini"
        );
    }

    return question;
};

export const updateQuestion = async (
    id: string,
    input: UpdateQuestionInput,
    requesterId: string,
    requesterRole: UserRole
) => {
    const existingQuestion =
        await prisma.question.findUnique({
            where: { id },
        });

    if (!existingQuestion) {
        throw new NotFoundError("Question tidak ditemukan");
    }

    if (
        requesterRole === "LECTURER" &&
        existingQuestion.createdById !== requesterId
    ) {
        throw new ForbiddenError(
            "Anda tidak memiliki akses untuk mengubah question ini"
        );
    }

    return prisma.question.update({
        where: {
            id,
        },
        data: {
            ...(input.questionType !== undefined && {
                questionType: input.questionType,
            }),

            ...(input.questionText !== undefined && {
                questionText: input.questionText,
            }),

            ...(input.options !== undefined && {
                options:
                    input.options === null
                        ? Prisma.JsonNull
                        : input.options,
            }),

            ...(input.correctAnswer !== undefined && {
                correctAnswer: input.correctAnswer,
            }),

            ...(input.points !== undefined && {
                points: input.points,
            }),

            ...(input.isActive !== undefined && {
                isActive: input.isActive,
            }),
        },
        select: QUESTION_SELECT,
    });
};

export const deleteQuestion = async (
    id: string,
    requesterId: string,
    requesterRole: UserRole
) => {
    const existingQuestion =
        await prisma.question.findUnique({
            where: { id },
            select: { createdById: true },
        });

    if (!existingQuestion) {
        throw new NotFoundError("Question tidak ditemukan");
    }

    if (
        requesterRole === "LECTURER" &&
        existingQuestion.createdById !== requesterId
    ) {
        throw new ForbiddenError(
            "Anda tidak memiliki akses untuk menghapus question ini"
        );
    }

    try {
        await prisma.question.delete({
            where: { id },
        });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2025"
        ) {
            throw new NotFoundError(
                "Question tidak ditemukan"
            );
        }

        throw error;
    }
};