import mongoose, { Schema } from 'mongoose'

export interface IRoomApplication {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  status:
    | 'draft'
    | 'submitted'
    | 'priority_window'
    | 'room_selected'
    | 'payment_pending'
    | 'paid'
    | 'contract_pending'
    | 'completed'
    | 'cancelled'
  /** 1 = highest */
  priorityTier?: number
  priorityQueueExpiresAt?: Date
  paymentDueAt?: Date
  dormId?: mongoose.Types.ObjectId
  floorId?: mongoose.Types.ObjectId
  roomId?: mongoose.Types.ObjectId
  wantsSpecialRoom: boolean
  specialReason?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const roomApplicationSchema = new Schema<IRoomApplication>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: [
        'draft',
        'submitted',
        'priority_window',
        'room_selected',
        'payment_pending',
        'paid',
        'contract_pending',
        'completed',
        'cancelled',
      ],
      default: 'draft',
      index: true,
    },
    priorityTier: { type: Number, min: 1, max: 5 },
    priorityQueueExpiresAt: { type: Date },
    paymentDueAt: { type: Date },
    dormId: { type: Schema.Types.ObjectId, ref: 'Dorm' },
    floorId: { type: Schema.Types.ObjectId, ref: 'Floor' },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room' },
    wantsSpecialRoom: { type: Boolean, default: false },
    specialReason: { type: String },
    notes: { type: String },
  },
  { timestamps: true },
)

roomApplicationSchema.index({ userId: 1, status: 1 })

export const RoomApplication = mongoose.model<IRoomApplication>(
  'RoomApplication',
  roomApplicationSchema,
)
