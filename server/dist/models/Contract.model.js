import mongoose, { Schema } from 'mongoose';
const contractSchema = new Schema({
    contractNumber: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isHalfYear: { type: Boolean, default: false },
    signedAt: { type: Date },
    eSignature: { type: String },
    status: {
        type: String,
        enum: ['pending_sign', 'active', 'cancelled', 'expired'],
        default: 'pending_sign',
        index: true,
    },
    signDeadlineAt: { type: Date },
    cancelledAt: { type: Date },
    cancelReason: { type: String },
}, { timestamps: true });
export const Contract = mongoose.model('Contract', contractSchema);
//# sourceMappingURL=Contract.model.js.map