import type { Request, Response } from "express";

import {
    createExamAttempt as createExamAttemptService,
    getExamAttemptById as getExamAttemptByIdService,
    getExamAttemptsByExamId as getExamAttemptsByExamIdService,
    getMyExamAttemptsByExamId as getMyExamAttemptsByExamIdService,
    grantExamRetake as grantExamRetakeService,
} from "../services/exam-attempt.service.js";

import type {
    CreateExamAttemptInput,
} from "../validators/exam-attempt.validator.js";

export const createExamAttempt = async (
    req: Request<
        unknown,
        unknown,
        CreateExamAttemptInput
    >,
    res: Response
) => {
    const userAgent = req.get("user-agent");

    const meta = {
        ...(req.ip !== undefined && {
            ipAddress: req.ip,
        }),

        ...(userAgent !== undefined && {
            userAgent,
        }),
    };

    const attempt = await createExamAttemptService(
        req.user!.id,
        req.body,
        meta
    );

    return res.status(201).json({
        success: true,
        message: "Exam attempt berhasil dimulai",
        data: attempt,
    });
};

export const getExamAttemptById = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    const attempt = await getExamAttemptByIdService(
        req.params.id,
        req.user!.id
    );

    return res.status(200).json({
        success: true,
        message: "Exam attempt berhasil diambil",
        data: attempt,
    });
};

export const getExamAttemptsByExamId = async (
    req: Request<{ examId: string }>,
    res: Response
) => {
    const user = req.user!;

    if (
        user.role !== "ADMIN" &&
        user.role !== "LECTURER"
    ) {
        return res.status(403).json({
            success: false,
            message: "Anda tidak memiliki akses ke monitoring exam",
        });
    }

    const result =
        await getExamAttemptsByExamIdService(
            req.params.examId,
            user.id,
            user.role
        );

    return res.status(200).json({
        success: true,
        message: "Daftar exam attempt berhasil diambil",
        data: result,
    });
};

export const getMyExamAttemptsByExamId = async (
    req: Request<{ examId: string }>,
    res: Response
) => {
    const result =
        await getMyExamAttemptsByExamIdService(
            req.params.examId,
            req.user!.id
        );

    return res.status(200).json({
        success: true,
        message: "Riwayat exam attempt berhasil diambil",
        data: result,
    });
};

export const grantExamRetake = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    const attempt = await grantExamRetakeService(
        req.params.id,
        req.user!.id
    );

    return res.status(200).json({
        success: true,
        message: "Izin retake berhasil diberikan",
        data: attempt,
    });
};