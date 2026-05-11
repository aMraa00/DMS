import mongoose, { Schema } from 'mongoose';
const roomChangeRequestSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reason: { type: String, required: true, trim: true },
    preferences: { type: String, trim: true },
    assignedRoomId: { type: Schema.Types.ObjectId, ref: 'Room' },
    status: {
        type: String,
        enum: ['pending', 'resolved', 'rejected'],
        default: 'pending',
        index: true,
    },
    resolvedAt: { type: Date },
    resolution: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
export const RoomChangeRequest = mongoose.model('RoomChangeRequest', roomChangeRequestSchema);
//# sourceMappingURL=RoomChangeRequest.model.js.map