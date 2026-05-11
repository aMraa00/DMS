import mongoose from 'mongoose';
export interface IViolation {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    contractId?: mongoose.Types.ObjectId;
    type: 'WARN' | 'CANCEL';
    category: string;
    description: string;
    violatedAt: Date;
    reportedBy?: mongoose.Types.ObjectId;
}
export declare const Violation: mongoose.Model<IViolation, {}, {}, {}, mongoose.Document<unknown, {}, IViolation, {}, {}> & IViolation & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
