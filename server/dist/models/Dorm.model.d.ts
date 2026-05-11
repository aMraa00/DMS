import mongoose from 'mongoose';
export interface IDorm {
    _id: mongoose.Types.ObjectId;
    name: string;
    address?: string;
    totalFloors: number;
    totalRooms: number;
    capacity: number;
    genderType: 'M' | 'F' | 'MIXED';
    managerId?: mongoose.Types.ObjectId;
}
export declare const Dorm: mongoose.Model<IDorm, {}, {}, {}, mongoose.Document<unknown, {}, IDorm, {}, {}> & IDorm & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
