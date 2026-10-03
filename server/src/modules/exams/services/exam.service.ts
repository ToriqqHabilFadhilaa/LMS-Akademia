import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../../config/database.js";

import {
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "../../../errors/app-error.js";

import type {
    CreateExamInput,
    UpdateExamInput,
} from "../validators/exam.validator.js";

const EXAM_SELECT = {
    id: true,
    courseOfferingId: true,
    title: true,
    description: true,
    durationMinutes: true,
    startAt: true,
    endAt: true,
    maxAttempts: true,
    passingScore: true,
    shuffleQuestions: true,
    shuffleAnswers: true,
    createdAt: true,
    updatedAt: true,

    courseOffering: {
        select: {
            id: true,
            term: true,
            section: true,
            status: true,

            course: {
                select: {
                    id: true,
                    code: true,
                    name: true,
                },
            },
        },
    },
} satisfies Prisma.ExamSelect;

const STUDENT_EXAM_SELECT = {
    id: true,
    courseOfferingId: true,
    title: true,
    description: true,
    durationMinutes: true,
    startAt: true,
    endAt: true,
    maxAttempts: true,
    passingScore: true,
    shuffleQuestions: true,
    shuffleAnswers: true,
    createdAt: true,
    updatedAt: true,

    courseOffering: {
        select: {
            id: true,
            term: true,
            section: true,
            status: true,
            course: {
                select: {
                    id: true,
                    code: true,
                    name: true,
                },
            },
        },
    },
} satisfies Prisma.ExamSelect;

export const createExam = async (
    input: CreateExamInput,
    requesterId: string,
    requesterRole: "ADMIN" | "LECTURER"
) => {
    const courseOffering =
        await prisma.courseOffering.findUnique({
            where: { id: input.courseOfferingId },
        });

    if (!courseOffering) {
        throw new NotFoundError(
            "Course offering tidak ditemukan"
        );
    }

    if (
        requesterRole === "LECTURER" &&
        courseOffering.lecturerId !== requesterId
    ) {
        throw new ForbiddenError(
            "Anda tidak memiliki akses untuk membuat exam di course offering ini"
        );
    }

    const data: Prisma.ExamCreateInput = {
        title: input.title,
        durationMinutes: input.durationMinutes,
        startAt: new Date(input.startAt),
        endAt: new Date(input.endAt),

        courseOffering: {
            connect: {
                id: input.courseOfferingId,
            },
        },

        ...(input.description !== undefined && {
            description: input.description,
        }),

        ...(input.maxAttempts !== undefined && {
            maxAttempts: input.maxAttempts,
        }),

        ...(input.shuffleQuestions !== undefined && {
            shuffleQuestions: input.shuffleQuestions,
        }),

        ...(input.shuffleAnswers !== undefined && {
            shuffleAnswers: input.shuffleAnswers,
        }),
    };

    return prisma.exam.create({
        data,
        select: EXAM_SELECT,
    });
};

export const getExams = async (
    courseOfferingId: string,
    requesterId: string,
    requesterRole: "ADMIN" | "LECTURER"
) => {
    const courseOffering =
        await prisma.courseOffering.findUnique({
            where: { id: courseOfferingId },
        });

    if (!courseOffering) {
        throw new NotFoundError(
            "Course offering tidak ditemukan"
        );
    }

    if (
        requesterRole === "LECTURER" &&
        courseOffering.lecturerId !== requesterId
    ) {
        throw new ForbiddenError(
            "Anda tidak memiliki akses ke exam di course offering ini"
        );
    }

    return prisma.exam.findMany({
        where: { courseOfferingId },
        select: EXAM_SELECT,
        orderBy: { startAt: "desc" },
    });
};

export const getExamById = async (
    id: string
) => {
    const exam = await prisma.exam.findUnique({
        where: {
            id,
        },
        select: EXAM_SELECT,
    });

    if (!exam) {
        throw new NotFoundError(
            "Exam tidak ditemukan"
        );
    }

    return exam;
};

export const updateExam = async (
    id: string,
    input: UpdateExamInput,
    requesterId: string,
    requesterRole: "ADMIN" | "LECTURER"
) => {
    const existingExam = await prisma.exam.findUnique({
        where: { id },
        include: { courseOffering: { select: { lecturerId: true } } },
    });

    if (!existingExam) {
        throw new NotFoundError("Exam tidak ditemukan");
    }

    if (
        requesterRole === "LECTURER" &&
        existingExam.courseOffering.lecturerId !== requesterId
    ) {
        throw new ForbiddenError(
            "Anda tidak memiliki akses untuk mengubah exam ini"
        );
    }

    const startAt = input.startAt
        ? new Date(input.startAt)
        : existingExam.startAt;

    const endAt = input.endAt
        ? new Date(input.endAt)
        : existingExam.endAt;

    if (endAt <= startAt) {
        throw new ConflictError(
            "Waktu selesai harus lebih besar dari waktu mulai"
        );
    }

    const data: Prisma.ExamUpdateInput = {
        ...(input.title !== undefined && {
            title: input.title,
        }),

        ...(input.description !== undefined && {
            description: input.description,
        }),

        ...(input.durationMinutes !== undefined && {
            durationMinutes: input.durationMinutes,
        }),

        ...(input.startAt !== undefined && {
            startAt: new Date(input.startAt),
        }),

        ...(input.endAt !== undefined && {
            endAt: new Date(input.endAt),
        }),

        ...(input.maxAttempts !== undefined && {
            maxAttempts: input.maxAttempts,
        }),

        ...(input.shuffleQuestions !== undefined && {
            shuffleQuestions: input.shuffleQuestions,
        }),

        ...(input.shuffleAnswers !== undefined && {
            shuffleAnswers: input.shuffleAnswers,
        }),
    };

    return prisma.exam.update({
        where: {
            id,
        },
        data,
        select: EXAM_SELECT,
    });
};

export const deleteExam = async (
    id: string,
    requesterId: string,
    requesterRole: "ADMIN" | "LECTURER"
) => {
    const existingExam = await prisma.exam.findUnique({
        where: { id },
        include: { courseOffering: { select: { lecturerId: true } } },
    });

    if (!existingExam) {
        throw new NotFoundError("Exam tidak ditemukan");
    }

    if (
        requesterRole === "LECTURER" &&
        existingExam.courseOffering.lecturerId !== requesterId
    ) {
        throw new ForbiddenError(
            "Anda tidak memiliki akses untuk menghapus exam ini"
        );
    }

    try {
        await prisma.exam.delete({
            where: { id },
        });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2025"
        ) {
            throw new NotFoundError(
                "Exam tidak ditemukan"
            );
        }

        throw error;
    }
};

export const getMyExams = async (
    courseOfferingId: string,
    studentId: string
) => {
    const member =
        await prisma.courseMember.findUnique({
            where: {
                courseOfferingId_userId: {
                    courseOfferingId,
                    userId: studentId,
                },
            },
            select: {
                role: true,
            },
        });

    if (!member || member.role !== "STUDENT") {
        throw new NotFoundError(
            "Course offering tidak ditemukan"
        );
    }

    return prisma.exam.findMany({
        where: {
            courseOfferingId,
        },
        select: EXAM_SELECT,
        orderBy: {
            startAt: "desc",
        },
    });
};

export const getMyExamById = async (
    examId: string,
    studentId: string
) => {
    const exam = await prisma.exam.findUnique({
        where: {
            id: examId,
        },
        select: STUDENT_EXAM_SELECT,
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
            select: {
                role: true,
            },
        });

    if (!member || member.role !== "STUDENT") {
        throw new NotFoundError(
            "Exam tidak ditemukan"
        );
    }

    return exam;
};