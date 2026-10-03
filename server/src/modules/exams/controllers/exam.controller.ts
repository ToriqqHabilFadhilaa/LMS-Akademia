import type { Request, Response } from "express";

import {
    createExam as createExamService,
    getExams as getExamsService,
    getExamById as getExamByIdService,
    updateExam as updateExamService,
    deleteExam as deleteExamService,
    getMyExams as getMyExamsService,
    getMyExamById as getMyExamByIdService,
} from "../services/exam.service.js";

import type {
    CreateExamInput,
    UpdateExamInput,
} from "../validators/exam.validator.js";

export const createExam = async (
    req: Request<unknown, unknown, CreateExamInput>,
    res: Response
) => {
    const exam = await createExamService(
        req.body,
        req.user!.id,
        req.user!.role as "ADMIN" | "LECTURER"
    );

    return res.status(201).json({
        success: true,
        message: "Exam berhasil dibuat",
        data: exam,
    });
};

export const getExams = async (
    req: Request<{ courseOfferingId: string }>,
    res: Response
) => {
    const exams = await getExamsService(
        req.params.courseOfferingId,
        req.user!.id,
        req.user!.role as "ADMIN" | "LECTURER"
    );

    return res.status(200).json({
        success: true,
        message: "Daftar exam berhasil diambil",
        data: exams,
    });
};

export const getExamById = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    const exam = await getExamByIdService(
        req.params.id
    );

    return res.status(200).json({
        success: true,
        message: "Exam berhasil diambil",
        data: exam,
    });
};

export const updateExam = async (
    req: Request<{ id: string }, unknown, UpdateExamInput>,
    res: Response
) => {
    const exam = await updateExamService(
        req.params.id,
        req.body,
        req.user!.id,
        req.user!.role as "ADMIN" | "LECTURER"
    );

    return res.status(200).json({
        success: true,
        message: "Exam berhasil diperbarui",
        data: exam,
    });
};

export const deleteExam = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    await deleteExamService(
        req.params.id,
        req.user!.id,
        req.user!.role as "ADMIN" | "LECTURER"
    );

    return res.status(200).json({
        success: true,
        message: "Exam berhasil dihapus",
    });
};

export const getMyExams = async (
    req: Request<{ courseOfferingId: string }>,
    res: Response
) => {
    const exams =
        await getMyExamsService(
            req.params.courseOfferingId,
            req.user!.id
        );

    return res.status(200).json({
        success: true,
        message: "Daftar exam student berhasil diambil",
        data: exams,
    });
};

export const getMyExamById = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    const exam =
        await getMyExamByIdService(
            req.params.id,
            req.user!.id
        );

    return res.status(200).json({
        success: true,
        message: "Exam berhasil diambil",
        data: exam,
    });
};