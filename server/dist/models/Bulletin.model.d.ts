import mongoose from 'mongoose';
export declare const BULLETIN_TYPES: readonly ["sell", "buy", "lost", "found", "announce", "service"];
export type BulletinType = (typeof BULLETIN_TYPES)[number];
export declare const BULLETIN_TYPE_LABELS: Record<BulletinType, string>;
export interface IBulletin {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    type: BulletinType;
    title: string;
    body: string;
    contactPhone?: string;
    price?: number;
    expiresAt?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Bulletin: mongoose.Model<IBulletin, {}, {}, {}, mongoose.Document<unknown, {}, IBulletin, {}, {}> & IBulletin & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
