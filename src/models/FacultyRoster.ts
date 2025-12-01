import mongoose, { Document, Schema } from 'mongoose';

export interface IFacultyRoster extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  name: string;
  dept: string;
  isCoordinator: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FacultyRosterSchema = new Schema<IFacultyRoster>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (email: string) => email.endsWith('@srmap.edu.in'),
      message: 'Faculty email must be from @srmap.edu.in domain'
    }
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  dept: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  isCoordinator: {
    type: Boolean,
    required: true,
    default: false
  },
  active: {
    type: Boolean,
    required: true,
    default: true
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

// Unique index on email (already defined in schema, but explicitly adding for clarity)
// Additional indexes for performance
FacultyRosterSchema.index({ active: 1 });
FacultyRosterSchema.index({ isCoordinator: 1 });

export const FacultyRoster = mongoose.model<IFacultyRoster>('FacultyRoster', FacultyRosterSchema);
export default FacultyRoster;