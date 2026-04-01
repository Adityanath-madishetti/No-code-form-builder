import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import {
    listVersions,
    getLatestVersion,
    getVersion,
    createVersion,
    updateVersion,
    publishVersion,
    updateVersionSettings,
    updateVersionAccess,
} from "../controllers/formVersionController.js";
import { validateFormVersionMiddleware } from "../utils/validators.js";

// mergeParams: true allows access to :formId from parent router
const router = Router({ mergeParams: true });

// ── Static routes MUST come before dynamic /:version ──
router.get("/latest", verifyToken, getLatestVersion);
router.post("/publish", verifyToken, publishVersion);

// ── Collection routes ──
router.get("/", verifyToken, listVersions);
router.post("/", verifyToken, createVersion);

// ── Dynamic routes ──
router.get("/:version", verifyToken, getVersion);
router.put("/:version", verifyToken, validateFormVersionMiddleware, updateVersion);
router.patch("/:version/settings", verifyToken, updateVersionSettings);
router.patch("/:version/access", verifyToken, updateVersionAccess);

export default router;
