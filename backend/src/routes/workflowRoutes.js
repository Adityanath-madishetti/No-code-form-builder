import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import {
    setWorkflow,
    getWorkflow,
} from "../controllers/workflowController.js";

const router = Router({ mergeParams: true });

// Workflow CRUD on a form
router.put("/", verifyToken, setWorkflow);
router.get("/", verifyToken, getWorkflow);

export default router;
