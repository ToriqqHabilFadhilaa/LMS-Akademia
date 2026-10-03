import type { Request, Response } from "express";

import {
    createQuestion as createQuestionService,
    getQuestions as getQuestionsService,
    getQuestionById as getQuestionByIdService,
    updateQuestion as updateQuestionService,
    deleteQuestion as deleteQuestionService,
} from "../services/question.service.js";

import type {
    CreateQuestionInput,
    UpdateQuestionInput,
} from "../validators/question.validator.js";

export const createQuestion = async (
    req: Request<unknown, unknown, CreateQuestionInput>,
    res: Response
) => {
    const question = await createQuestionService(
        req.user!.id,
        req.body
    );

    return res.status(201).json({
        success: true,
        message: "Question berhasil dibuat",
        data: question,
    });
};

export const getQuestions = async (
    req: Request,
    res: Response
) => {
    const questions = await getQuestionsService(
        req.user!.role,
        req.user!.id
    );

    return res.status(200).json({
        success: true,
        message: "Daftar question berhasil diambil",
        data: questions,
    });
};

export const getQuestionById = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    const question = await getQuestionByIdService(
        req.params.id,
        req.user!.role,
        req.user!.id
    );

    return res.status(200).json({
        success: true,
        message: "Question berhasil diambil",
        data: question,
    });
};

export const updateQuestion = async (
    req: Request<{ id: string }, unknown, UpdateQuestionInput>,
    res: Response
) => {
    const question = await updateQuestionService(
        req.params.id,
        req.body,
        req.user!.id,
        req.user!.role
    );

    return res.status(200).json({
        success: true,
        message: "Question berhasil diperbarui",
        data: question,
    });
};

export const deleteQuestion = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    await deleteQuestionService(
        req.params.id,
        req.user!.id,
        req.user!.role
    );

    return res.status(200).json({
        success: true,
        message: "Question berhasil dihapus",
    });
};