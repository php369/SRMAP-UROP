import mongoose, { Document, Schema } from 'mongoose';

export interface IGroup extends Document {
  _id: mongoose.Types.ObjectId;
  groupId: string; // Unique identifier
  groupNumber?: number; // Sequential group number assigned when approved
  groupCode: string; // 6-char alphanumeric
  groupName?: string;
  description?: string; // Group description
  avatarUrl?: string; // Group avatar/image URL
  leaderId: mongoose.Types.ObjectId; // Student who created the group
  members: mongoose.Types.ObjectId[]; // 2-4 students
  projectType: 'IDP' | 'UROP' | 'CAPSTONE';
  semester: string;
  year: number;
  status: 'forming' | 'complete' | 'applied' | 'approved' | 'frozen';
  assignedProjectId?: mongoose.Types.ObjectId;
  assignedFacultyId?: mongoose.Types.ObjectId;
  externalEvaluatorId?: mongoose.Types.ObjectId;
  // Aliases for compatibility
  projectId?: mongoose.Types.ObjectId;
  facultyId?: mongoose.Types.ObjectId;
  code?: string;
  memberIds?: mongoose.Types.ObjectId[];
  meetUrl?: string;
  calendarEventId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>({
  groupId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  groupNumber: {
    type: Number,
    sparse: true, // Allow multiple null values but unique non-null values
    unique: true
  },
  groupCode: {
    type: String,
    required: true,
    unique: true,
    length: 6,
    uppercase: true,
    validate: {
      validator: (code: string) => {
        // Validate 6-char alphanumeric code
        const validChars = /^[A-Z0-9]{6}$/;
        return validChars.test(code);
      },
      message: 'Code must be 6 alphanumeric characters'
    }
  },
  groupName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  avatarUrl: {
    type: String,
    trim: true
  },
  leaderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  projectType: {
    type: String,
    enum: ['IDP', 'UROP', 'CAPSTONE'],
    required: true
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
    enum: ['forming', 'complete', 'applied', 'approved', 'frozen'],
    required: true,
    default: 'forming'
  },
  assignedProjectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
  },
  assignedFacultyId: {
    type: Schema.Types.ObjectId,
    ref: 'FacultyRoster'
  },
  externalEvaluatorId: {
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

// Indexes for performance optimization
GroupSchema.index({ leaderId: 1 }); // Find groups by leader
GroupSchema.index({ members: 1 }); // Find groups by member
GroupSchema.index({ projectType: 1, semester: 1 }); // Groups by type and semester
GroupSchema.index({ createdAt: -1 }); // Recent groups

// Validation for member count (1-4 students, allowing solo students)
GroupSchema.pre('save', function (next) {
  if (this.members.length < 1 || this.members.length > 4) {
    next(new Error('Group must have between 1 and 4 members'));
  } else {
    next();
  }
});

// Virtual properties for compatibility
GroupSchema.virtual('projectId').get(function() {
  return this.assignedProjectId;
});

GroupSchema.virtual('facultyId').get(function() {
  return this.assignedFacultyId;
});

GroupSchema.virtual('code').get(function() {
  return this.groupCode;
});

GroupSchema.virtual('memberIds').get(function() {
  return this.members;
});

// Additional indexes for performance
GroupSchema.index({ status: 1, projectType: 1 });
GroupSchema.index({ groupId: 1 });

export const Group = mongoose.model<IGroup>('Group', GroupSchema);
export default Group;