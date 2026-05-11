import mongoose from 'mongoose';
import type { Role } from '../types/roles.js';
export interface IUser {
    _id: mongoose.Types.ObjectId;
    registerNumber?: string;
    studentId?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    passwordHash?: string;
    /** 1-5 / Mar / DoK — used for priority */
    level?: string;
    school?: string;
    program?: string;
    region?: string;
    gender?: 'M' | 'F';
    isDisabled?: boolean;
    hasInsurance?: boolean;
    /** WEST login name if linked */
    westLoginName?: string;
    role: Role;
    status: string;
    /** Relative public URL served from /uploads/avatars/:id.:ext */
    avatarUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
