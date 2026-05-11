import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth.middleware.js';
import { Notification } from '../../models/Notification.model.js';
export const notificationsRouter = Router();
notificationsRouter.use(authenticate);
notificationsRouter.get('/', async (req, res) => {
    const q = z
        .object({
        limit: z.coerce.number().min(1).max(100).optional().default(40),
    })
        .safeParse(req.query);
    if (!q.success) {
        res.status(400).json({ error: q.error.flatten() });
        return;
    }
    const uid = new mongoose.Types.ObjectId(req.user.id);
    const [notifications, unreadCount] = await Promise.all([
        Notification.find({ userId: uid })
            .sort({ createdAt: -1 })
            .limit(q.data.limit)
            .lean(),
        Notification.countDocuments({ userId: uid, read: false }),
    ]);
    res.json({
        notifications: notifications.map((n) => {
            const d = n;
            return {
                _id: String(n._id),
                title: n.title,
                message: n.message,
                read: n.read,
                link: n.link,
                createdAt: (d.createdAt ?? d.updatedAt ?? new Date()).toISOString(),
            };
        }),
        unreadCount,
    });
});
notificationsRouter.patch('/:id/read', async (req, res) => {
    const params = z.object({ id: z.string() }).safeParse(req.params);
    if (!params.success || !mongoose.isValidObjectId(params.data.id)) {
        res.status(400).json({ error: 'Invalid id' });
        return;
    }
    const uid = new mongoose.Types.ObjectId(req.user.id);
    const doc = await Notification.findOneAndUpdate({ _id: params.data.id, userId: uid }, { $set: { read: true } }, { new: true }).lean();
    if (!doc) {
        res.status(404).json({ error: 'Not found' });
        return;
    }
    res.json({ ok: true });
});
notificationsRouter.post('/read-all', async (req, res) => {
    const uid = new mongoose.Types.ObjectId(req.user.id);
    const r = await Notification.updateMany({ userId: uid, read: false }, { $set: { read: true } });
    res.json({ ok: true, modified: r.modifiedCount });
});
//# sourceMappingURL=notifications.routes.js.map