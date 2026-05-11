import { Router } from 'express'
import { z } from 'zod'
import { Payment } from '../../models/Payment.model.js'
import { Complaint } from '../../models/Complaint.model.js'
import { Violation } from '../../models/Violation.model.js'
import { User } from '../../models/User.model.js'
import { Contract } from '../../models/Contract.model.js'
import { authenticate, requireRoles, type AuthedRequest } from '../../middleware/auth.middleware.js'

export const reportRouter = Router()
reportRouter.use(authenticate)
reportRouter.use(requireRoles('admin', 'accountant', 'staff'))

/** 5.4.2 — сарын тайлан (үнэлгээний суурь; Excel/PDF нь дараагийн алхам) */
reportRouter.get('/monthly-summary', async (req: AuthedRequest, res) => {
  const q = z
    .object({
      yearMonth: z
        .string()
        .regex(/^\d{4}-\d{2}$/, 'YYYY-MM')
        .optional(),
    })
    .safeParse(req.query)
  if (!q.success) {
    res.status(400).json({ error: q.error.flatten() })
    return
  }
  const ym = q.data.yearMonth ?? new Date().toISOString().slice(0, 7)
  const [y, m] = ym.split('-').map(Number)
  const start = new Date(Date.UTC(y, m - 1, 1))
  const end = new Date(Date.UTC(y, m, 1))

  const [paymentsAgg] = await Payment.aggregate<{
    count: number
    sumPaid: number
    pending: number
  }>([
    { $match: { createdAt: { $gte: start, $lt: end } } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        sumPaid: {
          $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] },
        },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
        },
      },
    },
  ])

  const complaintStats = await Complaint.aggregate<{ _id: string; n: number }>([
    { $match: { createdAt: { $gte: start, $lt: end } } },
    { $group: { _id: '$status', n: { $sum: 1 } } },
  ])

  const violationStats = await Violation.aggregate<{ _id: string; n: number }>([
    { $match: { createdAt: { $gte: start, $lt: end } } },
    { $group: { _id: '$type', n: { $sum: 1 } } },
  ])

  res.json({
    period: ym,
    housingAndFees: paymentsAgg ?? { count: 0, sumPaid: 0, pending: 0 },
    complaintsByStatus: complaintStats,
    violationsByType: violationStats,
    exports: {
      csv: `/api/v1/reports/export.csv?yearMonth=${ym}`,
      pdf: '/api/v1/reports/export.pdf — exceljs/pdfkit суулгавал идэвхжинэ',
    },
  })
})

/** Сарын төлбөрийн CSV экспорт */
reportRouter.get('/export.csv', async (req: AuthedRequest, res) => {
  const q = z.object({
    yearMonth: z.string().regex(/^\d{4}-\d{2}$/, 'YYYY-MM').optional(),
  }).safeParse(req.query)
  if (!q.success) {
    res.status(400).json({ error: q.error.flatten() })
    return
  }
  const ym = q.data.yearMonth ?? new Date().toISOString().slice(0, 7)
  const [y, m] = ym.split('-').map(Number)
  const start = new Date(Date.UTC(y, m - 1, 1))
  const end = new Date(Date.UTC(y, m, 1))

  const payments = await Payment.find({ createdAt: { $gte: start, $lt: end } })
    .populate('userId', 'studentId firstName lastName email')
    .sort({ createdAt: -1 })
    .lean()

  const esc = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const line = (cells: string[]) => cells.map(esc).join(',')
  const headers = line(['Огноо', 'Лавлах', 'Оюутан ID', 'Нэр', 'Имэйл', 'Төрөл', 'Хэрэгсэл', 'Дүн', 'Шимтгэл', 'Төлөв', 'Төлсөн огноо'])

  const rows = payments.map((p) => {
    const u = p.userId as { studentId?: string; firstName?: string; lastName?: string; email?: string } | null
    return line([
      p.createdAt ? new Date(p.createdAt).toLocaleDateString('mn-MN') : '',
      String(p._id).slice(-8),
      u?.studentId ?? '',
      `${u?.lastName ?? ''} ${u?.firstName ?? ''}`.trim(),
      u?.email ?? '',
      p.type ?? '',
      p.method ?? '',
      String(p.amount),
      String(p.penalty ?? 0),
      p.status,
      p.paidAt ? new Date(p.paidAt).toLocaleDateString('mn-MN') : '',
    ])
  })

  const bom = '﻿'
  const csv = [bom + headers, ...rows].join('\n')

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="dms-payments-${ym}.csv"`)
  res.send(csv)
})

/** Оюутны жагсаалт CSV */
reportRouter.get('/students.csv', async (req: AuthedRequest, res) => {
  const students = await User.find({ role: 'student' })
    .select('studentId firstName lastName email phone level region gender school program status')
    .sort({ lastName: 1 })
    .lean()

  const esc = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const line = (cells: string[]) => cells.map(esc).join(',')
  const headers = line(['Оюутан ID', 'Овог', 'Нэр', 'Имэйл', 'Утас', 'Курс', 'Аймаг/Хот', 'Хүйс', 'Сургууль', 'Хөтөлбөр', 'Төлөв'])

  const rows = students.map((s) =>
    line([s.studentId ?? '', s.lastName ?? '', s.firstName ?? '', s.email ?? '', s.phone ?? '', s.level ?? '', s.region ?? '', s.gender ?? '', s.school ?? '', s.program ?? '', s.status ?? ''])
  )

  const bom = '﻿'
  const csv = [bom + headers, ...rows].join('\n')
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="dms-students-${new Date().toISOString().slice(0, 10)}.csv"`)
  res.send(csv)
})

/** Гэрээ дуусах ойртож буй жагсаалт */
reportRouter.get('/contracts-expiring', async (req: AuthedRequest, res) => {
  const q = z.object({ days: z.coerce.number().min(1).max(60).optional().default(7) }).safeParse(req.query)
  if (!q.success) {
    res.status(400).json({ error: q.error.flatten() })
    return
  }
  const threshold = new Date()
  threshold.setDate(threshold.getDate() + q.data.days)

  const contracts = await Contract.find({
    status: 'active',
    endDate: { $lte: threshold, $gte: new Date() },
  })
    .populate('userId', 'studentId firstName lastName email phone')
    .sort({ endDate: 1 })
    .lean()

  res.json({ contracts, count: contracts.length, daysAhead: q.data.days })
})
