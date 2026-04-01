import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

/**
 * POST /api/auth/login
 * Email-only login — find-or-create user, return JWT.
 */
export const loginByEmail = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email || typeof email !== "string") {
            return res.status(400).json({ error: "Email is required" });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Find or create user by email
        const uid = crypto
            .createHash("sha256")
            .update(normalizedEmail)
            .digest("hex")
            .slice(0, 24);

        const user = await User.findOneAndUpdate(
            { email: normalizedEmail },
            {
                $set: {
                    email: normalizedEmail,
                    lastLogin: new Date(),
                },
                $setOnInsert: {
                    uid,
                    displayName: normalizedEmail.split("@")[0],
                    roles: ["user"],
                    accountStatus: "active",
                },
            },
            { upsert: true, returnDocument: 'after', runValidators: true }
        );

        // Issue JWT
        const token = jwt.sign(
            { uid: user.uid, email: user.email },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).json({
            token,
            user: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
            },
        });
    } catch (err) {
        next(err);
    }
};
