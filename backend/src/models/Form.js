import mongoose from "mongoose";

const { Schema } = mongoose;

/* ──────────────── WORKFLOW TRANSITION ──────────────── */

const WorkflowTransitionSchema = new Schema(
    {
        id: {
            type: String,
            required: true,
        },
        from: {
            type: String,
            required: true,
        },
        to: {
            type: String,
            required: true,
        },
        condition: {
            type: String,
            default: "",
        },
        roles: {
            type: [String],
            default: [],
        },
        label: {
            type: String,
            default: "",
        },
    },
    { _id: false }
);

/* ──────────────── WORKFLOW ──────────────── */

const WorkflowSchema = new Schema(
    {
        enabled: {
            type: Boolean,
            default: false,
        },
        states: {
            type: [String],
            default: [],
        },
        initialState: {
            type: String,
            default: "",
        },
        transitions: {
            type: [WorkflowTransitionSchema],
            default: [],
        },
    },
    { _id: false }
);

/* ──────────────── FORM ──────────────── */

const FormSchema = new Schema(
    {
        formId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        title: {
            type: String,
            default: "Untitled Form",
            trim: true,
        },

        currentVersion: {
            type: Number,
            required: true,
            default: 1,
        },

        isActive: {
            type: Boolean,
            default: false,
        },

        isDeleted: {
            type: Boolean,
            default: false,
        },

        createdBy: {
            type: String,
            required: true,
            index: true,
        },

        workflow: {
            type: WorkflowSchema,
            default: null,
        },
    },
    { timestamps: true }
);

export default mongoose.model("Form", FormSchema);
