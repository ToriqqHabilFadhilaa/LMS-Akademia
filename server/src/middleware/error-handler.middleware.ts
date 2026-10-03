import type {
    Request,
    Response,
    NextFunction,
} from "express";

import { AppError } from "../errors/app-error.js";
import { ValidationError } from "../errors/validation-error.js";

export const errorHandler = (
    err: unknown,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    if (err instanceof ValidationError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.fields,
        });
    }

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            ...(err.code ? { code: err.code } : {}),
        });
    }

    console.error("[UNHANDLED ERROR]", {
        message: err instanceof Error
            ? err.message
            : String(err),

        stack: err instanceof Error
            ? err.stack
            : undefined,

        path: req.path,
        method: req.method,
    });

    return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
    });
};