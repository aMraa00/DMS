import mongoose, { Schema } from 'mongoose'

export interface IExitRequest {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  /** Өдөр буулгах огноо (7 хоногийн өмнөөс) */
  requestedExitDate: Date
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  approvedBy?: mongoose.Types.ObjectId
  /** Буцаах / татгалзах үед оюутанд харагдах тайлбар */
  adminNote?: string
  reviewedAt?: Date
}

const exitRequestSchema = new Schema<IExitRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    requestedExitDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    adminNote: { type: String },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
)

export const ExitRequest = mongoose.model<IExitRequest>('ExitRequest', exitRequestSchema)
