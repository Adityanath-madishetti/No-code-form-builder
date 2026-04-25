// backend/src/models/ThemeTemplate.js

import mongoose from "mongoose";

const { Schema } = mongoose;

const ThemeTemplateSchema = new Schema(
  {
    themeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    theme: {
      type: Schema.Types.Mixed, // The FormTheme object
      required: true,
    },
    createdBy: {
      type: String, // uid
      required: true,
      index: true,
    },
    sharedWith: {
      type: [String], // Array of emails
      default: [],
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export default mongoose.model("ThemeTemplate", ThemeTemplateSchema);
