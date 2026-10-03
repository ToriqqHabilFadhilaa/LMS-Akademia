import { prisma } from "../../../config/database.js";

import type { ExamAttempt } from "../../../generated/prisma/client.js";

export const getEffectiveEndAt = (
    attempt: Pick<ExamAttempt, "startedAt">,
    durationMinutes: number,
    examEndAt: Date
) => {
    const durationEndsAt = new Date(
        attempt.startedAt.getTime() +
        durationMinutes * 60 * 1000
    );

    return durationEndsAt < examEndAt
        ? durationEndsAt
        : examEndAt;
};

export const expireAttemptIfNeeded = async (
    attempt: Pick<
        ExamAttempt,
        "id" | "status" | "startedAt"
    >,
    durationMinutes: number,
    examEndAt: Date
) => {
    if (attempt.status !== "IN_PROGRESS") {
        return false;
    }

    const effectiveEndAt = getEffectiveEndAt(
        attempt,
        durationMinutes,
        examEndAt
    );

    if (new Date() <= effectiveEndAt) {
        return false;
    }

    await prisma.examAttempt.update({
        where: {
            id: attempt.id,
        },
        data: {
            status: "EXPIRED",
        },
    });

    return true;
};