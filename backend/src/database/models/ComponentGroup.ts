// backend/src/database/models/ComponentGroup.ts
import mongoose, { Document, Schema } from 'mongoose';
import { IGroupBase } from '@/modules/group/group.types.js';

export interface IComponentGroup extends IGroupBase, Document {}

const ComponentGroupSchema = new Schema<IComponentGroup>(
  {
    groupId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    components: { type: Schema.Types.Mixed, required: true },
    createdBy: { type: String, required: true, index: true },
    sharedWith: { type: [String], default: [] },
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model<IComponentGroup>('ComponentGroup', ComponentGroupSchema);
