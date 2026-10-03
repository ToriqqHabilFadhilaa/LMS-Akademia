import { Router } from "express";

import {
    createExamAttempt,
    getExamAttemptById,
    getExamAttemptsByExamId,
    getMyExamAttemptsByExamId,
    grantExamRetake,
} from "../controllers/exam-attempt.controller.js";

import { authenticate } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/authorize.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";

import {
    createExamAttemptSchema,
} from "../validators/exam-attempt.validator.js";

const router = Router();

router.post(
    "/",
    authenticate,
    authorize("STUDENT"),
    validate(createExamAttemptSchema),
    asyncHandler(createExamAttempt)
);

router.get(
    "/exam/:examId",
    authenticate,
    authorize("ADMIN", "LECTURER"),
    asyncHandler(getExamAttemptsByExamId)
);

router.get(
    "/my/exam/:examId",
    authenticate,
    authorize("STUDENT"),
    asyncHandler(getMyExamAttemptsByExamId)
);

router.patch(
    "/:id/grant-retake",
    authenticate,
    authorize("ADMIN"),
    asyncHandler(grantExamRetake)
);

router.get(
    "/:id",
    authenticate,
    authorize("STUDENT"),
    asyncHandler(getExamAttemptById)
);

export default router;