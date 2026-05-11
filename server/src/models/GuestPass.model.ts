import mongoose, { Schema } from 'mongoose'

export interface IGuestPass {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  guestName: string
  guestPhone: string
  relationship: string
  purpose?: string
  checkIn: Date
  checkOut: Date
  status: 'pending' | 'approved' | 'rejected' | 'used' | 'expired'
  approvedBy?: mongoose.Types.ObjectId
}

const guestPassSchema = new Schema<IGuestPass>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    guestName: { type: String, required: true },
    guestPhone: { type: String, required: true },
    relationship: { type: String, required: true },
    purpose: { type: String },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'used', 'expired'],
      default: 'pending',
      index: true,
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
)

export const GuestPass = mongoose.model<IGuestPass>('GuestPass', guestPassSchema)
