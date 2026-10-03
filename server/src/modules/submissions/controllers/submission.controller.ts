import type { Request, Response } from "express";

import {
    createSubmission as createSubmissionService,
    getSubmissionById as getSubmissionByIdService,
    getMySubmissions as getMySubmissionsService,
    updateSubmission as updateSubmissionService,
} from "../services/submission.service.js";

import type {
    CreateSubmissionInput,
    UpdateSubmissionInput,
} from "../validators/submission.validator.js";

export const createSubmission = async (
    req: Request<
        unknown,
        unknown,
        CreateSubmissionInput
    >,
    res: Response
) => {
    const submission =
        await createSubmissionService(
            req.user!.id,
            req.body
        );

    return res.status(201).json({
        success: true,
        message: "Submission berhasil dikirim",
        data: submission,
    });
};

export const getSubmissionById = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    const submission =
        await getSubmissionByIdService(
            req.params.id,
            req.user!.id,
            req.user!.role
        );

    return res.status(200).json({
        success: true,
        message: "Submission berhasil diambil",
        data: submission,
    });
};

export const getMySubmissions = async (
    req: Request,
    res: Response
) => {
    const submissions =
        await getMySubmissionsService(
            req.user!.id
        );

    return res.status(200).json({
        success: true,
        message: "Daftar submission berhasil diambil",
        data: submissions,
    });
};

export const updateSubmission = async (
    req: Request<
        { id: string },
        unknown,
        UpdateSubmissionInput
    >,
    res: Response
) => {
    const submission =
        await updateSubmissionService(
            req.params.id,
            req.user!.id,
            req.body
        );

    return res.status(200).json({
        success: true,
        message: "Submission berhasil diperbarui",
        data: submission,
    });
};