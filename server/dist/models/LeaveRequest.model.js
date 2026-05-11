import mongoose, { Schema } from 'mongoose';
const leaveRequestSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    leaveDate: { type: Date, required: true },
    returnDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        index: true,
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
export const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);
//# sourceMappingURL=LeaveRequest.model.js.map