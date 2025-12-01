import mongoose, { Document, Schema } from 'mongoose';

export interface IAvatarPool extends Document {
    _id: mongoose.Types.ObjectId;
    avatarId: string;
    avatarUrl: string;
    category: string;
    isActive: boolean;
}

const AvatarPoolSchema = new Schema<IAvatarPool>({
    avatarId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    avatarUrl: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    isActive: {
        type: Boolean,
        required: true,
        default: true
    }
}, {
    timestamps: false,
    toJSON: {
        transform: (_doc: any, ret: any) => {
            delete ret.__v;
            return ret;
        }
    }
});

// Indexes for performance
AvatarPoolSchema.index({ avatarId: 1 });
AvatarPoolSchema.index({ isActive: 1 });
AvatarPoolSchema.index({ category: 1 });

export const AvatarPool = mongoose.model<IAvatarPool>('AvatarPool', AvatarPoolSchema);
export default AvatarPool;
