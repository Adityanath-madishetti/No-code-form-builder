import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import { syncUser, getMe, updateMe } from "../controllers/userController.js";

const router = Router();

/**
 * @swagger
 * /api/users/sync:
 *   post:
 *     summary: Sync user with external provider/database
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User synced successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *       401:
 *         description: Unauthorized
 */
router.post("/sync", verifyToken, syncUser);
/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns current user data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 */
router.get("/me", verifyToken, getMe);
/**
 * @swagger
 * /api/users/me:
 *   patch:
 *     summary: Update current user properties
 *     tags: [Users]
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
 *       200:
 *         description: User updated successfully
 */
router.patch("/me", verifyToken, updateMe);

export default router;
