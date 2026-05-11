import mongoose, { Schema } from 'mongoose';
const staffSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    dormId: { type: Schema.Types.ObjectId, ref: 'Dorm' },
    role: {
        type: String,
        enum: ['manager', 'professional', 'accountant', 'security'],
        required: true,
    },
    employedAt: { type: Date },
    hiredAt: { type: Date },
}, { timestamps: true });
export const Staff = mongoose.model('Staff', staffSchema);
//# sourceMappingURL=Staff.model.js.map