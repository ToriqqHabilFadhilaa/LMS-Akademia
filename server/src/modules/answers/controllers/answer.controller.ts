import type { Request, Response } from "express";

import {
    createAnswer as createAnswerService,
    getAnswersByAttemptId as getAnswersByAttemptIdService,
    updateAnswer as updateAnswerService,
    gradeAnswer as gradeAnswerService,
    getAttemptAnswersForGrading as getAttemptAnswersForGradingService,
} from "../services/answer.service.js";

import type {
    CreateAnswerInput,
    UpdateAnswerInput,
    GradeAnswerInput,
} from "../validators/answer.validator.js";

export const createAnswer = async (
    req: Request<
        unknown,
        unknown,
        CreateAnswerInput
    >,
    res: Response
) => {
    const answer = await createAnswerService(
        req.user!.id,
        req.body
    );

    return res.status(201).json({
        success: true,
        message: "Jawaban berhasil disimpan",
        data: answer,
    });
};

export const getAnswersByAttemptId = async (
    req: Request<{ attemptId: string }>,
    res: Response
) => {
    const answers = await getAnswersByAttemptIdService(
        req.user!.id,
        req.params.attemptId
    );

    return res.status(200).json({
        success: true,
        message: "Daftar jawaban berhasil diambil",
        data: answers,
    });
};

export const gradeAnswer = async (
    req: Request<{ id: string }, unknown, GradeAnswerInput>,
    res: Response
) => {
    const user = req.user!;
    const answer = await gradeAnswerService(
        req.params.id,
        user.id,
        user.role as "ADMIN" | "LECTURER",
        req.body
    );

    return res.status(200).json({
        success: true,
        message: "Jawaban berhasil dinilai",
        data: answer,
    });
};

export const getAttemptAnswersForGrading = async (
    req: Request<{ attemptId: string }>,
    res: Response
) => {
    const user = req.user!;
    const result = await getAttemptAnswersForGradingService(
        req.params.attemptId,
        user.id,
        user.role as "ADMIN" | "LECTURER"
    );

    return res.status(200).json({
        success: true,
        message: "Data grading berhasil diambil",
        data: result,
    });
};

export const updateAnswer = async (
    req: Request<
        { id: string },
        unknown,
        UpdateAnswerInput
    >,
    res: Response
) => {
    const answer = await updateAnswerService(
        req.params.id,
        req.user!.id,
        req.body
    );

    return res.status(200).json({
        success: true,
        message: "Jawaban berhasil diperbarui",
        data: answer,
    });
};