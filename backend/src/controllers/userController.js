import User from "../models/User.js";
import { createError } from "../middleware/errorHandler.js";

/**
 * POST /api/users/sync
 * On first login — find-or-create user doc from Firebase token.
 */
export const syncUser = async (req, res, next) => {
    try {
        const { uid, email, name, picture } = req.user;

        const user = await User.findOneAndUpdate(
            { uid },
            {
                $set: {
                    email: email || "",
                    displayName: name || "",
                    avatarUrl: picture || "",
                    lastLogin: new Date(),
                },
                $setOnInsert: {
                    uid,
                    roles: ["user"],
                    accountStatus: "active",
                },
            },
            { upsert: true, returnDocument: 'after', runValidators: true }
        );

        res.status(200).json({ user });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/users/me
 * Return the current user's profile.
 */
export const getMe = async (req, res, next) => {
    try {
        const user = await User.findOne({ uid: req.user.uid });

        if (!user) {
            throw createError(404, "User not found. Please sync first.");
        }

        res.status(200).json({ user });
    } catch (err) {
        next(err);
    }
};

/**
 * PATCH /api/users/me
 * Update current user's profile (displayName, avatarUrl).
 */
export const updateMe = async (req, res, next) => {
    try {
        const allowedFields = ["displayName", "avatarUrl"];
        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            throw createError(400, "No valid fields to update");
        }

        const user = await User.findOneAndUpdate(
            { uid: req.user.uid },
            { $set: updates },
            { returnDocument: 'after', runValidators: true }
        );

        if (!user) {
            throw createError(404, "User not found");
        }

        res.status(200).json({ user });
    } catch (err) {
        next(err);
    }
};
