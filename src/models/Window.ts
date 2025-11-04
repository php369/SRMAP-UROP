import mongoose, { Document, Schema } from 'mongoose';

export interface IWindow extends Document {
  _id: mongoose.Types.ObjectId;
  kind: 'grouping' | 'application' | 'faculty-edit-title' | 'internal-eval' | 'external-eval';
  type: 'IDP' | 'UROP' | 'CAPSTONE';
  start: Date;
  end: Date;
  enforced: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WindowSchema = new Schema<IWindow>({
  kind: {
    type: String,
    enum: ['grouping', 'application', 'faculty-edit-title', 'internal-eval', 'external-eval'],
    required: true
  },
  type: {
    type: String,
    enum: ['IDP', 'UROP', 'CAPSTONE'],
    required: true
  },
  start: {
    type: Date,
    required: true
  },
  end: {
    type: Date,
    required: true
  },
  enforced: {
    type: Boolean,
    required: true,
    default: true
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

// Validation to ensure end is after start
WindowSchema.pre('save', function(next) {
  if (this.end <= this.start) {
    next(new Error('Window end time must be after start time'));
  } else {
    next();
  }
});

// Compound index for efficient window lookups
WindowSchema.index({ kind: 1, type: 1 });
// Additional indexes for performance
WindowSchema.index({ enforced: 1 });
WindowSchema.index({ start: 1, end: 1 });

export const Window = mongoose.model<IWindow>('Window', WindowSchema);
export default Window;