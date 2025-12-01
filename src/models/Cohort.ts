import mongoose, { Document, Schema } from 'mongoose';

export interface ICohort extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  year: number;
  department: string;
  members: mongoose.Types.ObjectId[]; // References to User model
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const CohortSchema = new Schema<ICohort>({
  name: {
    type: String,
    required: true,
    unique: true,
    maxlength: 100
  },
  year: {
    type: Number,
    required: true,
    min: 2020,
    max: 2030
  },
  department: {
    type: String,
    required: true,
    enum: [
      'Computer Science',
      'Information Technology',
      'Electronics and Communication',
      'Mechanical Engineering',
      'Civil Engineering',
      'Electrical Engineering',
      'Chemical Engineering',
      'Biotechnology',
      'Management Studies',
      'Liberal Arts'
    ]
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true,
  collection: 'cohorts'
});

// Indexes
CohortSchema.index({ year: 1, department: 1 });
CohortSchema.index({ status: 1 });

export const Cohort = mongoose.model<ICohort>('Cohort', CohortSchema);