import mongoose, { Schema } from 'mongoose';
const warningSchema = new Schema({
    violationId: {
        type: Schema.Types.ObjectId,
        ref: 'Violation',
        required: true,
        index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    warningNumber: { type: Number, enum: [1, 2], required: true },
    issuedAt: { type: Date, default: () => new Date() },
    acknowledged: { type: Boolean, default: false },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
export const Warning = mongoose.model('Warning', warningSchema);
//# sourceMappingURL=Warning.model.js.map