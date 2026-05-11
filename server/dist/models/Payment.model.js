import mongoose, { Schema } from 'mongoose';
const paymentSchema = new Schema({
    contractId: { type: Schema.Types.ObjectId, ref: 'Contract', index: true },
    applicationId: {
        type: Schema.Types.ObjectId,
        ref: 'RoomApplication',
        index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true },
    paidAt: { type: Date },
    type: { type: String, enum: ['FULL', 'HALF', 'SUMMER'], required: true },
    status: {
        type: String,
        enum: ['paid', 'pending', 'failed'],
        default: 'pending',
        index: true,
    },
    penalty: { type: Number, default: 0 },
    transactionId: { type: String },
    method: {
        type: String,
        enum: ['QPay', 'BankTransfer', 'Card'],
        default: 'QPay',
    },
    qpayInvoiceId: { type: String, index: true, sparse: true },
    qpayPaymentId: { type: String, sparse: true },
    qrText: { type: String },
    qrImage: { type: String },
    qpayShortUrl: { type: String },
    qpayDeeplinks: { type: Schema.Types.Mixed },
}, { timestamps: true });
export const Payment = mongoose.model('Payment', paymentSchema);
//# sourceMappingURL=Payment.model.js.map