import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  googleId: string;
  name: string;
  email: string;
  role: 'idp-student' | 'urop-student' | 'capstone-student' | 'faculty' | 'admin';
  studentId?: string; // Unique identifier for students
  facultyId?: string; // Unique identifier for faculty
  department?: string; // Department for all users
  isCoordinator?: boolean; // For faculty members (coordinator is also a faculty)
  isExternalEvaluator?: boolean; // For faculty members serving as external evaluators
  currentGroupId?: mongoose.Types.ObjectId; // Direct link to user's current group
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    emailNotifications?: boolean;
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
    enum: ['idp-student', 'urop-student', 'capstone-student', 'faculty', 'admin'],
    required: true,
    default: 'idp-student'
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
  department: {
    type: String,
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
  currentGroupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group'
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
    },
    emailNotifications: {
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
UserSchema.index({ department: 1 });
UserSchema.index({ lastSeen: -1 });

export const User = mongoose.model<IUser>('User', UserSchema);
export default User;
