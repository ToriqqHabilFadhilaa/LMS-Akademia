import { Router } from "express";

import {
    getExamResult,
    getExamResultForStaff,
    getExamReportByExamId,
} from "../controllers/exam-result.controller.js";

import { authenticate } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/authorize.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";

const router = Router();

router.get(
    "/attempt/:attemptId",
    authenticate,
    authorize("STUDENT"),
    asyncHandler(getExamResult)
);

router.get(
    "/staff/attempt/:attemptId",
    authenticate,
    authorize("ADMIN", "LECTURER"),
    asyncHandler(getExamResultForStaff)
);

router.get(
    "/report/:examId",
    authenticate,
    authorize("ADMIN", "LECTURER"),
    asyncHandler(getExamReportByExamId)
);

export default router;