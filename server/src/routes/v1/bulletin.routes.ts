import { Router } from 'express'
import mongoose from 'mongoose'
import { z } from 'zod'
import { Bulletin, BULLETIN_TYPES } from '../../models/Bulletin.model.js'
import { authenticate, requireRoles, type AuthedRequest } from '../../middleware/auth.middleware.js'

export const bulletinRouter = Router()
bulletinRouter.use(authenticate)
bulletinRouter.use(requireRoles('student', 'admin', 'staff'))

/** Нийтийн самбарын зарууд */
bulletinRouter.get('/', async (req: AuthedRequest, res) => {
  const q = z.object({
    type: z.enum([...BULLETIN_TYPES, 'all'] as [string, ...string[]]).optional().default('all'),
    limit: z.coerce.number().min(1).max(100).optional().default(50),
    skip: z.coerce.number().min(0).optional().default(0),
  }).safeParse(req.query)
  if (!q.success) {
    res.status(400).json({ error: q.error.flatten() })
    return
  }
  const now = new Date()
  const filter: Record<string, unknown> = {
    isActive: true,
    $or: [{ expiresAt: { $gte: now } }, { expiresAt: null }],
  }
  if (q.data.type !== 'all') filter.type = q.data.type

  const [total, items] = await Promise.all([
    Bulletin.countDocuments(filter),
    Bulletin.find(filter)
      .populate('userId', 'firstName lastName studentId')
      .sort({ createdAt: -1 })
      .skip(q.data.skip)
      .limit(q.data.limit)
      .lean(),
  ])
  res.json({ items, total })
})

/** Миний зарууд */
bulletinRouter.get('/my', async (req: AuthedRequest, res) => {
  const rows = await Bulletin.find({ userId: req.user!.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean()
  res.json({ items: rows })
})

const bulletinBody = z.object({
  type: z.enum(BULLETIN_TYPES),
  title: z.string().min(3).max(200),
  body: z.string().min(5).max(2000),
  contactPhone: z.string().max(20).optional(),
  price: z.number().min(0).optional(),
  expiresInDays: z.number().int().min(1).max(30).optional().default(14),
})

/** Шинэ зар нийтлэх */
bulletinRouter.post('/', async (req: AuthedRequest, res) => {
  const body = bulletinBody.safeParse(req.body)
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() })
    return
  }
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + body.data.expiresInDays)

  const item = await Bulletin.create({
    userId: req.user!.id,
    type: body.data.type,
    title: body.data.title,
    body: body.data.body,
    contactPhone: body.data.contactPhone,
    price: body.data.price,
    expiresAt,
    isActive: true,
  })
  res.status(201).json({ item })
})

/** Зар идэвхгүй болгох (устгах) */
bulletinRouter.delete('/:id', async (req: AuthedRequest, res) => {
  const params = z.object({ id: z.string() }).safeParse(req.params)
  if (!params.success || !mongoose.isValidObjectId(params.data.id)) {
    res.status(400).json({ error: 'Invalid id' })
    return
  }
  const item = await Bulletin.findOne({
    _id: params.data.id,
    $or: [{ userId: req.user!.id }, { role: { $in: ['admin', 'staff'] } }],
  })
  if (!item) {
    res.status(404).json({ error: 'Зар олдсонгүй' })
    return
  }
  if (String(item.userId) !== req.user!.id && !['admin', 'staff'].includes(req.user!.role)) {
    res.status(403).json({ error: 'Зөвхөн өөрийн зарыг устгана' })
    return
  }
  item.isActive = false
  await item.save()
  res.json({ ok: true })
})
