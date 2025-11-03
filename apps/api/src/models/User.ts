import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  googleId: string;
  name: string;
  email: string;
  role: 'student' | 'faculty' | 'admin';
  avatarUrl?: string;
  profile: {
    department?: string;
    year?: number;
    skills?: string[];
    bio?: string;
  };
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
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
  avatarUrl: {
    type: String,
    default: null
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
    skills: [{
      type: String,
      trim: true
    }],
    bio: {
      type: String,
      maxlength: 500
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
UserSchema.index({ role: 1 });
UserSchema.index({ 'profile.department': 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
export default User;
 