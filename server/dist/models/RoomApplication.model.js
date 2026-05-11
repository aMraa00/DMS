import mongoose, { Schema } from 'mongoose';
const roomApplicationSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
        type: String,
        enum: [
            'draft',
            'submitted',
            'priority_window',
            'room_selected',
            'payment_pending',
            'paid',
            'contract_pending',
            'completed',
            'cancelled',
        ],
        default: 'draft',
        index: true,
    },
    priorityTier: { type: Number, min: 1, max: 5 },
    priorityQueueExpiresAt: { type: Date },
    paymentDueAt: { type: Date },
    dormId: { type: Schema.Types.ObjectId, ref: 'Dorm' },
    floorId: { type: Schema.Types.ObjectId, ref: 'Floor' },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room' },
    wantsSpecialRoom: { type: Boolean, default: false },
    specialReason: { type: String },
    notes: { type: String },
}, { timestamps: true });
roomApplicationSchema.index({ userId: 1, status: 1 });
export const RoomApplication = mongoose.model('RoomApplication', roomApplicationSchema);
//# sourceMappingURL=RoomApplication.model.js.map