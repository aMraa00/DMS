import mongoose, { Schema } from 'mongoose'

export interface IDorm {
  _id: mongoose.Types.ObjectId
  name: string
  address?: string
  totalFloors: number
  totalRooms: number
  capacity: number
  genderType: 'M' | 'F' | 'MIXED'
  managerId?: mongoose.Types.ObjectId
}

const dormSchema = new Schema<IDorm>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    address: { type: String },
    totalFloors: { type: Number, default: 0 },
    totalRooms: { type: Number, default: 0 },
    capacity: { type: Number, default: 0 },
    genderType: { type: String, enum: ['M', 'F', 'MIXED'], default: 'MIXED' },
    managerId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
)

export const Dorm = mongoose.model<IDorm>('Dorm', dormSchema)
