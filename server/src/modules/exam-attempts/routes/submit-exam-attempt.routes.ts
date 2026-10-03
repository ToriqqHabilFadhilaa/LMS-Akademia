import { Router } from "express";

import {
    submitExamAttempt,
} from "../controllers/submit-exam-attempt.controller.js";

import { authenticate } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/authorize.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";

const router = Router();

router.patch(
    "/:id/submit",
    authenticate,
    authorize("STUDENT"),
    asyncHandler(submitExamAttempt)
);

export default router;