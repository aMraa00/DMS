import mongoose from 'mongoose';
export interface IGuestPass {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    guestName: string;
    guestPhone: string;
    relationship: string;
    purpose?: string;
    checkIn: Date;
    checkOut: Date;
    status: 'pending' | 'approved' | 'rejected' | 'used' | 'expired';
    approvedBy?: mongoose.Types.ObjectId;
}
export declare const GuestPass: mongoose.Model<IGuestPass, {}, {}, {}, mongoose.Document<unknown, {}, IGuestPass, {}, {}> & IGuestPass & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
