import mongoose from "mongoose";

const { Schema } = mongoose;

/* ──────────────── RESPONSE ──────────────── */

const SubmissionResponseSchema = new Schema(
    {
        componentId: {
            type: String,
            required: true,
        },

        response: {
            type: Schema.Types.Mixed,
            default: null,
        },
    },
    { _id: false }
);

/* ──────────────── PAGE ──────────────── */

const SubmissionPageSchema = new Schema(
    {
        pageNo: {
            type: Number,
            required: true,
        },

        responses: [SubmissionResponseSchema],
    },
    { _id: false }
);

/* ──────────────── SUBMISSION ──────────────── */

const SubmissionSchema = new Schema(
    {
        submissionId: {
            type: String,
            required: true,
            unique: true,
        },

        formId: {
            type: String,
            required: true,
            index: true,
        },

        version: {
            type: Number,
            required: true,
        },

        submittedBy: {
            type: String,
            default: null,
        },

        email: {
            type: String,
            default: null,
        },

        status: {
            type: String,
            enum: ["draft", "submitted", "under_review", "approved", "rejected"],
            default: "submitted",
        },

        meta: {
            isQuiz: {
                type: Boolean,
                default: false,
            },
            totalScore: {
                type: Number,
                default: null,
            },
        },

        pages: [SubmissionPageSchema],

        // ── Workflow State ──
        currentState: {
            type: String,
            default: null,
        },

        workflowHistory: [
            {
                from: String,
                to: String,
                transitionId: String,
                timestamp: { type: Date, default: Date.now },
                user: String,
                note: String,
            },
        ],
    },
    { timestamps: true }
);

// Fast lookup: all submissions for a specific form, newest first
SubmissionSchema.index({ formId: 1, createdAt: -1 });

export default mongoose.model("Submission", SubmissionSchema);
