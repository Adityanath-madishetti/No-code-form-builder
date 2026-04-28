import dotenv from "dotenv";
import crypto from "crypto";
import mongoose from "mongoose";
import { connectDB } from "../src/db/db.js";
import User from "../src/models/User.js";
import { createFormService, publishFormService } from "../src/services/formService.js";

dotenv.config();

async function ensureUser(email) {
  const normalizedEmail = email.trim().toLowerCase();
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
    { upsert: true, returnDocument: "after", runValidators: true },
  );

  return user;
}

async function main() {
  await connectDB();

  const demoEmail = process.env.DEMO_USER_EMAIL || "demo@nocodeformbuilder.app";
  const user = await ensureUser(demoEmail);
  const result = await createFormService(user.uid, {
    title: "Demo Leave Request",
    description: "Starter form for local Fluxoris integration tests.",
  });

  await publishFormService(result.form.formId, user.uid);

  console.log("Seed complete.");
  console.log(`Demo user email: ${user.email}`);
  console.log(`Demo formId: ${result.form.formId}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
