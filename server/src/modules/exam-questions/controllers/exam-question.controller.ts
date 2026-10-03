import type { Request, Response } from "express";

import {
    createExamQuestion as createExamQuestionService,
    getExamQuestions as getExamQuestionsService,
    getExamQuestionById as getExamQuestionByIdService,
    updateExamQuestion as updateExamQuestionService,
    deleteExamQuestion as deleteExamQuestionService,
} from "../services/exam-question.service.js";

import type {
    CreateExamQuestionInput,
    UpdateExamQuestionInput,
} from "../validators/exam-question.validator.js";

export const createExamQuestion = async (
    req: Request<
        unknown,
        unknown,
        CreateExamQuestionInput
    >,
    res: Response
) => {
    const user = req.user!;
    const examQuestion =
        await createExamQuestionService(
            req.body,
            user.id,
            user.role as "ADMIN" | "LECTURER"
        );

    return res.status(201).json({
        success: true,
        message: "Question berhasil ditambahkan ke exam",
        data: examQuestion,
    });
};

export const getExamQuestions = async (
    req: Request<{ examId: string }>,
    res: Response
) => {
    const user = req.user!;
    const examQuestions =
        await getExamQuestionsService(
            req.params.examId,
            user.id,
            user.role as "ADMIN" | "LECTURER"
        );

    return res.status(200).json({
        success: true,
        message: "Daftar question dalam exam berhasil diambil",
        data: examQuestions,
    });
};

export const getExamQuestionById = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    const user = req.user!;
    const examQuestion =
        await getExamQuestionByIdService(
            req.params.id,
            user.id,
            user.role as "ADMIN" | "LECTURER"
        );

    return res.status(200).json({
        success: true,
        message: "Exam question berhasil diambil",
        data: examQuestion,
    });
};

export const updateExamQuestion = async (
    req: Request<
        { id: string },
        unknown,
        UpdateExamQuestionInput
    >,
    res: Response
) => {
    const user = req.user!;
    const examQuestion =
        await updateExamQuestionService(
            req.params.id,
            req.body,
            user.id,
            user.role as "ADMIN" | "LECTURER"
        );

    return res.status(200).json({
        success: true,
        message: "Urutan question berhasil diperbarui",
        data: examQuestion,
    });
};

export const deleteExamQuestion = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    const user = req.user!;
    await deleteExamQuestionService(
        req.params.id,
        user.id,
        user.role as "ADMIN" | "LECTURER"
    );

    return res.status(200).json({
        success: true,
        message: "Question berhasil dihapus dari exam",
    });
};