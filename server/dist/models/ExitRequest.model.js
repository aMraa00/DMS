import mongoose, { Schema } from 'mongoose';
const exitRequestSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    requestedExitDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        index: true,
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    adminNote: { type: String },
    reviewedAt: { type: Date },
}, { timestamps: true });
export const ExitRequest = mongoose.model('ExitRequest', exitRequestSchema);
//# sourceMappingURL=ExitRequest.model.js.map