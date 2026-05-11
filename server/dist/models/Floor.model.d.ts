import mongoose from 'mongoose';
export interface IFloor {
    _id: mongoose.Types.ObjectId;
    dormId: mongoose.Types.ObjectId;
    floorNumber: number;
    label?: string;
}
export declare const Floor: mongoose.Model<IFloor, {}, {}, {}, mongoose.Document<unknown, {}, IFloor, {}, {}> & IFloor & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
