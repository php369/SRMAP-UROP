import mongoose, { Document, Schema } from 'mongoose';

export interface IAssessment extends Document {
  _id: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  facultyId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  dueAt: Date;
  meetUrl?: string;
  calendarEventId?: string;
  visibility: {
    cohortIds: mongoose.Types.ObjectId[];
    courseIds: mongoose.Types.ObjectId[];
  };
  settings: {
    allowLateSubmissions: boolean;
    maxFileSize: number;
    allowedFileTypes: string[];
  };
  status: 'draft' | 'published' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

const AssessmentSchema = new Schema<IAssessment>({
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  facultyId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  dueAt: {
    type: Date,
    required: true,
    index: true
  },
  meetUrl: {
    type: String,
    default: null
  },
  calendarEventId: {
    type: String,
    default: null
  },
  visibility: {
    cohortIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Cohort'
    }],
    courseIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Course'
    }]
  },
  settings: {
    allowLateSubmissions: {
      type: Boolean,
      default: false
    },
    maxFileSize: {
      type: Number,
      default: 10 * 1024 * 1024, // 10MB default
      min: 1024, // 1KB minimum
      max: 100 * 1024 * 1024 // 100MB maximum
    },
    allowedFileTypes: [{
      type: String,
      enum: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'zip', 'rar']
    }]
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'closed'],
    default: 'draft',
    index: true
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
AssessmentSchema.index({ facultyId: 1, status: 1 });
AssessmentSchema.index({ dueAt: 1, status: 1 });
AssessmentSchema.index({ 'visibility.cohortIds': 1, status: 1 });
AssessmentSchema.index({ 'visibility.courseIds': 1, status: 1 });

// Virtual for checking if assessment is overdue
AssessmentSchema.virtual('isOverdue').get(function() {
  return this.dueAt < new Date() && this.status === 'published';
});

export const Assessment = mongoose.model<IAssessment>('Assessment', AssessmentSchema);