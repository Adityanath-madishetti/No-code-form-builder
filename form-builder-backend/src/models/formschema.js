import mongoose from "mongoose";

const { Schema } = mongoose;

/* ---------------- COMPONENT ---------------- */

const ComponentSchema = new Schema(
    {
        id: {
            type: String,
            required: true
        },

        type: {
            type: String,
            required: true
        },

        label: String,

        placeholder: String,

        defaultValue: Schema.Types.Mixed,

        options: [
            {
                label: String,
                value: Schema.Types.Mixed
            }
        ],

        validation: {
            required: Boolean,
            min: Number,
            max: Number,
            minLength: Number,
            maxLength: Number,
            regex: String,
            customMessage: String
        },

        settings: Schema.Types.Mixed
    },
    { _id: false }
);

/* ---------------- PAGE ---------------- */

const PageSchema = new Schema(
    {
        pageId: {
            type: String,
            required: true
        },

        title: String,

        description: String,

        components: [ComponentSchema]
    },
    { _id: false }
);

/* ---------------- LOGIC ---------------- */

const LogicRuleSchema = new Schema(
    {
        type: {
            type: String,
            enum: ["visibility", "skip", "calculation"]
        },

        target: String,

        condition: {
            field: String,
            operator: String,
            value: Schema.Types.Mixed
        }
    },
    { _id: false }
);

/* ---------------- WORKFLOW ---------------- */

const TransitionSchema = new Schema(
    {
        from: String,
        to: String,
        role: String,
        condition: String
    },
    { _id: false }
);

const WorkflowSchema = new Schema(
    {
        states: [String],

        transitions: [TransitionSchema]
    },
    { _id: false }
);

/* ---------------- VERSION HISTORY ---------------- */

const VersionHistorySchema = new Schema(
    {
        version: Number,
        createdBy: String,
        createdAt: Date,
        message: String
    },
    { _id: false }
);

/* ---------------- ACCESS ---------------- */

const AccessSchema = new Schema(
    {
        visibility: {
            type: String,
            enum: ["public", "private"],
            default: "private"
        },

        editors: [String],

        roles: Schema.Types.Mixed
    },
    { _id: false }
);

/* ---------------- SETTINGS ---------------- */

const SettingsSchema = new Schema(
    {
        allowMultipleSubmissions: Boolean,
        requireLogin: Boolean,
        collectEmail: Boolean,
        saveDraft: Boolean,
        showProgressBar: Boolean,
        submissionLimit: Number
    },
    { _id: false }
);

/* ---------------- THEME ---------------- */

const ThemeSchema = new Schema(
    {
        mode: {
            type: String,
            enum: ["light", "dark"],
            default: "light"
        },

        primaryColor: String,

        backgroundColor: String,

        font: String,

        logoUrl: String
    },
    { _id: false }
);

/* ---------------- META ---------------- */

const MetaSchema = new Schema(
    {
        title: {
            type: String,
            required: true
        },

        description: String,

        ownerId: {
            type: String,
            required: true
        },

        tags: [String],

        status: {
            type: String,
            enum: ["draft", "published", "archived"],
            default: "draft"
        }
    },
    { timestamps: true, _id: false }
);

/* ---------------- MAIN FORM ---------------- */

const FormSchema = new Schema({

    formId: {
        type: String,
        required: true,
        unique: true
    },

    version: {
        type: Number,
        default: 1
    },

    versionHistory: [VersionHistorySchema],

    meta: MetaSchema,

    settings: SettingsSchema,

    theme: ThemeSchema,

    pages: [PageSchema],

    logic: {
        rules: [LogicRuleSchema]
    },

    workflow: WorkflowSchema,

    access: AccessSchema

},
    { timestamps: true });

export default mongoose.model("Form", FormSchema);