import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  BedDouble,
  CalendarDays,
  ClipboardList,
  ClipboardSignature,
  Clock,
  CreditCard,
  DoorOpen,
  FileSignature,
  Plus,
  Sofa,
  UserCircle,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  DmsBanner,
  DmsStatCard,
  PageHeaderDms,
  QuickCardDms,
  SectionTitleDms,
} from '@/components/dms/PageChrome'
import { BroadcastAnnouncementCard } from '@/components/BroadcastAnnouncementCard'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { api } from '@/lib/api'
import { CAMPUS_AIMAG_LABEL, CAMPUS_LOCALITY_LABEL } from '@/lib/campus-region'
import { formatMnt } from '@/lib/format'
import { studentHasConfirmedRoomBooking } from '@/lib/student-room-booking'
import { cn } from '@/lib/utils'
import { useAuth } from '@/stores/auth-store'

function todayMn() {
  return new Date().toLocaleDateString('mn-MN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/** өрөөний хүсэлтийн төлөв — товч монгол ялгах */
function applicationStatusMn(status: string) {
  const map: Record<string, string> = {
    draft: 'Ноорог',
    submitted: 'Илгээсэн',
    priority_window: 'Эрэмбийн цонх',
    room_selected: 'Өрөө сонгосон',
    payment_pending: 'Төлбөр хүлээж буй',
    paid: 'Төлбөр төлөгдсөн',
    contract_pending: 'Гэрээ хүлээж буй',
    completed: 'Дууссан',
    cancelled: 'Цуцалсан',
  }
  return map[status] ?? status
}

function appStepState(status: string | undefined): 'done' | 'current' | 'todo' {
  if (!status || status === 'cancelled') return 'todo'
  if (status === 'draft') return 'current'
  if (
    ['submitted', 'priority_window', 'room_selected', 'payment_pending'].includes(status)
  )
    return 'current'
  return 'done'
}

function contractStepState(c: { status: string } | null | undefined): 'done' | 'current' | 'todo' {
  if (!c) return 'todo'
  if (c.status === 'active') return 'done'
  if (c.status === 'pending_sign') return 'current'
  return 'todo'
}

function payStepState(pendingCount: number, paidSum: number): 'done' | 'current' | 'todo' {
  if (pendingCount > 0) return 'current'
  if (paidSum > 0) return 'done'
  return 'todo'
}

export function DashboardPage() {
  const user = useAuth((s) => s.user)
  const isStudent = user?.role === 'student'
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const priority = useQuery({
    queryKey: ['priority'],
    queryFn: async () => {
      const { data } = await api.get<{ tier: number; label: string }>('/applications/priority')
      return data
    },
    enabled: isStudent,
  })

  const contractMe = useQuery({
    queryKey: ['contract-me'],
    queryFn: async () => {
      const { data } = await api.get<{
        contract: {
          status: string
          roomSummary?: { dormName: string; roomNumber: number }
        } | null
      }>('/contracts/me')
      return data.contract
    },
    enabled: isStudent,
  })

  const dutyMyDay = useQuery({
    queryKey: ['daily-duty-my-day'],
    queryFn: async () => {
      const { data } = await api.get<{
        dateKey: string
        iamOnDutyToday: boolean
        dutyHolder: { userId: string; name: string; studentId?: string } | null
      }>('/daily/duty/my-day')
      return data
    },
    enabled: isStudent,
    staleTime: 60_000,
  })

  const studentPayments = useQuery({
    queryKey: ['payments-me'],
    queryFn: async () => {
      const { data } = await api.get<{ payments: { amount: number; status: string }[] }>(
        '/payments/me',
      )
      return data.payments
    },
    enabled: isStudent,
  })

  const activityNotifs = useQuery({
    queryKey: ['notifications', { limit: 12 }],
    queryFn: async () => {
      const { data } = await api.get<{
        notifications: {
          _id: string
          title: string
          message: string
          createdAt: string
          read?: boolean
          link?: string
        }[]
      }>('/notifications', { params: { limit: 12 } })
      return data.notifications
    },
    enabled: isStudent,
    refetchInterval: 45_000,
    refetchOnWindowFocus: true,
  })

  const markNotifRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  function openDashboardNotification(n: {
    _id: string
    read?: boolean
    link?: string
  }) {
    if (!n.read) markNotifRead.mutate(n._id)
    const dest = n.link?.trim()
    if (dest?.startsWith('/')) navigate(dest)
  }

  const appsMy = useQuery({
    queryKey: ['applications-my'],
    queryFn: async () => {
      const { data } = await api.get<{ applications: { status: string }[] }>('/applications/my')
      return data.applications
    },
    enabled: isStudent,
  })

  const adminOverview = useQuery({
    queryKey: ['admin-pending-overview'],
    queryFn: async () => {
      const { data } = await api.get<{
        applications: { _id: string; status: string; createdAt: string }[]
        contractsPendingSignature: { _id: string }[]
      }>('/admin/pending-overview')
      return data
    },
    enabled: !isStudent,
  })

  const paymentsOverview = useQuery({
    queryKey: ['admin-payments-overview', { limit: 500 }],
    queryFn: async () => {
      const { data } = await api.get<{ payments: { status: string; amount: number }[] }>(
        '/admin/payments/overview',
        { params: { limit: 500 } },
      )
      return data.payments
    },
    enabled: !isStudent,
  })

  /** Админ дээрх «Бүгд» шүүлттэй адил cache — давхар HTTP багасгана */
  const exitOverview = useQuery({
    queryKey: ['admin-exit-requests', 'all'],
    queryFn: async () => {
      const { data } = await api.get<{ pendingCount: number }>('/admin/exit-requests', {
        params: { status: 'all' },
      })
      return data
    },
    enabled: !isStudent,
  })

  if (!isStudent) {
    const apps = adminOverview.data?.applications ?? []
    const contractPending = adminOverview.data?.contractsPendingSignature?.length ?? 0
    const pays = Array.isArray(paymentsOverview.data) ? paymentsOverview.data : []

    const payPending = pays.filter((p) => p.status === 'pending')
    const payPaid = pays.filter((p) => p.status === 'paid')
    const payFailed = pays.filter((p) => p.status === 'failed')
    const pendingPaySum = payPending.reduce((s, p) => s + p.amount, 0)
    const paidSum = payPaid.reduce((s, p) => s + p.amount, 0)

    const statusCounts = apps.reduce(
      (acc, a) => {
        acc[a.status] = (acc[a.status] ?? 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
    const topStatuses = Object.entries(statusCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    const exitPendingCount = exitOverview.data?.pendingCount ?? 0
    const awaitingPaymentCount = statusCounts.payment_pending ?? 0
    const loadingOverview = adminOverview.isLoading || paymentsOverview.isLoading

    const roleLabel =
      user?.role === 'admin'
        ? 'Админ'
        : user?.role === 'staff'
          ? 'Ажилтан'
          : user?.role === 'accountant'
            ? 'Нягтлан'
            : user?.role ?? ''

    return (
      <div className="space-y-8">
        <PageHeaderDms
          crumbs={['Үндсэн', 'Тойм']}
          title="Хяналтын самбар"
          sub={`${roleLabel} · ${todayMn()} · өгөгдөл: өрөөний хүсэлт (200), төлбөр (500 доторх дүн)`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/admin"
                className={cn(
                  buttonVariants({ size: 'sm' }),
                  'gap-2 bg-[color:var(--primary)] text-primary-foreground hover:bg-[color:var(--primary)]/90',
                )}
              >
                <BedDouble className="size-4" />
                Консол
              </Link>
              <Link
                to="/payments"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  'gap-2 border-[color:var(--border-strong)]',
                )}
              >
                <CreditCard className="size-4" />
                Төлбөр
              </Link>
              <a
                href="/health"
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'text-muted-foreground',
                )}
              >
                API health
              </a>
            </div>
          }
        />

        {(exitPendingCount > 0 || contractPending > 0 || payPending.length > 0) && (
          <DmsBanner variant="warn" className="items-start sm:items-center">
            <AlertTriangle className="mt-0.5 size-[18px] shrink-0" />
            <div className="min-w-0 flex-1 text-sm">
              <div className="font-medium">Анхаарах захиалгууд</div>
              <ul className="mt-1 space-y-0.5 text-[color:var(--text-muted)]">
                {exitPendingCount > 0 ? (
                  <li>
                    Байраас гарах: <strong>{exitPendingCount}</strong> хүлээгдэж буй —{' '}
                    <Link to="/admin?tab=exits" className="underline underline-offset-2">
                      консол → «Байраас гарах»
                    </Link>
                  </li>
                ) : null}
                {contractPending > 0 ? (
                  <li>
                    Цахим гарын үсэг: <strong>{contractPending}</strong> гэрээ
                  </li>
                ) : null}
                {payPending.length > 0 ? (
                  <li>
                    QPay/товчоо дээр <strong>{formatMnt(pendingPaySum)}</strong> нийлбэр{' '}
                    <strong>{payPending.length}</strong> хүлээгдэж буй бичлэг
                  </li>
                ) : null}
              </ul>
            </div>
          </DmsBanner>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <DmsStatCard
            label="Өрөөний pipeline"
            value={apps.length}
            delta={`≤200 · төлбөр хүлээж: ${awaitingPaymentCount}`}
          />
          <DmsStatCard label="Гарын үсэг (гэрээ)" value={contractPending} delta="pending_sign" />
          <DmsStatCard
            label="Төлбөр — хүлээгдэж буй"
            value={formatMnt(pendingPaySum)}
            delta={`${payPending.length} бичлэг · ≤500`}
          />
          <DmsStatCard
            label="Төлбөр — батлагдсан"
            value={formatMnt(paidSum)}
            delta={`${payPaid.length} бичлэг · амжилтгүй: ${payFailed.length}`}
          />
          <DmsStatCard label="Гарах хүлээж буй" value={exitPendingCount} delta="«Байраас гарах» таб" />
        </div>

        <BroadcastAnnouncementCard />

        <div className="grid-dms grid-dms-2 gap-6">
          <Card className="border-[color:var(--border)] shadow-[var(--sh-1)]">
            <div className="dms-card-hd">
              <div>
                <h3>Хүсэлтийн төлөв (одоогийн очерть)</h3>
                <p className="sub">Сүүлийн 200 оролтийн дотоод харьцаа — raw status</p>
              </div>
              <Link
                to="/admin"
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1 shrink-0')}
              >
                Бүгд <span aria-hidden>→</span>
              </Link>
            </div>
            <CardContent className="space-y-4 pt-0">
              {loadingOverview ? (
                <p className="text-sm text-muted-foreground">Ачааллаж байна…</p>
              ) : apps.length === 0 ? (
                <p className="text-sm text-muted-foreground">Өрөөний идэвхтэй хүсэлт алга.</p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {topStatuses.map(([status, count]) => (
                      <Badge key={status} variant="secondary" className="text-xs font-normal">
                        {applicationStatusMn(status)} · {count}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Нэг оюутан олон дамжлагад байвал мөр давхардаж тоологдоно.
                  </div>
                  <div className="border-t border-[color:var(--border)] pt-4">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Сүүлийн 6 мөр (хамгийн сүүлийн)
                    </p>
                    <ul className="flex flex-col gap-0 divide-y divide-[color:var(--border)]">
                      {[...apps]
                        .sort(
                          (a, b) =>
                            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                        )
                        .slice(0, 6)
                        .map((a) => (
                          <li key={a._id} className="flex gap-3 py-2.5 text-sm first:pt-0">
                            <span className="font-mono text-[10px] text-[color:var(--text-faint)]">
                              …{a._id.slice(-6)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium">{applicationStatusMn(a.status)}</div>
                              <div className="text-xs text-[color:var(--text-muted)]">
                                {new Date(a.createdAt).toLocaleString('mn-MN')}
                              </div>
                            </div>
                          </li>
                        ))}
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-[color:var(--border)] shadow-[var(--sh-1)]">
            <div className="dms-card-hd">
              <div>
                <h3>Төлбөр & үйлчилгээ</h3>
                <p className="sub">Админы үндсэн ажлыг ялгана</p>
              </div>
            </div>
            <CardContent className="space-y-4 pt-0">
              <div className="grid gap-3 rounded-[var(--r-md)] border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">Төлөгдөөгүй нийлбөр</span>
                  <span className="tabular-nums font-semibold">{formatMnt(pendingPaySum)}</span>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">Батлагдсан нийлбөр (үзүүлэл)</span>
                  <span className="tabular-nums font-semibold text-[color:var(--ok-500)]">
                    {formatMnt(paidSum)}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to="/payments" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-2')}>
                  <Wallet className="size-4" />
                  Бүх төлбөр
                </Link>
                <Link to="/admin?tab=exits" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-2')}>
                  <DoorOpen className="size-4" />
                  Байраас гарах (таб)
                </Link>
              </div>
              <p className="text-[11px] leading-relaxed text-[color:var(--text-muted)]">
                Санал, гомдол, зочны зөвшөөрөл зэргийг оюутан өөрийн эрхээр «Өдөр тутмын» цэсээр илгээнэ; албаны эрхээр
                зөвхөн хүлээн авч шийдвэрлэнэ. Дүн нь{' '}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">GET /payments/overview</code>{' '}
                сүүлийн 500 бүртгэлээс — санхүүгийн бүрэн тайлан биш.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const greetName = user?.firstName ?? 'Оюутан'

  const pays = studentPayments.data ?? []
  const pendingSumSt = pays.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0)
  const paidSumSt = pays.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const pendingCountSt = pays.filter((p) => p.status === 'pending').length

  function roomStatValue() {
    const c = contractMe.data
    if (contractMe.isLoading) return '…'
    if (!c?.roomSummary) return '—'
    return `${c.roomSummary.dormName} · №${c.roomSummary.roomNumber}`
  }

  function roomStatDelta() {
    const c = contractMe.data
    if (!c?.roomSummary) return 'Өрөө баталгаажмагц энд харагдана'
    if (c.status === 'pending_sign') return 'Гарын үсэг үлдлээ'
    if (c.status === 'active') return 'Гэрээний хүрээнд'
    return 'Хүлээгдэж буй'
  }

  function paymentStatValue() {
    if (studentPayments.isLoading) return '…'
    if (pendingSumSt > 0) return formatMnt(pendingSumSt)
    if (paidSumSt > 0) return 'Төлөгдсөн'
    return '—'
  }

  function paymentStatDelta() {
    if (studentPayments.isLoading) return '…'
    if (pendingCountSt > 0) return `${pendingCountSt} хүлээгдэж буй · QPay`
    if (paidSumSt > 0) return `Нийт ${formatMnt(paidSumSt)}`
    return 'Төлбөрийн түүх: Төлбөр цэс'
  }

  const latestApp = appsMy.data?.[0]
  const roomBookingConfirmed = studentHasConfirmedRoomBooking(appsMy.data ?? [])
  const sApply = appStepState(latestApp?.status)
  const sContract = contractStepState(contractMe.data)
  const sPay = payStepState(pendingCountSt, paidSumSt)

  type PipeStep = {
    title: string
    sub: string
    state: 'done' | 'current' | 'todo'
    Icon: LucideIcon
  }

  const pipelineSteps: PipeStep[] = [
    {
      title: 'Бүртгэл баталгаажсан',
      sub: 'Системийн эрх идэвхтэй',
      state: 'done',
      Icon: CalendarDays,
    },
    {
      title: 'Өрөөний хүсэлт',
      sub: latestApp
        ? applicationStatusMn(latestApp.status)
        : '«Захиалга» цэсээс эхлүүлнэ',
      state: sApply,
      Icon: ClipboardList,
    },
    {
      title: 'Цахим гэрээ',
      sub:
        contractMe.data?.status === 'active'
          ? 'Баталгаажсан'
          : contractMe.data?.status === 'pending_sign'
            ? 'Гарын үсэг үлдлээ'
            : 'Гэрээ үүсэхээ хүлээнэ',
      state: sContract,
      Icon: ClipboardSignature,
    },
    {
      title: 'Төлбөр',
      sub:
        pendingCountSt > 0
          ? `${pendingCountSt} хүлээгдэж буй нэхэмжлэл`
          : paidSumSt > 0
            ? `Нийт ${formatMnt(paidSumSt)} төлөгдсөн`
            : 'Төлбөрийн бичлэг харагдахгүй байна',
      state: sPay,
      Icon: Wallet,
    },
  ]

  return (
    <div className="space-y-8">
      <PageHeaderDms
        crumbs={['Үндсэн']}
        title={`Сайн байна уу, ${greetName}`}
        sub={`Өнөөдөр · ${todayMn()}`}
        action={
          <Link
            to="/daily"
            className={cn(
              buttonVariants(),
              'gap-2 bg-[color:var(--primary)] text-primary-foreground hover:bg-[color:var(--primary)]/90',
            )}
          >
            <Plus className="size-4" />
            Хүсэлт нэмэх
          </Link>
        }
      />

      {contractMe.data?.status === 'pending_sign' ? (
        <DmsBanner variant="warn" className="items-center">
          <AlertTriangle className="mt-0.5 size-[18px] shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="ttl">Гэрээнд гарын үсэг зурах шаардлагатай</div>
            <div className="msg">
              Улирлын байрны гэрээ цахим гарын үсэг хүлээж байна. Хугацаа дуусахаас өмнө баталгаажуулна уу.
            </div>
          </div>
          <Link
            to="/contract"
            className={cn(
              buttonVariants({ size: 'sm' }),
              'shrink-0 bg-[color:var(--primary)] text-primary-foreground hover:bg-[color:var(--primary)]/90',
            )}
          >
            Гэрээ нээх
          </Link>
        </DmsBanner>
      ) : null}

      <Card className="border-[color:var(--border)] shadow-[var(--sh-1)]">
        <div className="dms-card-hd">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-[var(--r-md)] bg-[color:var(--primary-soft)] text-[color:var(--primary)]">
                <Clock className="size-5" aria-hidden />
              </span>
              <div>
                <h3>Өдрийн жижүүр — таньд</h3>
                <p className="sub">
                  {dutyMyDay.isLoading ? (
                    <>
                      Өнөөдрийн ээлжийн мэдээлэл уншиж байна. Ээлжийн өдөр&nbsp;
                      <Link
                        to="/notifications"
                        className="font-medium text-[color:var(--primary)] underline underline-offset-2"
                      >
                        мэдэгдлээр
                      </Link>
                      &nbsp; сануулга орно.
                    </>
                  ) : (
                    <>
                      <span className="tabular-nums font-medium">{dutyMyDay.data?.dateKey ?? '—'}</span>{' '}
                      ({CAMPUS_AIMAG_LABEL} · {CAMPUS_LOCALITY_LABEL}) кампусын өдөрт ээлж тохсон байдлыг
                      харуулна.&nbsp;
                      <Link
                        to="/notifications"
                        className="font-medium text-[color:var(--primary)] underline underline-offset-2"
                      >
                        Мэдэгдэлд
                      </Link>
                      &nbsp; нэг удаа сануулга илгээнэ.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
        <CardContent className="space-y-3 pt-0">
          {dutyMyDay.isLoading ? (
            <p className="text-sm text-muted-foreground">Ачааллаж байна…</p>
          ) : !dutyMyDay.data?.dutyHolder ? (
            <p className="text-sm text-muted-foreground">
              Энэ өдрийн жижүүрийг харуулах мэдээлэл байхгүй байна (ажиллах жагсаалт хоосон эсвэл админаас
              синк хийгдээгүй байж болно).
            </p>
          ) : dutyMyDay.data.iamOnDutyToday ? (
            <DmsBanner variant="warn" className="items-start shadow-none">
              <div>
                <div className="ttl flex flex-wrap items-center gap-2">
                  <Clock className="size-4 shrink-0" aria-hidden />
                  Өнөөдөр таны жижүүрийн ээлж
                </div>
                <div className="msg">
                  {dutyMyDay.data.dateKey} ({CAMPUS_LOCALITY_LABEL}){' '}
                  — дотоод журмыг хангаж нийтийн эзэмшлийн байдлыг шалгаж, яаралтай тохиолдолд албандаа
                  мэдэгдэнэ үү.
                </div>
              </div>
            </DmsBanner>
          ) : (
            <div className="rounded-[var(--r-md)] border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-3 text-sm">
              <p className="font-medium text-foreground">Энэ өдөр та жижүүр биш</p>
              <p className="mt-2 text-muted-foreground">
                Өнөөдрийн жижүүрийг гүйцэтгэгч:{' '}
                <strong className="text-foreground">{dutyMyDay.data.dutyHolder.name}</strong>
                {dutyMyDay.data.dutyHolder.studentId ? (
                  <>
                    {' '}
                    · оюутны код{' '}
                    <span className="font-mono">{dutyMyDay.data.dutyHolder.studentId}</span>
                  </>
                ) : null}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid-dms grid-dms-4">
        <DmsStatCard label="Миний өрөө" value={roomStatValue()} delta={roomStatDelta()} />
        <DmsStatCard
          label="Гэрээ"
          value={
            contractMe.isLoading
              ? '…'
              : !contractMe.data
                ? '—'
                : contractMe.data.status === 'active'
                  ? 'Баталгаажсан'
                  : contractMe.data.status === 'pending_sign'
                    ? 'Хүлээгдэж буй'
                    : '—'
          }
          delta="7 хоногийн цонх"
        />
        <DmsStatCard label="Төлбөр" value={paymentStatValue()} delta={paymentStatDelta()} />
        <DmsStatCard
          label="Эрэмбэ"
          value={priority.isLoading ? '…' : `#${priority.data?.tier ?? '—'}`}
          delta={priority.data?.label ?? '24 цагийн цонхоор шинэчлэгдэнэ'}
        />
      </div>

      <Card className="border-[color:var(--border)] shadow-[var(--sh-1)]">
        <div className="dms-card-hd">
          <div>
            <h3>Мэдэгдэл</h3>
            <p className="sub">
              Албаны зарлал (байр, хурал гэх мэт), төлбөр, гэрээний системийн мэдэгдэл энд харагдана
            </p>
          </div>
          <Link
            to="/notifications"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'shrink-0 text-xs',
            )}
          >
            Бүгдийг нээх →
          </Link>
        </div>
        <CardContent className="pt-0">
          {activityNotifs.isLoading ? (
            <p className="text-sm text-muted-foreground">Ачааллаж байна…</p>
          ) : !activityNotifs.data?.length ? (
            <p className="text-sm text-muted-foreground">
              Одоогоор мэдэгдэл байхгүй. Албанаас илгээсэн зарлал болон захиалгын шинэчлэл энд гарна.
            </p>
          ) : (
            <div className="timeline">
              {activityNotifs.data.map((n, i) => {
                const canNavigate = Boolean(n.link?.trim().startsWith('/'))
                return (
                  <div key={n._id} className={cn('tl-item', i === 0 ? 'active' : 'done')}>
                    <div className="when">{new Date(n.createdAt).toLocaleString('mn-MN')}</div>
                    <button
                      type="button"
                      className={cn(
                        'what w-full rounded-[var(--r-sm)] border-0 bg-transparent p-0 text-left font-inherit transition-colors',
                        canNavigate
                          ? 'cursor-pointer hover:bg-[color:var(--primary-soft)]/35 focus-visible:ring-2 focus-visible:ring-[color:var(--primary)] focus-visible:outline-none'
                          : 'cursor-default',
                      )}
                      onClick={() => openDashboardNotification(n)}
                    >
                      <span className="font-medium">{n.title}</span>
                      <span className="mt-0.5 block text-muted-foreground">{n.message}</span>
                      {canNavigate ? (
                        <span className="mt-1 inline-block text-xs font-medium text-[color:var(--primary)]">
                          Нээх →
                        </span>
                      ) : null}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <SectionTitleDms>Түргэн үйлдэл</SectionTitleDms>
        <div className="grid-dms grid-dms-4">
          <QuickCardDms
            to={roomBookingConfirmed ? '/room-change' : '/apply'}
            icon={<Sofa className="size-5" />}
            title={roomBookingConfirmed ? 'Өрөө солих хүсэлт' : 'Өрөө захиалга'}
            desc={
              roomBookingConfirmed
                ? 'Одоогийн өрөөнөөс шилжих албан хүсэлт үүсгэнэ'
                : 'Эрэмбэ, сонголт, төлбөрийн алхмууд'
            }
            cta={roomBookingConfirmed ? 'Үүсгэх' : 'Эхлэх'}
          />
          <QuickCardDms
            to="/payments"
            icon={<Wallet className="size-5" />}
            title="Төлбөр"
            desc="Төлбөрийн түүх, үлдэгдэл"
            cta="Үзэх"
          />
          <QuickCardDms
            to="/contract"
            icon={<FileSignature className="size-5" />}
            title="Цахим гэрээ"
            desc="Нөхцөл унших, гарын үсэг"
            cta="Нээх"
          />
          <QuickCardDms
            to="/profile"
            icon={<UserCircle className="size-5" />}
            title="Профайл"
            desc="Утас, оюутны мэдээлэл засах"
            cta="Нээх"
          />
        </div>
      </div>

      <Card className="border-[color:var(--border)] shadow-[var(--sh-1)]">
        <div className="dms-card-hd">
          <div>
            <h3>Дараагийн алхам</h3>
            <p className="sub">Таны явц (өрөө · гэрээ · төлбөр)</p>
          </div>
          <Badge variant="secondary">Оюутан</Badge>
        </div>
        <CardContent className="space-y-0 divide-y divide-[color:var(--border)] pt-0">
          {pipelineSteps.map((step) => {
            const Icon = step.Icon
            const bubble =
              step.state === 'done'
                ? 'bg-[color:var(--ok-500)] text-white'
                : step.state === 'current'
                  ? 'bg-[color:var(--primary)] text-white ring-4 ring-[color:var(--primary-soft)]'
                  : 'bg-[color:var(--ink-100)] text-[color:var(--text-muted)]'
            return (
              <div key={step.title} className="flex gap-3 py-3 first:pt-0">
                <span
                  className={cn(
                    'mt-0.5 flex size-[22px] shrink-0 items-center justify-center rounded-full',
                    bubble,
                  )}
                >
                  {step.state === 'todo' ? null : <Icon className="size-3" />}
                </span>
                <div className="min-w-0">
                  <div
                    className={cn(
                      'text-sm font-medium',
                      step.state === 'todo' && 'text-muted-foreground',
                    )}
                  >
                    {step.title}
                  </div>
                  <div className="text-xs text-muted-foreground">{step.sub}</div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
