import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";
import { ValidationError } from "../errors/validation-error.js";

export const validate = (schema: ZodType) => {
    return (
        req: Request,
        _res: Response,
        next: NextFunction
    ) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            return next(new ValidationError(result.error));
        }

        req.body = result.data;

        next();
    };
};