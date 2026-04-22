import crypto from "crypto";
import ThemeTemplate from "../models/ThemeTemplate.js";
import User from "../models/User.js";
import { createError } from "../middleware/errorHandler.js";
import { normalizeEmail } from "../utils/formPermissions.js";

export async function createThemeService(
  uid,
  { name, theme, sharedWith, isPublic },
) {
  const themeId = crypto.randomUUID();
  const normalizedEmails = (sharedWith || [])
    .map(normalizeEmail)
    .filter(Boolean);

  const template = await ThemeTemplate.create({
    themeId,
    name,
    theme,
    createdBy: uid,
    sharedWith: normalizedEmails,
    isPublic: isPublic || false,
  });

  const userObj = await User.findOne({ uid }).lean();
  return {
    ...template.toObject(),
    creatorEmail: userObj ? userObj.email : "Unknown",
  };
}

export async function listThemesService(user) {
  const uid = user.uid;
  const email = normalizeEmail(user.email);

  const query = {
    $or: [{ createdBy: uid }, { isPublic: true }],
  };

  if (email) {
    query.$or.push({ sharedWith: email });
  }

  const templates = await ThemeTemplate.find(query)
    .sort({ updatedAt: -1 })
    .lean();

  const uids = [...new Set(templates.map((t) => t.createdBy))];
  const users = await User.find({ uid: { $in: uids } }).lean();
  const emailMap = {};
  users.forEach((u) => {
    emailMap[u.uid] = u.email;
  });

  return templates.map((t) => ({
    ...t,
    creatorEmail: emailMap[t.createdBy] || "Unknown",
  }));
}

export async function updateThemeService(themeId, uid, updates) {
  const template = await ThemeTemplate.findOne({ themeId });
  if (!template) throw createError(404, "Theme not found");
  if (template.createdBy !== uid) throw createError(403, "Access denied");

  if (updates.name !== undefined) template.name = updates.name;
  if (updates.theme !== undefined) template.theme = updates.theme;
  if (updates.isPublic !== undefined) template.isPublic = updates.isPublic;
  if (updates.sharedWith !== undefined) {
    template.sharedWith = updates.sharedWith
      .map(normalizeEmail)
      .filter(Boolean);
  }

  await template.save();

  const userObj = await User.findOne({ uid: template.createdBy }).lean();
  return {
    ...template.toObject(),
    creatorEmail: userObj ? userObj.email : "Unknown",
  };
}

export async function deleteThemeService(themeId, uid) {
  const template = await ThemeTemplate.findOneAndDelete({
    themeId,
    createdBy: uid,
  });
  if (!template) throw createError(404, "Theme not found or access denied");
  return template;
}
