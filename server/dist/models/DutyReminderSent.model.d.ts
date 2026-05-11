import mongoose from 'mongoose';
/** Тухайн кампусын өдөр (Ховд/Жаргалант цагийн бүс) жижүүрийн мэдэгдэл аль хэдийн илгээгдсэн эсэх */
export interface IDutyReminderSent {
    _id: mongoose.Types.ObjectId;
    /** YYYY-MM-DD (кампусын CAMPUS_DAY_TIMEZONE) */
    dateKey: string;
    dutyUserId: mongoose.Types.ObjectId;
    notifiedAt: Date;
}
export declare const DutyReminderSent: mongoose.Model<IDutyReminderSent, {}, {}, {}, mongoose.Document<unknown, {}, IDutyReminderSent, {}, {}> & IDutyReminderSent & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
