import { Router } from 'express';
import { z } from 'zod';
import { RoomApplication } from '../../models/RoomApplication.model.js';
import { Room } from '../../models/Room.model.js';
import { Dorm } from '../../models/Dorm.model.js';
import { User } from '../../models/User.model.js';
import { authenticate, requireRoles } from '../../middleware/auth.middleware.js';
import { computePriorityTier, priorityWindowEnds } from '../../services/priority.service.js';
import { Payment } from '../../models/Payment.model.js';
import { randomUUID } from 'node:crypto';
import { createInAppNotification } from '../../services/notification.service.js';
export const applicationRouter = Router();
applicationRouter.use(authenticate);
applicationRouter.use(requireRoles('student'));
applicationRouter.post('/', async (req, res) => {
    const body = z
        .object({
        wantsSpecialRoom: z.boolean().optional(),
        specialReason: z.string().optional(),
        notes: z.string().optional(),
    })
        .safeParse(req.body);
    if (!body.success) {
        res.status(400).json({ error: body.error.flatten() });
        return;
    }
    const user = await User.findById(req.user.id);
    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    const tier = computePriorityTier(user);
    const now = new Date();
    const doc = await RoomApplication.create({
        userId: user._id,
        status: 'priority_window',
        priorityTier: tier,
        priorityQueueExpiresAt: priorityWindowEnds(now),
        wantsSpecialRoom: body.data.wantsSpecialRoom ?? false,
        specialReason: body.data.specialReason,
        notes: body.data.notes,
    });
    void createInAppNotification(String(user._id), 'Өрөө захиалга', 'Таны хүсэлт бүртгэгдлээ. Эрэмбийн цонхонд нээлттэй өрөөнөөс сонгоно уу.', '/apply');
    res.status(201).json({ application: serializeApplication(doc, user.gender) });
});
applicationRouter.get('/my', async (req, res) => {
    const list = await RoomApplication.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50);
    const user = await User.findById(req.user.id);
    res.json({
        applications: list.map((a) => serializeApplication(a, user?.gender)),
    });
});
applicationRouter.get('/priority', async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    const tier = computePriorityTier(user);
    res.json({ tier, label: priorityLabel(tier) });
});
applicationRouter.put('/:id/select-room', async (req, res) => {
    const params = z.object({ id: z.string() }).safeParse(req.params);
    const body = z
        .object({
        roomId: z.string(),
    })
        .safeParse(req.body);
    if (!params.success || !body.success) {
        res.status(400).json({ error: 'Invalid request' });
        return;
    }
    const application = await RoomApplication.findOne({
        _id: params.data.id,
        userId: req.user.id,
    });
    if (!application) {
        res.status(404).json({ error: 'Application not found' });
        return;
    }
    const user = await User.findById(req.user.id);
    const room = await Room.findById(body.data.roomId);
    if (!room) {
        res.status(404).json({ error: 'Room not found' });
        return;
    }
    const dorm = await Dorm.findById(room.dormId);
    if (!dorm) {
        res.status(400).json({ error: 'Invalid dorm' });
        return;
    }
    if (!genderAllowed(dorm.genderType, user?.gender)) {
        res.status(400).json({ error: 'Gender restriction: this dorm does not match student profile' });
        return;
    }
    if ((room.currentOccupancy ?? 0) >= room.maxOccupancy) {
        res.status(409).json({ error: 'Room is full' });
        return;
    }
    application.dormId = dorm._id;
    application.floorId = room.floorId;
    application.roomId = room._id;
    application.status = 'payment_pending';
    const due = new Date();
    due.setHours(due.getHours() + 4);
    application.paymentDueAt = due;
    await application.save();
    void createInAppNotification(String(user._id), 'Төлбөр үүслээ', 'Өрөө баталгаажлаа. Хугацаа дотор төлбөрөө «Төлбөр» хэсгээс төлж дуусгана уу.', '/payments');
    res.json({ application: serializeApplication(application, user?.gender) });
});
applicationRouter.post('/:id/pay', async (req, res) => {
    const params = z.object({ id: z.string() }).safeParse(req.params);
    const body = z
        .object({
        amount: z.number().positive(),
        type: z.enum(['FULL', 'HALF', 'SUMMER']),
        method: z.enum(['QPay', 'BankTransfer', 'Card']).default('QPay'),
    })
        .safeParse(req.body);
    if (!params.success || !body.success) {
        res.status(400).json({ error: 'Invalid request' });
        return;
    }
    const application = await RoomApplication.findOne({
        _id: params.data.id,
        userId: req.user.id,
    });
    if (!application || application.status !== 'payment_pending') {
        res.status(400).json({ error: 'Application not awaiting payment' });
        return;
    }
    if (application.paymentDueAt && application.paymentDueAt < new Date()) {
        application.status = 'cancelled';
        await application.save();
        res.status(400).json({ error: 'Payment window expired' });
        return;
    }
    const payment = await Payment.create({
        userId: application.userId,
        applicationId: application._id,
        amount: body.data.amount,
        type: body.data.type,
        status: 'pending',
        penalty: 0,
        method: body.data.method,
    });
    /** Stub: integrate QPay / bank callback to mark paid */
    res.status(202).json({
        payment: {
            id: String(payment._id),
            status: payment.status,
            transactionId: randomUUID(),
            message: 'Awaiting gateway confirmation (stub)',
        },
    });
});
function genderAllowed(dormGender, studentGender) {
    if (dormGender === 'MIXED')
        return true;
    if (!studentGender)
        return true;
    return dormGender === studentGender;
}
function priorityLabel(tier) {
    const labels = {
        1: 'Тэгш эрх ба 1-р түвшин (хөдөө)',
        2: 'Хөдөө 2–3 түвшин',
        3: 'Хөдөө 4–5 түвшин',
        4: 'УБ алслагдсан дүүрэг',
        5: 'Ахисан түвшин',
    };
    return labels[tier] ?? 'Энгийн эрэмбэ';
}
function serializeApplication(a, gender) {
    return {
        id: String(a._id),
        status: a.status,
        priorityTier: a.priorityTier,
        priorityQueueExpiresAt: a.priorityQueueExpiresAt,
        paymentDueAt: a.paymentDueAt,
        dormId: a.dormId ? String(a.dormId) : undefined,
        floorId: a.floorId ? String(a.floorId) : undefined,
        roomId: a.roomId ? String(a.roomId) : undefined,
        wantsSpecialRoom: a.wantsSpecialRoom,
        notes: a.notes,
        genderHint: gender,
        createdAt: a.createdAt,
    };
}
//# sourceMappingURL=application.routes.js.map