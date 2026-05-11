import mongoose, { Schema } from 'mongoose'

export interface IWarning {
  _id: mongoose.Types.ObjectId
  violationId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  warningNumber: 1 | 2
  issuedAt: Date
  acknowledged: boolean
  issuedBy?: mongoose.Types.ObjectId
}

const warningSchema = new Schema<IWarning>(
  {
    violationId: {
      type: Schema.Types.ObjectId,
      ref: 'Violation',
      required: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    warningNumber: { type: Number, enum: [1, 2], required: true },
    issuedAt: { type: Date, default: () => new Date() },
    acknowledged: { type: Boolean, default: false },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
)

export const Warning = mongoose.model<IWarning>('Warning', warningSchema)
