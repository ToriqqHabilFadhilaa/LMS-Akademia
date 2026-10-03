import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../../config/database.js";

import { ForbiddenError, NotFoundError } from "../../../errors/app-error.js";

const EVENT_RISK_POINTS = {
    TAB_SWITCH: 10,
    WINDOW_BLUR: 10,
    FULLSCREEN_EXIT: 15,
    COPY: 20,
    PASTE: 20,
    REFRESH: 5,
    MULTIPLE_SESSION: 30,
    CONNECTION_LOST: 5,
} as const;

const RISK_SCORE_SELECT = {
    id: true,
    attemptId: true,
    score: true,
    riskLevel: true,
    calculatedAt: true,
    updatedAt: true,
} satisfies Prisma.RiskScoreSelect;

const getRiskLevel = (
    score: number
): "LOW" | "MEDIUM" | "HIGH" => {
    if (score <= 20) {
        return "LOW";
    }

    if (score <= 50) {
        return "MEDIUM";
    }

    return "HIGH";
};

export const calculateRiskScore = async (
    attemptId: string
) => {
    const attempt = await prisma.examAttempt.findUnique({
        where: {
            id: attemptId,
        },
        select: {
            id: true,
        },
    });

    if (!attempt) {
        throw new NotFoundError(
            "Exam attempt tidak ditemukan"
        );
    }

    const activities =
        await prisma.activityLog.findMany({
            where: {
                attemptId,
            },
            select: {
                eventType: true,
            },
        });

    const score = Math.min(
        activities.reduce(
            (total, activity) =>
                total +
                EVENT_RISK_POINTS[activity.eventType],
            0
        ),
        100
    );

    const riskLevel = getRiskLevel(score);

    return prisma.riskScore.upsert({
        where: {
            attemptId,
        },
        update: {
            score,
            riskLevel,
            calculatedAt: new Date(),
        },
        create: {
            attemptId,
            score,
            riskLevel,
        },
        select: RISK_SCORE_SELECT,
    });
};

export const getRiskScoreByAttemptId = async (
    attemptId: string,
    requesterId: string,
    requesterRole: "ADMIN" | "LECTURER"
) => {
    const riskScore =
        await prisma.riskScore.findUnique({
            where: {
                attemptId,
            },
            select: RISK_SCORE_SELECT,
        });

    if (!riskScore) {
        throw new NotFoundError(
            "Risk score tidak ditemukan"
        );
    }

    if (requesterRole === "LECTURER") {
        const attempt = await prisma.examAttempt.findUnique({
            where: { id: attemptId },
            select: {
                exam: {
                    select: {
                        courseOffering: {
                            select: { lecturerId: true },
                        },
                    },
                },
            },
        });

        if (
            !attempt ||
            attempt.exam.courseOffering.lecturerId !== requesterId
        ) {
            throw new ForbiddenError(
                "Anda tidak memiliki akses ke risk score attempt ini"
            );
        }
    }

    return riskScore;
};