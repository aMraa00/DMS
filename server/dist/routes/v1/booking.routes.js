import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Booking, BOOKING_RESOURCES, BOOKING_SLOTS, BOOKING_RESOURCE_LABELS, } from '../../models/Booking.model.js';
import { authenticate, requireRoles } from '../../middleware/auth.middleware.js';
import { createInAppNotification } from '../../services/notification.service.js';
export const bookingRouter = Router();
bookingRouter.use(authenticate);
bookingRouter.use(requireRoles('student'));
/** Тухайн нөөцийн тухайн өдрийн захиалгасан цагуудыг буцаана */
bookingRouter.get('/slots', async (req, res) => {
    const q = z.object({
        resource: z.enum(BOOKING_RESOURCES),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD'),
    }).safeParse(req.query);
    if (!q.success) {
        res.status(400).json({ error: q.error.flatten() });
        return;
    }
    const taken = await Booking.find({
        resource: q.data.resource,
        date: q.data.date,
        status: 'active',
    }).select('timeSlot userId').lean();
    res.json({
        resource: q.data.resource,
        label: BOOKING_RESOURCE_LABELS[q.data.resource],
        date: q.data.date,
        slots: BOOKING_SLOTS.map((slot) => {
            const booking = taken.find((b) => b.timeSlot === slot);
            const mine = booking ? String(booking.userId) === req.user.id : false;
            return {
                slot,
                available: !booking,
                mine,
                bookingId: mine ? String(booking._id) : undefined,
            };
        }),
    });
});
/** Миний захиалгууд */
bookingRouter.get('/my', async (req, res) => {
    const today = new Date().toISOString().slice(0, 10);
    const rows = await Booking.find({ userId: req.user.id, status: 'active', date: { $gte: today } })
        .sort({ date: 1, timeSlot: 1 })
        .limit(20)
        .lean();
    res.json({ bookings: rows });
});
const bookBody = z.object({
    resource: z.enum(BOOKING_RESOURCES),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD'),
    timeSlot: z.enum(BOOKING_SLOTS),
    note: z.string().max(200).optional(),
});
/** Шинэ захиалга */
bookingRouter.post('/', async (req, res) => {
    const body = bookBody.safeParse(req.body);
    if (!body.success) {
        res.status(400).json({ error: body.error.flatten() });
        return;
    }
    const today = new Date().toISOString().slice(0, 10);
    if (body.data.date < today) {
        res.status(400).json({ error: 'Өнгөрсөн огноонд захиалга хийж болохгүй' });
        return;
    }
    const maxDays = new Date();
    maxDays.setDate(maxDays.getDate() + 7);
    if (body.data.date > maxDays.toISOString().slice(0, 10)) {
        res.status(400).json({ error: '7 хоногийн цааш захиалга хийж болохгүй' });
        return;
    }
    const existing = await Booking.findOne({
        resource: body.data.resource,
        date: body.data.date,
        timeSlot: body.data.timeSlot,
        status: 'active',
    });
    if (existing) {
        res.status(409).json({ error: 'Тухайн цаг аль хэдийн захиалагдсан байна' });
        return;
    }
    const myCount = await Booking.countDocuments({
        userId: req.user.id,
        resource: body.data.resource,
        date: body.data.date,
        status: 'active',
    });
    if (myCount >= 2) {
        res.status(400).json({ error: 'Нэг нөөцөд өдөрт хамгийн ихдээ 2 цаг захиалж болно' });
        return;
    }
    const booking = await Booking.create({
        userId: req.user.id,
        ...body.data,
        status: 'active',
    });
    void createInAppNotification(req.user.id, 'Захиалга баталгаажлаа', `${BOOKING_RESOURCE_LABELS[body.data.resource]} — ${body.data.date} · ${body.data.timeSlot}`, '/daily');
    res.status(201).json({ booking });
});
/** Захиалга цуцлах */
bookingRouter.delete('/:id', async (req, res) => {
    const params = z.object({ id: z.string() }).safeParse(req.params);
    if (!params.success || !mongoose.isValidObjectId(params.data.id)) {
        res.status(400).json({ error: 'Invalid id' });
        return;
    }
    const booking = await Booking.findOne({ _id: params.data.id, userId: req.user.id });
    if (!booking) {
        res.status(404).json({ error: 'Захиалга олдсонгүй' });
        return;
    }
    if (booking.status !== 'active') {
        res.status(400).json({ error: 'Цуцлагдсан захиалга' });
        return;
    }
    booking.status = 'cancelled';
    await booking.save();
    res.json({ ok: true });
});
/** Нийтийн нөөцүүдийн жагсаалт */
bookingRouter.get('/resources', (_req, res) => {
    res.json({
        resources: BOOKING_RESOURCES.map((r) => ({ key: r, label: BOOKING_RESOURCE_LABELS[r] })),
        slots: BOOKING_SLOTS,
    });
});
//# sourceMappingURL=booking.routes.js.map