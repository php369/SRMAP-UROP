import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  googleId: string;
  name: string;
  email: string;
  role: 'student' | 'faculty' | 'admin';
  avatar?: string; // Selected from predefined pool
  studentId?: string; // Unique identifier for students
  facultyId?: string; // Unique identifier for faculty
  isCoordinator?: boolean; // For faculty members (coordinator is also a faculty)
  isExternalEvaluator?: boolean; // For faculty members serving as external evaluators
  profile: {
    department?: string;
    year?: number;
    semester?: number; // Current semester (1-8)
    specialization?: string; // For 6th sem onwards
  };
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  googleId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: (email: string) => email.endsWith('@srmap.edu.in'),
      message: 'Email must be from @srmap.edu.in domain'
    }
  },
  role: {
    type: String,
    enum: ['student', 'faculty', 'admin'],
    required: true,
    default: 'student'
  },
  avatar: {
    type: String,
    default: null
  },
  studentId: {
    type: String,
    sparse: true,
    unique: true,
    trim: true
  },
  facultyId: {
    type: String,
    sparse: true,
    unique: true,
    trim: true
  },
  isCoordinator: {
    type: Boolean,
    default: false
  },
  isExternalEvaluator: {
    type: Boolean,
    default: false
  },
  profile: {
    department: {
      type: String,
      trim: true
    },
    year: {
      type: Number,
      min: 1,
      max: 4
    },
    semester: {
      type: Number,
      min: 1,
      max: 8
    },
    specialization: {
      type: String,
      trim: true
    }
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    notifications: {
      type: Boolean,
      default: true
    }
  },
  lastSeen: {
    type: Date,
    default: Date.now
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

// Indexes for performance (email already has unique index)
UserSchema.index({ role: 1, isCoordinator: 1 });
UserSchema.index({ 'profile.department': 1 });
UserSchema.index({ lastSeen: -1 });

export const User = mongoose.model<IUser>('User', UserSchema);
export default User;
