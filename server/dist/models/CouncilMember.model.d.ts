import mongoose from 'mongoose';
export interface ICouncilMember {
    _id: mongoose.Types.ObjectId;
    councilId?: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    role: 'head' | 'member';
    feeDiscount: number;
    isLevel1to3: boolean;
    termStart: Date;
    termEnd: Date;
}
export declare const CouncilMember: mongoose.Model<ICouncilMember, {}, {}, {}, mongoose.Document<unknown, {}, ICouncilMember, {}, {}> & ICouncilMember & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
