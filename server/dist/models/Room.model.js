import mongoose, { Schema } from 'mongoose';
const roomSchema = new Schema({
    dormId: { type: Schema.Types.ObjectId, ref: 'Dorm', required: true, index: true },
    floorId: { type: Schema.Types.ObjectId, ref: 'Floor', required: true, index: true },
    roomNumber: { type: Number, required: true },
    currentOccupancy: { type: Number, default: 0 },
    maxOccupancy: { type: Number, default: 2 },
    type: { type: String, enum: ['regular', 'special'], default: 'regular' },
    isFamilyRoom: { type: Boolean, default: false },
    monthlyFee: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['free', 'occupied', 'maintenance'],
        default: 'free',
        index: true,
    },
}, { timestamps: true });
roomSchema.index({ dormId: 1, floorId: 1, roomNumber: 1 }, { unique: true });
export const Room = mongoose.model('Room', roomSchema);
//# sourceMappingURL=Room.model.js.map