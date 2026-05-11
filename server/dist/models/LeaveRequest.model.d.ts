import mongoose from 'mongoose';
export interface ILeaveRequest {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    leaveDate: Date;
    returnDate: Date;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    approvedBy?: mongoose.Types.ObjectId;
}
export declare const LeaveRequest: mongoose.Model<ILeaveRequest, {}, {}, {}, mongoose.Document<unknown, {}, ILeaveRequest, {}, {}> & ILeaveRequest & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
