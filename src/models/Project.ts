import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: string; // Unique identifier
  title: string;
  brief: string;
  description?: string;
  type: 'IDP' | 'UROP' | 'CAPSTONE';
  department: string;
  prerequisites?: string;
  facultyId: mongoose.Types.ObjectId;
  facultyName: string; // Denormalized for performance
  facultyIdNumber: string; // Faculty ID for display
  capacity?: number;
  status: 'draft' | 'published' | 'frozen' | 'assigned';
  assignedTo?: mongoose.Types.ObjectId; // Group or Student ID
  isFrozen: boolean;
  semester: string; // e.g., "Fall 2025"
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>({
  projectId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  brief: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: ['IDP', 'UROP', 'CAPSTONE'],
    required: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  prerequisites: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  facultyId: {
    type: Schema.Types.ObjectId,
    ref: 'FacultyRoster',
    required: true
  },
  facultyName: {
    type: String,
    required: true,
    trim: true
  },
  facultyIdNumber: {
    type: String,
    required: true,
    trim: true
  },
  capacity: {
    type: Number,
    min: 1,
    max: 10,
    default: 1
  },
  semester: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'frozen', 'assigned'],
    required: true,
    default: 'draft'
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'Group'
  },
  isFrozen: {
    type: Boolean,
    default: false
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

// Compound index for performance optimization
ProjectSchema.index({ status: 1, type: 1, department: 1 });
// Additional indexes for common queries
ProjectSchema.index({ facultyId: 1, status: 1 });
ProjectSchema.index({ type: 1 });
ProjectSchema.index({ projectId: 1 });
ProjectSchema.index({ assignedTo: 1 });

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
export default Project;