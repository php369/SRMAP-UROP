import mongoose, { Document, Schema } from 'mongoose';

export interface ICourse extends Document {
  code: string;
  title: string;
  description?: string;
  credits: number;
  facultyId: mongoose.Types.ObjectId;
  cohorts: mongoose.Types.ObjectId[];
  semester: 'Fall' | 'Spring' | 'Summer';
  year: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>({
  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    maxlength: 20,
    unique: true,
    match: /^[A-Z]{2,4}\d{3,4}$/,
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
    maxlength: 1000,
    default: null
  },
  credits: {
    type: Number,
    required: true,
    min: 1,
    max: 6,
    default: 3
  },
  facultyId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  cohorts: [{
    type: Schema.Types.ObjectId,
    ref: 'Cohort'
  }],
  semester: {
    type: String,
    enum: ['Fall', 'Spring', 'Summer'],
    required: true,
    index: true
  },
  year: {
    type: Number,
    required: true,
    min: 2020,
    max: 2030,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
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
CourseSchema.index({ facultyId: 1, isActive: 1 });
CourseSchema.index({ semester: 1, year: 1, isActive: 1 });
CourseSchema.index({ 'cohorts': 1 });

// Virtual for full course identifier
CourseSchema.virtual('fullCode').get(function() {
  return `${this.code} - ${this.title}`;
});

// Virtual for cohort count
CourseSchema.virtual('cohortCount').get(function() {
  return this.cohorts.length;
});

// Static method to find courses by faculty
CourseSchema.statics.findByFaculty = function(facultyId: mongoose.Types.ObjectId, activeOnly: boolean = true) {
  const query: any = { facultyId };
  if (activeOnly) {
    query.isActive = true;
  }
  return this.find(query);
};

// Static method to find courses by cohort
CourseSchema.statics.findByCohort = function(cohortId: mongoose.Types.ObjectId, activeOnly: boolean = true) {
  const query: any = { cohorts: cohortId };
  if (activeOnly) {
    query.isActive = true;
  }
  return this.find(query);
};

// Static method to find current semester courses
CourseSchema.statics.findCurrentSemester = function() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  let semester: 'Fall' | 'Spring' | 'Summer';
  if (currentMonth >= 8 && currentMonth <= 12) {
    semester = 'Fall';
  } else if (currentMonth >= 1 && currentMonth <= 5) {
    semester = 'Spring';
  } else {
    semester = 'Summer';
  }
  
  return this.find({
    year: currentYear,
    semester,
    isActive: true
  });
};

export const Course = mongoose.model<ICourse>('Course', CourseSchema);