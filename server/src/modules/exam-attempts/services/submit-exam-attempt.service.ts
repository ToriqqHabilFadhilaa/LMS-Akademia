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

const SUBMITTED_ATTEMPT_SELECT = {
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
        },
    },
} satisfies Prisma.ExamAttemptSelect;

export const submitExamAttempt = async (
    attemptId: string,
    studentId: string
) => {
    const attempt = await prisma.examAttempt.findUnique({
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
            "Anda tidak dapat submit attempt milik student lain"
        );
    }

    if (attempt.status !== "IN_PROGRESS") {
        throw new ConflictError(
            "Exam attempt sudah tidak aktif"
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

    try {
        const submittedAttempt =
            await prisma.examAttempt.update({
                where: {
                    id: attemptId,
                },
                data: {
                    status: "SUBMITTED",
                    submittedAt,
                },
                select: SUBMITTED_ATTEMPT_SELECT,
            });

        return submittedAttempt;
    } catch (error) {
        if (
            error instanceof
            Prisma.PrismaClientKnownRequestError &&
            error.code === "P2025"
        ) {
            throw new NotFoundError(
                "Exam attempt tidak ditemukan"
            );
        }

        throw error;
    }
};