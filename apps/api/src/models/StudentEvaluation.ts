import mongoose, { Document, Schema } from 'mongoose';

export interface IStudentEvaluation extends Document {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  facultyId: mongoose.Types.ObjectId;
  externalFacultyId?: mongoose.Types.ObjectId;
  internal: {
    cla1: { conduct: number; convert: number }; // 0-20 → 0-10
    cla2: { conduct: number; convert: number }; // 0-30 → 0-15
    cla3: { conduct: number; convert: number }; // 0-50 → 0-25
  };
  external: {
    reportPresentation: { conduct: number; convert: number }; // 0-100 → 0-50
  };
  totalInternal: number;
  totalExternal: number;
  total: number;
  isPublished: boolean;
  publishedAt?: Date;
  publishedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EvaluationComponentSchema = new Schema({
  conduct: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  convert: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  }
}, { _id: false });

const StudentEvaluationSchema = new Schema<IStudentEvaluation>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
    ref: 'User',
    required: true
  },
  externalFacultyId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  internal: {
    cla1: {
      type: EvaluationComponentSchema,
      default: { conduct: 0, convert: 0 }
    },
    cla2: {
      type: EvaluationComponentSchema,
      default: { conduct: 0, convert: 0 }
    },
    cla3: {
      type: EvaluationComponentSchema,
      default: { conduct: 0, convert: 0 }
    }
  },
  external: {
    reportPresentation: {
      type: EvaluationComponentSchema,
      default: { conduct: 0, convert: 0 }
    }
  },
  totalInternal: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  totalExternal: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  isPublished: {
    type: Boolean,
    required: true,
    default: false
  },
  publishedAt: {
    type: Date
  },
  publishedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
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

// Automatic score conversion and totals calculation
StudentEvaluationSchema.pre('save', function(next) {
  try {
    // Calculate conversions using the same logic as group evaluations
    this.internal.cla1.convert = Math.min(10, Math.round(this.internal.cla1.conduct * 10 / 20));
    this.internal.cla2.convert = Math.min(15, Math.round(this.internal.cla2.conduct * 15 / 30));
    this.internal.cla3.convert = Math.min(25, Math.round(this.internal.cla3.conduct * 25 / 50));
    this.external.reportPresentation.convert = Math.min(50, Math.round(this.external.reportPresentation.conduct * 50 / 100));
    
    // Calculate totals
    this.totalInternal = this.internal.cla1.convert + this.internal.cla2.convert + this.internal.cla3.convert;
    this.totalExternal = this.external.reportPresentation.convert;
    this.total = this.totalInternal + this.totalExternal;
    
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Set publishedAt when isPublished changes to true
StudentEvaluationSchema.pre('save', function(next) {
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Compound indexes for performance optimization
StudentEvaluationSchema.index({ studentId: 1, groupId: 1, projectId: 1 }, { unique: true });
StudentEvaluationSchema.index({ facultyId: 1 });
StudentEvaluationSchema.index({ externalFacultyId: 1 });
StudentEvaluationSchema.index({ groupId: 1 });
StudentEvaluationSchema.index({ isPublished: 1 });

export const StudentEvaluation = mongoose.model<IStudentEvaluation>('StudentEvaluation', StudentEvaluationSchema);
export default StudentEvaluation;