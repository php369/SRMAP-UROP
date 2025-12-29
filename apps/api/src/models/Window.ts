import mongoose, { Document, Schema } from 'mongoose';

export interface IWindow extends Document {
  _id: mongoose.Types.ObjectId;
  windowType: 'proposal' | 'application' | 'submission' | 'assessment' | 'grade_release';
  projectType: 'IDP' | 'UROP' | 'CAPSTONE';
  assessmentType?: 'CLA-1' | 'CLA-2' | 'CLA-3' | 'External'; // For submission/assessment windows
  startDate: Date;
  endDate: Date;
  isActive: boolean; // Computed based on current time
  createdBy: mongoose.Types.ObjectId; // Coordinator
  createdAt: Date;
  updatedAt: Date;
}

const WindowSchema = new Schema<IWindow>({
  windowType: {
    type: String,
    enum: ['proposal', 'application', 'submission', 'assessment', 'grade_release'],
    required: true
  },
  projectType: {
    type: String,
    enum: ['IDP', 'UROP', 'CAPSTONE'],
    required: true
  },
  assessmentType: {
    type: String,
    enum: ['CLA-1', 'CLA-2', 'CLA-3', 'External']
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Validation to ensure endDate is after startDate
WindowSchema.pre('save', function (next) {
  if (this.endDate <= this.startDate) {
    next(new Error('Window end time must be after start time'));
  } else {
    next();
  }
});

// Compute isActive based on current time
WindowSchema.pre('save', function (next) {
  const now = new Date();
  this.isActive = now >= this.startDate && now <= this.endDate;
  next();
});

// Compound index for efficient window lookups
WindowSchema.index({ windowType: 1, projectType: 1, isActive: 1 });
// Additional indexes for performance
WindowSchema.index({ startDate: 1, endDate: 1 });
WindowSchema.index({ createdBy: 1 });

export const Window = mongoose.model<IWindow>('Window', WindowSchema);
export default Window;