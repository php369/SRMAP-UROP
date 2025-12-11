import mongoose, { Document, Schema } from 'mongoose';

export interface ISubmission extends Document {
  _id: mongoose.Types.ObjectId;
  submissionId: string; // Unique identifier
  groupId?: mongoose.Types.ObjectId; // For group submissions
  studentId?: mongoose.Types.ObjectId; // For solo submissions
  projectId: mongoose.Types.ObjectId;
  projectType: 'IDP' | 'UROP' | 'CAPSTONE';
  assessmentType: 'A1' | 'A2' | 'A3' | 'External';
  githubLink: string;
  reportUrl: string; // Cloudinary URL for PDF
  pptUrl?: string; // Cloudinary URL or external link (required for External only)
  presentationUrl?: string; // Alternative field name for compatibility
  submittedBy: mongoose.Types.ObjectId; // Group leader or solo student
  submittedAt: Date;
  isFrozen: boolean;
  facultyId: mongoose.Types.ObjectId;
  externalEvaluatorId?: mongoose.Types.ObjectId; // For external assessment
  facultyGrade?: number; // Out of 100
  externalGrade?: number; // Out of 100
  finalGrade?: number; // Combined grade
  facultyComments?: string; // Faculty feedback
  externalComments?: string; // External evaluator feedback
  isGraded: boolean;
  isGradeReleased: boolean;
  gradeReleased: boolean; // Alternative field name for compatibility
  meetUrl?: string; // Meeting URL for discussions
  comments?: string; // Optional comments from submitter
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>({
  submissionId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
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
  projectType: {
    type: String,
    enum: ['IDP', 'UROP', 'CAPSTONE'],
    required: true
  },
  assessmentType: {
    type: String,
    enum: ['A1', 'A2', 'A3', 'External'],
    required: true
  },
  githubLink: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: (url: string) => url.startsWith('https://github.com/'),
      message: 'GitHub link must be a valid GitHub repository URL'
    }
  },
  reportUrl: {
    type: String,
    required: true,
    trim: true
  },
  pptUrl: {
    type: String,
    trim: true
  },
  presentationUrl: {
    type: String,
    trim: true
  },
  submittedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  isFrozen: {
    type: Boolean,
    default: true
  },
  facultyId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  externalEvaluatorId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  facultyGrade: {
    type: Number,
    min: 0,
    max: 100
  },
  externalGrade: {
    type: Number,
    min: 0,
    max: 100
  },
  finalGrade: {
    type: Number,
    min: 0,
    max: 100
  },
  facultyComments: {
    type: String,
    trim: true
  },
  externalComments: {
    type: String,
    trim: true
  },
  isGraded: {
    type: Boolean,
    default: false
  },
  isGradeReleased: {
    type: Boolean,
    default: false
  },
  gradeReleased: {
    type: Boolean,
    default: false
  },
  meetUrl: {
    type: String,
    trim: true
  },
  comments: {
    type: String,
    trim: true
  },
  metadata: {
    ipAddress: String,
    userAgent: String
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
SubmissionSchema.index({ groupId: 1, assessmentType: 1 }); // Group submissions by type
SubmissionSchema.index({ studentId: 1, assessmentType: 1 }); // Student submissions by type
SubmissionSchema.index({ facultyId: 1, isGraded: 1 }); // Faculty grading queue
SubmissionSchema.index({ externalEvaluatorId: 1 }); // External evaluator queue
SubmissionSchema.index({ projectId: 1 }); // Project submissions
SubmissionSchema.index({ submittedAt: -1 }); // Recent submissions

// Validation: Must have either groupId OR studentId (not both, not neither)
SubmissionSchema.pre('save', function (next) {
  const hasGroup = !!this.groupId;
  const hasStudent = !!this.studentId;

  if (hasGroup && hasStudent) {
    return next(new Error('Submission cannot have both groupId and studentId'));
  }
  if (!hasGroup && !hasStudent) {
    return next(new Error('Submission must have either groupId or studentId'));
  }
  next();
});

// Validation: PPT is required for External assessment
SubmissionSchema.pre('save', function (next) {
  if (this.assessmentType === 'External' && !this.pptUrl) {
    return next(new Error('PPT is required for External assessment'));
  }
  next();
});

// Calculate final grade when both grades are available
SubmissionSchema.pre('save', function (next) {
  if (this.assessmentType === 'External' && this.facultyGrade !== undefined && this.externalGrade !== undefined) {
    // Weighted average: 60% faculty, 40% external
    this.finalGrade = Math.round(this.facultyGrade * 0.6 + this.externalGrade * 0.4);
    this.isGraded = true;
  } else if (this.assessmentType !== 'External' && this.facultyGrade !== undefined) {
    this.finalGrade = this.facultyGrade;
    this.isGraded = true;
  }
  next();
});

export const Submission = mongoose.model<ISubmission>('Submission', SubmissionSchema);
export default Submission;
