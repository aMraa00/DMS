import mongoose, { Schema } from 'mongoose';
const inventorySchema = new Schema({
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true },
    condition: { type: String, required: true },
    unitPrice: { type: Number, default: 0 },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
}, { timestamps: true });
export const Inventory = mongoose.model('Inventory', inventorySchema);
//# sourceMappingURL=Inventory.model.js.map