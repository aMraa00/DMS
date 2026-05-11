import mongoose from 'mongoose';
export interface IWarning {
    _id: mongoose.Types.ObjectId;
    violationId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    warningNumber: 1 | 2;
    issuedAt: Date;
    acknowledged: boolean;
    issuedBy?: mongoose.Types.ObjectId;
}
export declare const Warning: mongoose.Model<IWarning, {}, {}, {}, mongoose.Document<unknown, {}, IWarning, {}, {}> & IWarning & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
