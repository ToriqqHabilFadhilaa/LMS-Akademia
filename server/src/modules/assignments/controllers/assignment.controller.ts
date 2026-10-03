import type { Request, Response } from "express";

import {
    createAssignment as createAssignmentService,
    getAssignments as getAssignmentsService,
    getAssignmentById as getAssignmentByIdService,
    updateAssignment as updateAssignmentService,
    deleteAssignment as deleteAssignmentService,
    getMyAssignments as getMyAssignmentsService,
} from "../services/assignment.service.js";

import type {
    CreateAssignmentInput,
    UpdateAssignmentInput,
} from "../validators/assignment.validator.js";

export const createAssignment = async (
    req: Request<unknown, unknown, CreateAssignmentInput>,
    res: Response
) => {
    const assignment = await createAssignmentService(req.body);

    return res.status(201).json({
        success: true,
        message: "Assignment berhasil dibuat",
        data: assignment,
    });
};

export const getAssignments = async (
    req: Request<{ courseOfferingId: string }>,
    res: Response
) => {
    const assignments = await getAssignmentsService(
        req.params.courseOfferingId
    );

    return res.status(200).json({
        success: true,
        message: "Daftar assignment berhasil diambil",
        data: assignments,
    });
};

export const getAssignmentById = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    const assignment = await getAssignmentByIdService(
        req.params.id
    );

    return res.status(200).json({
        success: true,
        message: "Assignment berhasil diambil",
        data: assignment,
    });
};

export const updateAssignment = async (
    req: Request<{ id: string }, unknown, UpdateAssignmentInput>,
    res: Response
) => {
    const assignment = await updateAssignmentService(
        req.params.id,
        req.body
    );

    return res.status(200).json({
        success: true,
        message: "Assignment berhasil diperbarui",
        data: assignment,
    });
};

export const deleteAssignment = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    await deleteAssignmentService(req.params.id);

    return res.status(200).json({
        success: true,
        message: "Assignment berhasil dihapus",
    });
};

export const getMyAssignments = async (
    req: Request<{ courseOfferingId: string }>,
    res: Response
) => {
    const assignments =
        await getMyAssignmentsService(
            req.params.courseOfferingId,
            req.user!.id
        );

    return res.status(200).json({
        success: true,
        message: "Daftar assignment student berhasil diambil",
        data: assignments,
    });
};