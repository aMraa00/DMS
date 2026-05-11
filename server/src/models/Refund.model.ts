import mongoose, { Schema } from 'mongoose'

export interface IRefund {
  _id: mongoose.Types.ObjectId
  paymentId: mongoose.Types.ObjectId
  amount: number
  reason: string
  requestedAt: Date
  status: 'pending' | 'approved' | 'rejected'
  processedAt?: Date
}

const refundSchema = new Schema<IRefund>(
  {
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true, index: true },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    requestedAt: { type: Date, default: () => new Date() },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    processedAt: { type: Date },
  },
  { timestamps: true },
)

export const Refund = mongoose.model<IRefund>('Refund', refundSchema)
