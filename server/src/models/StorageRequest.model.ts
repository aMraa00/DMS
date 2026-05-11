import mongoose, { Schema } from 'mongoose'

export interface IStorageRequest {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  description: string
  summerPeriodLabel?: string
  status: 'pending' | 'approved' | 'rejected' | 'stored' | 'returned'
}

const storageRequestSchema = new Schema<IStorageRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    description: { type: String, required: true },
    summerPeriodLabel: { type: String },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'stored', 'returned'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true },
)

export const StorageRequest = mongoose.model<IStorageRequest>('StorageRequest', storageRequestSchema)
