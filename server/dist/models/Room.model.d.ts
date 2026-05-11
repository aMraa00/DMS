import mongoose from 'mongoose';
export interface IRoom {
    _id: mongoose.Types.ObjectId;
    dormId: mongoose.Types.ObjectId;
    floorId: mongoose.Types.ObjectId;
    roomNumber: number;
    currentOccupancy: number;
    maxOccupancy: number;
    type: 'regular' | 'special';
    isFamilyRoom: boolean;
    monthlyFee: number;
    status: 'free' | 'occupied' | 'maintenance';
}
export declare const Room: mongoose.Model<IRoom, {}, {}, {}, mongoose.Document<unknown, {}, IRoom, {}, {}> & IRoom & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
