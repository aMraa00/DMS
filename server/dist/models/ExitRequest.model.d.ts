import mongoose from 'mongoose';
export interface IExitRequest {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    /** Өдөр буулгах огноо (7 хоногийн өмнөөс) */
    requestedExitDate: Date;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    approvedBy?: mongoose.Types.ObjectId;
    /** Буцаах / татгалзах үед оюутанд харагдах тайлбар */
    adminNote?: string;
    reviewedAt?: Date;
}
export declare const ExitRequest: mongoose.Model<IExitRequest, {}, {}, {}, mongoose.Document<unknown, {}, IExitRequest, {}, {}> & IExitRequest & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
