import mongoose, { Schema } from 'mongoose'

export interface INotification {
  _id: mongoose.Types.ObjectId
  title: string
  message: string
  type: 'sms' | 'email' | 'in-app' | 'push'
  userId: mongoose.Types.ObjectId
  read: boolean
  sentAt?: Date
  /** Клиент дээр дарахад шилжих дотоод зам, ж: /contract */
  link?: string
}

const notificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['sms', 'email', 'in-app', 'push'], default: 'in-app' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    read: { type: Boolean, default: false, index: true },
    sentAt: { type: Date },
    link: { type: String },
  },
  { timestamps: true },
)

notificationSchema.index({ userId: 1, createdAt: -1 })

export const Notification = mongoose.model<INotification>('Notification', notificationSchema)
