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
/**
 * @swagger
 * /api/forms/{formId}/versions/latest:
 *   get:
 *     summary: Get the latest draft version of a form
 *     tags: [Form Versions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Latest form version
 *
 * /api/forms/{formId}/versions/publish:
 *   post:
 *     summary: Publish the current version
 *     tags: [Form Versions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Version published successfully
 */
router.get("/latest", verifyToken, getLatestVersion);
router.post("/publish", verifyToken, publishVersion);

// ── Collection routes ──
/**
 * @swagger
 * /api/forms/{formId}/versions:
 *   get:
 *     summary: List all versions of a form
 *     tags: [Form Versions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of versions
 *   post:
 *     summary: Create a new draft version from an existing version
 *     tags: [Form Versions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               baseVersionNumber:
 *                 type: number
 *     responses:
 *       201:
 *         description: New version created
 */
router.get("/", verifyToken, listVersions);
router.post("/", verifyToken, createVersion);

// ── Dynamic routes ──
/**
 * @swagger
 * /api/forms/{formId}/versions/{version}:
 *   get:
 *     summary: Get a specific form version by number
 *     tags: [Form Versions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: version
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Form version data
 *   put:
 *     summary: Update a form version
 *     tags: [Form Versions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: version
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pages:
 *                 type: array
 *               components:
 *                 type: object
 *               logicRules:
 *                 type: array
 *               logicFormulas:
 *                 type: array
 *     responses:
 *       200:
 *         description: Form version updated
 *
 * /api/forms/{formId}/versions/{version}/settings:
 *   patch:
 *     summary: Update version settings
 *     tags: [Form Versions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: version
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Settings updated
 *
 * /api/forms/{formId}/versions/{version}/access:
 *   patch:
 *     summary: Update version access roles/permissions
 *     tags: [Form Versions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: version
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               access:
 *                 type: object
 *     responses:
 *       200:
 *         description: Access permissions updated
 */
router.get("/:version", verifyToken, getVersion);
router.put("/:version", verifyToken, validateFormVersionMiddleware, updateVersion);
router.patch("/:version/settings", verifyToken, updateVersionSettings);
router.patch("/:version/access", verifyToken, updateVersionAccess);

export default router;
