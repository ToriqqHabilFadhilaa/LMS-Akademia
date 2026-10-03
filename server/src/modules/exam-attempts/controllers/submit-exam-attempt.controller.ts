import type { Request, Response } from "express";

import {
    submitExamAttempt as submitExamAttemptService,
} from "../services/submit-exam-attempt.service.js";

export const submitExamAttempt = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    const attempt = await submitExamAttemptService(
        req.params.id,
        req.user!.id
    );

    return res.status(200).json({
        success: true,
        message: "Exam attempt berhasil dikumpulkan",
        data: attempt,
    });
};