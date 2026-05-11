import mongoose, { Schema } from 'mongoose'

export interface IRoomChangeRequest {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  reason: string
  preferences?: string
  /** Админ шийдвэрлэхэд оноосон өрөө → гэрээний roomId-с холбогдоно */
  assignedRoomId?: mongoose.Types.ObjectId
  status: 'pending' | 'resolved' | 'rejected'
  createdAt: Date
  resolvedAt?: Date
  resolution?: string
  reviewedBy?: mongoose.Types.ObjectId
}

const roomChangeRequestSchema = new Schema<IRoomChangeRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reason: { type: String, required: true, trim: true },
    preferences: { type: String, trim: true },
    assignedRoomId: { type: Schema.Types.ObjectId, ref: 'Room' },
    status: {
      type: String,
      enum: ['pending', 'resolved', 'rejected'],
      default: 'pending',
      index: true,
    },
    resolvedAt: { type: Date },
    resolution: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
)

export const RoomChangeRequest = mongoose.model<IRoomChangeRequest>(
  'RoomChangeRequest',
  roomChangeRequestSchema,
)

