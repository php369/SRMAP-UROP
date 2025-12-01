import mongoose, { Document, Schema } from 'mongoose';

export interface IAssessment extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  type: 'IDP' | 'UROP' | 'CAPSTONE';
  dueDate: Date;
  facultyId: mongoose.Types.ObjectId;
  cohortIds: mongoose.Types.ObjectId[];
  status: 'draft' | 'published' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

const AssessmentSchema = new Schema<IAssessment>({
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: ['IDP', 'UROP', 'CAPSTONE'],
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  facultyId: {
    type: Schema.Types.ObjectId,
    ref: 'FacultyRoster',
    required: true
  },
  cohortIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Cohort'
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  }
}, {
  timestamps: true,
  collection: 'assessments'
});

// Indexes
AssessmentSchema.index({ facultyId: 1, status: 1 });
AssessmentSchema.index({ type: 1, status: 1 });
AssessmentSchema.index({ dueDate: 1 });

export const Assessment = mongoose.model<IAssessment>('Assessment', AssessmentSchema);