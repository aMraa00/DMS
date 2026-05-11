import mongoose, { Schema } from 'mongoose';
const dutyReminderSentSchema = new Schema({
    dateKey: { type: String, required: true, unique: true, index: true },
    dutyUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notifiedAt: { type: Date, default: Date.now },
}, { timestamps: false });
export const DutyReminderSent = mongoose.model('DutyReminderSent', dutyReminderSentSchema);
//# sourceMappingURL=DutyReminderSent.model.js.map