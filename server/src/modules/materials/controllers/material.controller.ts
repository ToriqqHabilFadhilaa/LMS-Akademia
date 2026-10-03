import type { Request, Response } from "express";

import {
    createMaterial as createMaterialService,
    getMaterials as getMaterialsService,
    getMaterialById as getMaterialByIdService,
    updateMaterial as updateMaterialService,
    deleteMaterial as deleteMaterialService,
    getMyMaterials as getMyMaterialsService,
} from "../services/material.service.js";

import type {
    CreateMaterialInput,
    UpdateMaterialInput,
} from "../validators/material.validator.js";

export const createMaterial = async (
    req: Request<unknown, unknown, CreateMaterialInput>,
    res: Response
) => {
    const material = await createMaterialService(req.body);

    return res.status(201).json({
        success: true,
        message: "Materi berhasil dibuat",
        data: material,
    });
};

export const getMaterials = async (
    req: Request<{ courseOfferingId: string }>,
    res: Response
) => {
    const materials = await getMaterialsService(
        req.params.courseOfferingId
    );

    return res.status(200).json({
        success: true,
        message: "Daftar materi berhasil diambil",
        data: materials,
    });
};

export const getMaterialById = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    const material = await getMaterialByIdService(
        req.params.id
    );

    return res.status(200).json({
        success: true,
        message: "Materi berhasil diambil",
        data: material,
    });
};

export const updateMaterial = async (
    req: Request<{ id: string }, unknown, UpdateMaterialInput>,
    res: Response
) => {
    const material = await updateMaterialService(
        req.params.id,
        req.body
    );

    return res.status(200).json({
        success: true,
        message: "Materi berhasil diperbarui",
        data: material,
    });
};

export const deleteMaterial = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    await deleteMaterialService(req.params.id);

    return res.status(200).json({
        success: true,
        message: "Materi berhasil dihapus",
    });
};

export const getMyMaterials = async (
    req: Request<{ courseOfferingId: string }>,
    res: Response
) => {
    const materials =
        await getMyMaterialsService(
            req.params.courseOfferingId,
            req.user!.id
        );

    return res.status(200).json({
        success: true,
        message: "Daftar materi berhasil diambil",
        data: materials,
    });
};