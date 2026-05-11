import mongoose, { Schema } from 'mongoose';
const violationSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    contractId: { type: Schema.Types.ObjectId, ref: 'Contract' },
    type: { type: String, enum: ['WARN', 'CANCEL'], required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    violatedAt: { type: Date, default: () => new Date() },
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
violationSchema.index({ userId: 1, type: 1 });
export const Violation = mongoose.model('Violation', violationSchema);
//# sourceMappingURL=Violation.model.js.map