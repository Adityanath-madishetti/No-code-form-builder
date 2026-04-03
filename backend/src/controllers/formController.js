import crypto from "crypto";
import Form from "../models/Form.js";
import FormVersion from "../models/FormVersion.js";
import Submission from "../models/Submission.js";
import { createError } from "../middleware/errorHandler.js";
import {
    canEditForm,
    canFillForm,
    normalizeEmail,
    normalizeVersionForResponse,
} from "../utils/formPermissions.js";

async function getLatestVersion(formId) {
    return FormVersion.findOne({ formId }).sort({ version: -1 });
}

/**
 * POST /api/forms
 * Create a new form — creates both a Form header and an initial FormVersion (v1).
 */
export const createForm = async (req, res, next) => {
    try {
        const uid = req.user.uid;
        const { title, description } = req.body;
        const formId = crypto.randomUUID();

        const form = await Form.create({
            formId,
            title: title || "Untitled Form",
            currentVersion: 1,
            createdBy: uid,
        });

        const formVersion = await FormVersion.create({
            formId,
            version: 1,
            meta: {
                createdBy: uid,
                name: title || "Untitled Form",
                description: description || "",
                isDraft: true,
            },
            settings: {
                collectEmailMode: "none",
                submissionPolicy: "none",
                canViewOwnSubmission: false,
            },
            access: {
                visibility: "private",
                editors: [],
                reviewers: [],
                viewers: [],
            },
            pages: [
                {
                    pageId: crypto.randomUUID(),
                    pageNo: 1,
                    title: "Page 1",
                    components: [],
                },
            ],
            versionHistory: [
                {
                    version: 1,
                    createdBy: uid,
                    createdAt: new Date(),
                    message: "Initial draft",
                },
            ],
        });

        res.status(201).json({ form, formVersion });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/forms
 * List forms owned by the logged-in user.
 */
export const listForms = async (req, res, next) => {
    try {
        const uid = req.user.uid;
        const forms = await Form.find({
            isDeleted: false,
            createdBy: uid,
        }).sort({ updatedAt: -1 });

        res.status(200).json({ forms });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/forms/shared
 * List forms shared with the logged-in user as editor or reviewer.
 */
export const listSharedForms = async (req, res, next) => {
    try {
        const uid = req.user.uid;
        const email = normalizeEmail(req.user.email);
        const matchClauses = [
            { "latestAccess.editors.uid": uid },
            { "latestAccess.reviewers.uid": uid },
        ];
        if (email) {
            matchClauses.push({ "latestAccess.editors.email": email });
            matchClauses.push({ "latestAccess.reviewers.email": email });
        }

        const sharedFormRows = await FormVersion.aggregate([
            { $sort: { version: -1 } },
            {
                $group: {
                    _id: "$formId",
                    latestAccess: { $first: "$access" },
                },
            },
            { $match: { $or: matchClauses } },
            { $project: { _id: 0, formId: "$_id", latestAccess: 1 } },
        ]);

        const hasIdentity = (list = []) =>
            Array.isArray(list) &&
            list.some((entry) => {
                const entryUid = typeof entry?.uid === "string" ? entry.uid : "";
                const entryEmail = normalizeEmail(entry?.email);
                return (entryUid && entryUid === uid) || (email && entryEmail === email);
            });

        const roleMap = new Map();
        for (const row of sharedFormRows) {
            const roles = [];
            if (hasIdentity(row.latestAccess?.editors)) roles.push("editor");
            if (hasIdentity(row.latestAccess?.reviewers)) roles.push("reviewer");
            if (roles.length) {
                roleMap.set(row.formId, roles);
            }
        }

        const sharedFormIds = [...roleMap.keys()];
        if (sharedFormIds.length === 0) {
            return res.status(200).json({ forms: [] });
        }

        const [forms, submissionCounts] = await Promise.all([
            Form.find({
                formId: { $in: sharedFormIds },
                isDeleted: false,
                createdBy: { $ne: uid },
            }).sort({ updatedAt: -1 }),
            Submission.aggregate([
                { $match: { formId: { $in: sharedFormIds } } },
                {
                    $group: {
                        _id: "$formId",
                        count: { $sum: 1 },
                    },
                },
            ]),
        ]);

        const countMap = new Map(
            submissionCounts.map((entry) => [entry._id, entry.count])
        );

        const sharedForms = forms
            .map((form) => {
                const sharedRoles = roleMap.get(form.formId) || [];
                if (!sharedRoles.length) return null;

                return {
                    formId: form.formId,
                    title: form.title,
                    currentVersion: form.currentVersion,
                    isActive: form.isActive,
                    updatedAt: form.updatedAt,
                    createdAt: form.createdAt,
                    sharedRole: sharedRoles.includes("editor")
                        ? "editor"
                        : "reviewer",
                    sharedRoles,
                    submissionCount: countMap.get(form.formId) || 0,
                };
            })
            .filter(Boolean);

        res.status(200).json({ forms: sharedForms });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/forms/:formId
 * Get a single form header if the user can edit the form.
 */
export const getForm = async (req, res, next) => {
    try {
        const { formId } = req.params;
        const form = await Form.findOne({ formId, isDeleted: false });
        if (!form) throw createError(404, "Form not found");

        const latestVersion = await getLatestVersion(formId);
        if (!latestVersion) throw createError(404, "Form version not found");

        if (!canEditForm(form, latestVersion, req.user)) {
            throw createError(403, "Access denied");
        }

        res.status(200).json({ form });
    } catch (err) {
        next(err);
    }
};

/**
 * PATCH /api/forms/:formId
 * Update form header (title, isActive) — owner or editor.
 */
export const updateForm = async (req, res, next) => {
    try {
        const { formId } = req.params;
        const allowedFields = ["title", "isActive"];
        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            throw createError(400, "No valid fields to update");
        }

        const form = await Form.findOne({ formId, isDeleted: false });
        if (!form) throw createError(404, "Form not found");

        const latestVersion = await getLatestVersion(formId);
        if (!latestVersion) throw createError(404, "Form version not found");

        if (!canEditForm(form, latestVersion, req.user)) {
            throw createError(403, "Access denied");
        }

        const updated = await Form.findOneAndUpdate(
            { formId, isDeleted: false },
            { $set: updates },
            { returnDocument: "after", runValidators: true }
        );

        res.status(200).json({ form: updated });
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/forms/:formId
 * Soft-delete a form (owner only).
 */
export const deleteForm = async (req, res, next) => {
    try {
        const form = await Form.findOneAndUpdate(
            {
                formId: req.params.formId,
                createdBy: req.user.uid,
                isDeleted: false,
            },
            { $set: { isDeleted: true, isActive: false } },
            { returnDocument: "after" }
        );

        if (!form) {
            throw createError(404, "Form not found");
        }

        res.status(200).json({ message: "Form deleted", form });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/forms/:formId/publish
 * Publish a form (owner only).
 */
export const publishForm = async (req, res, next) => {
    try {
        const { formId } = req.params;
        const uid = req.user.uid;

        const form = await Form.findOne({ formId, isDeleted: false });
        if (!form) throw createError(404, "Form not found");
        if (form.createdBy !== uid) throw createError(403, "Access denied");

        form.isActive = true;
        await form.save();

        const latestVersion = await FormVersion.findOne({ formId }).sort({
            version: -1,
        });
        if (!latestVersion) throw createError(400, "No version to publish");

        latestVersion.meta.isDraft = false;
        await latestVersion.save();

        res.status(200).json({
            message: "Form published successfully",
            form,
            publishedVersion: latestVersion.version,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/forms/:formId/public
 * Get the latest published version for filling (authorization depends on access policy).
 */
export const getPublicForm = async (req, res, next) => {
    try {
        const { formId } = req.params;

        const form = await Form.findOne({ formId, isDeleted: false });
        if (!form) throw createError(404, "Form not found");
        if (!form.isActive) {
            throw createError(400, "This form is not currently accepting responses");
        }

        const versionDoc = await FormVersion.findOne({
            formId,
            "meta.isDraft": false,
        }).sort({ version: -1 });
        if (!versionDoc) {
            throw createError(400, "No published version available");
        }

        const version = normalizeVersionForResponse(versionDoc);

        if (!canFillForm(form, version, req.user)) {
            if (!req.user) {
                throw createError(401, "Authentication required to access this form");
            }
            throw createError(403, "You do not have access to this form");
        }

        res.status(200).json({ form, version });
    } catch (err) {
        next(err);
    }
};
