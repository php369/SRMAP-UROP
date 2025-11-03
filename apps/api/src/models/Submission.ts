import mongoose, { Document, Schema } from 'mongoose';

export interface FileMetadata {
  url: string;
  name: string;
  size: number;
  contentType: string;
  cloudinaryId?: string;
}

export interface ISubmission extends Document {
  assessmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  files: FileMetadata[];
  notes?: string;
  submittedAt: Date;
  status: 'submitted' | 'graded' | 'returned';
  metadata: {
    ipAddress: string;
    userAgent: string;
    fileCount: number;
    totalSize: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const FileMetadataSchema = new Schema({
  url: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  size: {
    type: Number,
    required: true,
    min: 0
  },
  contentType: {
    type: String,
    required: true
  },
  cloudinaryId: {
    type: String,
    default: null
  }
}, { _id: false });

const SubmissionSchema = new Schema<ISubmission>({
  assessmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Assessment',
    required: true,
    index: true
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  files: {
    type: [FileMetadataSchema],
    required: true,
    validate: {
      validator: (files: FileMetadata[]) => files.length > 0,
      message: 'At least one file must be submitted'
    }
  },
  notes: {
    type: String,
    maxlength: 1000,
    default: null
  },
  submittedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  status: {
    type: String,
    enum: ['submitted', 'graded', 'returned'],
    default: 'submitted',
    index: true
  },
  metadata: {
    ipAddress: {
      type: String,
      required: true
    },
    userAgent: {
      type: String,
      required: true
    },
    fileCount: {
      type: Number,
      required: true,
      min: 1
    },
    totalSize: {
      type: Number,
      required: true,
      min: 0
    }
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

// Compound indexes for efficient queries
SubmissionSchema.index({ assessmentId: 1, studentId: 1 }, { unique: true });
SubmissionSchema.index({ studentId: 1, submittedAt: -1 });
SubmissionSchema.index({ assessmentId: 1, status: 1 });

// Virtual for checking if submission is late
SubmissionSchema.virtual('isLate').get(function() {
  // This will be populated when we have the assessment data
  return false; // Placeholder - will be calculated in business logic
});

export const Submission = mongoose.model<ISubmission>('Submission', SubmissionSchema);