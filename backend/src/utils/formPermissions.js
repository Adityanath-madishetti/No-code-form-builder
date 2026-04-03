import User from "../models/User.js";
import { normalizeLogicPayload } from "../services/logicEngine.js";

const VISIBILITY_VALUES = new Set(["public", "private", "link-only"]);
const COLLECT_EMAIL_MODE_VALUES = new Set(["none", "optional", "required"]);
const SUBMISSION_POLICY_VALUES = new Set([
    "none",
    "edit_only",
    "resubmit_only",
    "edit_and_resubmit",
]);

export function normalizeEmail(email) {
    if (typeof email !== "string") return "";
    return email.trim().toLowerCase();
}

function asIdentity(raw) {
    if (!raw) return null;

    if (typeof raw === "string") {
        const email = normalizeEmail(raw);
        return email ? { uid: "", email } : null;
    }

    if (typeof raw === "object") {
        const uid = typeof raw.uid === "string" ? raw.uid.trim() : "";
        const email = normalizeEmail(raw.email);
        if (!uid && !email) return null;
        return { uid, email };
    }

    return null;
}

function dedupeIdentities(entries) {
    const byUid = new Set();
    const byEmail = new Set();
    const result = [];

    for (const entry of entries) {
        if (!entry) continue;
        const uidKey = entry.uid || "";
        const emailKey = normalizeEmail(entry.email);

        if (uidKey) {
            if (byUid.has(uidKey)) continue;
            byUid.add(uidKey);
            result.push({ uid: uidKey, email: emailKey });
            continue;
        }

        if (!emailKey || byEmail.has(emailKey)) continue;
        byEmail.add(emailKey);
        result.push({ uid: "", email: emailKey });
    }

    return result;
}

function listToIdentities(list) {
    if (!Array.isArray(list)) return [];
    return dedupeIdentities(list.map(asIdentity).filter(Boolean));
}

export function normalizeAccess(access) {
    const visibility = VISIBILITY_VALUES.has(access?.visibility)
        ? access.visibility
        : "private";

    return {
        visibility,
        editors: listToIdentities(access?.editors),
        reviewers: listToIdentities(access?.reviewers),
        viewers: listToIdentities(access?.viewers),
        roles: access?.roles || {},
    };
}

export function normalizeSettings(settings) {
    const collectEmailMode = COLLECT_EMAIL_MODE_VALUES.has(settings?.collectEmailMode)
        ? settings.collectEmailMode
        : settings?.collectEmail
            ? "required"
            : "none";

    const submissionPolicy = SUBMISSION_POLICY_VALUES.has(settings?.submissionPolicy)
        ? settings.submissionPolicy
        : settings?.allowMultipleSubmissions
            ? "resubmit_only"
            : "none";

    return {
        ...settings,
        collectEmailMode,
        submissionPolicy,
        canViewOwnSubmission: settings?.canViewOwnSubmission === true,
        confirmationMessage:
            settings?.confirmationMessage || "Thank you for your response!",
    };
}

function matchesIdentity(entry, user) {
    if (!entry || !user) return false;
    if (entry.uid && user.uid && entry.uid === user.uid) return true;
    if (entry.email && user.email) {
        return normalizeEmail(entry.email) === normalizeEmail(user.email);
    }
    return false;
}

function hasRole(roleList, user) {
    const identities = listToIdentities(roleList);
    return identities.some((entry) => matchesIdentity(entry, user));
}

export function isOwner(form, user) {
    return Boolean(form?.createdBy && user?.uid && form.createdBy === user.uid);
}

export function isEditor(version, user) {
    return hasRole(version?.access?.editors, user);
}

export function isReviewer(version, user) {
    return hasRole(version?.access?.reviewers, user);
}

export function isViewer(version, user) {
    return hasRole(version?.access?.viewers, user);
}

export function canEditForm(form, version, user) {
    return isOwner(form, user) || isEditor(version, user);
}

export function canReviewSubmissions(form, version, user) {
    return isOwner(form, user) || isEditor(version, user) || isReviewer(version, user);
}

export function canFillForm(form, version, user) {
    if (!form || !version) return false;

    const access = normalizeAccess(version.access);
    if (access.visibility === "public") return true;

    if (!user) return false;
    if (isOwner(form, user)) return true;
    if (isEditor(version, user)) return true;
    if (isReviewer(version, user)) return true;
    if (isViewer(version, user)) return true;

    return false;
}

async function resolveIdentityList(rawList, ownerUid) {
    const identities = listToIdentities(rawList);
    const unresolvedEmails = [];
    const unresolvedUids = [];

    const emailsToResolve = identities
        .filter((entry) => !entry.uid && entry.email)
        .map((entry) => entry.email);
    const uidsToResolve = identities
        .filter((entry) => entry.uid && !entry.email)
        .map((entry) => entry.uid);

    const [usersByEmail, usersByUid] = await Promise.all([
        emailsToResolve.length
            ? User.find({ email: { $in: emailsToResolve } }).select("uid email")
            : [],
        uidsToResolve.length
            ? User.find({ uid: { $in: uidsToResolve } }).select("uid email")
            : [],
    ]);

    const emailMap = new Map(
        usersByEmail.map((user) => [normalizeEmail(user.email), user])
    );
    const uidMap = new Map(usersByUid.map((user) => [user.uid, user]));

    const resolved = [];
    for (const entry of identities) {
        if (entry.uid && entry.email) {
            resolved.push({
                uid: entry.uid,
                email: normalizeEmail(entry.email),
            });
            continue;
        }

        if (entry.uid) {
            const user = uidMap.get(entry.uid);
            if (!user) {
                unresolvedUids.push(entry.uid);
                continue;
            }
            resolved.push({
                uid: user.uid,
                email: normalizeEmail(user.email),
            });
            continue;
        }

        if (entry.email) {
            const user = emailMap.get(entry.email);
            if (!user) {
                unresolvedEmails.push(entry.email);
                continue;
            }
            resolved.push({
                uid: user.uid,
                email: normalizeEmail(user.email),
            });
        }
    }

    const deduped = dedupeIdentities(resolved).filter(
        (entry) => entry.uid && entry.uid !== ownerUid
    );

    return {
        resolved: deduped,
        unresolvedEmails,
        unresolvedUids,
    };
}

export async function resolveAccessPayload(rawAccess, ownerUid) {
    const visibility = normalizeAccess(rawAccess).visibility;

    const [editors, reviewers, viewers] = await Promise.all([
        resolveIdentityList(rawAccess?.editors, ownerUid),
        resolveIdentityList(rawAccess?.reviewers, ownerUid),
        resolveIdentityList(rawAccess?.viewers, ownerUid),
    ]);

    return {
        access: {
            visibility,
            editors: editors.resolved,
            reviewers: reviewers.resolved,
            viewers: viewers.resolved,
            roles: rawAccess?.roles || {},
        },
        unresolved: {
            emails: [
                ...editors.unresolvedEmails,
                ...reviewers.unresolvedEmails,
                ...viewers.unresolvedEmails,
            ],
            uids: [
                ...editors.unresolvedUids,
                ...reviewers.unresolvedUids,
                ...viewers.unresolvedUids,
            ],
        },
    };
}

export function normalizeVersionForResponse(versionDoc) {
    if (!versionDoc) return versionDoc;
    const plain = versionDoc.toObject ? versionDoc.toObject() : versionDoc;

    plain.settings = normalizeSettings(plain.settings || {});
    plain.access = normalizeAccess(plain.access || {});
    plain.logic = normalizeLogicPayload(plain.logic || {});

    return plain;
}
