import mongoose, { Document, Schema } from 'mongoose';

export interface ICourse extends Document {
  _id: mongoose.Types.ObjectId;
  code: string;
  name: string;
  credits: number;
  department: string;
  semester: number;
  type: 'IDP' | 'UROP' | 'CAPSTONE';
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>({
  code: {
    type: String,
    required: true,
    unique: true,
    maxlength: 20
  },
  name: {
    type: String,
    required: true,
    maxlength: 200
  },
  credits: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  department: {
    type: String,
    required: true,
    maxlength: 100
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  type: {
    type: String,
    enum: ['IDP', 'UROP', 'CAPSTONE'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true,
  collection: 'courses'
});

// Indexes (code already has unique index from schema definition)
CourseSchema.index({ department: 1, type: 1 });
CourseSchema.index({ semester: 1, type: 1 });

export const Course = mongoose.model<ICourse>('Course', CourseSchema);