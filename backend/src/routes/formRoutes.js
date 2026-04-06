import { Router } from "express";
import { optionalAuth, verifyToken } from "../middleware/auth.js";
import {
    createForm,
    listForms,
    listSharedForms,
    getForm,
    updateForm,
    deleteForm,
    publishForm,
    getPublicForm,
} from "../controllers/formController.js";
import {
    transitionSubmission,
    listAvailableTransitions,
} from "../controllers/workflowController.js";
import formVersionRoutes from "./formVersionRoutes.js";
import submissionRoutes from "./submissionRoutes.js";
import workflowRoutes from "./workflowRoutes.js";

const router = Router();

// Form CRUD
/**
 * @swagger
 * /api/forms:
 *   post:
 *     summary: Create a new form
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Form created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 form:
 *                   type: object
 *                 version:
 *                   type: object
 */
router.post("/", verifyToken, createForm);
/**
 * @swagger
 * /api/forms:
 *   get:
 *     summary: List all forms owned by the current user
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of forms
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get("/", verifyToken, listForms);

/**
 * @swagger
 * /api/forms/shared:
 *   get:
 *     summary: List forms shared with the current user
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of shared forms
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get("/shared", verifyToken, listSharedForms);
/**
 * @swagger
 * /api/forms/{formId}:
 *   get:
 *     summary: Get a form by ID
 *     tags: [Forms]
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
 *         description: Returns the form
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 form:
 *                   type: object
 *                 latestVersion:
 *                   type: object
 *                 mySubmissionsCount:
 *                   type: number
 *   patch:
 *     summary: Update basic form metadata
 *     tags: [Forms]
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
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Form updated
 *   delete:
 *     summary: Delete a form
 *     tags: [Forms]
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
 *         description: Form deleted
 */
router.get("/:formId", verifyToken, getForm);
router.patch("/:formId", verifyToken, updateForm);
router.delete("/:formId", verifyToken, deleteForm);

// Publish
/**
 * @swagger
 * /api/forms/{formId}/publish:
 *   post:
 *     summary: Publish a form's latest draft
 *     tags: [Forms]
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
 *         description: Form published successfully
 */
router.post("/:formId/publish", verifyToken, publishForm);

// Public form access (auth optional; policy enforcement in controller)
/**
 * @swagger
 * /api/forms/{formId}/public:
 *   get:
 *     summary: Get public form details for respondents
 *     tags: [Forms]
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
 *         description: Form details and workflow metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 form:
 *                   type: object
 *                 workflow:
 *                   type: object
 */
router.get("/:formId/public", optionalAuth, getPublicForm);

// Workflow transition endpoints (on submissions)
/**
 * @swagger
 * /api/forms/{formId}/submissions/{submissionId}/transition:
 *   post:
 *     summary: Transition a submission to a new workflow status
 *     tags: [Workflows]
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
 *             required:
 *               - transitionId
 *             properties:
 *               transitionId:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Submission transitioned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 * /api/forms/{formId}/submissions/{submissionId}/transitions:
 *   get:
 *     summary: List available transitions for a submission
 *     tags: [Workflows]
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
 *         description: Available transitions list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.post("/:formId/submissions/:submissionId/transition", verifyToken, transitionSubmission);
router.get("/:formId/submissions/:submissionId/transitions", verifyToken, listAvailableTransitions);

// Nested routes
router.use("/:formId/versions", formVersionRoutes);
router.use("/:formId/submissions", submissionRoutes);
router.use("/:formId/workflow", workflowRoutes);

export default router;

