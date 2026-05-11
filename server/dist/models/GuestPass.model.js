import mongoose, { Schema } from 'mongoose';
const guestPassSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    guestName: { type: String, required: true },
    guestPhone: { type: String, required: true },
    relationship: { type: String, required: true },
    purpose: { type: String },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'used', 'expired'],
        default: 'pending',
        index: true,
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
export const GuestPass = mongoose.model('GuestPass', guestPassSchema);
//# sourceMappingURL=GuestPass.model.js.map