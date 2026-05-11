import mongoose from 'mongoose';
export interface IStaff {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    dormId?: mongoose.Types.ObjectId;
    role: 'manager' | 'professional' | 'accountant' | 'security';
    employedAt?: Date;
    hiredAt?: Date;
}
export declare const Staff: mongoose.Model<IStaff, {}, {}, {}, mongoose.Document<unknown, {}, IStaff, {}, {}> & IStaff & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
