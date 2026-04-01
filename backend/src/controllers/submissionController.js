import crypto from "crypto";
import Form from "../models/Form.js";
import FormVersion from "../models/FormVersion.js";
import Submission from "../models/Submission.js";
import { createError } from "../middleware/errorHandler.js";

/**
 * POST /api/forms/:formId/submissions
 * Submit a form response. Auth is optional (depends on form settings).
 */
export const submitForm = async (req, res, next) => {
    try {
        const { formId } = req.params;

        // Check that the form exists and is active
        const form = await Form.findOne({ formId, isDeleted: false });
        if (!form) throw createError(404, "Form not found");
        if (!form.isActive) throw createError(400, "Form is not accepting submissions");

        // Get the latest published version (not necessarily currentVersion,
        // since currentVersion may point to a newer draft after cloning)
        const formVersion = await FormVersion.findOne({
            formId,
            "meta.isDraft": false,
        }).sort({ version: -1 });

        if (!formVersion) {
            throw createError(400, "No published version available. Publish the form first.");
        }

        const { settings } = formVersion;

        // Check if login is required
        if (settings.requireLogin && !req.user) {
            throw createError(401, "Authentication required to submit this form");
        }

        // Check submission limit
        if (settings.submissionLimit) {
            const count = await Submission.countDocuments({ formId });
            if (count >= settings.submissionLimit) {
                throw createError(400, "Submission limit reached");
            }
        }

        // Check close date
        if (settings.closeDate && new Date() > new Date(settings.closeDate)) {
            throw createError(400, "Form submissions are closed");
        }

        // Check multiple submissions
        if (!settings.allowMultipleSubmissions && req.user) {
            const existing = await Submission.findOne({
                formId,
                submittedBy: req.user.uid,
                status: { $ne: "draft" },
            });
            if (existing) {
                throw createError(400, "You have already submitted this form");
            }
        }

        // Initialize workflow state if the form has an active workflow
        let currentState = null;
        const workflowHistory = [];

        if (form.workflow && form.workflow.enabled && form.workflow.initialState) {
            currentState = form.workflow.initialState;
            workflowHistory.push({
                from: null,
                to: currentState,
                transitionId: "__init__",
                timestamp: new Date(),
                user: req.user?.uid || req.body.email || "anonymous",
                note: "Submission created",
            });
        }

        const submission = await Submission.create({
            submissionId: crypto.randomUUID(),
            formId,
            version: form.currentVersion,
            submittedBy: req.user?.uid || null,
            email: req.body.email || null,
            status: req.body.status || "submitted",
            meta: {
                isQuiz: formVersion.meta.isQuiz || false,
            },
            pages: req.body.pages || [],
            currentState,
            workflowHistory,
        });

        res.status(201).json({
            message: settings.confirmationMessage || "Thank you for your response!",
            submission,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/forms/:formId/submissions
 * List submissions for a form (owner only).
 */
export const listSubmissions = async (req, res, next) => {
    try {
        const { formId } = req.params;

        const form = await Form.findOne({ formId, isDeleted: false });
        if (!form) throw createError(404, "Form not found");
        if (form.createdBy !== req.user.uid) throw createError(403, "Access denied");

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;

        const [submissions, total] = await Promise.all([
            Submission.find({ formId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Submission.countDocuments({ formId }),
        ]);

        res.status(200).json({
            submissions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/forms/:formId/submissions/:submissionId
 * Get a single submission (owner only).
 */
export const getSubmission = async (req, res, next) => {
    try {
        const { formId, submissionId } = req.params;

        const form = await Form.findOne({ formId, isDeleted: false });
        if (!form) throw createError(404, "Form not found");
        if (form.createdBy !== req.user.uid) throw createError(403, "Access denied");

        const submission = await Submission.findOne({ formId, submissionId });
        if (!submission) throw createError(404, "Submission not found");

        res.status(200).json({ submission });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/submissions/mine
 * List all submissions by the logged-in user (across all forms).
 */
export const getMySubmissions = async (req, res, next) => {
    try {
        const uid = req.user.uid;

        const submissions = await Submission.find({ submittedBy: uid })
            .sort({ createdAt: -1 })
            .select("submissionId formId version status createdAt")
            .limit(50);

        // Enrich with form titles
        const formIds = [...new Set(submissions.map((s) => s.formId))];
        const forms = await Form.find({ formId: { $in: formIds } }).select(
            "formId title"
        );
        const titleMap = Object.fromEntries(
            forms.map((f) => [f.formId, f.title])
        );

        const enriched = submissions.map((s) => ({
            submissionId: s.submissionId,
            formId: s.formId,
            formTitle: titleMap[s.formId] || "Unknown Form",
            version: s.version,
            status: s.status,
            submittedAt: s.createdAt,
        }));

        res.status(200).json({ submissions: enriched });
    } catch (err) {
        next(err);
    }
};
