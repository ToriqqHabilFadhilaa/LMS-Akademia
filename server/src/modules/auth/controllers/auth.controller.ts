import type { Request, Response } from "express";

import {
    registerUser,
    loginUser,
    getCurrentUser,
} from "../services/auth.service.js";

import type {
    RegisterInput,
    LoginInput,
} from "../validators/auth.validator.js";

import {
    UnauthorizedError,
} from "../../../errors/app-error.js";

export const register = async (
    req: Request<unknown, unknown, RegisterInput>,
    res: Response
) => {
    const user = await registerUser(req.body);

    return res.status(201).json({
        success: true,
        message: "Registrasi berhasil",
        data: user,
    });
};

export const login = async (
    req: Request<unknown, unknown, LoginInput>,
    res: Response
) => {
    const result = await loginUser(req.body);

    return res.status(200).json({
        success: true,
        message: "Login berhasil",
        data: result,
    });
};

export const me = async (
    req: Request,
    res: Response
) => {
    const userId = req.user?.id;

    if (!userId) {
        throw new UnauthorizedError(
            "User belum terautentikasi"
        );
    }

    const user = await getCurrentUser(userId);

    return res.status(200).json({
        success: true,
        message: "User terautentikasi",
        data: user,
    });
};