import { Router } from "express";
import { verifyToken, optionalAuth } from "../middleware/auth.js";
import {
    submitForm,
    listSubmissions,
    exportSubmissionsCsv,
    getSubmission,
    getMyFormSubmissions,
    updateMySubmission,
} from "../controllers/submissionController.js";

// mergeParams: true allows access to :formId from parent router
const router = Router({ mergeParams: true });

// Submit uses optionalAuth — auth depends on form's requireLogin setting
/**
 * @swagger
 * /api/forms/{formId}/submissions:
 *   post:
 *     summary: Submit a response to a form
 *     tags: [Submissions]
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
 *               data:
 *                 type: object
 *     responses:
 *       201:
 *         description: Submission successful
 */
router.post("/", optionalAuth, submitForm);

// Viewing submissions requires authentication (owner/reviewer policy enforced in controller)
/**
 * @swagger
 * /api/forms/{formId}/submissions:
 *   get:
 *     summary: List all submissions for a form
 *     tags: [Submissions]
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
 *         description: List of submissions
 *
 * /api/forms/{formId}/submissions/export.csv:
 *   get:
 *     summary: Export all submissions as CSV
 *     tags: [Submissions]
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
 *         description: CSV file contents
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *
 * /api/forms/{formId}/submissions/mine:
 *   get:
 *     summary: Get submissions for this form by the current user
 *     tags: [Submissions]
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
 *         description: List of standard user's submissions
 *
 * /api/forms/{formId}/submissions/{submissionId}/mine:
 *   patch:
 *     summary: Update an existing submission by the user
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Submission updated
 *
 * /api/forms/{formId}/submissions/{submissionId}:
 *   get:
 *     summary: Get a specific submission details
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Submission data
 */
router.get("/", verifyToken, listSubmissions);
router.get("/export.csv", verifyToken, exportSubmissionsCsv);
router.get("/mine", verifyToken, getMyFormSubmissions);
router.patch("/:submissionId/mine", verifyToken, updateMySubmission);
router.get("/:submissionId", verifyToken, getSubmission);

export default router;
