import type {
    NextFunction,
    Request,
    RequestHandler,
    Response,
} from "express";

import type { ParamsDictionary } from "express-serve-static-core";
import type { ParsedQs } from "qs";

export const asyncHandler = <
    P extends ParamsDictionary = ParamsDictionary,
    ResBody = unknown,
    ReqBody = unknown,
    ReqQuery extends ParsedQs = ParsedQs,
    Locals extends Record<string, unknown> = Record<string, unknown>,
>(
    handler: (
        req: Request<P, ResBody, ReqBody, ReqQuery, Locals>,
        res: Response<ResBody, Locals>,
        next: NextFunction
    ) => unknown
): RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals> => {
    return (req, res, next) => {
        Promise.resolve(
            handler(req, res, next)
        ).catch(next);
    };
};