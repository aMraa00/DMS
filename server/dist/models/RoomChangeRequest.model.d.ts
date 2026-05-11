import mongoose from 'mongoose';
export interface IRoomChangeRequest {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    reason: string;
    preferences?: string;
    /** Админ шийдвэрлэхэд оноосон өрөө → гэрээний roomId-с холбогдоно */
    assignedRoomId?: mongoose.Types.ObjectId;
    status: 'pending' | 'resolved' | 'rejected';
    createdAt: Date;
    resolvedAt?: Date;
    resolution?: string;
    reviewedBy?: mongoose.Types.ObjectId;
}
export declare const RoomChangeRequest: mongoose.Model<IRoomChangeRequest, {}, {}, {}, mongoose.Document<unknown, {}, IRoomChangeRequest, {}, {}> & IRoomChangeRequest & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
