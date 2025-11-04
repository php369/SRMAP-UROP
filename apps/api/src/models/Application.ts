import mongoose, { Document, Schema } from 'mongoose';

export interface IApplication extends Document {
  _id: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  choices: mongoose.Types.ObjectId[]; // Up to 3 project choices
  state: 'pending' | 'approved' | 'rejected';
  decidedBy?: mongoose.Types.ObjectId; // Faculty or Coordinator who made decision
  decidedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>({
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  choices: [{
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  }],
  state: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    required: true,
    default: 'pending'
  },
  decidedBy: {
    type: Schema.Types.ObjectId,
    ref: 'FacultyRoster'
  },
  decidedAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
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

// Validation for choices count (1-3 projects)
ApplicationSchema.pre('save', function(next) {
  if (this.choices.length < 1 || this.choices.length > 3) {
    next(new Error('Application must have between 1 and 3 project choices'));
  } else {
    next();
  }
});

// Set decidedAt when state changes to approved/rejected
ApplicationSchema.pre('save', function(next) {
  if (this.isModified('state') && (this.state === 'approved' || this.state === 'rejected')) {
    if (!this.decidedAt) {
      this.decidedAt = new Date();
    }
  }
  next();
});

export const Application = mongoose.model<IApplication>('Application', ApplicationSchema);
export default Application;