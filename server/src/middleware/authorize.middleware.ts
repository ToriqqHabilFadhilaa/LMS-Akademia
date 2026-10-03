import type { Request, Response, NextFunction } from "express";
import type { UserRole } from "../generated/prisma/client.js";

import { ForbiddenError, UnauthorizedError } from "../errors/app-error.js";

export const authorize = (...allowedRoles: UserRole[]) => {
    return (
        req: Request,
        _res: Response,
        next: NextFunction
    ) => {
        if (!req.user) {
            return next(
                new UnauthorizedError("User belum terautentikasi")
            );
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(
                new ForbiddenError("Anda tidak memiliki akses")
            );
        }

        next();
    };
};