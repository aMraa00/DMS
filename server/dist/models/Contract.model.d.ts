import mongoose from 'mongoose';
export interface IContract {
    _id: mongoose.Types.ObjectId;
    contractNumber: string;
    userId: mongoose.Types.ObjectId;
    roomId: mongoose.Types.ObjectId;
    startDate: Date;
    endDate: Date;
    isHalfYear: boolean;
    signedAt?: Date;
    eSignature?: string;
    status: 'pending_sign' | 'active' | 'cancelled' | 'expired';
    signDeadlineAt?: Date;
    cancelledAt?: Date;
    cancelReason?: string;
}
export declare const Contract: mongoose.Model<IContract, {}, {}, {}, mongoose.Document<unknown, {}, IContract, {}, {}> & IContract & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
