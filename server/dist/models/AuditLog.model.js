import mongoose, { Schema } from 'mongoose';
const auditLogSchema = new Schema({
    actorUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, enum: ['CREATE', 'UPDATE', 'DELETE'], required: true },
    resource: { type: String, required: true },
    resourceId: { type: String },
    ipAddress: { type: String },
    metadata: { type: Schema.Types.Mixed },
}, { timestamps: { createdAt: true, updatedAt: false } });
auditLogSchema.index({ actorUserId: 1, createdAt: -1 });
export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
//# sourceMappingURL=AuditLog.model.js.map