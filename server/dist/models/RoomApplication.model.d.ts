import mongoose from 'mongoose';
export interface IRoomApplication {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    status: 'draft' | 'submitted' | 'priority_window' | 'room_selected' | 'payment_pending' | 'paid' | 'contract_pending' | 'completed' | 'cancelled';
    /** 1 = highest */
    priorityTier?: number;
    priorityQueueExpiresAt?: Date;
    paymentDueAt?: Date;
    dormId?: mongoose.Types.ObjectId;
    floorId?: mongoose.Types.ObjectId;
    roomId?: mongoose.Types.ObjectId;
    wantsSpecialRoom: boolean;
    specialReason?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const RoomApplication: mongoose.Model<IRoomApplication, {}, {}, {}, mongoose.Document<unknown, {}, IRoomApplication, {}, {}> & IRoomApplication & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
