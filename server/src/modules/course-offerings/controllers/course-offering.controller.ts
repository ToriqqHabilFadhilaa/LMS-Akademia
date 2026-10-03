import type { Request, Response } from "express";

import {
    createCourseOffering as createCourseOfferingService,
    getCourseOfferings as getCourseOfferingsService,
    getCourseOfferingById as getCourseOfferingByIdService,
    updateCourseOffering as updateCourseOfferingService,
    getMyCourseOfferingById as getMyCourseOfferingByIdService,
    getLecturerCourseOfferings as getLecturerCourseOfferingsService,
} from "../services/course-offering.service.js";

import type {
    CreateCourseOfferingInput,
    UpdateCourseOfferingInput,
} from "../validators/course-offering.validator.js";

export const createCourseOffering = async (
    req: Request<
        unknown,
        unknown,
        CreateCourseOfferingInput
    >,
    res: Response
) => {
    const offering = await createCourseOfferingService(
        req.body
    );

    return res.status(201).json({
        success: true,
        message: "Course offering berhasil dibuat",
        data: offering,
    });
};

export const getLecturerCourseOfferings = async (
    _req: Request,
    res: Response
) => {
    const offerings = await getLecturerCourseOfferingsService(
        _req.user!.id
    );

    return res.status(200).json({
        success: true,
        message: "Daftar course offering berhasil diambil",
        data: offerings,
    });
};

export const getCourseOfferings = async (
    _req: Request,
    res: Response
) => {
    const offerings = await getCourseOfferingsService();

    return res.status(200).json({
        success: true,
        message: "Daftar course offering berhasil diambil",
        data: offerings,
    });
};

export const getCourseOfferingById = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    const offering = await getCourseOfferingByIdService(
        req.params.id
    );

    return res.status(200).json({
        success: true,
        message: "Course offering berhasil diambil",
        data: offering,
    });
};

export const updateCourseOffering = async (
    req: Request<
        { id: string },
        unknown,
        UpdateCourseOfferingInput
    >,
    res: Response
) => {
    const offering = await updateCourseOfferingService(
        req.params.id,
        req.body
    );

    return res.status(200).json({
        success: true,
        message: "Course offering berhasil diperbarui",
        data: offering,
    });
};

export const getMyCourseOfferingById = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    const offering =
        await getMyCourseOfferingByIdService(
            req.params.id,
            req.user!.id
        );

    return res.status(200).json({
        success: true,
        message: "Course offering berhasil diambil",
        data: offering,
    });
};