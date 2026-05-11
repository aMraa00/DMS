import mongoose, { Schema } from 'mongoose';
const storageRequestSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    description: { type: String, required: true },
    summerPeriodLabel: { type: String },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'stored', 'returned'],
        default: 'pending',
        index: true,
    },
}, { timestamps: true });
export const StorageRequest = mongoose.model('StorageRequest', storageRequestSchema);
//# sourceMappingURL=StorageRequest.model.js.map