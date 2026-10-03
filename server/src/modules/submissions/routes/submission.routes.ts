import { Router } from "express";

import {
    createSubmission,
    getSubmissionById,
    getMySubmissions,
    updateSubmission,
} from "../controllers/submission.controller.js";

import { authenticate } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/authorize.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";

import {
    createSubmissionSchema,
    updateSubmissionSchema,
} from "../validators/submission.validator.js";

const router = Router();

router.post(
    "/",
    authenticate,
    authorize("STUDENT"),
    validate(createSubmissionSchema),
    asyncHandler(createSubmission)
);

router.get(
    "/mine",
    authenticate,
    authorize("STUDENT"),
    asyncHandler(getMySubmissions)
);

router.get(
    "/:id",
    authenticate,
    authorize("ADMIN", "LECTURER", "STUDENT"),
    asyncHandler(getSubmissionById)
);

router.patch(
    "/:id",
    authenticate,
    authorize("STUDENT"),
    validate(updateSubmissionSchema),
    asyncHandler(updateSubmission)
);

export default router;