import mongoose from 'mongoose';
export interface IAuditLog {
    _id: mongoose.Types.ObjectId;
    actorUserId?: mongoose.Types.ObjectId;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    resource: string;
    resourceId?: string;
    ipAddress?: string;
    metadata?: Record<string, unknown>;
}
export declare const AuditLog: mongoose.Model<IAuditLog, {}, {}, {}, mongoose.Document<unknown, {}, IAuditLog, {}, {}> & IAuditLog & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
