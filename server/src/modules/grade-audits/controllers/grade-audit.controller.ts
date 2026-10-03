import type { Request, Response } from "express";

import {
    getGradeAuditsBySubmissionId as getGradeAuditsBySubmissionIdService,
} from "../services/grade-audit.service.js";

export const getGradeAuditsBySubmissionId = async (
    req: Request<{ submissionId: string }>,
    res: Response
) => {
    const user = req.user!;

    if (
        user.role !== "ADMIN" &&
        user.role !== "LECTURER"
    ) {
        return res.status(403).json({
            success: false,
            message: "Anda tidak memiliki akses ke grade audit",
        });
    }

    const audits =
        await getGradeAuditsBySubmissionIdService(
            req.params.submissionId,
            user.id,
            user.role
        );

    return res.status(200).json({
        success: true,
        message: "Grade audit berhasil diambil",
        data: audits,
    });
};