import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import { z } from 'zod'
import { env } from '../../config/env.js'
import type { AuthedRequest } from '../../middleware/auth.middleware.js'
import { Contract } from '../../models/Contract.model.js'
import { Payment } from '../../models/Payment.model.js'
import { RoomApplication } from '../../models/RoomApplication.model.js'
import { User } from '../../models/User.model.js'
import * as qpayApi from '../../services/qpay.service.js'
import { createInAppNotification } from '../../services/notification.service.js'
import { stubCreateContract } from './contract.routes.js'

async function finalizePaid(payment: InstanceType<typeof Payment>) {
  if (payment.status === 'paid') return

  payment.status = 'paid'
  payment.paidAt = new Date()
  await payment.save()

  if (payment.applicationId) {
    const app = await RoomApplication.findByIdAndUpdate(
      payment.applicationId,
      { status: 'paid' },
      { new: true },
    )
    if (app?.roomId && app.userId) {
      const existing = await Contract.findOne({
        userId: app.userId,
        status: { $in: ['pending_sign', 'active'] },
      })
      if (!existing) {
        await stubCreateContract({
          userId: String(app.userId),
          roomId: String(app.roomId),
          startDate: new Date('2026-09-01'),
          endDate: new Date('2027-06-15'),
          isHalfYear: false,
        })
      }
    }
  }

  void createInAppNotification(
    String(payment.userId),
    'Төлбөр амжилттай',
    'Төлбөр батлагдлаа. Гэрээнд цахим гарын үсэг зурах шаардлагатай бол «Гэрээ» хэсгийг нээнэ үү.',
    '/contract',
  )
}

/** QPay webhook (нийтэд) */
export async function qpayCallback(req: Request, res: Response) {
  try {
    const body = z
      .object({
        payment_id: z.unknown().optional(),
        invoice_id: z.unknown().optional(),
      })
      .passthrough()
      .safeParse(req.body)
    const qpayPaymentId = body.success ? String(body.data.payment_id ?? '') : ''
    const invoiceId = body.success ? String(body.data.invoice_id ?? '') : ''
    if (!qpayPaymentId && !invoiceId) {
      res.json({ success: true })
      return
    }

    const or: { qpayInvoiceId: string }[] = []
    if (invoiceId) or.push({ qpayInvoiceId: invoiceId })
    if (qpayPaymentId) or.push({ qpayInvoiceId: qpayPaymentId })
    const payment = or.length ? await Payment.findOne({ $or: or }) : null

    if (!payment || payment.status === 'paid') {
      res.json({ success: true })
      return
    }

    if (!payment.qpayInvoiceId) {
      res.json({ success: true })
      return
    }

    let verified = false
    try {
      const checkResult = await qpayApi.checkPayment(payment.qpayInvoiceId)
      verified =
        (checkResult as { count?: number }).count! > 0 ||
        ((checkResult as { rows?: unknown[] }).rows?.length ?? 0) > 0
      const row = (checkResult as { rows?: { payment_id?: string }[] }).rows?.[0]
      if (verified && row?.payment_id) {
        payment.qpayPaymentId = row.payment_id
      }
    } catch {
      verified = !!qpayPaymentId
    }

    if (!verified) {
      res.json({ success: true })
      return
    }

    payment.qpayPaymentId = payment.qpayPaymentId || qpayPaymentId
    await finalizePaid(payment)
    res.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'callback error'
    res.status(500).json({ error: msg })
  }
}

const createBody = z.object({
  applicationId: z.string(),
  amount: z.number().positive(),
  type: z.enum(['FULL', 'HALF', 'SUMMER']),
})

export async function createQpayForApplication(req: AuthedRequest, res: Response) {
  const parsed = createBody.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const application = await RoomApplication.findOne({
    _id: parsed.data.applicationId,
    userId: req.user!.id,
    status: 'payment_pending',
  })
  if (!application) {
    res.status(400).json({ error: 'Өрөөний төлбөр хүлээгдэж буй хүсэлт олдсонгүй' })
    return
  }
  if (application.paymentDueAt && application.paymentDueAt < new Date()) {
    application.status = 'cancelled'
    await application.save()
    res.status(400).json({ error: 'Төлбөрийн хугацаа дууссан' })
    return
  }

  const user = await User.findById(req.user!.id)
  let paymentDoc = await Payment.findOne({
    applicationId: application._id,
    userId: req.user!.id,
    status: 'pending',
  })

  if (!paymentDoc) {
    paymentDoc = await Payment.create({
      userId: application.userId,
      applicationId: application._id,
      amount: parsed.data.amount,
      type: parsed.data.type,
      status: 'pending',
      penalty: 0,
      method: 'QPay',
    })
  } else {
    paymentDoc.amount = parsed.data.amount
    paymentDoc.type = parsed.data.type
    paymentDoc.method = 'QPay'
    if (paymentDoc.qpayInvoiceId) {
      try {
        await qpayApi.cancelInvoice(paymentDoc.qpayInvoiceId)
      } catch {
        /* хуучин invoice цуцлагдаагүй байж болно */
      }
    }
  }

  const host =
    env.BACKEND_PUBLIC_URL?.replace(/\/$/, '') ?? `${req.protocol}://${req.get('host') ?? 'localhost:4000'}`
  const callbackUrl = `${host}/api/v1/payments/qpay/callback`
  const senderInvoiceNo = `DMS-${Date.now()}-${String(paymentDoc._id).slice(-6)}`

  let qpayResp: Awaited<ReturnType<typeof qpayApi.createInvoice>>
  try {
    qpayResp = await qpayApi.createInvoice({
      senderInvoiceNo,
      amount: parsed.data.amount,
      description: `МУИС дотуур байр ${senderInvoiceNo}`,
      callbackUrl,
      receiverData: {
        name: user ? `${user.lastName ?? ''} ${user.firstName ?? ''}`.trim() : undefined,
        email: user?.email,
        phone: user?.phone,
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'QPay алдаа'
    res.status(502).json({ error: `QPay: ${msg}` })
    return
  }

  const invId = qpayResp.invoice_id
  if (!invId) {
    res.status(502).json({ error: 'QPay: invoice_id ирээгүй' })
    return
  }

  paymentDoc.qpayInvoiceId = invId
  paymentDoc.qrText = qpayResp.qr_text
  paymentDoc.qrImage = qpayResp.qr_image
  paymentDoc.qpayShortUrl = qpayResp.qPay_shortUrl
  paymentDoc.qpayDeeplinks = qpayResp.qPay_deeplink
  await paymentDoc.save()

  res.status(201).json({
    paymentId: String(paymentDoc._id),
    invoiceId: invId,
    qrText: qpayResp.qr_text,
    qrImage: qpayResp.qr_image,
    shortUrl: qpayResp.qPay_shortUrl,
    deeplinks: qpayResp.qPay_deeplink ?? [],
    total: parsed.data.amount,
  })
}

/** Жагсаалтаас сонгосон хүлээгдэж буй төлбөр (аль хэдийн үүссэн Payment бичлэг) — QPay invoice шинэчилнэ */
export async function createQpayForPendingPayment(req: AuthedRequest, res: Response) {
  const parsed = z.object({ paymentId: z.string() }).safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }
  if (!mongoose.isValidObjectId(parsed.data.paymentId)) {
    res.status(400).json({ error: 'Invalid payment id' })
    return
  }

  const paymentDoc = await Payment.findOne({
    _id: parsed.data.paymentId,
    userId: req.user!.id,
    status: 'pending',
  })
  if (!paymentDoc) {
    res.status(404).json({ error: 'Төлбөр олдсонгүй эсвэл аль хэдийн төлөгдсөн' })
    return
  }

  paymentDoc.method = 'QPay'
  if (paymentDoc.qpayInvoiceId) {
    try {
      await qpayApi.cancelInvoice(paymentDoc.qpayInvoiceId)
    } catch {
      /* */
    }
  }

  const user = await User.findById(req.user!.id)
  const host =
    env.BACKEND_PUBLIC_URL?.replace(/\/$/, '') ?? `${req.protocol}://${req.get('host') ?? 'localhost:4000'}`
  const callbackUrl = `${host}/api/v1/payments/qpay/callback`
  const senderInvoiceNo = `DMS-${Date.now()}-${String(paymentDoc._id).slice(-6)}`

  let qpayResp: Awaited<ReturnType<typeof qpayApi.createInvoice>>
  try {
    qpayResp = await qpayApi.createInvoice({
      senderInvoiceNo,
      amount: paymentDoc.amount,
      description: `МУИС дотуур байр төлбөр ${senderInvoiceNo} (${paymentDoc.type})`,
      callbackUrl,
      receiverData: {
        name: user ? `${user.lastName ?? ''} ${user.firstName ?? ''}`.trim() : undefined,
        email: user?.email,
        phone: user?.phone,
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'QPay алдаа'
    res.status(502).json({ error: `QPay: ${msg}` })
    return
  }

  const invId = qpayResp.invoice_id
  if (!invId) {
    res.status(502).json({ error: 'QPay: invoice_id ирээгүй' })
    return
  }

  paymentDoc.qpayInvoiceId = invId
  paymentDoc.qrText = qpayResp.qr_text
  paymentDoc.qrImage = qpayResp.qr_image
  paymentDoc.qpayShortUrl = qpayResp.qPay_shortUrl
  paymentDoc.qpayDeeplinks = qpayResp.qPay_deeplink
  await paymentDoc.save()

  res.status(201).json({
    paymentId: String(paymentDoc._id),
    invoiceId: invId,
    qrText: qpayResp.qr_text,
    qrImage: qpayResp.qr_image,
    shortUrl: qpayResp.qPay_shortUrl,
    deeplinks: qpayResp.qPay_deeplink ?? [],
    total: paymentDoc.amount,
  })
}

export async function checkQpayPayment(req: AuthedRequest, res: Response) {
  const params = z.object({ paymentId: z.string() }).safeParse(req.params)
  if (!params.success || !mongoose.isValidObjectId(params.data.paymentId)) {
    res.status(400).json({ error: 'Invalid payment id' })
    return
  }

  const payment = await Payment.findOne({
    _id: params.data.paymentId,
    userId: req.user!.id,
  })
  if (!payment) {
    res.status(404).json({ error: 'Төлбөр олдсонгүй' })
    return
  }

  if (payment.status === 'paid') {
    res.json({ paid: true, payment })
    return
  }

  if (!payment.qpayInvoiceId) {
    res.status(400).json({ error: 'QPay invoice байхгүй' })
    return
  }

  try {
    const result = await qpayApi.checkPayment(payment.qpayInvoiceId)
    const paid =
      (result?.count ?? 0) > 0 || (Array.isArray(result?.rows) && result.rows.length > 0)
    if (paid) {
      const row = result?.rows?.[0]
      if (row?.payment_id) payment.qpayPaymentId = String(row.payment_id)
      await finalizePaid(payment)
      const fresh = await Payment.findById(payment._id)
      res.json({ paid: true, payment: fresh })
      return
    }
    res.json({ paid: false, payment })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'QPay шалгахад алдаа'
    res.status(502).json({ error: msg })
  }
}
