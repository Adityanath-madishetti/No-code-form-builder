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
import { evaluateFormLogicRuntime } from "./logicEngine.js";

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

function enforceCollectEmailMode(settings, reqBody, reqUser) {
    const bodyEmail = normalizeEmail(reqBody?.email || "");
    const tokenEmail = normalizeEmail(reqUser?.email || "");

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

export async function submitFormService(formId, reqBody, user) {
    const form = await Form.findOne({ formId, isDeleted: false });
    if (!form) throw createError(404, "Form not found");
    if (!form.isActive) throw createError(400, "Form is not accepting submissions");

    const publishedVersionDoc = await getPublishedVersion(formId);
    if (!publishedVersionDoc) {
        throw createError(400, "No published version available. Publish the form first.");
    }
    const version = normalizeVersionForResponse(publishedVersionDoc);
    const { settings } = version;

    assertFillAccess(form, version, user);

    if (settings.requireLogin && !user) {
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
    if (user && (submissionPolicy === "none" || submissionPolicy === "edit_only")) {
        const existing = await Submission.findOne({
            formId,
            submittedBy: user.uid,
            status: { $ne: "draft" },
        });
        if (existing) {
            throw createError(409, "New submissions are not allowed by this form policy");
        }
    }

    const email = enforceCollectEmailMode(settings, reqBody, user);

    const logicResult = evaluateFormLogicRuntime({
        version,
        pages: reqBody?.pages || [],
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
        version: reqBody.formVersion || version.version,
        submittedBy: user?.uid || null,
        email,
        status: reqBody?.status || "submitted",
        meta: {
            isQuiz: version.meta?.isQuiz || false,
        },
        pages: logicResult.pages,
    });

    return {
        message: settings.confirmationMessage || "Thank you for your response!",
        submission,
    };
}

export async function listSubmissionsService(formId, page, limit, user) {
    const [form, latestVersionDoc] = await Promise.all([
        Form.findOne({ formId, isDeleted: false }),
        getLatestVersion(formId),
    ]);
    if (!form) throw createError(404, "Form not found");
    if (!latestVersionDoc) throw createError(404, "Form version not found");

    const latestVersion = normalizeVersionForResponse(latestVersionDoc);
    if (!canReviewSubmissions(form, latestVersion, user)) {
        throw createError(403, "Access denied");
    }

    const skip = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
        Submission.find({ formId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Submission.countDocuments({ formId }),
    ]);

    return {
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
    };
}

export async function exportSubmissionsCsvService(formId, user) {
    const [form, latestVersionDoc, submissions] = await Promise.all([
        Form.findOne({ formId, isDeleted: false }),
        getLatestVersion(formId),
        Submission.find({ formId }).sort({ createdAt: -1 }),
    ]);
    if (!form) throw createError(404, "Form not found");
    if (!latestVersionDoc) throw createError(404, "Form version not found");

    const latestVersion = normalizeVersionForResponse(latestVersionDoc);
    if (!canReviewSubmissions(form, latestVersion, user)) {
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

    return lines.join("\n");
}

export async function getSubmissionService(formId, submissionId, user) {
    const [form, latestVersionDoc] = await Promise.all([
        Form.findOne({ formId, isDeleted: false }),
        getLatestVersion(formId),
    ]);
    if (!form) throw createError(404, "Form not found");
    if (!latestVersionDoc) throw createError(404, "Form version not found");

    const latestVersion = normalizeVersionForResponse(latestVersionDoc);
    if (!canReviewSubmissions(form, latestVersion, user)) {
        throw createError(403, "Access denied");
    }

    const submission = await Submission.findOne({ formId, submissionId });
    if (!submission) throw createError(404, "Submission not found");

    return submission;
}

export async function getMyFormSubmissionsService(formId, user) {
    const uid = user.uid;

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
        canReviewSubmissions(form, latestVersion, user) ||
        canEditForm(form, latestVersion, user);

    if (!canSelfView) {
        throw createError(403, "Viewing your submissions is disabled for this form");
    }

    return Submission.find({
        formId,
        submittedBy: uid,
    }).sort({ createdAt: -1 });
}

export async function updateMySubmissionService(formId, submissionId, reqBody, user) {
    const uid = user.uid;

    const form = await Form.findOne({ formId, isDeleted: false });
    if (!form) throw createError(404, "Form not found");

    const publishedVersionDoc = await getPublishedVersion(formId);
    if (!publishedVersionDoc) {
        throw createError(400, "No published version available");
    }
    const version = normalizeVersionForResponse(publishedVersionDoc);
    const { settings } = version;

    assertFillAccess(form, version, user);

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

    const email = enforceCollectEmailMode(settings, reqBody, user);

    const logicResult = evaluateFormLogicRuntime({
        version,
        pages: reqBody?.pages || [],
        stage: "submit",
    });
    if (logicResult.errors.length) {
        throwLogicEngineError(logicResult.errors);
    }
    if (logicResult.violations.length) {
        throwLogicViolationError(logicResult.violations);
    }

    if (reqBody?.pages !== undefined) {
        submission.pages = logicResult.pages;
    }
    if (reqBody?.formVersion !== undefined) {
        submission.version = reqBody.formVersion;
    }
    submission.email = email;

    await submission.save();

    return submission;
}

export async function getMySubmissionsService(user) {
    const uid = user.uid;

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
        if (canReviewSubmissions(form, latestVersion, user)) return true;
        if (canEditForm(form, latestVersion, user)) return true;

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

    return enriched;
}
