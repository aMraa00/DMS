import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, Wallet, Clock, AlertTriangle } from 'lucide-react'
import { useMemo, useState, useEffect } from 'react'
import { QPayQrModal, type QPaySession } from '@/components/payments/QPayQrModal'
import { DmsStatCard, PageHeaderDms } from '@/components/dms/PageChrome'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { formatMnt } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAuth } from '@/stores/auth-store'

type PaymentUser = {
  _id: string
  studentId?: string
  firstName?: string
  lastName?: string
}

type PaymentRow = {
  _id: string
  amount: number
  status: string
  type?: string
  method?: string
  createdAt?: string
  paidAt?: string
  userId?: PaymentUser | string
}

type ApplicationRow = {
  id: string
  status: string
  paymentDueAt?: string
}

type RefundPreview = {
  originalAmount: number
  refundAmount: number
  penalties: { appliedFee: number; basis: string; notes: string[] }
  disclaimer: string
}

function useCountdown(targetIso: string | undefined) {
  const [ms, setMs] = useState(() =>
    targetIso ? Math.max(0, new Date(targetIso).getTime() - Date.now()) : 0,
  )
  useEffect(() => {
    if (!targetIso) return
    const tick = () => setMs(Math.max(0, new Date(targetIso).getTime() - Date.now()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetIso])
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  const s = Math.floor((ms % 60_000) / 1_000)
  return { ms, h, m, s, expired: ms === 0 && !!targetIso }
}

function downloadPaymentsCsv(rows: PaymentRow[], filterLabel: string) {
  const headers = ['Оюутан ID', 'Нэр', 'Огноо', 'Төрөл', 'Хэрэгсэл', 'Дүн', 'Төлөв']
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`
  const line = (cells: string[]) => cells.map(esc).join(',')
  const body = rows.map((r) => {
    const u = r.userId && typeof r.userId === 'object' ? r.userId as PaymentUser : null
    return line([
      u?.studentId ?? r._id.slice(-8),
      u ? `${u.lastName ?? ''} ${u.firstName ?? ''}`.trim() : '',
      r.paidAt ? new Date(r.paidAt).toISOString() : r.createdAt ?? '',
      r.type ?? '',
      r.method ?? '',
      String(r.amount),
      r.status,
    ])
  })
  const bom = '\uFEFF'
  const blob = new Blob([[bom, line(headers), '\n', body.join('\n')].join('')], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dms-tulbur-${filterLabel}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function formatApiErr(e: unknown): string {
  const raw =
    e && typeof e === 'object' && 'response' in e
      ? (e as { response?: { data?: { error?: unknown } } }).response?.data?.error
      : undefined
  if (typeof raw === 'string') return raw
  if (raw && typeof raw === 'object') {
    try {
      return JSON.stringify(raw)
    } catch {
      return 'Алдаа'
    }
  }
  return ''
}

export function PaymentsPage() {
  const queryClient = useQueryClient()
  const user = useAuth((s) => s.user)
  const isStudent = user?.role === 'student'
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'failed'>('all')
  const [qpaySession, setQpaySession] = useState<QPaySession | null>(null)
  const [qpayOpen, setQpayOpen] = useState(false)
  const [qpayErr, setQpayErr] = useState<string | null>(null)
  const [refundPaymentId, setRefundPaymentId] = useState<string | null>(null)
  const [refundPreview, setRefundPreview] = useState<RefundPreview | null>(null)
  const [refundPreviewOpen, setRefundPreviewOpen] = useState(false)
  const [refundReason, setRefundReason] = useState('')
  const [refundCancelled, setRefundCancelled] = useState(false)
  const [refundNeverSigned, setRefundNeverSigned] = useState(false)

  const studentPayments = useQuery({
    queryKey: ['payments-me'],
    queryFn: async () => {
      const { data } = await api.get<{ payments: PaymentRow[] }>('/payments/me')
      return data.payments
    },
    enabled: isStudent,
  })

  const myApplications = useQuery({
    queryKey: ['applications-my'],
    queryFn: async () => {
      const { data } = await api.get<{ applications: ApplicationRow[] }>('/applications/my')
      return data.applications
    },
    enabled: isStudent,
  })

  const paymentDueAt = useMemo(() => {
    const app = myApplications.data?.find((a) => a.status === 'payment_pending' && a.paymentDueAt)
    return app?.paymentDueAt
  }, [myApplications.data])

  const countdown = useCountdown(paymentDueAt)

  const fetchRefundPreview = useMutation({
    mutationFn: async ({ paymentId, cancelled, neverSigned }: { paymentId: string; cancelled: boolean; neverSigned: boolean }) => {
      const { data } = await api.get<RefundPreview>('/payments/refunds/preview', {
        params: { paymentId, contractCancelled: cancelled, neverSignedContract: neverSigned },
      })
      return data
    },
    onSuccess: (data) => {
      setRefundPreview(data)
      setRefundPreviewOpen(true)
    },
  })

  const submitRefund = useMutation({
    mutationFn: async () => {
      if (!refundPaymentId) throw new Error('no payment')
      await api.post('/payments/refunds', {
        paymentId: refundPaymentId,
        reason: refundReason,
        contractCancelled: refundCancelled,
        neverSignedContract: refundNeverSigned,
      })
    },
    onSuccess: () => {
      setRefundPreviewOpen(false)
      setRefundPaymentId(null)
      setRefundPreview(null)
      setRefundReason('')
      void queryClient.invalidateQueries({ queryKey: ['payments-me'] })
    },
  })

  const adminPayments = useQuery({
    queryKey: ['admin-payments-overview', { limit: 200 }],
    queryFn: async () => {
      const { data } = await api.get<{ payments: PaymentRow[] }>('/admin/payments/overview', {
        params: { limit: 200 },
      })
      return data.payments
    },
    enabled: !isStudent,
  })

  const createQpayForRow = useMutation({
    mutationFn: async (paymentId: string) => {
      const { data } = await api.post<{
        paymentId: string
        total: number
        qrImage?: string
        qrText?: string
        shortUrl?: string
        deeplinks?: QPaySession['deeplinks']
      }>('/payments/qpay/create-for-payment', { paymentId })
      return data
    },
    onSuccess: (data) => {
      setQpayErr(null)
      setQpaySession({
        paymentId: data.paymentId,
        total: data.total,
        qrImage: data.qrImage,
        qrText: data.qrText,
        shortUrl: data.shortUrl,
        deeplinks: data.deeplinks,
      })
      setQpayOpen(true)
    },
    onError: (err: unknown) => {
      setQpayErr(formatApiErr(err) || 'QPay invoice үүсгэж чадсангүй.')
    },
  })

  const rows = useMemo(() => {
    const raw = isStudent ? studentPayments.data : adminPayments.data
    return Array.isArray(raw) ? raw : []
  }, [isStudent, studentPayments.data, adminPayments.data])
  const filtered = useMemo(() => {
    if (filter === 'all') return rows
    return rows.filter((r) => r.status === filter)
  }, [rows, filter])

  const pendingRows = useMemo(() => rows.filter((r) => r.status === 'pending'), [rows])
  const firstPending = pendingRows[0]

  const pendingSum = useMemo(
    () => rows.filter((r) => r.status === 'pending').reduce((s, r) => s + r.amount, 0),
    [rows],
  )
  const paidSum = useMemo(
    () => rows.filter((r) => r.status === 'paid').reduce((s, r) => s + r.amount, 0),
    [rows],
  )

  const loading = isStudent ? studentPayments.isLoading : adminPayments.isLoading

  function startQpay(paymentId: string) {
    setQpayErr(null)
    createQpayForRow.mutate(paymentId)
  }

  function openRefundFlow(paymentId: string) {
    setRefundPaymentId(paymentId)
    setRefundReason('')
    setRefundCancelled(false)
    setRefundNeverSigned(false)
    setRefundPreview(null)
    setRefundPreviewOpen(true)
  }

  return (
    <div className="space-y-8">
      {isStudent && paymentDueAt && !countdown.expired && (
        <div
          className={cn(
            'flex items-center gap-3 rounded-[var(--r-md)] border px-4 py-3 text-sm',
            countdown.h < 1
              ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200'
              : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
          )}
        >
          {countdown.h < 1 ? (
            <AlertTriangle className="size-4 shrink-0" />
          ) : (
            <Clock className="size-4 shrink-0" />
          )}
          <div className="flex-1">
            <span className="font-semibold">Төлбөрийн хугацаа: </span>
            <span className="tabular-nums">
              {countdown.h > 0 ? `${countdown.h}ц ` : ''}
              {countdown.m}м {countdown.s}с үлдлээ
            </span>
            {countdown.h < 1 && (
              <span className="ml-2 text-xs font-medium">— Яараарай, цаг дуусахад өрөө цуцлагдана!</span>
            )}
          </div>
        </div>
      )}
      {isStudent && countdown.expired && paymentDueAt && (
        <div className="flex items-center gap-3 rounded-[var(--r-md)] border border-red-300 bg-red-100 px-4 py-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/60 dark:text-red-100">
          <AlertTriangle className="size-4 shrink-0" />
          Төлбөрийн 4 цагийн цонх дууссан. Өрөөний хүсэлт цуцлагдсан байж болзошгүй — шинэ хүсэлт гаргана уу.
        </div>
      )}

      <PageHeaderDms
        crumbs={['Санхүү']}
        title="Төлбөр"
        sub={
          isStudent ? 'Танай төлбөрийн түүх ба үлдэгдэл' : 'Бүх төлбөрийн бичлэг (админ тойм)'
        }
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-[color:var(--border-strong)]"
              type="button"
              disabled={filtered.length === 0}
              onClick={() => downloadPaymentsCsv(filtered, filter)}
            >
              <Download className="size-4" />
              CSV татах
            </Button>
            {isStudent && firstPending ? (
              <Button
                size="sm"
                className="gap-2 bg-[color:var(--primary)]"
                disabled={createQpayForRow.isPending}
                onClick={() => startQpay(firstPending._id)}
              >
                <Wallet className="size-4" />
                QPay (эхний хүлээгдэж буй)
              </Button>
            ) : null}
          </div>
        }
      />

      {isStudent && qpayErr ? (
        <div className="rounded-[var(--r-md)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {qpayErr}
        </div>
      ) : null}

      {isStudent && (
        <div className="grid-dms grid-dms-3 gap-4">
          <Card className="overflow-hidden border-0 shadow-[var(--sh-1)]">
            <div className="pay-hero-dms">
              <div className="text-xs uppercase tracking-wider opacity-85">Үлдэгдэл (төлөгдөөгүй)</div>
              <div className="mt-2 text-3xl font-semibold tabular-nums">
                {formatMnt(pendingSum || 0)}
              </div>
              <div className="mt-2 text-xs opacity-85">
                Төлсөн нийт: {formatMnt(paidSum)} · {rows.length} бичлэг
                {pendingRows.length > 1 ? ` · ${pendingRows.length} хүлээгдэж буй нэхэмжлэл` : null}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="bg-white font-semibold text-[color:var(--primary)] hover:bg-white/90"
                  disabled={!firstPending || createQpayForRow.isPending}
                  onClick={() => firstPending && startQpay(firstPending._id)}
                >
                  <Wallet className="size-3.5" />
                  QPay QR
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/35 bg-white/20 text-white hover:bg-white/25"
                  type="button"
                  disabled
                >
                  Банк
                </Button>
              </div>
              {pendingRows.length > 1 ? (
                <p className="mt-3 max-w-[22rem] text-[11px] leading-snug opacity-90">
                  Олон хүлээгдэж буй төлбөр байвал хүснэгтээс мөр бүрээр «QPay QR» дарж тусад нь төлнө.
                </p>
              ) : null}
            </div>
          </Card>
          <Card className="border-[color:var(--border)] shadow-[var(--sh-1)]">
            <div className="dms-card-hd">
              <div>
                <h3>Улирлын тойм</h3>
                <p className="sub">Backend-ээс тооцоолно</p>
              </div>
            </div>
            <CardContent className="space-y-2 text-sm pt-0">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Төлсөн</span>
                <span className="num font-medium">{formatMnt(paidSum)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Хүлээгдэж буй</span>
                <span className="num font-medium text-amber-700 dark:text-amber-300">
                  {formatMnt(pendingSum)}
                </span>
              </div>
              <hr className="border-[color:var(--border)]" />
              <div className="kpi-line">
                <div
                  className="seg bg-[color:var(--ok-500)]"
                  style={{
                    width: `${paidSum + pendingSum > 0 ? Math.round((100 * paidSum) / (paidSum + pendingSum)) : 50}%`,
                  }}
                />
                <div
                  className="seg bg-[color:var(--ink-200)]"
                  style={{
                    width: `${paidSum + pendingSum > 0 ? Math.round((100 * pendingSum) / (paidSum + pendingSum)) : 50}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-[color:var(--text-muted)]">
                {formatMnt(paidSum)} төлсөн / {formatMnt(pendingSum)} үлдсэн
              </p>
            </CardContent>
          </Card>
          <Card className="border-[color:var(--border)] shadow-[var(--sh-1)]">
            <div className="dms-card-hd">
              <div>
                <h3>Холболт</h3>
                <p className="sub">Демо</p>
              </div>
            </div>
            <CardContent className="space-y-3 pt-0 text-sm">
              <div className="flex items-center gap-2 rounded-[var(--r)] border border-[color:var(--border)] p-3">
                <Wallet className="size-4 text-[color:var(--primary)]" />
                <div>
                  <div className="font-medium">QPay</div>
                  <div className="text-xs text-muted-foreground">
                    Жагсаалтаас QR нээнэ · «Шалгах» эсвэл webhook
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!isStudent && (
        <div className="grid-dms grid-dms-4">
          <DmsStatCard label="Нийт бичлэг" value={rows.length} />
          <DmsStatCard
            label="Төлсөн"
            value={rows.filter((r) => r.status === 'paid').length}
            deltaTone="up"
            delta="pipeline"
          />
          <DmsStatCard
            label="Хүлээгдэж буй"
            value={rows.filter((r) => r.status === 'pending').length}
          />
          <DmsStatCard
            label="Амжилтгүй"
            value={rows.filter((r) => r.status === 'failed').length}
            deltaTone="down"
          />
        </div>
      )}

      <Card className="overflow-hidden border-[color:var(--border)] p-0 shadow-[var(--sh-1)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between dms-card-hd">
          <div>
            <h3>Төлбөрийн түүх</h3>
            <p className="sub">{filtered.length} бичлэг харагдаж байна</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['all', 'Бүгд'],
                ['paid', 'Төлсөн'],
                ['pending', 'Хүлээгдэж буй'],
                ['failed', 'Амжилтгүй'],
              ] as const
            ).map(([k, label]) => (
              <Button
                key={k}
                type="button"
                size="sm"
                variant={filter === k ? 'default' : 'outline'}
                className={cn(
                  filter === k && 'bg-[color:var(--primary)] text-white hover:bg-[color:var(--primary)]/90',
                )}
                onClick={() => setFilter(k)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
        <div className="dms-card-bd px-0 pb-6">
          {loading ? (
            <p className="px-6 text-sm text-muted-foreground">Ачааллаж байна…</p>
          ) : filtered.length === 0 ? (
            <div className="empty-dms mx-6">
              <div className="ttl">Бичлэг алга</div>
              <div>Энд төлбөрийн мэдээлэл харагдана.</div>
            </div>
          ) : (
            <div className="table-wrap-dms">
              <table className="table-dms">
                <thead>
                  <tr>
                    <th>Лавлах</th>
                    <th>Огноо</th>
                    <th>Төрөл</th>
                    <th>Хэрэгсэл</th>
                    <th className="text-right">Дүн</th>
                    <th>Төлөв</th>
                    {isStudent ? <th className="text-right">Үйлдэл</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const u = r.userId && typeof r.userId === 'object' ? r.userId as PaymentUser : null
                    const studentNum = u?.studentId ?? (isStudent ? undefined : String(r.userId).slice(-6))
                    return (
                    <tr key={r._id}>
                      <td className="text-xs">
                        {studentNum ? (
                          <span className="font-mono font-medium">{studentNum}</span>
                        ) : (
                          <span className="font-mono text-muted-foreground">{r._id.slice(-8)}</span>
                        )}
                        {!isStudent && u && (u.lastName || u.firstName) && (
                          <div className="text-[11px] text-muted-foreground leading-tight">
                            {`${u.lastName ?? ''} ${u.firstName ?? ''}`.trim()}
                          </div>
                        )}
                      </td>
                      <td className="num text-xs">
                        {r.paidAt
                          ? new Date(r.paidAt).toLocaleDateString('mn-MN')
                          : r.createdAt
                            ? new Date(r.createdAt).toLocaleDateString('mn-MN')
                            : '—'}
                      </td>
                      <td>{r.type ?? '—'}</td>
                      <td>{r.method ?? '—'}</td>
                      <td className="num text-right font-medium">{formatMnt(r.amount)}</td>
                      <td>
                        <Badge
                          variant={
                            r.status === 'paid'
                              ? 'default'
                              : r.status === 'pending'
                                ? 'secondary'
                                : 'destructive'
                          }
                          className="text-xs"
                        >
                          {r.status === 'paid'
                            ? 'Төлсөн'
                            : r.status === 'pending'
                              ? 'Хүлээгдэж буй'
                              : 'Амжилтгүй'}
                        </Badge>
                      </td>
                      {isStudent ? (
                        <td className="text-right">
                          <div className="flex justify-end gap-1">
                            {r.status === 'pending' && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="gap-1"
                                disabled={createQpayForRow.isPending}
                                onClick={() => startQpay(r._id)}
                              >
                                <Wallet className="size-3.5" />
                                QR
                              </Button>
                            )}
                            {r.status === 'paid' && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="gap-1 text-xs text-muted-foreground hover:text-red-600"
                                onClick={() => openRefundFlow(r._id)}
                              >
                                Буцаалт
                              </Button>
                            )}
                            {r.status !== 'pending' && r.status !== 'paid' && (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {isStudent ? (
        <QPayQrModal
          session={qpaySession}
          open={qpayOpen}
          onOpenChange={(o) => {
            setQpayOpen(o)
            if (!o) setQpaySession(null)
          }}
          onPaid={() => {
            void queryClient.invalidateQueries({ queryKey: ['payments-me'] })
            setQpayOpen(false)
            setQpaySession(null)
          }}
        />
      ) : null}

      <Dialog open={refundPreviewOpen} onOpenChange={setRefundPreviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Буцаалтын хүсэлт</DialogTitle>
          </DialogHeader>
          {!refundPreview ? (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="refund-reason">Буцаалтын шалтгаан</Label>
                <textarea
                  id="refund-reason"
                  rows={3}
                  minLength={5}
                  placeholder="Тайлбар (хамгийн багадаа 5 тэмдэгт)"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="flex min-h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Нөхцөл</p>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={refundCancelled}
                    onChange={(e) => setRefundCancelled(e.target.checked)}
                    className="size-4"
                  />
                  Гэрээ цуцлагдсан (1 сарын суутгал)
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={refundNeverSigned}
                    onChange={(e) => setRefundNeverSigned(e.target.checked)}
                    className="size-4"
                  />
                  Гэрээнд гарын үсэг зураагүй (10% шимтгэл)
                </label>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Дараагийн алхамд суутгалын дүн урьдчилан харагдана.
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="rounded-[var(--r-md)] border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Анхны дүн</span>
                  <span className="tabular-nums font-medium">{formatMnt(refundPreview.originalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Суутгал</span>
                  <span className="tabular-nums font-medium text-red-600">−{formatMnt(refundPreview.penalties.appliedFee)}</span>
                </div>
                <hr className="border-[color:var(--border)]" />
                <div className="flex justify-between text-sm font-semibold">
                  <span>Буцах дүн</span>
                  <span className="tabular-nums text-[color:var(--ok-500)]">{formatMnt(refundPreview.refundAmount)}</span>
                </div>
              </div>
              {refundPreview.penalties.notes.map((n, i) => (
                <p key={i} className="text-xs text-muted-foreground">· {n}</p>
              ))}
              <p className="text-[11px] text-muted-foreground">{refundPreview.disclaimer}</p>
              {submitRefund.isError && (
                <p className="text-xs text-red-600">Хүсэлт илгээхэд алдаа гарлаа. Дахин оролдоно уу.</p>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setRefundPreviewOpen(false); setRefundPreview(null) }}>
              Болих
            </Button>
            {!refundPreview ? (
              <Button
                disabled={refundReason.trim().length < 5 || fetchRefundPreview.isPending}
                onClick={() => {
                  if (!refundPaymentId) return
                  fetchRefundPreview.mutate({ paymentId: refundPaymentId, cancelled: refundCancelled, neverSigned: refundNeverSigned })
                }}
                className="bg-[color:var(--primary)]"
              >
                {fetchRefundPreview.isPending ? 'Тооцоолж байна…' : 'Урьдчилан харах'}
              </Button>
            ) : (
              <Button
                disabled={submitRefund.isPending}
                onClick={() => submitRefund.mutate()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {submitRefund.isPending ? 'Илгээж байна…' : 'Хүсэлт илгээх'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
