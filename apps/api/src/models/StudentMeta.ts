import mongoose, { Document, Schema } from 'mongoose';

export interface IStudentMeta extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  stream: string; // Required: e.g., "Computer Science", "Information Technology"
  specialization?: string; // Required if semester >= 6
  cgpa?: number; // Optional: 0-10 scale
  updatedAt: Date;
}

const StudentMetaSchema = new Schema<IStudentMeta>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  stream: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: (stream: string) => stream.length >= 2 && stream.length <= 100,
      message: 'Stream must be between 2 and 100 characters'
    }
  },
  specialization: {
    type: String,
    trim: true,
    validate: {
      validator: function(this: IStudentMeta, specialization: string) {
        // If specialization is provided, it should be between 2 and 100 characters
        if (specialization && (specialization.length < 2 || specialization.length > 100)) {
          return false;
        }
        return true;
      },
      message: 'Specialization must be between 2 and 100 characters'
    }
  },
  cgpa: {
    type: Number,
    min: [0, 'CGPA cannot be negative'],
    max: [10, 'CGPA cannot exceed 10'],
    validate: {
      validator: (cgpa: number) => {
        // Allow up to 2 decimal places
        return Number.isInteger(cgpa * 100);
      },
      message: 'CGPA can have at most 2 decimal places'
    }
  }
}, {
  timestamps: { createdAt: false, updatedAt: true },
  toJSON: {
    transform: (_doc: any, ret: any) => {
      delete ret.__v;
      return ret;
    }
  }
});

// Index for efficient queries (userId already has unique index from schema definition)

export const StudentMeta = mongoose.model<IStudentMeta>('StudentMeta', StudentMetaSchema);
export default StudentMeta;