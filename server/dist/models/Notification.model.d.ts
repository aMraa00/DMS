import mongoose from 'mongoose';
export interface INotification {
    _id: mongoose.Types.ObjectId;
    title: string;
    message: string;
    type: 'sms' | 'email' | 'in-app' | 'push';
    userId: mongoose.Types.ObjectId;
    read: boolean;
    sentAt?: Date;
    /** Клиент дээр дарахад шилжих дотоод зам, ж: /contract */
    link?: string;
}
export declare const Notification: mongoose.Model<INotification, {}, {}, {}, mongoose.Document<unknown, {}, INotification, {}, {}> & INotification & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
