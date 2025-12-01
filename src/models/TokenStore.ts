import mongoose, { Document, Schema } from 'mongoose';

export interface ITokenStore extends Document {
  facultyId: mongoose.Types.ObjectId;
  provider: 'google';
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scopes: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TokenStoreSchema = new Schema<ITokenStore>({
  facultyId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: String,
    enum: ['google'],
    required: true,
    default: 'google'
  },
  accessToken: {
    type: String,
    required: true,
    select: false // Don't include in queries by default for security
  },
  refreshToken: {
    type: String,
    required: true,
    select: false // Don't include in queries by default for security
  },
  expiresAt: {
    type: Date,
    required: true
  },
  scopes: [{
    type: String,
    required: true
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: (_doc: any, ret: any) => {
      delete ret.__v;
      delete ret.accessToken;
      delete ret.refreshToken;
      return ret;
    }
  }
});

// Compound index for efficient token lookup
TokenStoreSchema.index({ facultyId: 1, provider: 1 }, { unique: true });

// Index for token expiration cleanup
TokenStoreSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual to check if token is expired
TokenStoreSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

// Static method to find valid token for faculty
TokenStoreSchema.statics.findValidToken = function(facultyId: mongoose.Types.ObjectId, provider: string = 'google') {
  return this.findOne({
    facultyId,
    provider,
    expiresAt: { $gt: new Date() }
  }).select('+accessToken +refreshToken');
};

// Static method to cleanup expired tokens
TokenStoreSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

export const TokenStore = mongoose.model<ITokenStore>('TokenStore', TokenStoreSchema);