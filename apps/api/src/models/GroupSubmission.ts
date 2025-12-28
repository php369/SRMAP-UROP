import mongoose, { Document, Schema } from 'mongoose';

export interface IGroupSubmission extends Document {
  _id: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  githubUrl: string; // Required GitHub repository URL
  reportFile?: {
    url: string;
    name: string;
    size: number;
    contentType: string;
    cloudinaryId?: string;
    storagePath?: string;
  };
  presentationFile?: {
    url: string;
    name: string;
    size: number;
    contentType: string;
    cloudinaryId?: string;
    storagePath?: string;
  };
  presentationUrl?: string; // Optional presentation URL (alternative to file)
  comments?: string; // Optional comments from the group
  submittedAt: Date;
  submittedBy: mongoose.Types.ObjectId; // Which group member submitted
  status: 'submitted';
  metadata: {
    ipAddress: string;
    userAgent: string;
    totalFileSize: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const FileSchema = new Schema({
  url: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  size: {
    type: Number,
    required: true,
    min: 0,
    max: 50 * 1024 * 1024 // 50MB limit
  },
  contentType: {
    type: String,
    required: true
  },
  cloudinaryId: {
    type: String,
    default: null
  },
  storagePath: {
    type: String,
    default: null
  }
}, { _id: false });

const GroupSubmissionSchema = new Schema({
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    unique: true, // One submission per group
    index: true
  },
  githubUrl: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: (url: string) => {
        // Validate GitHub URL format
        const githubUrlPattern = /^https:\/\/github\.com\/[\w\-\.]+\/[\w\-\.]+\/?$/;
        return githubUrlPattern.test(url);
      },
      message: 'Must be a valid GitHub repository URL (https://github.com/username/repository)'
    }
  },
  reportFile: {
    type: FileSchema,
    default: null
  },
  presentationFile: {
    type: FileSchema,
    default: null
  },
  presentationUrl: {
    type: String,
    default: null,
    trim: true,
    validate: {
      validator: function(url: string) {
        if (!url) return true; // Optional field
        // Allow common presentation platforms
        const urlPattern = /^https:\/\/(docs\.google\.com|www\.canva\.com|prezi\.com|slides\.com|www\.slideshare\.net)/;
        return urlPattern.test(url);
      },
      message: 'Presentation URL must be from supported platforms (Google Slides, Canva, Prezi, etc.)'
    }
  },
  comments: {
    type: String,
    maxlength: 1000,
    default: null,
    trim: true
  },
  submittedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  submittedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['submitted'],
    default: 'submitted',
    required: true
  },
  metadata: {
    ipAddress: {
      type: String,
      required: true
    },
    userAgent: {
      type: String,
      required: true
    },
    totalFileSize: {
      type: Number,
      required: true,
      min: 0
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

// Validation: Must have either presentationFile OR presentationUrl (not both)
GroupSubmissionSchema.pre('save', function(next) {
  const hasPresentationFile = !!this.presentationFile;
  const hasPresentationUrl = !!this.presentationUrl;
  
  if (hasPresentationFile && hasPresentationUrl) {
    return next(new Error('Cannot have both presentation file and presentation URL. Choose one.'));
  }

  // Validate report file if present
  if (this.reportFile) {
    if (this.reportFile.contentType !== 'application/pdf') {
      return next(new Error('Report must be a PDF file'));
    }
    if (this.reportFile.size > 50 * 1024 * 1024) {
      return next(new Error('Report file must be under 50MB'));
    }
  }

  // Validate presentation file if present
  if (this.presentationFile) {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    if (!allowedTypes.includes(this.presentationFile.contentType)) {
      return next(new Error('Presentation must be PDF, PPT, or PPTX'));
    }
    if (this.presentationFile.size > 50 * 1024 * 1024) {
      return next(new Error('Presentation file must be under 50MB'));
    }
  }

  next();
});

// Calculate total file size before saving
GroupSubmissionSchema.pre('save', function(next) {
  let totalSize = 0;
  if (this.reportFile) totalSize += this.reportFile.size;
  if (this.presentationFile) totalSize += this.presentationFile.size;
  this.metadata.totalFileSize = totalSize;
  next();
});

// Indexes for performance
GroupSubmissionSchema.index({ submittedAt: -1 });
GroupSubmissionSchema.index({ submittedBy: 1 });

export const GroupSubmission = mongoose.model<IGroupSubmission>('GroupSubmission', GroupSubmissionSchema);
export default GroupSubmission;