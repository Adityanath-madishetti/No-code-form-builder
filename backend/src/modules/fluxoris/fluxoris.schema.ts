import mongoose, { Document, Model } from 'mongoose';

const { Schema } = mongoose;

export interface IFluxorisEvent extends Document {
  source: string;
  eventType: string;
  runId: string;
  workflowId: string;
  formId: string;
  signature: string;
  payload: any;
  createdAt: Date;
  updatedAt: Date;
}

const FluxorisEventSchema = new Schema<IFluxorisEvent>(
  {
    source: {
      type: String,
      default: 'fluxoris',
      index: true,
    },
    eventType: {
      type: String,
      default: '',
      index: true,
    },
    runId: {
      type: String,
      default: '',
      index: true,
    },
    workflowId: {
      type: String,
      default: '',
      index: true,
    },
    formId: {
      type: String,
      default: '',
      index: true,
    },
    signature: {
      type: String,
      default: '',
    },
    payload: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

const FluxorisEvent: Model<IFluxorisEvent> = mongoose.model<IFluxorisEvent>(
  'FluxorisEvent',
  FluxorisEventSchema,
);

export default FluxorisEvent;
