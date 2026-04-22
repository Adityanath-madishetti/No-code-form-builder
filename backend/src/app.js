import express from "express";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import formRoutes from "./routes/formRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import themeRoutes from "./routes/themeTemplateRoutes.js";
import { getMySubmissions } from "./controllers/submissionController.js";
import { verifyToken } from "./middleware/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";

import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";

const app = express();

// ── Swagger UI ──
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// ── Global Middleware ──
app.use(express.json({ limit: "10mb" }));
app.use(cors());
app.use(helmet());

// ── Health Check ──
/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: API Health Check
 *     tags: [System]
 *     responses:
 *       200:
 *         description: OK
 */
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Routes ──
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/themes", themeRoutes);
// Note: formVersionRoutes and submissionRoutes are nested under formRoutes
//       at /api/forms/:formId/versions and /api/forms/:formId/submissions

// User-level submission history (not nested under a specific form)
/**
 * @swagger
 * /api/submissions/mine:
 *   get:
 *     summary: Get all submissions made by the current user across all forms
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of the user's global submissions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
app.get("/api/submissions/mine", verifyToken, getMySubmissions);
app.use("/api/ai", aiRoutes);

// ── Error Handling (must be last) ──
app.use(errorHandler);

export default app;
