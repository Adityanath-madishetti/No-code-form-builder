import Form from "../models/Form.js";
import FormVersion from "../models/FormVersion.js";
import { createError } from "../middleware/errorHandler.js";
import {
    canEditForm,
    normalizeAccess,
    normalizeSettings,
    normalizeVersionForResponse,
    resolveAccessPayload,
} from "../utils/formPermissions.js";
import { normalizeLogicPayload } from "../services/logicEngine.js";

async function getFormWithLatest(formId) {
    const [form, latestVersion] = await Promise.all([
        Form.findOne({ formId, isDeleted: false }),
        FormVersion.findOne({ formId }).sort({ version: -1 }),
    ]);
    return { form, latestVersion };
}

async function assertCanEdit(formId, user) {
    const { form, latestVersion } = await getFormWithLatest(formId);

    if (!form) throw createError(404, "Form not found");
    if (!latestVersion) throw createError(404, "No versions found");
    if (!canEditForm(form, latestVersion, user)) {
        throw createError(403, "Access denied");
    }

    return { form, latestVersion };
}

async function applyVersionUpdates({ formId, versionNum, uid, user, payload }) {
    const { form } = await assertCanEdit(formId, user);

    const allowedFields = ["meta", "settings", "pages", "logic", "workflow", "access"];
    const updates = {};
    for (const field of allowedFields) {
        if (payload[field] !== undefined) {
            updates[field] = payload[field];
        }
    }

    if (Object.keys(updates).length === 0) {
        throw createError(400, "No valid fields to update");
    }

    if (updates.settings !== undefined) {
        updates.settings = normalizeSettings(updates.settings || {});
    }

    if (updates.access !== undefined) {
        const { access, unresolved } = await resolveAccessPayload(
            updates.access || {},
            form.createdBy
        );
        if (unresolved.emails.length || unresolved.uids.length) {
            const err = createError(
                422,
                "Some invited users were not found"
            );
            err.details = {
                unresolvedEmails: [...new Set(unresolved.emails)],
                unresolvedUids: [...new Set(unresolved.uids)],
            };
            throw err;
        }
        updates.access = access;
    }

    if (updates.logic !== undefined) {
        updates.logic = normalizeLogicPayload(updates.logic || {});
    }

    if (updates.meta && updates.meta.createdBy === undefined) {
        updates.meta = {
            ...updates.meta,
            createdBy: uid,
        };
    }

    const versionDoc = await FormVersion.findOneAndUpdate(
        { formId, version: versionNum },
        { $set: updates },
        { returnDocument: "after", runValidators: true }
    );

    if (!versionDoc) throw createError(404, "Version not found");
    return normalizeVersionForResponse(versionDoc);
}

/**
 * GET /api/forms/:formId/versions
 * List all versions of a form.
 */
export const listVersions = async (req, res, next) => {
    try {
        const { formId } = req.params;
        await assertCanEdit(formId, req.user);

        const versions = await FormVersion.find({ formId })
            .select("formId version meta.name meta.isDraft createdAt updatedAt")
            .sort({ version: -1 });

        res.status(200).json({ versions });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/forms/:formId/versions/latest
 * Get the latest (highest version number) version of a form.
 */
export const getLatestVersion = async (req, res, next) => {
    try {
        const { formId } = req.params;
        await assertCanEdit(formId, req.user);

        const versionDoc = await FormVersion.findOne({ formId }).sort({
            version: -1,
        });
        if (!versionDoc) throw createError(404, "No versions found");

        res.status(200).json({ version: normalizeVersionForResponse(versionDoc) });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/forms/:formId/versions/:version
 * Get a specific version of a form.
 */
export const getVersion = async (req, res, next) => {
    try {
        const { formId } = req.params;
        const versionNum = parseInt(req.params.version, 10);
        if (isNaN(versionNum)) throw createError(400, "Invalid version number");

        await assertCanEdit(formId, req.user);

        const versionDoc = await FormVersion.findOne({ formId, version: versionNum });
        if (!versionDoc) throw createError(404, "Version not found");

        res.status(200).json({ version: normalizeVersionForResponse(versionDoc) });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/forms/:formId/versions
 * Create a new version by cloning the latest and incrementing.
 */
export const createVersion = async (req, res, next) => {
    try {
        const { formId } = req.params;
        const uid = req.user.uid;

        await assertCanEdit(formId, req.user);

        const latest = await FormVersion.findOne({ formId }).sort({ version: -1 });
        if (!latest) throw createError(404, "No existing version to clone");

        const newVersionNum = latest.version + 1;

        const cloned = latest.toObject();
        delete cloned._id;
        delete cloned.__v;
        delete cloned.id;
        delete cloned.createdAt;
        delete cloned.updatedAt;

        cloned.version = newVersionNum;
        cloned.meta = {
            ...cloned.meta,
            isDraft: true,
        };
        cloned.settings = normalizeSettings(cloned.settings || {});
        cloned.access = normalizeAccess(cloned.access || {});
        cloned.logic = normalizeLogicPayload(cloned.logic || {});

        cloned.versionHistory = [
            ...(cloned.versionHistory || []),
            {
                version: newVersionNum,
                createdBy: uid,
                createdAt: new Date(),
                message:
                    (req.body && req.body.message) ||
                    `Created version ${newVersionNum}`,
            },
        ];

        const newVersion = await FormVersion.create(cloned);

        await Form.findOneAndUpdate(
            { formId },
            { currentVersion: newVersionNum },
            { returnDocument: "after" }
        );

        res.status(201).json({ version: normalizeVersionForResponse(newVersion) });
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/forms/:formId/versions/:version
 * Save/update a specific draft version (owner/editor).
 */
export const updateVersion = async (req, res, next) => {
    try {
        const { formId } = req.params;
        const versionNum = parseInt(req.params.version, 10);
        const uid = req.user.uid;

        if (isNaN(versionNum)) throw createError(400, "Invalid version number");

        const version = await applyVersionUpdates({
            formId,
            versionNum,
            uid,
            user: req.user,
            payload: req.body,
        });

        res.status(200).json({ version });
    } catch (err) {
        next(err);
    }
};

/**
 * PATCH /api/forms/:formId/versions/:version/settings
 * Patch only settings fields for a version.
 */
export const updateVersionSettings = async (req, res, next) => {
    try {
        const { formId } = req.params;
        const versionNum = parseInt(req.params.version, 10);
        const uid = req.user.uid;
        if (isNaN(versionNum)) throw createError(400, "Invalid version number");

        const settingsPayload = req.body?.settings ?? req.body;
        const version = await applyVersionUpdates({
            formId,
            versionNum,
            uid,
            user: req.user,
            payload: { settings: settingsPayload },
        });

        res.status(200).json({ version });
    } catch (err) {
        next(err);
    }
};

/**
 * PATCH /api/forms/:formId/versions/:version/access
 * Patch only access fields for a version.
 */
export const updateVersionAccess = async (req, res, next) => {
    try {
        const { formId } = req.params;
        const versionNum = parseInt(req.params.version, 10);
        const uid = req.user.uid;
        if (isNaN(versionNum)) throw createError(400, "Invalid version number");

        const accessPayload = req.body?.access ?? req.body;
        const version = await applyVersionUpdates({
            formId,
            versionNum,
            uid,
            user: req.user,
            payload: { access: accessPayload },
        });

        res.status(200).json({ version });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/forms/:formId/versions/publish
 * Publish the latest version (owner only).
 */
export const publishVersion = async (req, res, next) => {
    try {
        const { formId } = req.params;
        const uid = req.user.uid;

        const form = await Form.findOne({ formId, isDeleted: false });
        if (!form) throw createError(404, "Form not found");
        if (form.createdBy !== uid) throw createError(403, "Access denied");

        const version = await FormVersion.findOneAndUpdate(
            { formId, version: form.currentVersion },
            {
                $set: { "meta.isDraft": false },
                $push: {
                    versionHistory: {
                        version: form.currentVersion,
                        createdBy: uid,
                        createdAt: new Date(),
                        message: `Published version ${form.currentVersion}`,
                    },
                },
            },
            { returnDocument: "after" }
        );

        if (!version) throw createError(404, "Version not found");

        await Form.findOneAndUpdate(
            { formId },
            { isActive: true },
            { returnDocument: "after" }
        );

        res.status(200).json({
            message: "Form published",
            version: normalizeVersionForResponse(version),
        });
    } catch (err) {
        next(err);
    }
};
