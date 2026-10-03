import { Router } from "express";

import {
    gradeSubmission,
} from "../controllers/grading.controller.js";

import { authenticate } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/authorize.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";

import {
    gradeSubmissionSchema,
} from "../validators/grading.validator.js";

const router = Router();

router.patch(
    "/submissions/:id",
    authenticate,
    authorize("ADMIN", "LECTURER"),
    validate(gradeSubmissionSchema),
    asyncHandler(gradeSubmission)
);

export default router;