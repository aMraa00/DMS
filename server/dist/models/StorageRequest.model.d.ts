import mongoose from 'mongoose';
export interface IStorageRequest {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    description: string;
    summerPeriodLabel?: string;
    status: 'pending' | 'approved' | 'rejected' | 'stored' | 'returned';
}
export declare const StorageRequest: mongoose.Model<IStorageRequest, {}, {}, {}, mongoose.Document<unknown, {}, IStorageRequest, {}, {}> & IStorageRequest & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
