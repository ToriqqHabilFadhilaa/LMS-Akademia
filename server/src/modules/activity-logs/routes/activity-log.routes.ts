import { Router } from "express";

import {
    createActivityLog,
    getActivityLogsByAttemptId,
} from "../controllers/activity-log.controller.js";

import { authenticate } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/authorize.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";

import {
    createActivityLogSchema,
} from "../validators/activity-log.validator.js";

const router = Router();

router.post(
    "/",
    authenticate,
    authorize("STUDENT"),
    validate(createActivityLogSchema),
    asyncHandler(createActivityLog)
);

router.get(
    "/attempt/:attemptId",
    authenticate,
    authorize("ADMIN", "LECTURER"),
    asyncHandler(getActivityLogsByAttemptId)
);

export default router;