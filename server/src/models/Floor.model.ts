import mongoose, { Schema } from 'mongoose'

export interface IFloor {
  _id: mongoose.Types.ObjectId
  dormId: mongoose.Types.ObjectId
  floorNumber: number
  label?: string
}

const floorSchema = new Schema<IFloor>(
  {
    dormId: { type: Schema.Types.ObjectId, ref: 'Dorm', required: true, index: true },
    floorNumber: { type: Number, required: true },
    label: { type: String },
  },
  { timestamps: true },
)

floorSchema.index({ dormId: 1, floorNumber: 1 }, { unique: true })

export const Floor = mongoose.model<IFloor>('Floor', floorSchema)
