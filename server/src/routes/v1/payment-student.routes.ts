import { Router } from 'express'
import { z } from 'zod'
import { Payment } from '../../models/Payment.model.js'
import { Refund } from '../../models/Refund.model.js'
import { CouncilMember } from '../../models/CouncilMember.model.js'
import { authenticate, requireRoles, type AuthedRequest } from '../../middleware/auth.middleware.js'
import { computeRefundPenalties, applyCouncilDiscount } from '../../services/penalty.service.js'
import {
  checkQpayPayment,
  createQpayForApplication,
  createQpayForPendingPayment,
  qpayCallback,
} from './payment-qpay.handlers.js'
import { notifyUsersWithRoles, createInAppNotification } from '../../services/notification.service.js'

export const paymentStudentRouter = Router()

/** QPay webhook — нийтэд (QPay серверээс) */
paymentStudentRouter.post('/qpay/callback', qpayCallback)

paymentStudentRouter.use(authenticate)

paymentStudentRouter.post('/qpay/create', requireRoles('student'), createQpayForApplication)
paymentStudentRouter.post('/qpay/create-for-payment', createQpayForPendingPayment)
paymentStudentRouter.get('/qpay/check/:paymentId', checkQpayPayment)

paymentStudentRouter.get('/me', requireRoles('student'), async (req: AuthedRequest, res) => {
  const rows = await Payment.find({ userId: req.user!.id })
    .populate('userId', 'studentId firstName lastName')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()
  res.json({ payments: rows })
})

const refundBody = z.object({
  paymentId: z.string(),
  reason: z.string().min(5),
  principalAmount: z.number().positive().optional(),
  contractCancelled: z.boolean().optional(),
  neverSignedContract: z.boolean().optional(),
})

paymentStudentRouter.post('/refunds', requireRoles('student'), async (req: AuthedRequest, res) => {
  const parsed = refundBody.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }
  const pay = await Payment.findOne({
    _id: parsed.data.paymentId,
    userId: req.user!.id,
    status: 'paid',
  })
  if (!pay) {
    res.status(404).json({ error: 'Төлбөр олдсонгүй эсвэл буцаах боломжгүй' })
    return
  }
  const dup = await Refund.findOne({ paymentId: pay._id, status: 'pending' })
  if (dup) {
    res.status(409).json({ error: 'Буцаалтын хүсэлт аль хэдийн бүртгэгдсэн' })
    return
  }

  const principal = parsed.data.principalAmount ?? pay.amount
  const penalties = computeRefundPenalties(principal, pay.amount / 12, {
    cancelled: parsed.data.contractCancelled,
    neverSignedContract: parsed.data.neverSignedContract,
  })

  const refund = await Refund.create({
    paymentId: pay._id,
    amount: Math.max(0, Math.round((principal - penalties.appliedFee) * 100) / 100),
    reason: parsed.data.reason,
    status: 'pending',
  })

  void notifyUsersWithRoles(
    ['admin', 'staff', 'accountant'],
    'Буцаалтын хүсэлт',
    `Оюутнаас буцаалтын хүсэлт ирлээ (${String(refund._id).slice(-8)}). Шалтгааныг нягтлана уу.`,
    '/payments',
  )

  void createInAppNotification(
    req.user!.id,
    'Буцаалтын хүсэлт',
    'Хүсэлтээ илгээллээ. Нягтлан шийдвэрлэх хүртэл хүлээнэ үү.',
    '/payments',
  )

  res.status(201).json({
    refund,
    penalties,
    disclaimer: 'Эцсийн дүнг нягтлан батална.',
  })
})

paymentStudentRouter.get('/refunds/my', requireRoles('student'), async (req: AuthedRequest, res) => {
  const pays = await Payment.find({ userId: req.user!.id }).distinct('_id')
  const rows = await Refund.find({ paymentId: { $in: pays } }).sort({ createdAt: -1 }).limit(50).lean()
  res.json({ refunds: rows })
})

/** Буцаалтын урьдчилсан тооцоо — бодит хүсэлт үүсгэхгүй */
paymentStudentRouter.get('/refunds/preview', requireRoles('student'), async (req: AuthedRequest, res) => {
  const q = z.object({
    paymentId: z.string(),
    contractCancelled: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
    neverSignedContract: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
  }).safeParse(req.query)
  if (!q.success) {
    res.status(400).json({ error: q.error.flatten() })
    return
  }
  const pay = await Payment.findOne({ _id: q.data.paymentId, userId: req.user!.id, status: 'paid' })
  if (!pay) {
    res.status(404).json({ error: 'Төлбөр олдсонгүй' })
    return
  }
  const penalties = computeRefundPenalties(pay.amount, pay.amount / 12, {
    cancelled: q.data.contractCancelled,
    neverSignedContract: q.data.neverSignedContract,
  })
  res.json({
    originalAmount: pay.amount,
    refundAmount: Math.max(0, Math.round((pay.amount - penalties.appliedFee) * 100) / 100),
    penalties,
    disclaimer: 'Эцсийн дүнг нягтлан батална.',
  })
})

/** Зөвлөлийн гишүүний хөнгөлөлт тооцоолох */
paymentStudentRouter.get('/council-discount', requireRoles('student'), async (req: AuthedRequest, res) => {
  const q = z.object({ amount: z.coerce.number().positive() }).safeParse(req.query)
  if (!q.success) {
    res.status(400).json({ error: q.error.flatten() })
    return
  }
  const now = new Date()
  const member = await CouncilMember.findOne({ userId: req.user!.id, termEnd: { $gte: now } })
    .sort({ termEnd: -1 })
    .lean()
  if (!member) {
    res.json({ eligible: false, discountPct: 0, discounted: q.data.amount, saved: 0 })
    return
  }
  const result = applyCouncilDiscount(q.data.amount, member.feeDiscount)
  res.json({ eligible: true, ...result, role: member.role })
})
