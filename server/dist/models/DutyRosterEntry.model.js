import mongoose, { Schema } from 'mongoose';
const dutyRosterEntrySchema = new Schema({
    sequence: { type: Number, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
}, { timestamps: true });
dutyRosterEntrySchema.index({ sequence: 1 });
export const DutyRosterEntry = mongoose.model('DutyRosterEntry', dutyRosterEntrySchema);
//# sourceMappingURL=DutyRosterEntry.model.js.map