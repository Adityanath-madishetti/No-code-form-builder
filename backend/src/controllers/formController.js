import crypto from "crypto";
import Form from "../models/Form.js";
import FormVersion from "../models/FormVersion.js";
import { createError } from "../middleware/errorHandler.js";

/**
 * POST /api/forms
 * Create a new form — creates both a Form header and an initial FormVersion (v1).
 */
export const createForm = async (req, res, next) => {
    try {
        const uid = req.user.uid;
        const { title, description } = req.body;
        const formId = crypto.randomUUID();

        // Create header
        const form = await Form.create({
            formId,
            title: title || "Untitled Form",
            currentVersion: 1,
            createdBy: uid,
        });

        // Create initial version (v1 draft)
        const formVersion = await FormVersion.create({
            formId,
            version: 1,
            meta: {
                createdBy: uid,
                name: title || "Untitled Form",
                description: description || "",
                isDraft: true,
            },
            settings: {},
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
 * List all forms for the logged-in user (excludes soft-deleted).
 */
export const listForms = async (req, res, next) => {
    try {
        const forms = await Form.find({
            createdBy: req.user.uid,
            isDeleted: false,
        }).sort({ updatedAt: -1 });

        res.status(200).json({ forms });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/forms/:formId
 * Get a single form's header.
 */
export const getForm = async (req, res, next) => {
    try {
        const form = await Form.findOne({
            formId: req.params.formId,
            isDeleted: false,
        });

        if (!form) {
            throw createError(404, "Form not found");
        }

        // Only the owner can view the form header
        if (form.createdBy !== req.user.uid) {
            throw createError(403, "Access denied");
        }

        res.status(200).json({ form });
    } catch (err) {
        next(err);
    }
};

/**
 * PATCH /api/forms/:formId
 * Update form header (title, isActive).
 */
export const updateForm = async (req, res, next) => {
    try {
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

        const form = await Form.findOneAndUpdate(
            {
                formId: req.params.formId,
                createdBy: req.user.uid,
                isDeleted: false,
            },
            { $set: updates },
            { returnDocument: "after", runValidators: true }
        );

        if (!form) {
            throw createError(404, "Form not found");
        }

        res.status(200).json({ form });
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/forms/:formId
 * Soft-delete a form.
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
 * Publish a form — sets isActive=true and marks the latest version as published (isDraft=false).
 */
export const publishForm = async (req, res, next) => {
    try {
        const { formId } = req.params;
        const uid = req.user.uid;

        const form = await Form.findOne({ formId, isDeleted: false });
        if (!form) throw createError(404, "Form not found");
        if (form.createdBy !== uid) throw createError(403, "Access denied");

        // Activate the form
        form.isActive = true;
        await form.save();

        // Mark the latest version as published
        const latestVersion = await FormVersion.findOne({ formId }).sort({
            version: -1,
        });
        if (!latestVersion)
            throw createError(400, "No version to publish");

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
 * Get the published version of a form for filling. Any authenticated user can access.
 */
export const getPublicForm = async (req, res, next) => {
    try {
        const { formId } = req.params;

        const form = await Form.findOne({ formId, isDeleted: false });
        if (!form) throw createError(404, "Form not found");
        if (!form.isActive)
            throw createError(400, "This form is not currently accepting responses");

        // Get the latest published (non-draft) version
        const version = await FormVersion.findOne({
            formId,
            "meta.isDraft": false,
        }).sort({ version: -1 });

        if (!version)
            throw createError(400, "No published version available");

        res.status(200).json({ form, version });
    } catch (err) {
        next(err);
    }
};
