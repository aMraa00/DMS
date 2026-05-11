import mongoose, { Schema } from 'mongoose';
const notificationSchema = new Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['sms', 'email', 'in-app', 'push'], default: 'in-app' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    read: { type: Boolean, default: false, index: true },
    sentAt: { type: Date },
    link: { type: String },
}, { timestamps: true });
notificationSchema.index({ userId: 1, createdAt: -1 });
export const Notification = mongoose.model('Notification', notificationSchema);
//# sourceMappingURL=Notification.model.js.map