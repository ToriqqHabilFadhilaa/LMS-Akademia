import { Router } from "express";

import {
    createExamQuestion,
    getExamQuestions,
    getExamQuestionById,
    updateExamQuestion,
    deleteExamQuestion,
} from "../controllers/exam-question.controller.js";

import { authenticate } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/authorize.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";

import {
    createExamQuestionSchema,
    updateExamQuestionSchema,
} from "../validators/exam-question.validator.js";

const router = Router();

router.post(
    "/",
    authenticate,
    authorize("ADMIN", "LECTURER"),
    validate(createExamQuestionSchema),
    asyncHandler(createExamQuestion)
);

router.get(
    "/exam/:examId",
    authenticate,
    authorize("ADMIN", "LECTURER"),
    asyncHandler(getExamQuestions)
);

router.get(
    "/:id",
    authenticate,
    authorize("ADMIN", "LECTURER"),
    asyncHandler(getExamQuestionById)
);

router.patch(
    "/:id",
    authenticate,
    authorize("ADMIN", "LECTURER"),
    validate(updateExamQuestionSchema),
    asyncHandler(updateExamQuestion)
);

router.delete(
    "/:id",
    authenticate,
    authorize("ADMIN", "LECTURER"),
    asyncHandler(deleteExamQuestion)
);

export default router;