import mongoose, { Document, Schema } from 'mongoose';

export interface IMeetingLog extends Document {
  _id: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  facultyId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId; // student user ID
  attendees: Array<{
    studentId: mongoose.Types.ObjectId;
    present: boolean;
  }>;
  mode: 'physical' | 'online';
  startedAt: Date;
  endedAt?: Date;
  location?: string;
  notes?: string;
  status: 'submitted' | 'approved' | 'rejected';
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MeetingLogSchema = new Schema<IMeetingLog>({
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  facultyId: {
    type: Schema.Types.ObjectId,
    ref: 'FacultyRoster',
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attendees: [{
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    present: {
      type: Boolean,
      required: true,
      default: false
    }
  }],
  mode: {
    type: String,
    enum: ['physical', 'online'],
    required: true
  },
  startedAt: {
    type: Date,
    required: true
  },
  endedAt: {
    type: Date
  },
  location: {
    type: String,
    trim: true,
    maxlength: 200
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  status: {
    type: String,
    enum: ['submitted', 'approved', 'rejected'],
    required: true,
    default: 'submitted'
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'FacultyRoster'
  },
  reviewedAt: {
    type: Date
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

// Validation for attendees (at least one attendee required)
MeetingLogSchema.pre('save', function(next) {
  if (this.attendees.length < 1) {
    next(new Error('Meeting log must have at least one attendee'));
  } else {
    next();
  }
});

// Set reviewedAt when status changes to approved/rejected
MeetingLogSchema.pre('save', function(next) {
  if (this.isModified('status') && (this.status === 'approved' || this.status === 'rejected')) {
    if (!this.reviewedAt) {
      this.reviewedAt = new Date();
    }
  }
  next();
});

// Validate endedAt is after startedAt if provided
MeetingLogSchema.pre('save', function(next) {
  if (this.endedAt && this.endedAt <= this.startedAt) {
    next(new Error('Meeting end time must be after start time'));
  } else {
    next();
  }
});

// Indexes for performance
MeetingLogSchema.index({ groupId: 1, createdAt: -1 });
MeetingLogSchema.index({ facultyId: 1, status: 1 });
MeetingLogSchema.index({ status: 1 });
MeetingLogSchema.index({ createdBy: 1 });

export const MeetingLog = mongoose.model<IMeetingLog>('MeetingLog', MeetingLogSchema);
export default MeetingLog;