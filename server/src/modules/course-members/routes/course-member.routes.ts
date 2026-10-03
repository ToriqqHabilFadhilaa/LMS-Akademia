import { Router } from "express";

import {
    createCourseMember,
    getCourseMembers,
    getCourseMemberById,
    updateCourseMember,
    deleteCourseMember,
    getMyCourseMembers,
} from "../controllers/course-member.controller.js";

import { authenticate } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/authorize.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";

import {
    createCourseMemberSchema,
    updateCourseMemberSchema,
} from "../validators/course-member.validator.js";

const router = Router();

router.post(
    "/",
    authenticate,
    authorize("ADMIN", "LECTURER"),
    validate(createCourseMemberSchema),
    asyncHandler(createCourseMember)
);

router.get(
    "/my",
    authenticate,
    authorize("STUDENT"),
    asyncHandler(getMyCourseMembers)
);

router.get(
    "/offering/:courseOfferingId",
    authenticate,
    authorize("ADMIN", "LECTURER", "STUDENT"),
    asyncHandler(getCourseMembers)
);

router.get(
    "/:id",
    authenticate,
    authorize("ADMIN", "LECTURER", "STUDENT"),
    asyncHandler(getCourseMemberById)
);

router.patch(
    "/:id",
    authenticate,
    authorize("ADMIN", "LECTURER"),
    validate(updateCourseMemberSchema),
    asyncHandler(updateCourseMember)
);

router.delete(
    "/:id",
    authenticate,
    authorize("ADMIN", "LECTURER"),
    asyncHandler(deleteCourseMember)
);

export default router;