import mongoose from "mongoose";

const { Schema } = mongoose;

const FluxorisEventSchema = new Schema(
  {
    source: {
      type: String,
      default: "fluxoris",
      index: true,
    },
    eventType: {
      type: String,
      default: "",
      index: true,
    },
    runId: {
      type: String,
      default: "",
      index: true,
    },
    workflowId: {
      type: String,
      default: "",
      index: true,
    },
    formId: {
      type: String,
      default: "",
      index: true,
    },
    signature: {
      type: String,
      default: "",
    },
    payload: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

export default mongoose.model("FluxorisEvent", FluxorisEventSchema);
