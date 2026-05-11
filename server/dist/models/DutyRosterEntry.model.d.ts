import mongoose from 'mongoose';
export interface IDutyRosterEntry {
    _id: mongoose.Types.ObjectId;
    /** Ээлжийн байр суурь тогтоох дараалал (жижүүр ээлжийн эргэлтийн дүрэмд ашиглагдана) */
    sequence: number;
    userId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const DutyRosterEntry: mongoose.Model<IDutyRosterEntry, {}, {}, {}, mongoose.Document<unknown, {}, IDutyRosterEntry, {}, {}> & IDutyRosterEntry & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
