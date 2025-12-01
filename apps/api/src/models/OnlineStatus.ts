import mongoose, { Document, Schema } from 'mongoose';

export interface IOnlineStatus extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    isOnline: boolean;
    lastSeen: Date;
    socketId?: string;
    updatedAt: Date;
}

const OnlineStatusSchema = new Schema<IOnlineStatus>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    isOnline: {
        type: Boolean,
        required: true,
        default: false
    },
    lastSeen: {
        type: Date,
        required: true,
        default: Date.now
    },
    socketId: {
        type: String,
        trim: true
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

// Indexes for performance
OnlineStatusSchema.index({ userId: 1 });
OnlineStatusSchema.index({ isOnline: 1, lastSeen: -1 });

export const OnlineStatus = mongoose.model<IOnlineStatus>('OnlineStatus', OnlineStatusSchema);
export default OnlineStatus;
