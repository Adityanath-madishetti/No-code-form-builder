import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import {
    createForm,
    listForms,
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
router.get("/:formId", verifyToken, getForm);
router.patch("/:formId", verifyToken, updateForm);
router.delete("/:formId", verifyToken, deleteForm);

// Publish
router.post("/:formId/publish", verifyToken, publishForm);

// Public form access (any authenticated user can fill)
router.get("/:formId/public", verifyToken, getPublicForm);

// Workflow transition endpoints (on submissions)
router.post("/:formId/submissions/:submissionId/transition", verifyToken, transitionSubmission);
router.get("/:formId/submissions/:submissionId/transitions", verifyToken, listAvailableTransitions);

// Nested routes
router.use("/:formId/versions", formVersionRoutes);
router.use("/:formId/submissions", submissionRoutes);
router.use("/:formId/workflow", workflowRoutes);

export default router;

