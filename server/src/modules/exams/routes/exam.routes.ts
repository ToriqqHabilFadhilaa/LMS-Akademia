import { Router } from "express";

import {
    createExam,
    getExams,
    getExamById,
    updateExam,
    deleteExam,
    getMyExams,
    getMyExamById,
} from "../controllers/exam.controller.js";

import { authenticate } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/authorize.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";

import {
    createExamSchema,
    updateExamSchema,
} from "../validators/exam.validator.js";

const router = Router();

router.post(
    "/",
    authenticate,
    authorize("ADMIN", "LECTURER"),
    validate(createExamSchema),
    asyncHandler(createExam)
);

router.get(
    "/course-offerings/:courseOfferingId",
    authenticate,
    authorize("ADMIN", "LECTURER"),
    asyncHandler(getExams)
);

router.get(
    "/my/:courseOfferingId",
    authenticate,
    authorize("STUDENT"),
    asyncHandler(getMyExams)
);

router.get(
    "/my/detail/:id",
    authenticate,
    authorize("STUDENT"),
    asyncHandler(getMyExamById)
);

router.get(
    "/:id",
    authenticate,
    authorize("ADMIN", "LECTURER", "STUDENT"),
    asyncHandler(getExamById)
);

router.patch(
    "/:id",
    authenticate,
    authorize("ADMIN", "LECTURER"),
    validate(updateExamSchema),
    asyncHandler(updateExam)
);

router.delete(
    "/:id",
    authenticate,
    authorize("ADMIN", "LECTURER"),
    asyncHandler(deleteExam)
);

export default router;