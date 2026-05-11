import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import { z } from 'zod'
import { Contract } from '../../models/Contract.model.js'
import { Dorm } from '../../models/Dorm.model.js'
import { Room } from '../../models/Room.model.js'
import { authenticate, requireRoles, type AuthedRequest } from '../../middleware/auth.middleware.js'
import { createInAppNotification } from '../../services/notification.service.js'

export const contractRouter = Router()
contractRouter.use(authenticate)
contractRouter.use(requireRoles('student'))

/** Сүүлийн гэрээ (идэвхтэй эсвэл гарын үсэг хүлээж буй) */
contractRouter.get('/me', async (req: AuthedRequest, res) => {
  const c = await Contract.findOne({
    userId: req.user!.id,
    status: { $in: ['pending_sign', 'active'] },
  })
    .sort({ updatedAt: -1 })
    .lean()
  if (!c) {
    res.json({ contract: null })
    return
  }

  let roomSummary: { dormName: string; roomNumber: number } | null = null
  const room = await Room.findById(c.roomId).lean()
  if (room) {
    const dorm = await Dorm.findById(room.dormId).lean()
    roomSummary = {
      dormName: dorm?.name ?? '—',
      roomNumber: room.roomNumber,
    }
  }

  const now = new Date()
  const deadlineMs = c.signDeadlineAt ? new Date(c.signDeadlineAt).getTime() : null
  res.json({
    contract: {
      ...c,
      _id: String(c._id),
      userId: String(c.userId),
      roomId: String(c.roomId),
      signDeadlineAt: c.signDeadlineAt,
      daysLeftToSign:
        deadlineMs != null ? Math.max(0, Math.ceil((deadlineMs - now.getTime()) / 86_400_000)) : null,
      roomSummary,
    },
  })
})

/** Журмын 3.2.1 — цахим гарын үсэг (PNG/data URL дамжуулах) */
contractRouter.post('/:id/sign', async (req: AuthedRequest, res) => {
  const params = z.object({ id: z.string() }).safeParse(req.params)
  const body = z.object({ signatureDataUrl: z.string().min(20) }).safeParse(req.body)
  if (!params.success || !body.success) {
    res.status(400).json({ error: 'Invalid payload' })
    return
  }
  const contract = await Contract.findOne({
    _id: params.data.id,
    userId: req.user!.id,
    status: 'pending_sign',
  })
  if (!contract) {
    res.status(404).json({ error: 'Гэрээ олдсонгүй эсвэл аль хэдийн баталгаажсан' })
    return
  }
  if (contract.signDeadlineAt && contract.signDeadlineAt < new Date()) {
    contract.status = 'expired'
    await contract.save()
    res.status(400).json({ error: 'Гэрээний 7 хоногийн цонх дууссан' })
    return
  }
  contract.eSignature = body.data.signatureDataUrl
  contract.signedAt = new Date()
  contract.status = 'active'
  await contract.save()

  void createInAppNotification(
    String(contract.userId),
    'Гэрээ баталгаажлаа',
    'Таны цахим гарын үсэг хадгалагдлаа.',
    '/contract',
  )

  res.json({ ok: true, contractId: String(contract._id) })
})

/** Админ/систем – төлбөр батлагдсаны дараа дуудагдах жишээ (одоогоор seed/dev) */
export async function stubCreateContract(opts: {
  userId: string
  roomId: string
  startDate: Date
  endDate: Date
  isHalfYear: boolean
}) {
  const deadline = new Date()
  deadline.setDate(deadline.getDate() + 7)
  return Contract.create({
    contractNumber: `DMS-${Date.now().toString(36)}-${randomUUID().slice(0, 6)}`,
    userId: opts.userId,
    roomId: opts.roomId,
    startDate: opts.startDate,
    endDate: opts.endDate,
    isHalfYear: opts.isHalfYear,
    status: 'pending_sign',
    signDeadlineAt: deadline,
  })
}
