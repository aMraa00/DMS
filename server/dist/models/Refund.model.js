import mongoose, { Schema } from 'mongoose';
const refundSchema = new Schema({
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true, index: true },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    requestedAt: { type: Date, default: () => new Date() },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        index: true,
    },
    processedAt: { type: Date },
}, { timestamps: true });
export const Refund = mongoose.model('Refund', refundSchema);
//# sourceMappingURL=Refund.model.js.map