import type { Request, Response } from "express";

import {
    createUser as createUserService,
    deleteUser as deleteUserService,
    getActiveLecturers as getActiveLecturersService,
    getUserById as getUserByIdService,
    getUsers as getUsersService,
    updateUser as updateUserService,
} from "../services/user.service.js";

import type {
    CreateUserInput,
    UpdateUserInput,
} from "../services/user.service.js";

export const getActiveLecturers = async (
    _req: Request,
    res: Response
) => {
    const lecturers =
        await getActiveLecturersService();

    return res.status(200).json({
        success: true,
        message:
            "Daftar lecturer aktif berhasil diambil",
        data: lecturers,
    });
};

export const getUsers = async (
    _req: Request,
    res: Response
) => {
    const users = await getUsersService();

    return res.status(200).json({
        success: true,
        message: "Daftar user berhasil diambil",
        data: users,
    });
};

export const getUserById = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    const user =
        await getUserByIdService(req.params.id);

    return res.status(200).json({
        success: true,
        message: "Data user berhasil diambil",
        data: user,
    });
};

export const createUser = async (
    req: Request<
        Record<string, never>,
        unknown,
        CreateUserInput
    >,
    res: Response
) => {
    const user = await createUserService(
        req.body
    );

    return res.status(201).json({
        success: true,
        message: "User berhasil dibuat",
        data: user,
    });
};

export const updateUser = async (
    req: Request<
        { id: string },
        unknown,
        UpdateUserInput
    >,
    res: Response
) => {
    const user = await updateUserService(
        req.params.id,
        req.body
    );

    return res.status(200).json({
        success: true,
        message: "User berhasil diperbarui",
        data: user,
    });
};

export const deleteUser = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    const requesterId = req.user!.id;

    const user = await deleteUserService(
        req.params.id,
        requesterId
    );

    return res.status(200).json({
        success: true,
        message: "User berhasil dinonaktifkan",
        data: user,
    });
};