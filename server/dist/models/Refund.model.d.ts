import mongoose from 'mongoose';
export interface IRefund {
    _id: mongoose.Types.ObjectId;
    paymentId: mongoose.Types.ObjectId;
    amount: number;
    reason: string;
    requestedAt: Date;
    status: 'pending' | 'approved' | 'rejected';
    processedAt?: Date;
}
export declare const Refund: mongoose.Model<IRefund, {}, {}, {}, mongoose.Document<unknown, {}, IRefund, {}, {}> & IRefund & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
