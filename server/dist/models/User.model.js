import mongoose, { Schema } from 'mongoose';
const userSchema = new Schema({
    registerNumber: { type: String, sparse: true, unique: true },
    studentId: { type: String, sparse: true, unique: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, select: false },
    level: { type: String, trim: true },
    school: { type: String, trim: true },
    program: { type: String, trim: true },
    region: { type: String, trim: true },
    gender: { type: String, enum: ['M', 'F'] },
    isDisabled: { type: Boolean, default: false },
    hasInsurance: { type: Boolean, default: false },
    westLoginName: { type: String, sparse: true, unique: true },
    role: {
        type: String,
        enum: ['student', 'staff', 'admin', 'accountant'],
        default: 'student',
    },
    status: { type: String, default: 'active' },
    avatarUrl: { type: String, trim: true },
}, { timestamps: true });
export const User = mongoose.model('User', userSchema);
//# sourceMappingURL=User.model.js.map