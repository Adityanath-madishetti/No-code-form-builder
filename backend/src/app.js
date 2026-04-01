import express from "express";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import formRoutes from "./routes/formRoutes.js";
import { getMySubmissions } from "./controllers/submissionController.js";
import { verifyToken } from "./middleware/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";



const app = express();

// ── Global Middleware ──
app.use(express.json({ limit: "10mb" }));
app.use(cors());
app.use(helmet());

// ── Health Check ──
app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Routes ──
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/forms", formRoutes);
// Note: formVersionRoutes and submissionRoutes are nested under formRoutes
//       at /api/forms/:formId/versions and /api/forms/:formId/submissions

// User-level submission history (not nested under a specific form)
app.get("/api/submissions/mine", verifyToken, getMySubmissions);

// ── Error Handling (must be last) ──
app.use(errorHandler);

export default app;
