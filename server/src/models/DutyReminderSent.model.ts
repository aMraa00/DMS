import mongoose, { Schema } from 'mongoose'

/** Тухайн кампусын өдөр (Ховд/Жаргалант цагийн бүс) жижүүрийн мэдэгдэл аль хэдийн илгээгдсэн эсэх */
export interface IDutyReminderSent {
  _id: mongoose.Types.ObjectId
  /** YYYY-MM-DD (кампусын CAMPUS_DAY_TIMEZONE) */
  dateKey: string
  dutyUserId: mongoose.Types.ObjectId
  notifiedAt: Date
}

const dutyReminderSentSchema = new Schema<IDutyReminderSent>(
  {
    dateKey: { type: String, required: true, unique: true, index: true },
    dutyUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notifiedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
)

export const DutyReminderSent = mongoose.model<IDutyReminderSent>('DutyReminderSent', dutyReminderSentSchema)
