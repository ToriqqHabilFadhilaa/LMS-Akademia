import type { Request, Response } from "express";

import {
    createCourse as createCourseService,
    getCourses as getCoursesService,
    getCourseById as getCourseByIdService,
    updateCourse as updateCourseService,
} from "../services/course.service.js";

import type {
    CreateCourseInput,
    UpdateCourseInput,
} from "../validators/course.validator.js";

export const createCourse = async (
    req: Request<unknown, unknown, CreateCourseInput>,
    res: Response
) => {
    const course = await createCourseService(req.body);

    return res.status(201).json({
        success: true,
        message: "Mata kuliah berhasil dibuat",
        data: course,
    });
};

export const getCourses = async (
    _req: Request,
    res: Response
) => {
    const courses = await getCoursesService();

    return res.status(200).json({
        success: true,
        message: "Daftar mata kuliah berhasil diambil",
        data: courses,
    });
};

export const getCourseById = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    const course = await getCourseByIdService(req.params.id);

    return res.status(200).json({
        success: true,
        message: "Mata kuliah berhasil diambil",
        data: course,
    });
};

export const updateCourse = async (
    req: Request<{ id: string }, unknown, UpdateCourseInput>,
    res: Response
) => {
    const course = await updateCourseService(
        req.params.id,
        req.body
    );

    return res.status(200).json({
        success: true,
        message: "Mata kuliah berhasil diperbarui",
        data: course,
    });
};