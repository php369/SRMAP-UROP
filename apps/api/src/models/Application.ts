import mongoose, { Document, Schema } from 'mongoose';

export interface IApplication extends Document {
  _id: mongoose.Types.ObjectId;
  studentId?: mongoose.Types.ObjectId; // For solo applications
  groupId?: mongoose.Types.ObjectId; // For group applications
  projectPreferences: mongoose.Types.ObjectId[]; // Up to 3 projects in order
  department: string;
  stream: string;
  specialization?: string; // Required if semester >= 6
  cgpa?: number; // Optional, 0-10 scale
  status: 'pending' | 'approved' | 'rejected' | 'released';
  reviewedBy?: mongoose.Types.ObjectId; // Faculty who reviewed
  reviewedAt?: Date;
  selectedProjectId?: mongoose.Types.ObjectId;
  isFrozen: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group'
  },
  projectPreferences: [{
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  }],
  department: {
    type: String,
    required: true,
    trim: true
  },
  stream: {
    type: String,
    required: true,
    trim: true
  },
  specialization: {
    type: String,
    trim: true
  },
  cgpa: {
    type: Number,
    min: 0,
    max: 10
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'released'],
    required: true,
    default: 'pending'
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'FacultyRoster'
  },
  reviewedAt: {
    type: Date
  },
  selectedProjectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
  },
  isFrozen: {
    type: Boolean,
    default: false
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

// Validation: Must have either studentId OR groupId (not both, not neither)
ApplicationSchema.pre('save', function (next) {
  const hasStudent = !!this.studentId;
  const hasGroup = !!this.groupId;

  if (hasStudent && hasGroup) {
    return next(new Error('Application cannot have both studentId and groupId'));
  }
  if (!hasStudent && !hasGroup) {
    return next(new Error('Application must have either studentId or groupId'));
  }
  next();
});

// Validation for project preferences count (1-3 projects)
ApplicationSchema.pre('save', function (next) {
  if (this.projectPreferences.length < 1 || this.projectPreferences.length > 3) {
    next(new Error('Application must have between 1 and 3 project preferences'));
  } else {
    next();
  }
});

// Set reviewedAt when status changes to approved/rejected
ApplicationSchema.pre('save', function (next) {
  if (this.isModified('status') && (this.status === 'approved' || this.status === 'rejected')) {
    if (!this.reviewedAt) {
      this.reviewedAt = new Date();
    }
  }
  next();
});

// Set isFrozen when status changes to approved
ApplicationSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'approved') {
    this.isFrozen = true;
  }
  next();
});

// Indexes for performance
ApplicationSchema.index({ groupId: 1, status: 1 });
ApplicationSchema.index({ studentId: 1, status: 1 });
ApplicationSchema.index({ status: 1, createdAt: -1 });
ApplicationSchema.index({ reviewedBy: 1 });

export const Application = mongoose.model<IApplication>('Application', ApplicationSchema);
export default Application;