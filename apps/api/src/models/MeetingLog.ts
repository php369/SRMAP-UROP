import mongoose, { Document, Schema } from 'mongoose';

export interface IMeetingLog extends Document {
  _id: mongoose.Types.ObjectId;
  groupId?: mongoose.Types.ObjectId; // Optional for solo students
  studentId?: mongoose.Types.ObjectId; // For solo students
  projectId: mongoose.Types.ObjectId;
  facultyId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId; // Group leader or solo student user ID
  attendees: Array<{
    studentId: mongoose.Types.ObjectId;
    present: boolean;
  }>;
  mode: 'online' | 'in-person';
  meetingDate: Date;
  startedAt: Date;
  endedAt?: Date;
  location?: string; // For in-person meetings
  meetUrl?: string; // Google Meet URL for online meetings
  minutesOfMeeting?: string; // MOM - meeting notes
  status: 'submitted' | 'completed' | 'approved' | 'rejected';
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string; // Faculty notes when rejecting
  grade?: number; // Grade out of 5 for the meeting log
  createdAt: Date;
  updatedAt: Date;
}

const MeetingLogSchema = new Schema<IMeetingLog>({
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group'
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  facultyId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
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
    enum: ['online', 'in-person'],
    required: true
  },
  meetingDate: {
    type: Date,
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
  meetUrl: {
    type: String,
    trim: true,
    validate: {
      validator: (url: string) => !url || url.startsWith('https://meet.google.com/'),
      message: 'Meet URL must be a valid Google Meet link'
    }
  },
  minutesOfMeeting: {
    type: String,
    trim: true,
    maxlength: 5000
  },
  status: {
    type: String,
    enum: ['submitted', 'completed', 'approved', 'rejected'],
    required: true,
    default: 'submitted'
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  grade: {
    type: Number,
    min: 0,
    max: 5,
    default: null
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

// Validation: Must have either groupId OR studentId (not both, not neither)
MeetingLogSchema.pre('save', function (next) {
  const hasGroup = !!this.groupId;
  const hasStudent = !!this.studentId;

  if (hasGroup && hasStudent) {
    return next(new Error('Meeting log cannot have both groupId and studentId'));
  }
  if (!hasGroup && !hasStudent) {
    return next(new Error('Meeting log must have either groupId or studentId'));
  }
  next();
});

// Validation for attendees (at least one attendee required)
MeetingLogSchema.pre('save', function (next) {
  if (this.attendees.length < 1) {
    next(new Error('Meeting log must have at least one attendee'));
  } else {
    next();
  }
});

// Set reviewedAt when status changes to approved/rejected
MeetingLogSchema.pre('save', function (next) {
  if (this.isModified('status') && (this.status === 'approved' || this.status === 'rejected')) {
    if (!this.reviewedAt) {
      this.reviewedAt = new Date();
    }
  }
  next();
});

// Validate endedAt is after startedAt if provided
MeetingLogSchema.pre('save', function (next) {
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