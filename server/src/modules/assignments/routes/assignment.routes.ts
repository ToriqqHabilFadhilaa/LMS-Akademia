import { Router } from "express";

import {
    createAssignment,
    getAssignments,
    getAssignmentById,
    updateAssignment,
    deleteAssignment,
    getMyAssignments,
} from "../controllers/assignment.controller.js";

import { authenticate } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/authorize.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";

import {
    createAssignmentSchema,
    updateAssignmentSchema,
} from "../validators/assignment.validator.js";

const router = Router();

router.post(
    "/",
    authenticate,
    authorize("ADMIN", "LECTURER"),
    validate(createAssignmentSchema),
    asyncHandler(createAssignment)
);

router.get(
    "/my/:courseOfferingId",
    authenticate,
    authorize("STUDENT"),
    asyncHandler(getMyAssignments)
);

router.get(
    "/offering/:courseOfferingId",
    authenticate,
    authorize("ADMIN", "LECTURER", "STUDENT"),
    asyncHandler(getAssignments)
);

router.get(
    "/:id",
    authenticate,
    authorize("ADMIN", "LECTURER", "STUDENT"),
    asyncHandler(getAssignmentById)
);

router.patch(
    "/:id",
    authenticate,
    authorize("ADMIN", "LECTURER"),
    validate(updateAssignmentSchema),
    asyncHandler(updateAssignment)
);

router.delete(
    "/:id",
    authenticate,
    authorize("ADMIN", "LECTURER"),
    asyncHandler(deleteAssignment)
);

export default router;