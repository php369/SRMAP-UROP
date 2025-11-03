import mongoose, { Document, Schema } from 'mongoose';

export interface ICohort extends Document {
  name: string;
  year: number;
  department: string;
  students: mongoose.Types.ObjectId[];
  faculty: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const CohortSchema = new Schema<ICohort>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    unique: true
  },
  year: {
    type: Number,
    required: true,
    min: 2020,
    max: 2030,
    index: true
  },
  department: {
    type: String,
    required: true,
    trim: true,
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
    ],
    index: true
  },
  students: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  faculty: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
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
CohortSchema.index({ department: 1, year: 1 });
CohortSchema.index({ 'students': 1 });
CohortSchema.index({ 'faculty': 1 });

// Virtual for student count
CohortSchema.virtual('studentCount').get(function() {
  return this.students.length;
});

// Virtual for faculty count
CohortSchema.virtual('facultyCount').get(function() {
  return this.faculty.length;
});

// Static method to find cohorts by student
CohortSchema.statics.findByStudent = function(studentId: mongoose.Types.ObjectId) {
  return this.find({ students: studentId });
};

// Static method to find cohorts by faculty
CohortSchema.statics.findByFaculty = function(facultyId: mongoose.Types.ObjectId) {
  return this.find({ faculty: facultyId });
};

export const Cohort = mongoose.model<ICohort>('Cohort', CohortSchema);