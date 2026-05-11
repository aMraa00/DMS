import mongoose, { Schema } from 'mongoose';
const councilMemberSchema = new Schema({
    councilId: { type: Schema.Types.ObjectId },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['head', 'member'], default: 'member' },
    feeDiscount: { type: Number, min: 0, max: 50, default: 0 },
    isLevel1to3: { type: Boolean, default: false },
    termStart: { type: Date, required: true },
    termEnd: { type: Date, required: true, index: true },
}, { timestamps: true });
councilMemberSchema.index({ userId: 1, termEnd: 1 });
export const CouncilMember = mongoose.model('CouncilMember', councilMemberSchema);
//# sourceMappingURL=CouncilMember.model.js.map