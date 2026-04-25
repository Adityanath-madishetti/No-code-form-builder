// backend/src/models/FormVersion.js

import mongoose from "mongoose";

const { Schema } = mongoose;

const IdentitySchema = new Schema(
  {
    uid: {
      type: String,
      required: false,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
  },
  { _id: false },
);

/* ──────────────── COMPONENT ──────────────── */

const ComponentSchema = new Schema(
  {
    componentId: {
      type: String,
      required: true,
    },

    componentType: {
      type: String,
      required: true,
      enum: [
        // ── Text / Input ──
        "single-line-input",
        "multi-line-input",
        "email",
        "phone",
        "number",
        "decimal",
        "url",

        "text-box",

        // ── Date / Time ──
        "date",
        "time",

        // ── Selection ──
        "dropdown",
        "radio",
        "checkbox",
        "single-choice-grid",
        "multi-choice-grid",
        "matrix-table",

        // ── Scale / Rating ──
        "rating",
        "linear-scale",
        "slider",

        // ── File / Media ──
        "file-upload",
        "image-upload",

        // ── Composite / Blocks ──
        "address-block",
        "name-block",

        // ── Special ──
        "color-picker",
        "signature",
        "captcha",
        "payment",

        // ── Layout ──
        "heading",
        "section-divider",
        "page-break",

        // ── Extensibility ──
        "custom",
      ],
    },

    // Only used when componentType === "custom"
    customKey: {
      type: String,
    },

    label: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    required: {
      type: Boolean,
      default: false,
    },

    // Aligns with frontend's ComponentMetadata.group
    group: {
      type: String,
      enum: ["layout", "input", "selection"],
      default: "input",
    },

    // Component-specific configuration (varies by type)
    // See implementation_plan.md for per-type props documentation
    props: {
      type: Schema.Types.Mixed,
      default: {},
    },

    // Component-specific validation rules (varies by type)
    // See implementation_plan.md for per-type validation documentation
    validation: {
      type: Schema.Types.Mixed,
      default: {},
    },

    // Quiz-mode scoring
    scoring: {
      points: {
        type: Number,
        default: 0,
      },
      correctAnswer: {
        type: Schema.Types.Mixed,
      },
      isAutoGraded: {
        type: Boolean,
        default: false,
      },
    },

    // Display order within the page
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

/* ──────────────── PAGE ──────────────── */

const PageSchema = new Schema(
  {
    pageId: {
      type: String,
      required: true,
    },

    pageNo: {
      type: Number,
      required: true,
    },

    title: {
      type: String,
      trim: true,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    components: {
      type: [ComponentSchema],
      default: [],
    },

    isTerminal: {
      type: Boolean,
    },

    defaultPreviousPageId: {
      type: String,
      // required: true,
    },

    defaultNextPageId: {
      type: String,
      // required: true,
    },
  },
  { _id: false },
);

/* ──────────────── LOGIC RULES ──────────────── */

const RuleActionSchema = new Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "SHOW",
        "HIDE",
        "ENABLE",
        "DISABLE",
        "SET_VALUE",
        "SKIP_PAGE",
        "CONDITIONAL",
      ],
      required: true,
    },
    targetId: { type: String, required: true },
    toPageId: { type: String, required: false },
    value: { type: Schema.Types.Mixed },
    condition: { type: Schema.Types.Mixed },
  },
  { _id: false },
);

RuleActionSchema.add({
  thenActions: [RuleActionSchema],
  elseActions: [RuleActionSchema],
});

const LogicRuleSchema = new Schema(
  {
    ruleId: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      default: "New Rule",
    },

    enabled: {
      type: Boolean,
      default: true,
    },

    ruleType: {
      type: String,
      enum: ["field", "validation", "navigation"],
      default: "field",
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },

    // Nested condition tree (uses Mixed for recursive AND/OR groups)
    condition: {
      type: Schema.Types.Mixed,
      required: true,
    },

    thenActions: [RuleActionSchema],

    elseActions: [RuleActionSchema],
  },
  { _id: false },
);

const FormulaRuleSchema = new Schema(
  {
    ruleId: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      default: "New Formula",
    },

    enabled: {
      type: Boolean,
      default: true,
    },

    targetId: {
      type: String,
      default: "",
    },

    expression: {
      type: String,
      default: "",
    },

    referencedFields: [String],

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const ComponentShuffleStackSchema = new Schema(
  {
    stackId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      default: "New Stack",
    },
    pageId: {
      type: String,
      default: "",
    },
    componentIds: {
      type: [String],
      default: [],
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false },
);

/* ──────────────── WORKFLOW ──────────────── */

const TransitionSchema = new Schema(
  {
    from: String,
    to: String,
    role: String,
    condition: String,
  },
  { _id: false },
);

const WorkflowSchema = new Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
    },

    states: [String],

    transitions: [TransitionSchema],
  },
  { _id: false },
);

/* ──────────────── ACCESS CONTROL ──────────────── */

const AccessSchema = new Schema(
  {
    visibility: {
      type: String,
      enum: ["public", "private", "link-only"],
      default: "private",
    },

    editors: {
      type: [IdentitySchema],
      default: [],
    },

    reviewers: {
      type: [IdentitySchema],
      default: [],
    },

    viewers: {
      type: [IdentitySchema],
      default: [],
    },

    roles: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false },
);

/* ──────────────── SETTINGS ──────────────── */

const SettingsSchema = new Schema(
  {
    allowMultipleSubmissions: {
      type: Boolean,
      default: false,
    },

    requireLogin: {
      type: Boolean,
      default: false,
    },

    collectEmail: {
      type: Boolean,
      default: false,
    },

    collectEmailMode: {
      type: String,
      enum: ["none", "optional", "required"],
      default: "none",
    },

    submissionPolicy: {
      type: String,
      enum: ["none", "edit_only", "resubmit_only", "edit_and_resubmit"],
      default: "none",
    },

    canViewOwnSubmission: {
      type: Boolean,
      default: false,
    },

    saveDraft: {
      type: Boolean,
      default: false,
    },

    showProgressBar: {
      type: Boolean,
      default: false,
    },

    submissionLimit: {
      type: Number,
    },

    closeDate: {
      type: Date,
    },

    confirmationMessage: {
      type: String,
      default: "Thank you for your response!",
    },

    notifyOnSubmission: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

/* ──────────────── THEME ──────────────── */

const ThemeSchema = new Schema(
  {
    color: String,
    mode: String,
    headingFont: { family: String },
    bodyFont: { family: String },
    background: {
      type: Schema.Types.Mixed, // Quickest way to accept your nested background object
      default: {},
    },
    layout: {
      type: Schema.Types.Mixed,
      default: {},
    },
    componentProps: {
      type: Schema.Types.Mixed,
      default: {},
    },
    primaryColor: {
      type: String,
      default: "",
    },
    secondaryColor: {
      type: String,
      default: "",
    },
  },
  { _id: false },
);

/* ──────────────── META ──────────────── */

const MetaSchema = new Schema(
  {
    createdBy: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    isDraft: {
      type: Boolean,
      default: true,
    },

    isMultiPage: {
      type: Boolean,
      default: false,
    },

    isQuiz: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

/* ──────────────── VERSION HISTORY ──────────────── */

const VersionHistorySchema = new Schema(
  {
    version: Number,

    createdBy: String,

    createdAt: {
      type: Date,
      default: Date.now,
    },

    message: String,
  },
  { _id: false },
);

/* ════════════════ FORM VERSION (root) ════════════════ */

const FormVersionSchema = new Schema(
  {
    formId: {
      type: String,
      required: true,
    },

    version: {
      type: Number,
      default: 1,
    },

    versionHistory: [VersionHistorySchema],

    meta: {
      type: MetaSchema,
      required: true,
    },

    theme: {
      type: ThemeSchema,
    },

    settings: {
      type: SettingsSchema,
      required: true,
    },

    pages: [PageSchema],

    logic: {
      rules: [LogicRuleSchema],
      formulas: [FormulaRuleSchema],
      componentShuffleStacks: [ComponentShuffleStackSchema],
    },

/*
    workflow: {
      type: WorkflowSchema,
    },
*/

    access: {
      type: AccessSchema,
    },
  },
  { timestamps: true },
);

// Compound index: one unique version per form
FormVersionSchema.index({ formId: 1, version: -1 }, { unique: true });

export default mongoose.model("FormVersion", FormVersionSchema);
