import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../../config/database.js";

import {
    ForbiddenError,
    ConflictError,
    NotFoundError,
} from "../../../errors/app-error.js";

import type {
    CreateActivityLogInput,
} from "../validators/activity-log.validator.js";

import {
    calculateRiskScore,
} from "../../risk-scores/services/risk-score.service.js";

import {
    expireAttemptIfNeeded,
} from "../../exam-attempts/services/exam-attempt-status.service.js";

const ACTIVITY_LOG_SELECT = {
    id: true,
    attemptId: true,
    eventType: true,
    eventData: true,
    occurredAt: true,
} satisfies Prisma.ActivityLogSelect;

const toPrismaJson = (
    value: unknown
): Prisma.InputJsonValue | typeof Prisma.JsonNull => {
    if (value === null) {
        return Prisma.JsonNull;
    }

    return value as Prisma.InputJsonValue;
};

const VIOLATION_EVENTS = [
    "TAB_SWITCH",
    "WINDOW_BLUR",
    "FULLSCREEN_EXIT",
    "COPY",
    "PASTE",
] as const;

const MAX_VIOLATIONS = 5;

type WarningLevel =
    | "WARNING"
    | "FINAL_WARNING"
    | "REVIEW_REQUIRED"
    | null;

export const createActivityLog = async (
    studentId: string,
    input: CreateActivityLogInput
) => {
    const attempt = await prisma.examAttempt.findUnique({
        where: {
            id: input.attemptId,
        },
        select: {
            id: true,
            studentId: true,
            status: true,
            startedAt: true,
            exam: {
                select: {
                    durationMinutes: true,
                    endAt: true,
                },
            },
        },
    });

    if (!attempt) {
        throw new NotFoundError(
            "Exam attempt tidak ditemukan"
        );
    }

    if (attempt.studentId !== studentId) {
        throw new ForbiddenError(
            "Anda tidak dapat mencatat aktivitas pada attempt milik student lain"
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

    const activity = await prisma.activityLog.create({
        data: {
            attemptId: input.attemptId,
            eventType: input.eventType,
            ...(input.eventData !== undefined && {
                eventData: toPrismaJson(input.eventData),
            }),
        },
        select: ACTIVITY_LOG_SELECT,
    });

    const isViolation =
        (VIOLATION_EVENTS as readonly string[]).includes(
            input.eventType
        );

    let violationCount = 0;
    let warningLevel: WarningLevel = null;
    let message = "";

    if (isViolation) {
        violationCount =
            await prisma.activityLog.count({
                where: {
                    attemptId: input.attemptId,
                    eventType: {
                        in: [...VIOLATION_EVENTS],
                    },
                },
            });

        if (violationCount >= MAX_VIOLATIONS) {
            warningLevel = "REVIEW_REQUIRED";

            message =
                "Beberapa sinyal aktivitas dari browser telah tercatat. Sinyal ini tidak memblokir ujian secara otomatis dan perlu ditinjau pengawas.";
        } else if (violationCount === 4) {
            warningLevel = "FINAL_WARNING";

            message =
                "PERINGATAN: beberapa sinyal aktivitas telah tercatat. Sinyal browser ini dapat keliru dan tidak otomatis memblokir ujian.";
        } else if (violationCount >= 1) {
            warningLevel = "WARNING";

            message =
                `Sinyal aktivitas browser ${violationCount} tercatat. Sinyal ini hanya petunjuk dan dapat keliru.`;
        }
    }

    await calculateRiskScore(
        input.attemptId
    );

    return {
        activity,
        violationCount,
        maxViolations: MAX_VIOLATIONS,
        warningLevel,
        blocked: false,
        message,
    };
};

export const getActivityLogsByAttemptId = async (
    attemptId: string,
    requesterId: string,
    requesterRole: "ADMIN" | "LECTURER"
) => {
    const attempt = await prisma.examAttempt.findUnique({
        where: {
            id: attemptId,
        },
        select: {
            id: true,

            exam: {
                select: {
                    courseOffering: {
                        select: {
                            lecturerId: true,
                        },
                    },
                },
            },
        },
    });

    if (!attempt) {
        throw new NotFoundError(
            "Exam attempt tidak ditemukan"
        );
    }

    if (
        requesterRole === "LECTURER" &&
        attempt.exam.courseOffering.lecturerId !== requesterId
    ) {
        throw new ForbiddenError(
            "Anda tidak memiliki akses ke activity log attempt ini"
        );
    }

    return prisma.activityLog.findMany({
        where: {
            attemptId,
        },
        select: ACTIVITY_LOG_SELECT,
        orderBy: {
            occurredAt: "asc",
        },
    });
};