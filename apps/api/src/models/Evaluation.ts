import mongoose, { Document, Schema } from 'mongoose';
import { EvaluationService } from '../services/evaluationService';

export interface IEvaluation extends Document {
  _id: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  facultyId: mongoose.Types.ObjectId;
  externalFacultyId?: mongoose.Types.ObjectId;
  internal: {
    a1: { conduct: number; convert: number }; // 0-20 → 0-10
    a2: { conduct: number; convert: number }; // 0-30 → 0-15
    a3: { conduct: number; convert: number }; // 0-50 → 0-25
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
    min: 0
  },
  convert: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const EvaluationSchema = new Schema<IEvaluation>({
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
    a1: {
      type: EvaluationComponentSchema,
      default: { conduct: 0, convert: 0 }
    },
    a2: {
      type: EvaluationComponentSchema,
      default: { conduct: 0, convert: 0 }
    },
    a3: {
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
EvaluationSchema.pre('save', function(next) {
  try {
    // Calculate all conversions and totals automatically
    const calculated = EvaluationService.calculateScores({
      internal: this.internal,
      external: this.external
    });
    
    // Update the document with calculated values
    this.internal.a1.convert = calculated.internal.a1.convert;
    this.internal.a2.convert = calculated.internal.a2.convert;
    this.internal.a3.convert = calculated.internal.a3.convert;
    this.external.reportPresentation.convert = calculated.external.reportPresentation.convert;
    this.totalInternal = calculated.totalInternal;
    this.totalExternal = calculated.totalExternal;
    this.total = calculated.total;
    
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Set publishedAt when isPublished changes to true
EvaluationSchema.pre('save', function(next) {
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Compound index for performance optimization
EvaluationSchema.index({ groupId: 1, projectId: 1 });
// Additional indexes for performance
EvaluationSchema.index({ facultyId: 1 });
EvaluationSchema.index({ isPublished: 1 });

export const Evaluation = mongoose.model<IEvaluation>('Evaluation', EvaluationSchema);
export default Evaluation;