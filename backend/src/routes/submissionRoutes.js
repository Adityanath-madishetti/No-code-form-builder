import { Router } from "express";
import { verifyToken, optionalAuth } from "../middleware/auth.js";
import {
    submitForm,
    listSubmissions,
    getSubmission,
    getMyFormSubmissions,
    updateMySubmission,
} from "../controllers/submissionController.js";

// mergeParams: true allows access to :formId from parent router
const router = Router({ mergeParams: true });

// Submit uses optionalAuth — auth depends on form's requireLogin setting
router.post("/", optionalAuth, submitForm);

// Viewing submissions requires authentication (owner/reviewer policy enforced in controller)
router.get("/", verifyToken, listSubmissions);
router.get("/mine", verifyToken, getMyFormSubmissions);
router.patch("/:submissionId/mine", verifyToken, updateMySubmission);
router.get("/:submissionId", verifyToken, getSubmission);

export default router;
