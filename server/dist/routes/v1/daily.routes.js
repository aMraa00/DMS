import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Complaint, COMPLAINT_CATEGORIES } from '../../models/Complaint.model.js';
import { RoomApplication } from '../../models/RoomApplication.model.js';
import { RoomChangeRequest } from '../../models/RoomChangeRequest.model.js';
import { ExitRequest } from '../../models/ExitRequest.model.js';
import { GuestPass } from '../../models/GuestPass.model.js';
import { LeaveRequest } from '../../models/LeaveRequest.model.js';
import { StorageRequest } from '../../models/StorageRequest.model.js';
import { authenticate, requireRoles } from '../../middleware/auth.middleware.js';
import { assertExitNoticeDays, assertGuestVisitWindow, assertLeaveDays, } from '../../services/daily-rules.service.js';
import { notifyUsersWithRoles } from '../../services/notification.service.js';
export const dailyRouter = Router();
dailyRouter.use(authenticate);
dailyRouter.use(requireRoles('student'));
const ROOM_BOOKED_STATUSES = [
    'room_selected',
    'payment_pending',
    'paid',
    'contract_pending',
    'completed',
];
async function studentHasActiveRoomBooking(userId) {
    const doc = await RoomApplication.findOne({
        userId,
        status: { $in: [...ROOM_BOOKED_STATUSES] },
    })
        .select('_id')
        .lean();
    return !!doc;
}
const guestPassBody = z.object({
    guestName: z.string().min(1),
    guestPhone: z.string().min(5),
    relationship: z.string().min(1),
    purpose: z.string().optional(),
    checkIn: z.coerce.date(),
    checkOut: z.coerce.date(),
});
dailyRouter.post('/guest-passes', async (req, res) => {
    const parsed = guestPassBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    try {
        assertGuestVisitWindow(parsed.data.checkIn, parsed.data.checkOut);
    }
    catch (e) {
        res.status(400).json({ error: e instanceof Error ? e.message : 'Validation error' });
        return;
    }
    const doc = await GuestPass.create({
        userId: req.user.id,
        ...parsed.data,
        status: 'pending',
    });
    void notifyUsersWithRoles(['admin', 'staff', 'accountant'], 'Зочны зөвшөөрөл', `${parsed.data.guestName} — шинэ зочны бүртгэл ирлээ.`, '/admin');
    res.status(201).json({ guestPass: doc });
});
dailyRouter.get('/guest-passes/my', async (req, res) => {
    const rows = await GuestPass.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ guestPasses: rows });
});
const leaveBody = z.object({
    leaveDate: z.coerce.date(),
    returnDate: z.coerce.date(),
    reason: z.string().min(5),
});
dailyRouter.post('/leave-requests', async (req, res) => {
    const parsed = leaveBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    try {
        assertLeaveDays(parsed.data.leaveDate, parsed.data.returnDate);
    }
    catch (e) {
        res.status(400).json({ error: e instanceof Error ? e.message : 'Validation error' });
        return;
    }
    const doc = await LeaveRequest.create({
        userId: req.user.id,
        ...parsed.data,
        status: 'pending',
    });
    void notifyUsersWithRoles(['admin', 'staff', 'accountant'], 'Хотоос явах', 'Оюутан хотоос явах хүсэлт илгээлээ.', '/admin');
    res.status(201).json({ leaveRequest: doc });
});
dailyRouter.get('/leave-requests/my', async (req, res) => {
    const rows = await LeaveRequest.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ leaveRequests: rows });
});
const exitBody = z.object({
    requestedExitDate: z.coerce.date(),
    reason: z.string().min(5),
});
dailyRouter.post('/exit-requests', async (req, res) => {
    const parsed = exitBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    try {
        assertExitNoticeDays(parsed.data.requestedExitDate);
    }
    catch (e) {
        res.status(400).json({ error: e instanceof Error ? e.message : 'Validation error' });
        return;
    }
    const dupe = await ExitRequest.findOne({ userId: req.user.id, status: 'pending' });
    if (dupe) {
        res.status(409).json({ error: 'Идэвхтэй гарах хүсэлт аль хэдийн бүртгэгдсэн. Шинийг оруулахаас өмнө хүлээнэ үү.' });
        return;
    }
    const doc = await ExitRequest.create({
        userId: req.user.id,
        ...parsed.data,
        status: 'pending',
    });
    void notifyUsersWithRoles(['admin', 'staff', 'accountant'], 'Байраас гарах', `Шинэ гарах хүсэлт (${new Date(parsed.data.requestedExitDate).toLocaleDateString('mn-MN')}).`, '/admin?tab=exits');
    res.status(201).json({ exitRequest: doc });
});
dailyRouter.get('/exit-requests/my', async (req, res) => {
    const rows = await ExitRequest.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ exitRequests: rows });
});
const complaintBody = z.object({
    title: z.string().min(3).max(200),
    content: z.string().min(10).max(2000),
    category: z.enum(COMPLAINT_CATEGORIES).optional().default('other'),
});
dailyRouter.post('/complaints', async (req, res) => {
    const parsed = complaintBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    const doc = await Complaint.create({
        userId: req.user.id,
        ...parsed.data,
        status: 'pending',
    });
    const isMaintenance = parsed.data.category.startsWith('maintenance_');
    void notifyUsersWithRoles(['admin', 'staff', 'accountant'], isMaintenance ? 'Засварын хүсэлт' : 'Гомдол', `[${parsed.data.category}] ${parsed.data.title.slice(0, 80)}`, '/admin');
    res.status(201).json({ complaint: doc });
});
dailyRouter.get('/complaints/my', async (req, res) => {
    const rows = await Complaint.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ complaints: rows });
});
const roomChangeBody = z.object({
    reason: z.string().trim().min(15),
    preferences: z.string().trim().optional(),
});
dailyRouter.post('/room-change-requests', async (req, res) => {
    const parsed = roomChangeBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    const uid = req.user.id;
    if (!(await studentHasActiveRoomBooking(uid))) {
        res.status(403).json({
            error: 'Идэвхтэй өрөөний захиалга (сонгосон өрөө) байхгүй байна. Эхлээд «Өрөө захиалга» цэсээр шинэ захиалга үүсгэнэ үү.',
        });
        return;
    }
    const doc = await RoomChangeRequest.create({
        userId: uid,
        reason: parsed.data.reason,
        preferences: parsed.data.preferences || undefined,
        status: 'pending',
    });
    const snippet = parsed.data.reason.slice(0, 120);
    void notifyUsersWithRoles(['admin', 'staff', 'accountant'], 'Өрөө солих хүсэлт', `Шинэ хүсэлт: ${snippet}${parsed.data.reason.length > 120 ? '…' : ''}`, '/admin?tab=room-changes');
    res.status(201).json({
        roomChangeRequest: {
            _id: String(doc._id),
            reason: doc.reason,
            preferences: doc.preferences,
            status: doc.status,
            createdAt: doc.createdAt?.toISOString(),
        },
    });
});
dailyRouter.get('/room-change-requests/my', async (req, res) => {
    const rows = await RoomChangeRequest.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate({
        path: 'assignedRoomId',
        select: 'roomNumber dormId',
        populate: { path: 'dormId', select: 'name', model: 'Dorm' },
    })
        .lean();
    res.json({
        roomChangeRequests: rows.map((r) => {
            let assignedRoom;
            const arid = r.assignedRoomId;
            if (arid &&
                typeof arid === 'object' &&
                !(arid instanceof mongoose.Types.ObjectId) &&
                '_id' in arid &&
                typeof arid.roomNumber === 'number') {
                const room = arid;
                const dz = room.dormId;
                const dname = dz && typeof dz === 'object' && !(dz instanceof mongoose.Types.ObjectId) && 'name' in dz
                    ? String(dz.name ?? '—')
                    : '—';
                assignedRoom = { dormName: dname, roomNumber: room.roomNumber };
            }
            return {
                _id: String(r._id),
                reason: r.reason,
                preferences: r.preferences,
                status: r.status,
                resolution: r.resolution,
                createdAt: r.createdAt?.toISOString(),
                resolvedAt: r.resolvedAt?.toISOString(),
                ...(assignedRoom ? { assignedRoom } : {}),
            };
        }),
    });
});
const storageBody = z.object({
    description: z.string().min(5),
    summerPeriodLabel: z.string().optional(),
});
dailyRouter.post('/storage-requests', async (req, res) => {
    const parsed = storageBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    const doc = await StorageRequest.create({
        userId: req.user.id,
        ...parsed.data,
        status: 'pending',
    });
    void notifyUsersWithRoles(['admin', 'staff', 'accountant'], 'Агуулах', 'Шинэ агуулахын хүсэлт ирлээ.', '/admin');
    res.status(201).json({ storageRequest: doc });
});
dailyRouter.get('/storage-requests/my', async (req, res) => {
    const rows = await StorageRequest.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ storageRequests: rows });
});
//# sourceMappingURL=daily.routes.js.map