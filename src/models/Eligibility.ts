import mongoose, { Document, Schema } from 'mongoose';

export interface IEligibility extends Document {
  _id: mongoose.Types.ObjectId;
  studentEmail: string;
  regNo?: string;
  year: 2 | 3 | 4;
  semester: 3 | 4 | 7 | 8;
  termKind: 'odd' | 'even'; // odd: Jan-May, even: Aug-Dec
  type: 'IDP' | 'UROP' | 'CAPSTONE';
  validFrom: Date;
  validTo: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EligibilitySchema = new Schema<IEligibility>({
  studentEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (email: string) => email.endsWith('@srmap.edu.in'),
      message: 'Student email must be from @srmap.edu.in domain'
    }
  },
  regNo: {
    type: String,
    trim: true,
    uppercase: true
  },
  year: {
    type: Number,
    enum: [2, 3, 4],
    required: true
  },
  semester: {
    type: Number,
    enum: [3, 4, 7, 8],
    required: true
  },
  termKind: {
    type: String,
    enum: ['odd', 'even'],
    required: true
  },
  type: {
    type: String,
    enum: ['IDP', 'UROP', 'CAPSTONE'],
    required: true
  },
  validFrom: {
    type: Date,
    required: true
  },
  validTo: {
    type: Date,
    required: true
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

// Validation to ensure validTo is after validFrom
EligibilitySchema.pre('save', function(next) {
  if (this.validTo <= this.validFrom) {
    next(new Error('validTo must be after validFrom'));
  } else {
    next();
  }
});

// Compound index for performance optimization
EligibilitySchema.index({ 
  studentEmail: 1, 
  type: 1, 
  termKind: 1, 
  year: 1, 
  semester: 1 
});

export const Eligibility = mongoose.model<IEligibility>('Eligibility', EligibilitySchema);
export default Eligibility;