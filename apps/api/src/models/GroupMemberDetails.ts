import mongoose, { Document, Schema } from 'mongoose';

export interface IGroupMemberDetails extends Document {
  _id: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  department: string;
  specialization?: string;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GroupMemberDetailsSchema = new Schema<IGroupMemberDetails>({
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  specialization: {
    type: String,
    trim: true,
    maxlength: 100
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (_doc: any, ret: any) => {
      delete ret.__v;
      return ret;
    }
  }
});

// Ensure one record per user per group
GroupMemberDetailsSchema.index({ groupId: 1, userId: 1 }, { unique: true });

// Indexes for performance
GroupMemberDetailsSchema.index({ groupId: 1 });
GroupMemberDetailsSchema.index({ userId: 1 });

export const GroupMemberDetails = mongoose.model<IGroupMemberDetails>('GroupMemberDetails', GroupMemberDetailsSchema);
export default GroupMemberDetails;