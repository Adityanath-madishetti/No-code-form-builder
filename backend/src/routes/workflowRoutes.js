import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import {
    setWorkflow,
    getWorkflow,
} from "../controllers/workflowController.js";

const router = Router({ mergeParams: true });

// Workflow CRUD on a form
/**
 * @swagger
 * /api/forms/{formId}/workflow:
 *   put:
 *     summary: Create or update the workflow definition for a form
 *     tags: [Workflows]
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
 *               statuses:
 *                 type: array
 *               transitions:
 *                 type: array
 *     responses:
 *       200:
 *         description: Workflow updated successfully
 *   get:
 *     summary: Get the workflow definition for a form
 *     tags: [Workflows]
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
 *         description: Workflow definition
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statuses:
 *                   type: array
 *                 transitions:
 *                   type: array
 */
router.put("/", verifyToken, setWorkflow);
router.get("/", verifyToken, getWorkflow);

export default router;
