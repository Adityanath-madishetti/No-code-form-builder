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
import { normalizeLogicPayload } from "./logicEngine.js";

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

    const allowedFields = ["meta", "theme", "settings", "pages", "logic", "workflow", "access"];
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

export async function listVersionsService(formId, user) {
    await assertCanEdit(formId, user);

    return FormVersion.find({ formId })
        .select("formId version meta.name meta.isDraft createdAt updatedAt")
        .sort({ version: -1 });
}

export async function getLatestVersionService(formId, user) {
    await assertCanEdit(formId, user);

    const versionDoc = await FormVersion.findOne({ formId }).sort({
        version: -1,
    });
    if (!versionDoc) throw createError(404, "No versions found");

    return normalizeVersionForResponse(versionDoc);
}

export async function getVersionService(formId, versionNum, user) {
    if (isNaN(versionNum)) throw createError(400, "Invalid version number");

    await assertCanEdit(formId, user);

    const versionDoc = await FormVersion.findOne({ formId, version: versionNum });
    if (!versionDoc) throw createError(404, "Version not found");

    return normalizeVersionForResponse(versionDoc);
}

export async function createVersionService(formId, user) {
    const uid = user.uid;

    await assertCanEdit(formId, user);

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
            message: `Created version ${newVersionNum}`,
        },
    ];

    const newVersion = await FormVersion.create(cloned);

    await Form.findOneAndUpdate(
        { formId },
        { currentVersion: newVersionNum },
        { returnDocument: "after" }
    );

    return normalizeVersionForResponse(newVersion);
}

export async function updateVersionService(formId, versionNum, payload, user) {
    if (isNaN(versionNum)) throw createError(400, "Invalid version number");

    return applyVersionUpdates({
        formId,
        versionNum,
        uid: user.uid,
        user,
        payload,
    });
}

export async function updateVersionSettingsService(formId, versionNum, payload, user) {
    if (isNaN(versionNum)) throw createError(400, "Invalid version number");

    const settingsPayload = payload?.settings ?? payload;
    return applyVersionUpdates({
        formId,
        versionNum,
        uid: user.uid,
        user,
        payload: { settings: settingsPayload },
    });
}

export async function updateVersionAccessService(formId, versionNum, payload, user) {
    if (isNaN(versionNum)) throw createError(400, "Invalid version number");

    const accessPayload = payload?.access ?? payload;
    return applyVersionUpdates({
        formId,
        versionNum,
        uid: user.uid,
        user,
        payload: { access: accessPayload },
    });
}

export async function publishVersionService(formId, user) {
    const uid = user.uid;

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

    return normalizeVersionForResponse(version);
}
