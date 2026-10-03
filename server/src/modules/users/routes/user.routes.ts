import { Router } from "express";

import {
    createUser,
    deleteUser,
    getActiveLecturers,
    getUserById,
    getUsers,
    updateUser,
} from "../controllers/user.controller.js";

import { authenticate } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/authorize.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";

import {
    createUserSchema,
    updateUserSchema,
} from "../validators/user.validator.js";

const router = Router();

router.get(
    "/lecturers",
    authenticate,
    authorize("ADMIN"),
    asyncHandler(getActiveLecturers)
);

router.get(
    "/",
    authenticate,
    authorize("ADMIN"),
    asyncHandler(getUsers)
);

router.get(
    "/:id",
    authenticate,
    authorize("ADMIN"),
    asyncHandler(getUserById)
);

router.post(
    "/",
    authenticate,
    authorize("ADMIN"),
    validate(createUserSchema),
    asyncHandler(createUser)
);

router.patch(
    "/:id",
    authenticate,
    authorize("ADMIN"),
    validate(updateUserSchema),
    asyncHandler(updateUser)
);

router.delete(
    "/:id",
    authenticate,
    authorize("ADMIN"),
    asyncHandler(deleteUser)
);

export default router;