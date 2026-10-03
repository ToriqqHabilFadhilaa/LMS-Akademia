import { Router } from "express";
import { register, login, me, } from "../controllers/auth.controller.js";
import { authenticate } from "../../../middleware/auth.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import { authorize } from "../../../middleware/authorize.middleware.js";

import {
    registerSchema,
    loginSchema,
} from "../validators/auth.validator.js";

const router = Router();

router.post(
    "/register",
    validate(registerSchema),
    asyncHandler(register)
);

router.post(
    "/login",
    validate(loginSchema),
    asyncHandler(login)
);

router.get(
    "/me",
    authenticate,
    asyncHandler(me)
);

router.get(
    "/admin-test",
    authenticate,
    authorize("ADMIN"),
    asyncHandler(async (_req, res) => {
        return res.status(200).json({
            success: true,
            message: "Anda memiliki akses ADMIN",
        });
    })
);

router.get(
    "/staff-test",
    authenticate,
    authorize("ADMIN", "LECTURER"),
    asyncHandler(async (_req, res) => {
        return res.status(200).json({
            success: true,
            message: "Anda memiliki akses staff",
        });
    })
);

export default router;