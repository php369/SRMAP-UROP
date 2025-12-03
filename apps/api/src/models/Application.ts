import mongoose, { Document, Schema } from 'mongoose';

export interface IApplication extends Document {
  _id: mongoose.Types.ObjectId;
  studentId?: mongoose.Types.ObjectId; // For solo applications
  groupId?: mongoose.Types.ObjectId; // For group applications
  projectType: 'IDP' | 'UROP' | 'CAPSTONE';
  projectPreferences: mongoose.Types.ObjectId[]; // Up to 3 projects in order
  department: string;
  stream: string;
  specialization?: string; // Required if semester >= 6
  cgpa?: number; // Optional, 0-10 scale
  semester: number; // Student's current semester
  status: 'pending' | 'approved' | 'rejected' | 'released';
  reviewedBy?: mongoose.Types.ObjectId; // Faculty who reviewed
  reviewedAt?: Date;
  selectedProjectId?: mongoose.Types.ObjectId;
  assignedProject?: mongoose.Types.ObjectId;
  isFrozen: boolean;
  submittedAt?: Date;
  notes?: string;
  metadata?: any;
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
  projectType: {
    type: String,
    enum: ['IDP', 'UROP', 'CAPSTONE'],
    required: true
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
  semester: {
    type: Number,
    required: true,
    min: 1,
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
  assignedProject: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
  },
  isFrozen: {
    type: Boolean,
    default: false
  },
  submittedAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  metadata: {
    type: Schema.Types.Mixed
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

// Indexes for performance optimization
ApplicationSchema.index({ projectId: 1, status: 1 }); // Applications by project and status
ApplicationSchema.index({ groupId: 1 }); // Find applications by group
ApplicationSchema.index({ studentId: 1 }); // Find applications by student
ApplicationSchema.index({ status: 1, createdAt: -1 }); // Recent applications by status

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