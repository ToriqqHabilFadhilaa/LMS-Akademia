import { Router } from "express";

import {
    createCourse,
    getCourses,
    getCourseById,
    updateCourse,
} from "../controllers/course.controller.js";

import { authenticate } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/authorize.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";

import {
    createCourseSchema,
    updateCourseSchema,
} from "../validators/course.validator.js";

const router = Router();

router.get(
    "/",
    authenticate,
    authorize("ADMIN", "LECTURER", "STUDENT"),
    asyncHandler(getCourses)
);

router.get(
    "/:id",
    authenticate,
    authorize("ADMIN", "LECTURER", "STUDENT"),
    asyncHandler(getCourseById)
);

router.post(
    "/",
    authenticate,
    authorize("ADMIN"),
    validate(createCourseSchema),
    asyncHandler(createCourse)
);

router.patch(
    "/:id",
    authenticate,
    authorize("ADMIN"),
    validate(updateCourseSchema),
    asyncHandler(updateCourse)
);

export default router;