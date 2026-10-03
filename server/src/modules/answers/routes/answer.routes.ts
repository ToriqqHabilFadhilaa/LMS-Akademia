import { Router } from "express";

import {
    createAnswer,
    getAnswersByAttemptId,
    updateAnswer,
    gradeAnswer,
    getAttemptAnswersForGrading,
} from "../controllers/answer.controller.js";

import { authenticate } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/authorize.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";

import {
    createAnswerSchema,
    updateAnswerSchema,
    gradeAnswerSchema,
} from "../validators/answer.validator.js";

const router = Router();

router.get(
    "/grading/attempt/:attemptId",
    authenticate,
    authorize("ADMIN", "LECTURER"),
    asyncHandler(getAttemptAnswersForGrading)
);

router.patch(
    "/:id/grade",
    authenticate,
    authorize("ADMIN", "LECTURER"),
    validate(gradeAnswerSchema),
    asyncHandler(gradeAnswer)
);

router.post(
    "/",
    authenticate,
    authorize("STUDENT"),
    validate(createAnswerSchema),
    asyncHandler(createAnswer)
);

router.get(
    "/attempt/:attemptId",
    authenticate,
    authorize("STUDENT"),
    asyncHandler(getAnswersByAttemptId)
);

router.patch(
    "/:id",
    authenticate,
    authorize("STUDENT"),
    validate(updateAnswerSchema),
    asyncHandler(updateAnswer)
);

export default router;