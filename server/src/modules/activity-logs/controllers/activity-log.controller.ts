import type { Request, Response } from "express";

import {
    createActivityLog as createActivityLogService,
    getActivityLogsByAttemptId as getActivityLogsByAttemptIdService,
} from "../services/activity-log.service.js";

import { ForbiddenError } from "../../../errors/app-error.js";

import type {
    CreateActivityLogInput,
} from "../validators/activity-log.validator.js";

export const createActivityLog = async (
    req: Request<
        unknown,
        unknown,
        CreateActivityLogInput
    >,
    res: Response
) => {
    const activity = await createActivityLogService(
        req.user!.id,
        req.body
    );

    return res.status(201).json({
        success: true,
        message: "Aktivitas berhasil dicatat",
        data: activity,
    });
};

export const getActivityLogsByAttemptId = async (
    req: Request<{ attemptId: string }>,
    res: Response
) => {
    const user = req.user!;

    if (
        user.role !== "ADMIN" &&
        user.role !== "LECTURER"
    ) {
        throw new ForbiddenError(
            "Anda tidak memiliki akses ke activity log"
        );
    }

    const activities =
        await getActivityLogsByAttemptIdService(
            req.params.attemptId,
            user.id,
            user.role
        );

    return res.status(200).json({
        success: true,
        message: "Activity log berhasil diambil",
        data: activities,
    });
};