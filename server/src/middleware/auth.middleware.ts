import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { UnauthorizedError } from "../errors/app-error.js";
import { prisma } from "../config/database.js";
import type { UserRole } from "../generated/prisma/client.js";

interface JwtPayload {
    sub: string;
    role: UserRole;
}

const isUserRole = (value: unknown): value is UserRole =>
    value === "ADMIN" || value === "LECTURER" || value === "STUDENT";

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET is not defined");
    }

    return secret;
};

export const authenticate = async (
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    const authorization = req.headers.authorization;

    if (!authorization) {
        return next(
            new UnauthorizedError("Token autentikasi diperlukan")
        );
    }

    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
        return next(
            new UnauthorizedError("Format token tidak valid")
        );
    }

    let decoded: JwtPayload;
    try {
        const payload = jwt.verify(token, getJwtSecret());
        if (
            typeof payload === "string" ||
            !payload.sub ||
            !isUserRole(payload.role)
        ) {
            return next(new UnauthorizedError("Token tidak valid"));
        }
        decoded = payload as JwtPayload;
    } catch {
        return next(
            new UnauthorizedError("Token tidak valid atau sudah kedaluwarsa")
        );
    }

    const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
        select: {
            id: true,
            role: true,
            status: true,
            deletedAt: true,
        },
    });

    if (
        !user ||
        user.status !== "ACTIVE" ||
        user.deletedAt !== null ||
        user.role !== decoded.role
    ) {
        return next(
            new UnauthorizedError(
                "Sesi tidak valid. Silakan login kembali."
            )
        );
    }

    req.user = {
        id: user.id,
        role: user.role,
    };
    next();
};