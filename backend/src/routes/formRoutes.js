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
router.post("/", verifyToken, createForm);
router.get("/", verifyToken, listForms);
router.get("/shared", verifyToken, listSharedForms);
router.get("/:formId", verifyToken, getForm);
router.patch("/:formId", verifyToken, updateForm);
router.delete("/:formId", verifyToken, deleteForm);

// Publish
router.post("/:formId/publish", verifyToken, publishForm);

// Public form access (auth optional; policy enforcement in controller)
router.get("/:formId/public", optionalAuth, getPublicForm);

// Workflow transition endpoints (on submissions)
router.post("/:formId/submissions/:submissionId/transition", verifyToken, transitionSubmission);
router.get("/:formId/submissions/:submissionId/transitions", verifyToken, listAvailableTransitions);

// Nested routes
router.use("/:formId/versions", formVersionRoutes);
router.use("/:formId/submissions", submissionRoutes);
router.use("/:formId/workflow", workflowRoutes);

export default router;

