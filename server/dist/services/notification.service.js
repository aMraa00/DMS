import mongoose from 'mongoose';
import { Notification } from '../models/Notification.model.js';
import { Contract } from '../models/Contract.model.js';
import { User } from '../models/User.model.js';
export async function createInAppNotification(userId, title, message, link) {
    await Notification.create({
        title,
        message,
        type: 'in-app',
        userId: typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId,
        read: false,
        link: link || undefined,
    });
}
export async function notifyUsersWithRoles(roles, title, message, link) {
    const users = await User.find({ role: { $in: [...roles] } })
        .select('_id')
        .lean();
    if (!users.length)
        return;
    await Notification.insertMany(users.map((u) => ({
        title,
        message,
        type: 'in-app',
        userId: u._id,
        read: false,
        link: link || undefined,
    })));
}
/** Идэвхтэй оюутнууд эсвэл бүх идэвхтэй хэрэглэгчид мэдэгдэл хуулагдана (чанкаар insert). */
export async function broadcastInAppNotifications(opts) {
    const filter = opts.audience === 'students'
        ? { role: 'student', status: 'active' }
        : { status: 'active' };
    const users = await User.find(filter).select('_id').lean();
    const recipientCount = users.length;
    if (recipientCount === 0)
        return { recipientCount: 0 };
    const link = opts.link?.trim() || undefined;
    const chunkSize = 500;
    for (let i = 0; i < users.length; i += chunkSize) {
        const slice = users.slice(i, i + chunkSize);
        await Notification.insertMany(slice.map((u) => ({
            title: opts.title,
            message: opts.message,
            type: 'in-app',
            userId: u._id,
            read: false,
            link,
        })));
    }
    return { recipientCount };
}
/**
 * Гарын үсэг зурах хугацаа дуусах гэж байгаа гэрээнүүдэд мэдэгдэл илгээнэ.
 * Серверт эхлэхэд нэг удаа ажиллуулж, дараа нь цаг тутам шалгана.
 */
export function scheduleContractDeadlineReminders() {
    const INTERVAL_MS = 60 * 60 * 1000;
    async function sendReminders() {
        const now = new Date();
        const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
        const contracts = await Contract.find({
            status: 'pending_sign',
            signDeadlineAt: { $gte: now, $lte: in48h },
        }).lean();
        for (const c of contracts) {
            const msLeft = new Date(c.signDeadlineAt).getTime() - now.getTime();
            const hoursLeft = Math.ceil(msLeft / (60 * 60 * 1000));
            const alreadySent = await Notification.findOne({
                userId: c.userId,
                title: 'Гэрээний хугацааны сануулга',
                createdAt: { $gte: new Date(now.getTime() - INTERVAL_MS) },
            });
            if (alreadySent)
                continue;
            const message = hoursLeft <= 24
                ? `Гэрээнд гарын үсэг зурах ${hoursLeft} цаг үлдлээ! Яаралтай «Гэрээ» хэсгийг нээнэ үү.`
                : `Гэрээнд гарын үсэг зурах 2 өдөр хүрэхгүй хугацаа үлдлээ (${hoursLeft} цаг).`;
            await createInAppNotification(String(c.userId), 'Гэрээний хугацааны сануулга', message, '/contract');
        }
    }
    void sendReminders();
    setInterval(() => void sendReminders(), INTERVAL_MS);
}
//# sourceMappingURL=notification.service.js.map