import mongoose, { Schema } from 'mongoose';
const dormSchema = new Schema({
    name: { type: String, required: true, unique: true, trim: true },
    address: { type: String },
    totalFloors: { type: Number, default: 0 },
    totalRooms: { type: Number, default: 0 },
    capacity: { type: Number, default: 0 },
    genderType: { type: String, enum: ['M', 'F', 'MIXED'], default: 'MIXED' },
    managerId: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
export const Dorm = mongoose.model('Dorm', dormSchema);
//# sourceMappingURL=Dorm.model.js.map