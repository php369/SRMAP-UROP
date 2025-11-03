import mongoose, { Document, Schema } from 'mongoose';

export interface RubricCriteria {
  criteria: string;
  points: number;
  maxPoints: number;
  feedback?: string;
}

export interface GradeHistory {
  gradedAt: Date;
  score: number;
  maxScore: number;
  comments: string;
  facultyId: mongoose.Types.ObjectId;
}

export interface IGrade extends Document {
  submissionId: mongoose.Types.ObjectId;
  facultyId: mongoose.Types.ObjectId;
  score: number;
  maxScore: number;
  rubric?: RubricCriteria[];
  comments: string;
  gradedAt: Date;
  history: GradeHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const RubricCriteriaSchema = new Schema({
  criteria: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  points: {
    type: Number,
    required: true,
    min: 0
  },
  maxPoints: {
    type: Number,
    required: true,
    min: 0
  },
  feedback: {
    type: String,
    maxlength: 500,
    default: ''
  }
}, { _id: false });

const GradeHistorySchema = new Schema({
  gradedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  score: {
    type: Number,
    required: true,
    min: 0
  },
  maxScore: {
    type: Number,
    required: true,
    min: 0
  },
  comments: {
    type: String,
    maxlength: 1000,
    default: ''
  },
  facultyId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { _id: false });

const GradeSchema = new Schema<IGrade>({
  submissionId: {
    type: Schema.Types.ObjectId,
    ref: 'Submission',
    required: true,
    unique: true,
    index: true
  },
  facultyId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(this: IGrade, score: number) {
        return score <= this.maxScore;
      },
      message: 'Score cannot exceed maximum score'
    }
  },
  maxScore: {
    type: Number,
    required: true,
    min: 0,
    default: 100
  },
  rubric: {
    type: [RubricCriteriaSchema],
    default: []
  },
  comments: {
    type: String,
    maxlength: 1000,
    default: ''
  },
  gradedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  history: {
    type: [GradeHistorySchema],
    default: []
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

// Indexes for efficient queries
GradeSchema.index({ facultyId: 1, gradedAt: -1 });
GradeSchema.index({ score: 1 });

// Virtual for percentage calculation
GradeSchema.virtual('percentage').get(function() {
  return this.maxScore > 0 ? Math.round((this.score / this.maxScore) * 100) : 0;
});

// Virtual for letter grade (basic implementation)
GradeSchema.virtual('letterGrade').get(function() {
  const percentage = this.maxScore > 0 ? Math.round((this.score / this.maxScore) * 100) : 0;
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
});

// Pre-save middleware to add to history
GradeSchema.pre('save', function(next) {
  if (this.isModified('score') || this.isModified('comments')) {
    this.history.push({
      gradedAt: new Date(),
      score: this.score,
      maxScore: this.maxScore,
      comments: this.comments,
      facultyId: this.facultyId
    });
  }
  next();
});

export const Grade = mongoose.model<IGrade>('Grade', GradeSchema);