import mongoose, { Schema } from 'mongoose'

export interface IInventory {
  _id: mongoose.Types.ObjectId
  itemName: string
  quantity: number
  condition: string
  unitPrice: number
  roomId: mongoose.Types.ObjectId
}

const inventorySchema = new Schema<IInventory>(
  {
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true },
    condition: { type: String, required: true },
    unitPrice: { type: Number, default: 0 },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
  },
  { timestamps: true },
)

export const Inventory = mongoose.model<IInventory>('Inventory', inventorySchema)
