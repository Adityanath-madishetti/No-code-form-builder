import crypto from "crypto";
import Form from "../models/Form.js";
import FormVersion from "../models/FormVersion.js";
import Submission from "../models/Submission.js";
import { createError } from "../middleware/errorHandler.js";
import {
    canEditForm,
    canFillForm,
    canReviewSubmissions,
    normalizeEmail,
    normalizeVersionForResponse,
} from "../utils/formPermissions.js";
import { evaluateFormLogicRuntime } from "../services/logicEngine.js";

async function getLatestVersion(formId) {
    return FormVersion.findOne({ formId }).sort({ version: -1 });
}

async function getPublishedVersion(formId) {
    return FormVersion.findOne({ formId, "meta.isDraft": false }).sort({
        version: -1,
    });
}

function assertFillAccess(form, version, user) {
    if (!canFillForm(form, version, user)) {
        if (!user) throw createError(401, "Authentication required to access this form");
        throw createError(403, "You do not have access to this form");
    }
}

function enforceCollectEmailMode(settings, req) {
    const bodyEmail = normalizeEmail(req.body?.email || "");
    const tokenEmail = normalizeEmail(req.user?.email || "");

    if (settings.collectEmailMode === "none") {
        return null;
    }

    const email = bodyEmail || tokenEmail || null;
    if (settings.collectEmailMode === "required" && !email) {
        throw createError(400, "Email is required for this form");
    }

    return email;
}

function toCsvCell(value) {
    if (value === null || value === undefined) return "";
    const raw =
        typeof value === "string"
            ? value
            : typeof value === "number" || typeof value === "boolean"
                ? String(value)
                : JSON.stringify(value);
    return `"${String(raw).replace(/"/g, "\"\"")}"`;
}

function flattenSubmissionResponses(pages = []) {
    const out = {};
    for (const page of pages) {
        for (const response of page?.responses || []) {
            out[response.componentId] = response.response;
        }
    }
    return out;
}

function throwLogicViolationError(violations) {
    const err = createError(422, "Validation failed");
    err.details = violations;
    throw err;
}

function throwLogicEngineError(errors) {
    const err = createError(409, "Logic execution failed");
    err.details = errors;
    throw err;
}

/**
 * POST /api/forms/:formId/submissions
 * Submit a form response. Auth is optional for public forms.
 */
export const submitForm = async (req, res, next) => {
    try {
        const { formId } = req.params;

        const form = await Form.findOne({ formId, isDeleted: false });
        if (!form) throw createError(404, "Form not found");
        if (!form.isActive) throw createError(400, "Form is not accepting submissions");

        const publishedVersionDoc = await getPublishedVersion(formId);
        if (!publishedVersionDoc) {
            throw createError(400, "No published version available. Publish the form first.");
        }
        const version = normalizeVersionForResponse(publishedVersionDoc);
        const { settings } = version;

        assertFillAccess(form, version, req.user);

        if (settings.requireLogin && !req.user) {
            throw createError(401, "Authentication required to submit this form");
        }

        if (settings.submissionLimit) {
            const count = await Submission.countDocuments({
                formId,
                status: { $ne: "draft" },
            });
            if (count >= settings.submissionLimit) {
                throw createError(400, "Submission limit reached");
            }
        }

        if (settings.closeDate && new Date() > new Date(settings.closeDate)) {
            throw createError(400, "Form submissions are closed");
        }

        const submissionPolicy = settings.submissionPolicy || "none";
        if (req.user && (submissionPolicy === "none" || submissionPolicy === "edit_only")) {
            const existing = await Submission.findOne({
                formId,
                submittedBy: req.user.uid,
                status: { $ne: "draft" },
            });
            if (existing) {
                throw createError(409, "New submissions are not allowed by this form policy");
            }
        }

        const email = enforceCollectEmailMode(settings, req);

        const logicResult = evaluateFormLogicRuntime({
            version,
            pages: req.body?.pages || [],
            stage: "submit",
        });
        if (logicResult.errors.length) {
            throwLogicEngineError(logicResult.errors);
        }
        if (logicResult.violations.length) {
            throwLogicViolationError(logicResult.violations);
        }

        const submission = await Submission.create({
            submissionId: crypto.randomUUID(),
            formId,
            version: version.version,
            submittedBy: req.user?.uid || null,
            email,
            status: req.body?.status || "submitted",
            meta: {
                isQuiz: version.meta?.isQuiz || false,
            },
            pages: logicResult.pages,
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
 * List submissions for a form (owner, editor, or reviewer).
 */
export const listSubmissions = async (req, res, next) => {
    try {
        const { formId } = req.params;

        const [form, latestVersionDoc] = await Promise.all([
            Form.findOne({ formId, isDeleted: false }),
            getLatestVersion(formId),
        ]);
        if (!form) throw createError(404, "Form not found");
        if (!latestVersionDoc) throw createError(404, "Form version not found");

        const latestVersion = normalizeVersionForResponse(latestVersionDoc);
        if (!canReviewSubmissions(form, latestVersion, req.user)) {
            throw createError(403, "Access denied");
        }

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
            form: {
                formId: form.formId,
                title: form.title,
            },
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
 * GET /api/forms/:formId/submissions/export.csv
 * Export submissions as CSV (owner/editor/reviewer).
 */
export const exportSubmissionsCsv = async (req, res, next) => {
    try {
        const { formId } = req.params;

        const [form, latestVersionDoc, submissions] = await Promise.all([
            Form.findOne({ formId, isDeleted: false }),
            getLatestVersion(formId),
            Submission.find({ formId }).sort({ createdAt: -1 }),
        ]);
        if (!form) throw createError(404, "Form not found");
        if (!latestVersionDoc) throw createError(404, "Form version not found");

        const latestVersion = normalizeVersionForResponse(latestVersionDoc);
        if (!canReviewSubmissions(form, latestVersion, req.user)) {
            throw createError(403, "Access denied");
        }

        const orderedComponentIds = [];
        const componentSet = new Set();

        for (const page of latestVersion.pages || []) {
            for (const component of page.components || []) {
                const componentId = component?.componentId;
                if (!componentId || componentSet.has(componentId)) continue;
                componentSet.add(componentId);
                orderedComponentIds.push(componentId);
            }
        }

        for (const submission of submissions) {
            const flat = flattenSubmissionResponses(submission.pages || []);
            for (const componentId of Object.keys(flat)) {
                if (componentSet.has(componentId)) continue;
                componentSet.add(componentId);
                orderedComponentIds.push(componentId);
            }
        }

        const header = [
            "submissionId",
            "submittedAt",
            "status",
            "submittedBy",
            "email",
            ...orderedComponentIds,
        ];

        const lines = [header.map(toCsvCell).join(",")];
        for (const submission of submissions) {
            const flat = flattenSubmissionResponses(submission.pages || []);
            const row = [
                submission.submissionId,
                submission.createdAt?.toISOString?.() || "",
                submission.status || "",
                submission.submittedBy || "",
                submission.email || "",
                ...orderedComponentIds.map((id) => flat[id] ?? ""),
            ];
            lines.push(row.map(toCsvCell).join(","));
        }

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="form-${formId}-submissions.csv"`
        );
        res.status(200).send(lines.join("\n"));
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/forms/:formId/submissions/:submissionId
 * Get a single submission (owner, editor, or reviewer).
 */
export const getSubmission = async (req, res, next) => {
    try {
        const { formId, submissionId } = req.params;

        const [form, latestVersionDoc] = await Promise.all([
            Form.findOne({ formId, isDeleted: false }),
            getLatestVersion(formId),
        ]);
        if (!form) throw createError(404, "Form not found");
        if (!latestVersionDoc) throw createError(404, "Form version not found");

        const latestVersion = normalizeVersionForResponse(latestVersionDoc);
        if (!canReviewSubmissions(form, latestVersion, req.user)) {
            throw createError(403, "Access denied");
        }

        const submission = await Submission.findOne({ formId, submissionId });
        if (!submission) throw createError(404, "Submission not found");

        res.status(200).json({ submission });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/forms/:formId/submissions/mine
 * Get the logged-in user's submissions for a specific form.
 */
export const getMyFormSubmissions = async (req, res, next) => {
    try {
        const { formId } = req.params;
        const uid = req.user.uid;

        const [form, latestVersionDoc, publishedVersionDoc] = await Promise.all([
            Form.findOne({ formId, isDeleted: false }),
            getLatestVersion(formId),
            getPublishedVersion(formId),
        ]);
        if (!form) throw createError(404, "Form not found");
        if (!latestVersionDoc) throw createError(404, "Form version not found");

        const latestVersion = normalizeVersionForResponse(latestVersionDoc);
        const publishedVersion = publishedVersionDoc
            ? normalizeVersionForResponse(publishedVersionDoc)
            : latestVersion;

        const canSelfView =
            publishedVersion.settings?.canViewOwnSubmission === true ||
            canReviewSubmissions(form, latestVersion, req.user) ||
            canEditForm(form, latestVersion, req.user);

        if (!canSelfView) {
            throw createError(403, "Viewing your submissions is disabled for this form");
        }

        const submissions = await Submission.find({
            formId,
            submittedBy: uid,
        }).sort({ createdAt: -1 });

        res.status(200).json({ submissions });
    } catch (err) {
        next(err);
    }
};

/**
 * PATCH /api/forms/:formId/submissions/:submissionId/mine
 * Edit the logged-in user's submission if policy allows editing.
 */
export const updateMySubmission = async (req, res, next) => {
    try {
        const { formId, submissionId } = req.params;
        const uid = req.user.uid;

        const form = await Form.findOne({ formId, isDeleted: false });
        if (!form) throw createError(404, "Form not found");

        const publishedVersionDoc = await getPublishedVersion(formId);
        if (!publishedVersionDoc) {
            throw createError(400, "No published version available");
        }
        const version = normalizeVersionForResponse(publishedVersionDoc);
        const { settings } = version;

        assertFillAccess(form, version, req.user);

        if (settings.closeDate && new Date() > new Date(settings.closeDate)) {
            throw createError(400, "Form submissions are closed");
        }

        const submissionPolicy = settings.submissionPolicy || "none";
        if (submissionPolicy !== "edit_only" && submissionPolicy !== "edit_and_resubmit") {
            throw createError(409, "Editing submissions is not allowed by this form policy");
        }

        const submission = await Submission.findOne({
            formId,
            submissionId,
            submittedBy: uid,
            status: { $ne: "draft" },
        });
        if (!submission) throw createError(404, "Submission not found");

        const email = enforceCollectEmailMode(settings, req);

        const logicResult = evaluateFormLogicRuntime({
            version,
            pages: req.body?.pages || [],
            stage: "submit",
        });
        if (logicResult.errors.length) {
            throwLogicEngineError(logicResult.errors);
        }
        if (logicResult.violations.length) {
            throwLogicViolationError(logicResult.violations);
        }

        if (req.body?.pages !== undefined) {
            submission.pages = logicResult.pages;
        }
        submission.email = email;

        await submission.save();

        res.status(200).json({ submission });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/submissions/mine
 * List visible submissions by the logged-in user (across forms).
 */
export const getMySubmissions = async (req, res, next) => {
    try {
        const uid = req.user.uid;

        const submissions = await Submission.find({ submittedBy: uid })
            .sort({ createdAt: -1 })
            .select("submissionId formId version status createdAt pages")
            .limit(100);

        const formIds = [...new Set(submissions.map((s) => s.formId))];
        const [forms, latestVersions] = await Promise.all([
            Form.find({ formId: { $in: formIds }, isDeleted: false }).select(
                "formId title createdBy"
            ),
            FormVersion.aggregate([
                { $match: { formId: { $in: formIds } } },
                { $sort: { version: -1 } },
                {
                    $group: {
                        _id: "$formId",
                        version: { $first: "$$ROOT" },
                    },
                },
            ]),
        ]);

        const formMap = new Map(forms.map((f) => [f.formId, f]));
        const versionMap = new Map(
            latestVersions.map((row) => [
                row._id,
                normalizeVersionForResponse(row.version),
            ])
        );

        const filtered = submissions.filter((submission) => {
            const form = formMap.get(submission.formId);
            const latestVersion = versionMap.get(submission.formId);
            if (!form || !latestVersion) return false;

            if (latestVersion.settings?.canViewOwnSubmission === true) return true;
            if (canReviewSubmissions(form, latestVersion, req.user)) return true;
            if (canEditForm(form, latestVersion, req.user)) return true;

            return false;
        });

        const enriched = filtered.map((submission) => ({
            submissionId: submission.submissionId,
            formId: submission.formId,
            formTitle: formMap.get(submission.formId)?.title || "Unknown Form",
            version: submission.version,
            status: submission.status,
            submittedAt: submission.createdAt,
            pages: submission.pages || [],
        }));

        res.status(200).json({ submissions: enriched });
    } catch (err) {
        next(err);
    }
};
