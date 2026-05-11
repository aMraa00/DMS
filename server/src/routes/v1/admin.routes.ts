import { Router } from 'express'
import mongoose from 'mongoose'
import { z } from 'zod'
import { Dorm } from '../../models/Dorm.model.js'
import { ExitRequest } from '../../models/ExitRequest.model.js'
import { Payment } from '../../models/Payment.model.js'
import { RoomApplication } from '../../models/RoomApplication.model.js'
import { Room } from '../../models/Room.model.js'
import { Contract } from '../../models/Contract.model.js'
import { RoomChangeRequest } from '../../models/RoomChangeRequest.model.js'
import { User } from '../../models/User.model.js'
import { Violation } from '../../models/Violation.model.js'
import { Warning } from '../../models/Warning.model.js'
import { authenticate, requireRoles, type AuthedRequest } from '../../middleware/auth.middleware.js'
import {
  broadcastInAppNotifications,
  createInAppNotification,
} from '../../services/notification.service.js'
import { moveStudentContractToRoom } from '../../services/move-contract-room.service.js'
import {
  adminAssignStudentToDutyRoster,
  adminRemoveDutyRosterEntry,
  adminSetDutyRosterOrder,
  adminSwapDutyRosterAdjacent,
  appendStudentIfMissingToDutyRoster,
  previewDutyWeekCampus,
  rosterAllEntriesForAdmin,
  syncActiveStudentsOntoDutyRoster,
} from '../../services/duty-roster.service.js'
import { stubCreateContract } from './contract.routes.js'

export const adminRouter = Router()
adminRouter.use(authenticate)
adminRouter.use(requireRoles('admin', 'staff', 'accountant'))

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function serializeAdminUser(u: {
  _id: unknown
  email?: string
  firstName?: string
  lastName?: string
  studentId?: string
  registerNumber?: string
  phone?: string
  role?: string
  status?: string
  isDisabled?: boolean
  westLoginName?: string
  level?: string
  region?: string
  gender?: string
  school?: string
  program?: string
  createdAt?: Date
  updatedAt?: Date
}) {
  return {
    _id: String(u._id),
    email: u.email ?? '',
    firstName: u.firstName ?? '',
    lastName: u.lastName ?? '',
    studentId: u.studentId,
    registerNumber: u.registerNumber,
    phone: u.phone,
    role: u.role ?? 'student',
    status: u.status ?? 'active',
    isDisabled: Boolean(u.isDisabled),
    westLoginName: u.westLoginName,
    level: u.level,
    region: u.region,
    gender: u.gender,
    school: u.school,
    program: u.program,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }
}

adminRouter.get('/users', async (req: AuthedRequest, res) => {
  const q = z
    .object({
      search: z.string().trim().max(120).optional(),
      role: z.enum(['all', 'student', 'staff', 'admin', 'accountant']).optional().default('all'),
      status: z.enum(['all', 'active', 'inactive']).optional().default('all'),
      limit: z.coerce.number().min(1).max(200).optional().default(80),
      skip: z.coerce.number().min(0).max(50_000).optional().default(0),
    })
    .safeParse(req.query)
  if (!q.success) {
    res.status(400).json({ error: q.error.flatten() })
    return
  }

  const and: Record<string, unknown>[] = []
  if (q.data.role !== 'all') {
    and.push({ role: q.data.role })
  }
  if (q.data.status === 'active') {
    and.push({ status: 'active', $nor: [{ isDisabled: true }] })
  } else if (q.data.status === 'inactive') {
    and.push({
      $or: [{ status: { $ne: 'active' } }, { isDisabled: true }],
    })
  }

  const search = q.data.search?.trim()
  if (search && search.length > 0) {
    const rx = new RegExp(escapeRegex(search), 'i')
    and.push({
      $or: [
        { email: rx },
        { firstName: rx },
        { lastName: rx },
        { studentId: rx },
        { registerNumber: rx },
        { westLoginName: rx },
      ],
    })
  }

  const filter = and.length > 0 ? { $and: and } : {}

  const [total, rows] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .sort({ updatedAt: -1 })
      .skip(q.data.skip)
      .limit(q.data.limit)
      .select(
        'email firstName lastName studentId registerNumber phone role status isDisabled westLoginName level region gender school program createdAt updatedAt',
      )
      .lean(),
  ])

  res.json({
    users: rows.map((row) =>
      serializeAdminUser(row as Parameters<typeof serializeAdminUser>[0]),
    ),
    total,
    skip: q.data.skip,
    limit: q.data.limit,
  })
})

const adminUserActionBody = z.object({
  action: z.enum(['activate', 'suspend']),
})

adminRouter.patch('/users/:id', async (req: AuthedRequest, res) => {
  if (req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Зөвхөн админ энэ үйлдлийг хийнэ' })
    return
  }
  const params = z.object({ id: z.string() }).safeParse(req.params)
  const body = adminUserActionBody.safeParse(req.body ?? {})
  if (!params.success || !mongoose.isValidObjectId(params.data.id)) {
    res.status(400).json({ error: 'Invalid id' })
    return
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() })
    return
  }
  if (req.user!.id === params.data.id) {
    res.status(400).json({ error: 'Өөрийн бүртгэлийг эндээс өөрчилж болохгүй' })
    return
  }

  const doc = await User.findById(params.data.id)
  if (!doc) {
    res.status(404).json({ error: 'Хэрэглэгч олдсонгүй' })
    return
  }
  if (doc.role === 'admin') {
    res.status(403).json({ error: 'Админ эрхтэй хэрэглэгчийн төлөв өөрчлөхгүй' })
    return
  }

  if (body.data.action === 'activate') {
    doc.status = 'active'
    doc.isDisabled = false
    if (doc.role === 'student') {
      void appendStudentIfMissingToDutyRoster(doc._id)
    }
  } else {
    doc.status = 'suspended'
    doc.isDisabled = true
  }
  await doc.save()

  const fresh = await User.findById(doc._id)
    .select(
      'email firstName lastName studentId registerNumber phone role status isDisabled westLoginName level region gender school program createdAt updatedAt',
    )
    .lean()
  res.json({
    ok: true,
    user: fresh
      ? serializeAdminUser(fresh as Parameters<typeof serializeAdminUser>[0])
      : serializeAdminUser(doc.toObject()),
  })
})

adminRouter.get('/pending-overview', async (_req: AuthedRequest, res) => {
  const applications = await RoomApplication.find({
    status: { $in: ['priority_window', 'payment_pending', 'paid', 'contract_pending'] },
  })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean()

  const pendingSignatures = await Contract.find({ status: 'pending_sign' })
    .sort({ updatedAt: -1 })
    .limit(100)
    .lean()

  res.json({
    applications: applications.map((a) => ({ ...a, _id: String(a._id), userId: String(a.userId) })),
    contractsPendingSignature: pendingSignatures.map((c) => ({
      ...c,
      _id: String(c._id),
      userId: String(c.userId),
      roomId: String(c.roomId),
    })),
  })
})

adminRouter.get('/payments/overview', async (req: AuthedRequest, res) => {
  const q = z
    .object({
      limit: z.coerce.number().min(1).max(500).optional().default(100),
    })
    .safeParse(req.query)
  if (!q.success) {
    res.status(400).json({ error: q.error.flatten() })
    return
  }
  const rows = await Payment.find({})
    .populate('userId', 'studentId firstName lastName')
    .sort({ createdAt: -1 })
    .limit(q.data.limit)
    .lean()
  res.json({ payments: rows })
})

function serializeExitRow(r: {
  _id: unknown
  userId: unknown
  requestedExitDate: Date
  reason: string
  status: string
  approvedBy?: unknown
  adminNote?: string
  reviewedAt?: Date
  createdAt?: Date
  updatedAt?: Date
}) {
  const uid = r.userId as Record<string, unknown> | mongoose.Types.ObjectId | null | undefined
  const populated =
    uid && typeof uid === 'object' && '_id' in uid && !(uid instanceof mongoose.Types.ObjectId)

  let userBrief: Record<string, string | undefined> | null = null
  if (populated) {
    const u = uid as Record<string, unknown>
    userBrief = {
      id: String(u._id),
      studentId: u.studentId != null ? String(u.studentId) : undefined,
      registerNumber: u.registerNumber != null ? String(u.registerNumber) : undefined,
      firstName: u.firstName != null ? String(u.firstName) : undefined,
      lastName: u.lastName != null ? String(u.lastName) : undefined,
      email: u.email != null ? String(u.email) : undefined,
    }
  }

  return {
    _id: String(r._id),
    userId: populated ? String((uid as { _id: unknown })._id) : String(r.userId),
    user: userBrief,
    requestedExitDate: r.requestedExitDate,
    reason: r.reason,
    status: r.status,
    approvedBy: r.approvedBy ? String(r.approvedBy) : undefined,
    adminNote: r.adminNote,
    reviewedAt: r.reviewedAt,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }
}

adminRouter.get('/exit-requests', async (req: AuthedRequest, res) => {
  const q = z
    .object({
      status: z.enum(['all', 'pending', 'approved', 'rejected']).optional().default('all'),
    })
    .safeParse(req.query)
  if (!q.success) {
    res.status(400).json({ error: q.error.flatten() })
    return
  }
  const filter = q.data.status === 'all' ? {} : { status: q.data.status }
  const rows = await ExitRequest.find(filter)
    .populate('userId', 'studentId registerNumber firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(200)
    .lean()

  const pendingCount = await ExitRequest.countDocuments({ status: 'pending' })
  res.json({
    exitRequests: rows.map((r) => serializeExitRow(r as Parameters<typeof serializeExitRow>[0])),
    pendingCount,
  })
})

adminRouter.post('/exit-requests/:id/approve', async (req: AuthedRequest, res) => {
  const params = z.object({ id: z.string() }).safeParse(req.params)
  if (!params.success || !mongoose.isValidObjectId(params.data.id)) {
    res.status(400).json({ error: 'Invalid id' })
    return
  }
  const doc = await ExitRequest.findById(params.data.id)
  if (!doc || doc.status !== 'pending') {
    res.status(404).json({ error: 'Хүсэлт олдсонгүй эсвэл аль хэдийн шийдвэрлэгдсэн' })
    return
  }
  doc.status = 'approved'
  doc.approvedBy = new mongoose.Types.ObjectId(req.user!.id)
  doc.reviewedAt = new Date()
  doc.adminNote = undefined
  await doc.save()
  void createInAppNotification(
    String(doc.userId),
    'Байраас гарах',
    'Таны хүсэлт зөвшөөрөгдсөн.',
    '/daily',
  )
  res.json({ ok: true, exitRequest: serializeExitRow(doc.toObject()) })
})

const rejectExitBody = z.object({
  note: z.string().min(5).max(800),
})

adminRouter.post('/exit-requests/:id/reject', async (req: AuthedRequest, res) => {
  const params = z.object({ id: z.string() }).safeParse(req.params)
  const body = rejectExitBody.safeParse(req.body)
  if (!params.success || !mongoose.isValidObjectId(params.data.id)) {
    res.status(400).json({ error: 'Invalid id' })
    return
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() })
    return
  }
  const doc = await ExitRequest.findById(params.data.id)
  if (!doc || doc.status !== 'pending') {
    res.status(404).json({ error: 'Хүсэлт олдсонгүй эсвэл аль хэдийн шийдвэрлэгдсэн' })
    return
  }
  doc.status = 'rejected'
  doc.approvedBy = new mongoose.Types.ObjectId(req.user!.id)
  doc.reviewedAt = new Date()
  doc.adminNote = body.data.note
  await doc.save()
  void createInAppNotification(
    String(doc.userId),
    'Байраас гарах',
    `Татгалзсан. Тайлбар: ${body.data.note.slice(0, 200)}`,
    '/daily',
  )
  res.json({ ok: true, exitRequest: serializeExitRow(doc.toObject()) })
})

function serializeRoomChangeRow(r: {
  _id: unknown
  userId: unknown
  assignedRoomId?: unknown
  reason: string
  preferences?: string
  status: string
  resolution?: string
  resolvedAt?: Date
  createdAt?: Date
  updatedAt?: Date
}) {
  const uid = r.userId as Record<string, unknown> | mongoose.Types.ObjectId | null | undefined
  const populated =
    uid && typeof uid === 'object' && '_id' in uid && !(uid instanceof mongoose.Types.ObjectId)

  let userBrief: Record<string, string | undefined> | null = null
  if (populated) {
    const u = uid as Record<string, unknown>
    userBrief = {
      id: String(u._id),
      studentId: u.studentId != null ? String(u.studentId) : undefined,
      registerNumber: u.registerNumber != null ? String(u.registerNumber) : undefined,
      firstName: u.firstName != null ? String(u.firstName) : undefined,
      lastName: u.lastName != null ? String(u.lastName) : undefined,
      email: u.email != null ? String(u.email) : undefined,
    }
  }

  const rid = r.assignedRoomId as Record<string, unknown> | mongoose.Types.ObjectId | null | undefined
  const assignedPopulated =
    rid && typeof rid === 'object' && '_id' in rid && !(rid instanceof mongoose.Types.ObjectId)

  let assignedBrief: {
    assignedRoomId: string
    assignedRoom: { dormName: string; roomNumber: number } | null
  } | undefined
  if (assignedPopulated) {
    const room = rid as { roomNumber?: unknown; dormId?: unknown }
    const did = room.dormId
    const d =
      did && typeof did === 'object' && !(did instanceof mongoose.Types.ObjectId)
        ? (did as Record<string, unknown>)
        : undefined
    const dormNameRaw = d?.name
    const rn =
      typeof room.roomNumber === 'number' ? room.roomNumber : Number(room.roomNumber) || 0
    assignedBrief = {
      assignedRoomId: String((rid as { _id: unknown })._id),
      assignedRoom:
        rn > 0
          ? {
              dormName: dormNameRaw != null ? String(dormNameRaw) : '—',
              roomNumber: rn,
            }
          : null,
    }
  } else if (rid instanceof mongoose.Types.ObjectId) {
    assignedBrief = {
      assignedRoomId: String(rid),
      assignedRoom: null,
    }
  }

  return {
    _id: String(r._id),
    userId: populated ? String((uid as { _id: unknown })._id) : String(r.userId),
    user: userBrief,
    reason: r.reason,
    preferences: r.preferences,
    status: r.status,
    resolution: r.resolution,
    resolvedAt: r.resolvedAt,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    assignedRoomId: assignedBrief?.assignedRoomId,
    assignedRoom: assignedBrief ? assignedBrief.assignedRoom : null,
  }
}

adminRouter.get('/rooms-for-assignment', async (_req: AuthedRequest, res) => {
  const rooms = await Room.find({})
    .sort({ dormId: 1, roomNumber: 1 })
    .limit(500)
    .lean()
  const dormIds = [...new Set(rooms.map((x) => String(x.dormId)))]
  const dorms = await Dorm.find({ _id: { $in: dormIds } })
    .select('name genderType')
    .lean()
  const dm = new Map(dorms.map((d) => [String(d._id), d]))
  res.json({
    rooms: rooms.map((room) => {
      const d = dm.get(String(room.dormId))
      return {
        id: String(room._id),
        roomNumber: room.roomNumber,
        dormId: String(room.dormId),
        dormName: d?.name ?? '—',
        dormGenderType: (d?.genderType as 'M' | 'F' | 'MIXED' | undefined) ?? 'MIXED',
        currentOccupancy: room.currentOccupancy ?? 0,
        maxOccupancy: room.maxOccupancy ?? 0,
        status: room.status,
      }
    }),
  })
})

adminRouter.get('/room-change-requests', async (req: AuthedRequest, res) => {
  const q = z
    .object({
      status: z.enum(['all', 'pending', 'resolved', 'rejected']).optional().default('all'),
    })
    .safeParse(req.query)
  if (!q.success) {
    res.status(400).json({ error: q.error.flatten() })
    return
  }
  const filter = q.data.status === 'all' ? {} : { status: q.data.status }
  const rows = await RoomChangeRequest.find(filter)
    .populate('userId', 'studentId registerNumber firstName lastName email')
    .populate({
      path: 'assignedRoomId',
      select: 'roomNumber dormId',
      populate: { path: 'dormId', select: 'name genderType', model: 'Dorm' },
    })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean()

  const pendingCount = await RoomChangeRequest.countDocuments({ status: 'pending' })
  res.json({
    roomChangeRequests: rows.map((r) =>
      serializeRoomChangeRow(r as Parameters<typeof serializeRoomChangeRow>[0]),
    ),
    pendingCount,
  })
})

const roomChangeResolveBody = z.object({
  note: z.string().trim().max(1200).optional(),
  /** Шилжүүлэх шинэ өрөө (шаардлагатай) — энэ нь `/contracts/me` дээрх өрөөнөө шинэчилнэ */
  assignedRoomId: z.string().trim().min(1),
})

adminRouter.post('/room-change-requests/:id/resolve', async (req: AuthedRequest, res) => {
  const params = z.object({ id: z.string() }).safeParse(req.params)
  const body = roomChangeResolveBody.safeParse(req.body ?? {})
  if (!params.success || !mongoose.isValidObjectId(params.data.id)) {
    res.status(400).json({ error: 'Invalid id' })
    return
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() })
    return
  }
  const doc = await RoomChangeRequest.findById(params.data.id)
  if (!doc || doc.status !== 'pending') {
    res.status(404).json({ error: 'Хүсэлт олдсонгүй эсвэл аль хэдийн шийдвэрлэгдсэн' })
    return
  }
  const roomOid = body.data.assignedRoomId
  if (!mongoose.isValidObjectId(roomOid)) {
    res.status(400).json({ error: 'Шинэ өрөө сонгох хэрэгтэй (assignedRoomId)' })
    return
  }

  const move = await moveStudentContractToRoom(String(doc.userId), roomOid)
  if (!move.ok) {
    res.status(move.status).json({ error: move.message })
    return
  }

  doc.status = 'resolved'
  doc.resolvedAt = new Date()
  doc.resolution =
    body.data.note != null && body.data.note.length > 0 ? body.data.note : 'Шийдвэрлэгдлээ.'
  doc.reviewedBy = new mongoose.Types.ObjectId(req.user!.id)
  doc.assignedRoomId = new mongoose.Types.ObjectId(roomOid)
  await doc.save()
  void createInAppNotification(
    String(doc.userId),
    'Өрөө солих',
    'Таны систем дээрх өрөө шинэчлэгдлээ. Лавлагаа хэсгээсээ шалгана уу.',
    '/room-change',
  )
  const refreshed = await RoomChangeRequest.findById(doc._id)
    .populate('userId', 'studentId registerNumber firstName lastName email')
    .populate({
      path: 'assignedRoomId',
      select: 'roomNumber dormId',
      populate: { path: 'dormId', select: 'name genderType', model: 'Dorm' },
    })
    .lean()
  res.json({
    ok: true,
    roomChangeRequest: refreshed
      ? serializeRoomChangeRow(refreshed as Parameters<typeof serializeRoomChangeRow>[0])
      : null,
  })
})

const roomChangeRejectBody = z.object({
  note: z.string().trim().min(5).max(1200),
})

adminRouter.post('/room-change-requests/:id/reject', async (req: AuthedRequest, res) => {
  const params = z.object({ id: z.string() }).safeParse(req.params)
  const body = roomChangeRejectBody.safeParse(req.body)
  if (!params.success || !mongoose.isValidObjectId(params.data.id)) {
    res.status(400).json({ error: 'Invalid id' })
    return
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() })
    return
  }
  const doc = await RoomChangeRequest.findById(params.data.id)
  if (!doc || doc.status !== 'pending') {
    res.status(404).json({ error: 'Хүсэлт олдсонгүй эсвэл аль хэдийн шийдвэрлэгдсэн' })
    return
  }
  doc.status = 'rejected'
  doc.resolvedAt = new Date()
  doc.resolution = body.data.note
  doc.reviewedBy = new mongoose.Types.ObjectId(req.user!.id)
  await doc.save()
  void createInAppNotification(
    String(doc.userId),
    'Өрөө солих',
    `Татгалзсан. Тайлбар: ${body.data.note.slice(0, 200)}`,
    '/room-change',
  )
  const refreshed = await RoomChangeRequest.findById(doc._id)
    .populate('userId', 'studentId registerNumber firstName lastName email')
    .populate({
      path: 'assignedRoomId',
      select: 'roomNumber dormId',
      populate: { path: 'dormId', select: 'name genderType', model: 'Dorm' },
    })
    .lean()
  res.json({
    ok: true,
    roomChangeRequest: refreshed
      ? serializeRoomChangeRow(refreshed as Parameters<typeof serializeRoomChangeRow>[0])
      : null,
  })
})

const adminBroadcastBody = z
  .object({
    title: z.string().trim().min(1).max(200),
    message: z.string().trim().min(5).max(4000),
    audience: z.enum(['students', 'all']).optional().default('students'),
    link: z.string().trim().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    const ln = data.link?.trim()
    if (ln && ln.length > 0 && !ln.startsWith('/')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Холбоос нь /-ээр эхлэх ёстой (ж: /dashboard)',
        path: ['link'],
      })
    }
  })

/** Bulk exit-request approve */
adminRouter.post('/exit-requests/bulk-approve', async (req: AuthedRequest, res) => {
  const body = z.object({ ids: z.array(z.string()).min(1).max(50) }).safeParse(req.body)
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() })
    return
  }
  const validIds = body.data.ids.filter((id) => mongoose.isValidObjectId(id))
  const docs = await ExitRequest.find({ _id: { $in: validIds }, status: 'pending' })
  await Promise.all(
    docs.map(async (doc) => {
      doc.status = 'approved'
      doc.approvedBy = new mongoose.Types.ObjectId(req.user!.id)
      doc.reviewedAt = new Date()
      await doc.save()
      void createInAppNotification(String(doc.userId), 'Байраас гарах', 'Таны хүсэлт зөвшөөрөгдсөн.', '/daily')
    }),
  )
  res.json({ ok: true, updated: docs.length })
})

/** Bulk exit-request reject */
adminRouter.post('/exit-requests/bulk-reject', async (req: AuthedRequest, res) => {
  const body = z.object({ ids: z.array(z.string()).min(1).max(50), note: z.string().min(3).max(800) }).safeParse(req.body)
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() })
    return
  }
  const validIds = body.data.ids.filter((id) => mongoose.isValidObjectId(id))
  const docs = await ExitRequest.find({ _id: { $in: validIds }, status: 'pending' })
  await Promise.all(
    docs.map(async (doc) => {
      doc.status = 'rejected'
      doc.approvedBy = new mongoose.Types.ObjectId(req.user!.id)
      doc.reviewedAt = new Date()
      doc.adminNote = body.data.note
      await doc.save()
      void createInAppNotification(String(doc.userId), 'Байраас гарах', `Татгалзсан. Тайлбар: ${body.data.note.slice(0, 200)}`, '/daily')
    }),
  )
  res.json({ ok: true, updated: docs.length })
})

/** Bulk room-change resolve */
adminRouter.post('/room-change-requests/bulk-resolve', async (req: AuthedRequest, res) => {
  const body = z.object({ ids: z.array(z.string()).min(1).max(50), note: z.string().trim().max(1200).optional() }).safeParse(req.body)
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() })
    return
  }
  const validIds = body.data.ids.filter((id) => mongoose.isValidObjectId(id))
  const docs = await RoomChangeRequest.find({ _id: { $in: validIds }, status: 'pending' })
  const resolution = body.data.note?.length ? body.data.note : 'Шийдвэрлэгдлээ.'
  await Promise.all(
    docs.map(async (doc) => {
      doc.status = 'resolved'
      doc.resolvedAt = new Date()
      doc.resolution = resolution
      doc.reviewedBy = new mongoose.Types.ObjectId(req.user!.id)
      await doc.save()
      void createInAppNotification(String(doc.userId), 'Өрөө солих', resolution.slice(0, 220), '/room-change')
    }),
  )
  res.json({ ok: true, updated: docs.length })
})

/** Admin: гэрээ гараар үүсгэх (төлбөрийн дараа автоматаар үүсдэггүй тохиолдолд) */
adminRouter.post('/contracts/create', async (req: AuthedRequest, res) => {
  if (req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Зөвхөн админ' })
    return
  }
  const body = z.object({
    userId: z.string(),
    roomId: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    isHalfYear: z.boolean().optional().default(false),
  }).safeParse(req.body)
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() })
    return
  }
  const existing = await Contract.findOne({ userId: body.data.userId, status: { $in: ['pending_sign', 'active'] } })
  if (existing) {
    res.status(409).json({ error: 'Энэ оюутанд идэвхтэй гэрээ байна', contractId: String(existing._id) })
    return
  }
  const contract = await stubCreateContract({
    userId: body.data.userId,
    roomId: body.data.roomId,
    startDate: new Date(body.data.startDate),
    endDate: new Date(body.data.endDate),
    isHalfYear: body.data.isHalfYear,
  })
  void createInAppNotification(body.data.userId, 'Шинэ гэрээ', 'Танд гэрээ үүслээ. 7 хоногийн дотор гарын үсэг зурна уу.', '/contract')
  res.status(201).json({ ok: true, contractId: String(contract._id) })
})

/** Violation жагсаалт */
adminRouter.get('/violations', async (req: AuthedRequest, res) => {
  const q = z.object({
    userId: z.string().optional(),
    type: z.enum(['all', 'WARN', 'CANCEL']).optional().default('all'),
    limit: z.coerce.number().min(1).max(200).optional().default(100),
    skip: z.coerce.number().min(0).optional().default(0),
  }).safeParse(req.query)
  if (!q.success) {
    res.status(400).json({ error: q.error.flatten() })
    return
  }
  const filter: Record<string, unknown> = {}
  if (q.data.type !== 'all') filter.type = q.data.type
  if (q.data.userId && mongoose.isValidObjectId(q.data.userId)) filter.userId = q.data.userId

  const [total, rows] = await Promise.all([
    Violation.countDocuments(filter),
    Violation.find(filter)
      .populate('userId', 'studentId firstName lastName email')
      .populate('reportedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(q.data.skip)
      .limit(q.data.limit)
      .lean(),
  ])
  res.json({ violations: rows, total })
})

const violationBody = z.object({
  userId: z.string(),
  contractId: z.string().optional(),
  type: z.enum(['WARN', 'CANCEL']),
  category: z.string().min(2).max(200),
  description: z.string().min(5).max(2000),
  violatedAt: z.string().optional(),
})

/** Violation бүртгэх */
adminRouter.post('/violations', async (req: AuthedRequest, res) => {
  const body = violationBody.safeParse(req.body)
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() })
    return
  }
  if (!mongoose.isValidObjectId(body.data.userId)) {
    res.status(400).json({ error: 'Invalid userId' })
    return
  }
  const violation = await Violation.create({
    userId: body.data.userId,
    contractId: body.data.contractId && mongoose.isValidObjectId(body.data.contractId) ? body.data.contractId : undefined,
    type: body.data.type,
    category: body.data.category,
    description: body.data.description,
    violatedAt: body.data.violatedAt ? new Date(body.data.violatedAt) : new Date(),
    reportedBy: req.user!.id,
  })

  if (body.data.type === 'WARN') {
    const prevWarnings = await Warning.countDocuments({ userId: body.data.userId })
    const warningNumber = (prevWarnings % 2) + 1
    const warning = await Warning.create({
      violationId: violation._id,
      userId: body.data.userId,
      warningNumber,
      issuedBy: req.user!.id,
    })
    void createInAppNotification(
      body.data.userId,
      `Сануулга #${warningNumber}`,
      `${body.data.category}: ${body.data.description.slice(0, 200)}`,
      '/dashboard',
    )
    res.status(201).json({ ok: true, violation, warning })
    return
  }

  void createInAppNotification(body.data.userId, 'Зөрчил бүртгэгдлээ', body.data.description.slice(0, 200), '/dashboard')
  res.status(201).json({ ok: true, violation })
})

/** Violation-ы warnings жагсаалт */
adminRouter.get('/violations/:id/warnings', async (req: AuthedRequest, res) => {
  const params = z.object({ id: z.string() }).safeParse(req.params)
  if (!params.success || !mongoose.isValidObjectId(params.data.id)) {
    res.status(400).json({ error: 'Invalid id' })
    return
  }
  const warnings = await Warning.find({ violationId: params.data.id })
    .populate('issuedBy', 'firstName lastName')
    .lean()
  res.json({ warnings })
})

/** Хэрэглэгчийн violations */
adminRouter.get('/users/:id/violations', async (req: AuthedRequest, res) => {
  const params = z.object({ id: z.string() }).safeParse(req.params)
  if (!params.success || !mongoose.isValidObjectId(params.data.id)) {
    res.status(400).json({ error: 'Invalid id' })
    return
  }
  const [violations, warnings] = await Promise.all([
    Violation.find({ userId: params.data.id }).sort({ createdAt: -1 }).lean(),
    Warning.find({ userId: params.data.id }).sort({ issuedAt: -1 }).lean(),
  ])
  res.json({ violations, warnings })
})

adminRouter.post('/notifications/broadcast', async (req: AuthedRequest, res) => {
  const parsed = adminBroadcastBody.safeParse(req.body ?? {})
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }
  const linkRaw = parsed.data.link?.trim()
  const link = linkRaw && linkRaw.length > 0 ? linkRaw : undefined
  const { recipientCount } = await broadcastInAppNotifications({
    title: parsed.data.title,
    message: parsed.data.message,
    audience: parsed.data.audience,
    link,
  })
  res.json({ ok: true, recipientCount })
})

adminRouter.get('/duty/roster', async (_req: AuthedRequest, res) => {
  const entries = await rosterAllEntriesForAdmin()
  const eligibleActive = entries.filter((e) => e.rosterEligibleDuty).length
  res.json({ entries, eligibleActive })
})

adminRouter.get('/duty/preview-week', async (req: AuthedRequest, res) => {
  const q = z
    .object({ days: z.coerce.number().min(1).max(42).optional().default(14) })
    .safeParse(req.query)
  if (!q.success) {
    res.status(400).json({ error: q.error.flatten() })
    return
  }
  const schedule = await previewDutyWeekCampus(q.data.days ?? 14)
  res.json({ schedule })
})

adminRouter.post('/duty/sync-roster-from-students', async (_req: AuthedRequest, res) => {
  const summary = await syncActiveStudentsOntoDutyRoster()
  res.json({ ok: true, ...summary })
})

const dutyMemberAddBody = z
  .object({
    userId: z.string().trim().optional(),
    studentId: z.string().trim().optional(),
  })
  .refine((o) => Boolean((o.userId && o.userId.length > 0) || (o.studentId && o.studentId.length > 0)), {
    message: 'userId эсвэл studentId заавал',
  })

adminRouter.post('/duty/roster/members', async (req: AuthedRequest, res) => {
  if (req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Зөвхөн админ жижүүрийн жагсаалт өөрчилнө' })
    return
  }
  const parsed = dutyMemberAddBody.safeParse(req.body ?? {})
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  let targetUserId: string | undefined
  if (parsed.data.userId && parsed.data.userId.length > 0) {
    if (!mongoose.isValidObjectId(parsed.data.userId)) {
      res.status(400).json({ error: 'Хүчингүй userId' })
      return
    }
    targetUserId = parsed.data.userId
  }
  if (!targetUserId && parsed.data.studentId && parsed.data.studentId.length > 0) {
    const u = await User.findOne({ studentId: parsed.data.studentId })
      .select('_id role')
      .lean()
    if (!u) {
      res.status(404).json({ error: 'Оюутны код энэ кодтой этгээд системд алга.' })
      return
    }
    if (u.role !== 'student') {
      res.status(400).json({ error: 'Зөвхөн оюутанд жижүүрийг томилно' })
      return
    }
    targetUserId = String(u._id)
  }

  if (!targetUserId) {
    res.status(400).json({ error: 'Оюутан сонгогдоогүй' })
    return
  }

  const result = await adminAssignStudentToDutyRoster(targetUserId)
  if (!result.ok) {
    const map: Record<string, number> = {
      not_found: 404,
      not_student: 400,
      duplicate: 409,
      invalid_id: 400,
    }
    const msg =
      result.error === 'duplicate'
        ? 'Энэ оюутан аль хэдийн жагсаалтад бүртгэгдсэн байна.'
        : result.error === 'not_student'
          ? 'Зөвхөн оюутанд жижүүрийг томилно.'
          : 'Алдаа'
    res.status(map[result.error] ?? 400).json({ error: msg })
    return
  }
  res.status(201).json({ ok: true, entryId: result.entryId, sequence: result.sequence })
})

adminRouter.delete('/duty/roster/members/:entryId', async (req: AuthedRequest, res) => {
  if (req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Зөвхөн админ жижүүрийн жагсаалт өөрчилнө' })
    return
  }
  const params = z.object({ entryId: z.string().min(1) }).safeParse(req.params)
  if (!params.success || !mongoose.isValidObjectId(params.data.entryId)) {
    res.status(400).json({ error: 'Хүчингүй бичлгийн Id' })
    return
  }
  const result = await adminRemoveDutyRosterEntry(params.data.entryId)
  if (!result.ok) {
    const status = result.error === 'not_found' ? 404 : 400
    res.status(status).json({ error: result.error === 'not_found' ? 'Олдсонгүй' : 'Алдаа' })
    return
  }
  res.json({ ok: true })
})

const dutyRosterOrderBody = z.object({
  entryIds: z.array(z.string()).superRefine((arr, ctx) => {
    if (!arr.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Хоосон массив' })
      return
    }
    for (const id of arr) {
      if (!mongoose.isValidObjectId(id))
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'ObjectId буруу' })
    }
  }),
})

adminRouter.put('/duty/roster/order', async (req: AuthedRequest, res) => {
  if (req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Зөвхөн админ жижүүрийн жагсаалт өөрчилнө' })
    return
  }
  const parsed = dutyRosterOrderBody.safeParse(req.body ?? {})
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }
  const result = await adminSetDutyRosterOrder(parsed.data.entryIds)
  if (!result.ok) {
    res.status(400).json({
      error: 'Дараалал буруу: бүх бичлгийн оролцооны тоо тохирсон Id-уудаар яг нэгэн зэрэг ачаална.',
    })
    return
  }
  res.json({ ok: true })
})

const dutyMoveBody = z.object({
  direction: z.enum(['up', 'down']),
})

adminRouter.patch('/duty/roster/members/:entryId/move', async (req: AuthedRequest, res) => {
  if (req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Зөвхөн админ жижүүрийн жагсаалт өөрчилнө' })
    return
  }
  const params = z.object({ entryId: z.string().min(1) }).safeParse(req.params)
  const body = dutyMoveBody.safeParse(req.body ?? {})
  if (!params.success || !mongoose.isValidObjectId(params.data.entryId)) {
    res.status(400).json({ error: 'Хүчингүй бичлгийн Id' })
    return
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.flatten() })
    return
  }
  const result = await adminSwapDutyRosterAdjacent(params.data.entryId, body.data.direction)
  if (!result.ok) {
    const status = result.error === 'not_found' ? 404 : 400
    res.status(status).json({ error: result.error === 'not_found' ? 'Олдсонгүй' : 'Алдаа' })
    return
  }
  res.json({ ok: true })
})
