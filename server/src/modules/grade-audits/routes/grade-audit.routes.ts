import { Router } from "express";

import {
    getGradeAuditsBySubmissionId,
} from "../controllers/grade-audit.controller.js";

import { authenticate } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/authorize.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";

const router = Router();

router.get(
    "/submission/:submissionId",
    authenticate,
    authorize("ADMIN", "LECTURER"),
    asyncHandler(getGradeAuditsBySubmissionId)
);

export default router;