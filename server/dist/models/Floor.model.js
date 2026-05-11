import mongoose, { Schema } from 'mongoose';
const floorSchema = new Schema({
    dormId: { type: Schema.Types.ObjectId, ref: 'Dorm', required: true, index: true },
    floorNumber: { type: Number, required: true },
    label: { type: String },
}, { timestamps: true });
floorSchema.index({ dormId: 1, floorNumber: 1 }, { unique: true });
export const Floor = mongoose.model('Floor', floorSchema);
//# sourceMappingURL=Floor.model.js.map