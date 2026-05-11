import mongoose from 'mongoose';
export interface IInventory {
    _id: mongoose.Types.ObjectId;
    itemName: string;
    quantity: number;
    condition: string;
    unitPrice: number;
    roomId: mongoose.Types.ObjectId;
}
export declare const Inventory: mongoose.Model<IInventory, {}, {}, {}, mongoose.Document<unknown, {}, IInventory, {}, {}> & IInventory & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
