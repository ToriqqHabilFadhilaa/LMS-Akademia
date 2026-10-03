import { Router } from "express";

import {
    createQuestion,
    getQuestions,
    getQuestionById,
    updateQuestion,
    deleteQuestion,
} from "../controllers/question.controller.js";

import { authenticate } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/authorize.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";

import {
    createQuestionSchema,
    updateQuestionSchema,
} from "../validators/question.validator.js";

const router = Router();

router.post(
    "/",
    authenticate,
    authorize("ADMIN", "LECTURER"),
    validate(createQuestionSchema),
    asyncHandler(createQuestion)
);

router.get(
    "/",
    authenticate,
    authorize("ADMIN", "LECTURER"),
    asyncHandler(getQuestions)
);

router.get(
    "/:id",
    authenticate,
    authorize("ADMIN", "LECTURER"),
    asyncHandler(getQuestionById)
);

router.patch(
    "/:id",
    authenticate,
    authorize("ADMIN", "LECTURER"),
    validate(updateQuestionSchema),
    asyncHandler(updateQuestion)
);

router.delete(
    "/:id",
    authenticate,
    authorize("ADMIN", "LECTURER"),
    asyncHandler(deleteQuestion)
);

export default router;