import type { Request, Response } from "express";

import {
    gradeSubmission as gradeSubmissionService,
} from "../services/grading.service.js";

import type {
    GradeSubmissionInput,
} from "../validators/grading.validator.js";

export const gradeSubmission = async (
    req: Request<
        { id: string },
        unknown,
        GradeSubmissionInput
    >,
    res: Response
) => {
    const submission = await gradeSubmissionService(
        req.params.id,
        req.user!.id,
        req.body
    );

    return res.status(200).json({
        success: true,
        message: "Submission berhasil dinilai",
        data: submission,
    });
};