import { Router } from "express";

import {
    getRiskScoreByAttemptId,
} from "../controllers/risk-score.controller.js";

import { authenticate } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/authorize.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";

const router = Router();

router.get(
    "/attempt/:attemptId",
    authenticate,
    authorize("ADMIN", "LECTURER"),
    asyncHandler(getRiskScoreByAttemptId)
);

export default router;