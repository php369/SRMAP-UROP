import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: 'student' | 'faculty' | 'coordinator' | 'admin';
  type: 'APPLICATION_SUBMITTED' | 'APPLICATION_APPROVED' | 'APPLICATION_REJECTED' | 
        'PROJECT_FROZEN' | 'MEETING_APPROVAL_REQUIRED' | 'MEETING_APPROVED' | 
        'MEETING_REJECTED' | 'GRADES_PUBLISHED' | 'GRADES_UNPUBLISHED' |
        'EXTERNAL_ASSIGNED' | 'GROUP_OVERRIDE' | 'SYSTEM' | 'SUBMISSION' | 'ASSESSMENT';
  title: string;
  message: string;
  data: Record<string, any>; // JSON data for deep linking
  read: boolean;
  targetGroupId?: mongoose.Types.ObjectId;
  targetProjectId?: mongoose.Types.ObjectId;
  actorId?: mongoose.Types.ObjectId; // Who triggered the notification
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'faculty', 'coordinator', 'admin'],
    required: true
  },
  type: {
    type: String,
    enum: [
      'APPLICATION_SUBMITTED',
      'APPLICATION_APPROVED', 
      'APPLICATION_REJECTED',
      'PROJECT_FROZEN',
      'MEETING_APPROVAL_REQUIRED',
      'MEETING_APPROVED',
      'MEETING_REJECTED',
      'GRADES_PUBLISHED',
      'GRADES_UNPUBLISHED',
      'EXTERNAL_ASSIGNED',
      'GROUP_OVERRIDE',
      'SYSTEM',
      'SUBMISSION',
      'ASSESSMENT'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  data: {
    type: Schema.Types.Mixed,
    default: {}
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  targetGroupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: false
  },
  targetProjectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: false
  },
  actorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false, // We're using createdAt manually
  collection: 'notifications'
});

// Compound indexes for efficient queries
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, createdAt: -1 });
NotificationSchema.index({ targetGroupId: 1, createdAt: -1 });
NotificationSchema.index({ targetProjectId: 1, createdAt: -1 });

// Virtual for notification age
NotificationSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Method to mark as read
NotificationSchema.methods.markAsRead = function() {
  this.read = true;
  return this.save();
};

// Static method to mark multiple notifications as read
NotificationSchema.statics.markAllAsRead = function(userId: string) {
  return this.updateMany(
    { userId: new mongoose.Types.ObjectId(userId), read: false },
    { read: true }
  );
};

// Static method to get unread count
NotificationSchema.statics.getUnreadCount = function(userId: string) {
  return this.countDocuments({
    userId: new mongoose.Types.ObjectId(userId),
    read: false
  });
};

// Static method to get paginated notifications
NotificationSchema.statics.getPaginated = function(
  userId: string, 
  options: {
    page?: number;
    limit?: number;
    read?: boolean;
    type?: string;
  } = {}
) {
  const {
    page = 1,
    limit = 20,
    read,
    type
  } = options;

  const query: any = { userId: new mongoose.Types.ObjectId(userId) };
  
  if (read !== undefined) {
    query.read = read;
  }
  
  if (type) {
    query.type = type;
  }

  const skip = (page - 1) * limit;

  return Promise.all([
    this.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actorId', 'name email')
      .populate('targetGroupId', 'code')
      .populate('targetProjectId', 'title')
      .lean(),
    this.countDocuments(query)
  ]).then(([notifications, total]) => ({
    notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  }));
};

// Pre-save middleware to ensure data consistency
NotificationSchema.pre('save', function(next) {
  // Ensure createdAt is set
  if (!this.createdAt) {
    this.createdAt = new Date();
  }
  
  // Validate data field
  if (this.data && typeof this.data !== 'object') {
    this.data = {};
  }
  
  next();
});

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);