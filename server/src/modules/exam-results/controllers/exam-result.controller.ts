import type { Request, Response } from "express";

import {
    getExamResult as getExamResultService,
    getExamResultForStaff as getExamResultForStaffService,
    getExamReportByExamId as getExamReportByExamIdService,
} from "../services/exam-result.service.js";

export const getExamResult = async (
    req: Request<{ attemptId: string }>,
    res: Response
) => {
    const result = await getExamResultService(
        req.params.attemptId,
        req.user!.id
    );

    return res.status(200).json({
        success: true,
        message: "Hasil exam berhasil diambil",
        data: result,
    });
};

export const getExamResultForStaff = async (
    req: Request<{ attemptId: string }>,
    res: Response
) => {
    const user = req.user!;

    if (
        user.role !== "ADMIN" &&
        user.role !== "LECTURER"
    ) {
        return res.status(403).json({
            success: false,
            message: "Anda tidak memiliki akses ke hasil exam",
        });
    }

    const result = await getExamResultForStaffService(
        req.params.attemptId,
        user.id,
        user.role
    );

    return res.status(200).json({
        success: true,
        message: "Hasil exam berhasil diambil",
        data: result,
    });
};

export const getExamReportByExamId = async (
    req: Request<{ examId: string }>,
    res: Response
) => {
    const user = req.user!;

    const report = await getExamReportByExamIdService(
        req.params.examId,
        user.id,
        user.role as "ADMIN" | "LECTURER"
    );

    return res.status(200).json({
        success: true,
        message: "Report exam berhasil diambil",
        data: report,
    });
};