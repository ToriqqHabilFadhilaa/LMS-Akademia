import type { Request, Response } from "express";

import {
    getRiskScoreByAttemptId as getRiskScoreByAttemptIdService,
} from "../services/risk-score.service.js";

export const getRiskScoreByAttemptId = async (
    req: Request<{ attemptId: string }>,
    res: Response
) => {
    const user = req.user!;
    const riskScore =
        await getRiskScoreByAttemptIdService(
            req.params.attemptId,
            user.id,
            user.role as "ADMIN" | "LECTURER"
        );

    return res.status(200).json({
        success: true,
        message: "Risk score berhasil diambil",
        data: riskScore,
    });
};