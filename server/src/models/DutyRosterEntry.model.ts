import mongoose, { Schema } from 'mongoose'

export interface IDutyRosterEntry {
  _id: mongoose.Types.ObjectId
  /** Ээлжийн байр суурь тогтоох дараалал (жижүүр ээлжийн эргэлтийн дүрэмд ашиглагдана) */
  sequence: number
  userId: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const dutyRosterEntrySchema = new Schema<IDutyRosterEntry>(
  {
    sequence: { type: Number, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  },
  { timestamps: true },
)

dutyRosterEntrySchema.index({ sequence: 1 })

export const DutyRosterEntry = mongoose.model<IDutyRosterEntry>('DutyRosterEntry', dutyRosterEntrySchema)
