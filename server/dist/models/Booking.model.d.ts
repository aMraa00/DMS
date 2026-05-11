import mongoose from 'mongoose';
export declare const BOOKING_RESOURCES: readonly ["washing_machine_1", "washing_machine_2", "washing_machine_3", "dryer_1", "study_room_a", "study_room_b", "common_room", "gym"];
export type BookingResource = (typeof BOOKING_RESOURCES)[number];
export declare const BOOKING_RESOURCE_LABELS: Record<BookingResource, string>;
export declare const BOOKING_SLOTS: readonly ["07:00-08:00", "08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00", "17:00-18:00", "18:00-19:00", "19:00-20:00"];
export type BookingSlot = (typeof BOOKING_SLOTS)[number];
export interface IBooking {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    resource: BookingResource;
    date: string;
    timeSlot: BookingSlot;
    status: 'active' | 'cancelled' | 'completed';
    note?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Booking: mongoose.Model<IBooking, {}, {}, {}, mongoose.Document<unknown, {}, IBooking, {}, {}> & IBooking & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
