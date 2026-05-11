import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Inventory } from '../../models/Inventory.model.js';
import { authenticate, requireRoles } from '../../middleware/auth.middleware.js';
export const inventoryRouter = Router();
inventoryRouter.use(authenticate);
inventoryRouter.use(requireRoles('admin', 'staff'));
/** Өрөөний эд хогшлын жагсаалт */
inventoryRouter.get('/', async (req, res) => {
    const q = z.object({
        roomId: z.string().optional(),
        limit: z.coerce.number().min(1).max(500).optional().default(200),
        skip: z.coerce.number().min(0).optional().default(0),
    }).safeParse(req.query);
    if (!q.success) {
        res.status(400).json({ error: q.error.flatten() });
        return;
    }
    const filter = {};
    if (q.data.roomId && mongoose.isValidObjectId(q.data.roomId)) {
        filter.roomId = q.data.roomId;
    }
    const [total, items] = await Promise.all([
        Inventory.countDocuments(filter),
        Inventory.find(filter)
            .populate('roomId', 'roomNumber')
            .sort({ itemName: 1 })
            .skip(q.data.skip)
            .limit(q.data.limit)
            .lean(),
    ]);
    res.json({ items, total });
});
const inventoryBody = z.object({
    itemName: z.string().min(1).max(200),
    quantity: z.number().int().min(0),
    condition: z.string().min(1).max(100),
    unitPrice: z.number().min(0).optional().default(0),
    roomId: z.string(),
});
/** Шинэ эд хогшил бүртгэх */
inventoryRouter.post('/', async (req, res) => {
    const body = inventoryBody.safeParse(req.body);
    if (!body.success) {
        res.status(400).json({ error: body.error.flatten() });
        return;
    }
    if (!mongoose.isValidObjectId(body.data.roomId)) {
        res.status(400).json({ error: 'Invalid roomId' });
        return;
    }
    const item = await Inventory.create(body.data);
    res.status(201).json({ ok: true, item });
});
const inventoryPatchBody = z.object({
    itemName: z.string().min(1).max(200).optional(),
    quantity: z.number().int().min(0).optional(),
    condition: z.string().min(1).max(100).optional(),
    unitPrice: z.number().min(0).optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'Хамгийн багадаа нэг талбар шаардлагатай' });
/** Эд хогшлын мэдээлэл засах */
inventoryRouter.patch('/:id', async (req, res) => {
    const params = z.object({ id: z.string() }).safeParse(req.params);
    if (!params.success || !mongoose.isValidObjectId(params.data.id)) {
        res.status(400).json({ error: 'Invalid id' });
        return;
    }
    const body = inventoryPatchBody.safeParse(req.body);
    if (!body.success) {
        res.status(400).json({ error: body.error.flatten() });
        return;
    }
    const item = await Inventory.findByIdAndUpdate(params.data.id, body.data, { new: true });
    if (!item) {
        res.status(404).json({ error: 'Бүртгэл олдсонгүй' });
        return;
    }
    res.json({ ok: true, item });
});
/** Эд хогшлын бүртгэл устгах */
inventoryRouter.delete('/:id', async (req, res) => {
    if (req.user.role !== 'admin') {
        res.status(403).json({ error: 'Зөвхөн админ устгана' });
        return;
    }
    const params = z.object({ id: z.string() }).safeParse(req.params);
    if (!params.success || !mongoose.isValidObjectId(params.data.id)) {
        res.status(400).json({ error: 'Invalid id' });
        return;
    }
    const item = await Inventory.findByIdAndDelete(params.data.id);
    if (!item) {
        res.status(404).json({ error: 'Бүртгэл олдсонгүй' });
        return;
    }
    res.json({ ok: true });
});
//# sourceMappingURL=inventory.routes.js.map