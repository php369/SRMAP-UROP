import mongoose, { Document, Schema } from 'mongoose';

export interface IGroup extends Document {
  _id: mongoose.Types.ObjectId;
  code: string; // 6-char A-Z + 2-9 (no O/0 I/1 S/5)
  type: 'IDP' | 'UROP' | 'CAPSTONE';
  memberIds: mongoose.Types.ObjectId[]; // 1-4 students
  projectId?: mongoose.Types.ObjectId;
  facultyId?: mongoose.Types.ObjectId;
  meetUrl?: string;
  calendarEventId?: string;
  status: 'forming' | 'applied' | 'approved' | 'rejected' | 'frozen';
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>({
  code: {
    type: String,
    required: true,
    unique: true,
    length: 6,
    uppercase: true,
    validate: {
      validator: (code: string) => {
        // Validate 6-char code using A-Z + 2-9 (excluding O/0, I/1, S/5)
        const validChars = /^[ABCDEFGHJKLMNPQRTUVWXYZ23456789]{6}$/;
        return validChars.test(code);
      },
      message: 'Code must be 6 characters using A-Z and 2-9 (excluding O/0, I/1, S/5)'
    }
  },
  type: {
    type: String,
    enum: ['IDP', 'UROP', 'CAPSTONE'],
    required: true
  },
  memberIds: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
  },
  facultyId: {
    type: Schema.Types.ObjectId,
    ref: 'FacultyRoster'
  },
  meetUrl: {
    type: String,
    validate: {
      validator: (url: string) => !url || url.startsWith('https://meet.google.com/'),
      message: 'Meet URL must be a valid Google Meet link'
    }
  },
  calendarEventId: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['forming', 'applied', 'approved', 'rejected', 'frozen'],
    required: true,
    default: 'forming'
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

// Validation for member count (1-4 students)
GroupSchema.pre('save', function(next) {
  if (this.memberIds.length < 1 || this.memberIds.length > 4) {
    next(new Error('Group must have between 1 and 4 members'));
  } else {
    next();
  }
});

// Unique index on code (already defined in schema)
// Additional indexes for performance
GroupSchema.index({ type: 1 });
GroupSchema.index({ status: 1 });
GroupSchema.index({ memberIds: 1 });

export const Group = mongoose.model<IGroup>('Group', GroupSchema);
export default Group;