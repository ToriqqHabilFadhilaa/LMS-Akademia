import { Router } from "express";

import {
    createCourseOffering,
    getCourseOfferings,
    getCourseOfferingById,
    updateCourseOffering,
    getMyCourseOfferingById,
    getLecturerCourseOfferings,
} from "../controllers/course-offering.controller.js";

import { authenticate } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/authorize.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";

import {
    createCourseOfferingSchema,
    updateCourseOfferingSchema,
} from "../validators/course-offering.validator.js";

const router = Router();

router.get(
    "/lecturer/my",
    authenticate,
    authorize("LECTURER"),
    asyncHandler(getLecturerCourseOfferings)
);

router.get(
    "/",
    authenticate,
    authorize("ADMIN", "LECTURER", "STUDENT"),
    asyncHandler(getCourseOfferings)
);

router.get(
    "/my/:id",
    authenticate,
    authorize("STUDENT"),
    asyncHandler(getMyCourseOfferingById)
);

router.get(
    "/:id",
    authenticate,
    authorize("ADMIN", "LECTURER", "STUDENT"),
    asyncHandler(getCourseOfferingById)
);

router.post(
    "/",
    authenticate,
    authorize("ADMIN"),
    validate(createCourseOfferingSchema),
    asyncHandler(createCourseOffering)
);

router.patch(
    "/:id",
    authenticate,
    authorize("ADMIN"),
    validate(updateCourseOfferingSchema),
    asyncHandler(updateCourseOffering)
);

export default router;