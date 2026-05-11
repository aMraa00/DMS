import mongoose, { Schema } from 'mongoose'

export interface IContract {
  _id: mongoose.Types.ObjectId
  contractNumber: string
  userId: mongoose.Types.ObjectId
  roomId: mongoose.Types.ObjectId
  startDate: Date
  endDate: Date
  isHalfYear: boolean
  signedAt?: Date
  eSignature?: string
  status: 'pending_sign' | 'active' | 'cancelled' | 'expired'
  signDeadlineAt?: Date
  cancelledAt?: Date
  cancelReason?: string
}

const contractSchema = new Schema<IContract>(
  {
    contractNumber: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isHalfYear: { type: Boolean, default: false },
    signedAt: { type: Date },
    eSignature: { type: String },
    status: {
      type: String,
      enum: ['pending_sign', 'active', 'cancelled', 'expired'],
      default: 'pending_sign',
      index: true,
    },
    signDeadlineAt: { type: Date },
    cancelledAt: { type: Date },
    cancelReason: { type: String },
  },
  { timestamps: true },
)

export const Contract = mongoose.model<IContract>('Contract', contractSchema)
