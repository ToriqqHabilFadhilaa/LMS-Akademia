import { Router } from "express";

import {
    createMaterial,
    getMaterials,
    getMaterialById,
    updateMaterial,
    deleteMaterial,
    getMyMaterials,
} from "../controllers/material.controller.js";

import { authenticate } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/authorize.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";

import {
    createMaterialSchema,
    updateMaterialSchema,
} from "../validators/material.validator.js";

const router = Router();

router.post(
    "/",
    authenticate,
    authorize("ADMIN", "LECTURER"),
    validate(createMaterialSchema),
    asyncHandler(createMaterial)
);

router.get(
    "/my/:courseOfferingId",
    authenticate,
    authorize("STUDENT"),
    asyncHandler(getMyMaterials)
);

router.get(
    "/offering/:courseOfferingId",
    authenticate,
    authorize("ADMIN", "LECTURER", "STUDENT"),
    asyncHandler(getMaterials)
);

router.get(
    "/:id",
    authenticate,
    authorize("ADMIN", "LECTURER", "STUDENT"),
    asyncHandler(getMaterialById)
);

router.patch(
    "/:id",
    authenticate,
    authorize("ADMIN", "LECTURER"),
    validate(updateMaterialSchema),
    asyncHandler(updateMaterial)
);

router.delete(
    "/:id",
    authenticate,
    authorize("ADMIN", "LECTURER"),
    asyncHandler(deleteMaterial)
);

export default router;