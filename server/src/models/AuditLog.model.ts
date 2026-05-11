import mongoose, { Schema } from 'mongoose'

export interface IAuditLog {
  _id: mongoose.Types.ObjectId
  actorUserId?: mongoose.Types.ObjectId
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  resource: string
  resourceId?: string
  ipAddress?: string
  metadata?: Record<string, unknown>
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, enum: ['CREATE', 'UPDATE', 'DELETE'], required: true },
    resource: { type: String, required: true },
    resourceId: { type: String },
    ipAddress: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

auditLogSchema.index({ actorUserId: 1, createdAt: -1 })

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema)
