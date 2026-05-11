import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import { Building2, ChevronLeft, ChevronRight, LayoutGrid, List } from 'lucide-react'
import { useMemo, useState } from 'react'
import { QPayQrModal, type QPaySession } from '@/components/payments/QPayQrModal'
import { DmsStepper, PageHeaderDms } from '@/components/dms/PageChrome'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { formatMnt } from '@/lib/format'
import { studentHasConfirmedRoomBooking } from '@/lib/student-room-booking'
import { cn } from '@/lib/utils'

type RoomLite = {
  id: string
  dormId: string
  floorId: string
  roomNumber: number
  maxOccupancy: number
  currentOccupancy?: number
  monthlyFee?: number
  dormName?: string
  floorNumber?: number
  status?: 'free' | 'occupied' | 'maintenance'
}

const STEPS = [
  { key: 'p', label: 'Эрэмбэ / хүсэлт' },
  { key: 'r', label: 'Өрөө сонгох' },
  { key: 'pay', label: 'Төлбөр' },
]

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
      return 'Хүсэлт буруу'
    }
  }
  return ''
}

export function ApplyPage() {
  const queryClient = useQueryClient()
  const [step, setStep] = useState(1)
  const [rooms, setRooms] = useState<RoomLite[]>([])
  const [selectedRoom, setSelectedRoom] = useState<RoomLite | null>(null)
  const [appId, setAppId] = useState<string | null>(null)
  const [qpaySession, setQpaySession] = useState<QPaySession | null>(null)
  const [qpayOpen, setQpayOpen] = useState(false)
  const [qpayErr, setQpayErr] = useState<string | null>(null)
  const [payCompletedUi, setPayCompletedUi] = useState(false)
  const [roomViewMode, setRoomViewMode] = useState<'list' | 'grid'>('list')

  const roomsByFloor = useMemo(() => {
    const map = new Map<number, RoomLite[]>()
    for (const r of rooms) {
      const floor = r.floorNumber ?? (Math.floor(r.roomNumber / 100) || 1)
      if (!map.has(floor)) map.set(floor, [])
      map.get(floor)!.push(r)
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0])
  }, [rooms])

  const priority = useQuery({
    queryKey: ['priority'],
    queryFn: async () => {
      const { data } = await api.get<{ tier: number; label: string }>('/applications/priority')
      return data
    },
  })

  const myApplications = useQuery({
    queryKey: ['applications-my'],
    queryFn: async () => {
      const { data } = await api.get<{ applications: { id: string; status: string }[] }>(
        '/applications/my',
      )
      return data.applications
    },
  })

  const serverApp = appId ? myApplications.data?.find((a) => a.id === appId) : undefined
  const applicationPaid =
    payCompletedUi ||
    serverApp?.status === 'paid' ||
    serverApp?.status === 'contract_pending'

  const createApplication = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ application: { id: string; priorityTier?: number } }>(
        '/applications',
        {},
      )
      return data.application
    },
    onSuccess: (app) => {
      setAppId(app.id)
      setPayCompletedUi(false)
      setStep(2)
    },
  })

  async function loadRooms() {
    const { data } = await api.get<{ rooms: RoomLite[] }>('/rooms/available')
    setRooms(data.rooms)
  }

  const selectRoom = useMutation({
    mutationFn: async (roomId: string) => {
      if (!appId) throw new Error('missing app')
      const { data } = await api.put<{ application: unknown }>(`/applications/${appId}/select-room`, {
        roomId,
      })
      return data
    },
    onSuccess: () => setStep(3),
  })

  const createQpay = useMutation({
    mutationFn: async () => {
      if (!appId || !selectedRoom) throw new Error('missing context')
      const { data } = await api.post<{
        paymentId: string
        total: number
        qrImage?: string
        qrText?: string
        shortUrl?: string
        deeplinks?: QPaySession['deeplinks']
      }>('/payments/qpay/create', {
        applicationId: appId,
        amount: selectedRoom.monthlyFee ?? 250000,
        type: 'FULL',
      })
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
      const msg = formatApiErr(err)
      setQpayErr(
        msg ||
          'QPay холболтоос QR үүсгэж чадсангүй. Сүлжээ, QPAY_* тохиргоог шалгана уу.',
      )
    },
  })

  if (
    myApplications.isSuccess &&
    studentHasConfirmedRoomBooking(myApplications.data ?? [])
  ) {
    return <Navigate to="/room-change" replace />
  }

  return (
    <div className="space-y-6">
      <PageHeaderDms
        crumbs={['Үйлчилгээ', `${step}/${STEPS.length}`]}
        title="Өрөөний хүсэлт"
        sub="Гурван алхам: эрэмбэ → өрөө сонголт → төлбөр (4 цагийн цонх)."
      />

      <Card className="overflow-hidden border-[color:var(--border)] p-0 shadow-[var(--sh-1)]">
        <div className="px-6 pt-6">
          <DmsStepper steps={STEPS} currentIndex={step - 1} />
        </div>

        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle>Эрэмбэ болон хугацаа</CardTitle>
              <CardDescription>
                Таны эрэмбэ:{' '}
                <span className="font-medium text-foreground">
                  #{priority.data?.tier ?? '…'} — {priority.data?.label}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <input id="special" type="checkbox" className="size-4 rounded border border-input" />
                <Label htmlFor="special">Тусгай өрөө (ах дүү, гэр бүл, тусламж)</Label>
              </div>
            </CardContent>
            <div className="dms-card-ft-dms">
              <Button variant="ghost" disabled className="gap-1">
                <ChevronLeft className="size-4" />
                Буцах
              </Button>
              <div className="text-xs text-[color:var(--text-muted)]">
                Алхам {step} / {STEPS.length}
              </div>
              <Button
                className="gap-1 bg-[color:var(--primary)]"
                onClick={() => createApplication.mutate()}
                disabled={createApplication.isPending}
              >
                Үргэлжлүүлэх
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle>Өрөө сонгох</CardTitle>
              <CardDescription>
                Эхлээд боломжит жагсаалтыг татаад, дараа нь нэгийг сонгоно уу.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" type="button" onClick={() => void loadRooms()}>
                  Боломжит өрөө татах
                </Button>
                {rooms.length > 0 && (
                  <div className="flex gap-1 rounded-lg border border-[color:var(--border)] p-0.5">
                    <button
                      type="button"
                      title="Жагсаалт"
                      onClick={() => setRoomViewMode('list')}
                      className={cn(
                        'flex size-7 items-center justify-center rounded',
                        roomViewMode === 'list'
                          ? 'bg-[color:var(--primary)] text-white'
                          : 'text-muted-foreground hover:bg-muted',
                      )}
                    >
                      <List className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Зураглал"
                      onClick={() => setRoomViewMode('grid')}
                      className={cn(
                        'flex size-7 items-center justify-center rounded',
                        roomViewMode === 'grid'
                          ? 'bg-[color:var(--primary)] text-white'
                          : 'text-muted-foreground hover:bg-muted',
                      )}
                    >
                      <LayoutGrid className="size-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {roomViewMode === 'list' && (
                <div className="choice-grid md:grid-cols-2">
                  {rooms.map((r) => {
                    const sel = selectedRoom?.id === r.id
                    const free = Math.max(r.maxOccupancy - (r.currentOccupancy ?? 0), 0)
                    return (
                      <div
                        key={r.id}
                        role="button"
                        tabIndex={0}
                        aria-selected={sel}
                        onClick={() => setSelectedRoom(r)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setSelectedRoom(r)
                          }
                        }}
                        className={cn('choice', sel && 'ring-2 ring-[color:var(--primary)]')}
                      >
                        <div className="ic">
                          <Building2 className="size-[18px]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="ttl">
                            Өрөө {r.roomNumber} · {r.dormName ?? r.dormId}
                          </div>
                          <div className="meta">
                            Сул: {free} · Багтаамж {r.maxOccupancy}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {formatMnt(r.monthlyFee ?? 250000)}
                            </Badge>
                            {free === 0 && (
                              <Badge variant="destructive" className="text-xs">Дүүрэн</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {roomViewMode === 'grid' && (
                <div className="space-y-5">
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block size-3 rounded-sm bg-[color:var(--ok-500)]" />
                      Сул
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block size-3 rounded-sm bg-[color:var(--ink-300,#aaa)]" />
                      Дүүрсэн
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block size-3 rounded-sm border-2 border-[color:var(--primary)] bg-[color:var(--primary-soft)]" />
                      Сонгосон
                    </span>
                  </div>
                  {roomsByFloor.map(([floor, floorRooms]) => (
                    <div key={floor}>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {floor}-р давхар
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {floorRooms.sort((a, b) => a.roomNumber - b.roomNumber).map((r) => {
                          const sel = selectedRoom?.id === r.id
                          const free = Math.max(r.maxOccupancy - (r.currentOccupancy ?? 0), 0)
                          const isFull = free === 0
                          return (
                            <button
                              key={r.id}
                              type="button"
                              title={`Өрөө ${r.roomNumber} · Сул: ${free}/${r.maxOccupancy} · ${formatMnt(r.monthlyFee ?? 250000)}`}
                              disabled={isFull}
                              onClick={() => setSelectedRoom(r)}
                              className={cn(
                                'flex h-14 w-16 flex-col items-center justify-center rounded-lg border-2 text-xs font-medium transition-all',
                                sel
                                  ? 'border-[color:var(--primary)] bg-[color:var(--primary-soft)] text-[color:var(--primary)]'
                                  : isFull
                                    ? 'cursor-not-allowed border-transparent bg-muted text-muted-foreground opacity-50'
                                    : 'border-transparent bg-[color:var(--ok-500)]/15 text-[color:var(--ok-700)] hover:border-[color:var(--ok-500)] hover:bg-[color:var(--ok-500)]/25',
                              )}
                            >
                              <span className="tabular-nums text-[13px] font-semibold leading-none">
                                {r.roomNumber}
                              </span>
                              <span className="mt-0.5 text-[10px] leading-none opacity-80">
                                {free}/{r.maxOccupancy}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                  {selectedRoom && (
                    <div className="rounded-[var(--r-md)] border border-[color:var(--primary)]/30 bg-[color:var(--primary-soft)]/20 px-4 py-3 text-sm">
                      <span className="font-semibold">Сонгогдсон:</span> Өрөө {selectedRoom.roomNumber}
                      {selectedRoom.dormName ? ` · ${selectedRoom.dormName}` : ''} ·{' '}
                      {formatMnt(selectedRoom.monthlyFee ?? 250000)}/сар
                    </div>
                  )}
                </div>
              )}

              {!rooms.length ? (
                <p className="text-sm text-muted-foreground">
                  Өгөгдөл алга — сервер дээр <code className="kbd-dms">npm run seed</code> ажиллуулж үзнэ үү.
                </p>
              ) : null}
            </CardContent>
            <div className="dms-card-ft-dms">
              <Button variant="ghost" type="button" className="gap-1" onClick={() => setStep(1)}>
                <ChevronLeft className="size-4" />
                Буцах
              </Button>
              <div className="text-xs text-[color:var(--text-muted)]">
                Алхам {step} / {STEPS.length}
              </div>
              <Button
                type="button"
                className="gap-1 bg-[color:var(--primary)]"
                disabled={!selectedRoom || selectRoom.isPending}
                onClick={() => selectedRoom && selectRoom.mutate(selectedRoom.id)}
              >
                Үргэлжлүүлэх
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </>
        )}

        {step === 3 && selectedRoom && (
          <>
            <CardHeader>
              <CardTitle>Төлбөр — QPay</CardTitle>
              <CardDescription>
                QPay sandbox эсвэл бодит эрхээр QR үүснэ. Төлбөр баталгаажсаны дараа хүсэлт төлөв шинэчлэгдэнэ.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {applicationPaid ? (
                <div className="rounded-[var(--r-md)] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
                  <p className="font-medium">Төлбөр баталгаажсан</p>
                  <p className="mt-1 text-emerald-800/90 dark:text-emerald-200/90">
                    Энэ хүсэлтийн төлбөр төлөгдсөн. Дахин QR хэрэгтэй бол шинэ өргөө өгнө үү.
                  </p>
                </div>
              ) : (
                <>
                  <div className="banner warn">
                    <div className="min-w-0 flex-1">
                      <div className="ttl">4 цагийн чөлөө</div>
                      <div className="msg">
                        Хугацаа дуусвал сонголт цуцлагдана. Дүн:{' '}
                        {formatMnt(selectedRoom.monthlyFee ?? 250000)}
                      </div>
                    </div>
                  </div>
                  {qpayErr ? (
                    <div className="rounded-[var(--r-md)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                      {qpayErr}
                    </div>
                  ) : null}
                  <div className="rounded-[var(--r-md)] border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4 text-sm">
                    <p className="font-medium">Өрөө {selectedRoom.roomNumber}</p>
                    <p className="text-[color:var(--text-muted)]">
                      {selectedRoom.dormName ?? selectedRoom.dormId}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      setQpayErr(null)
                      createQpay.mutate()
                    }}
                    disabled={createQpay.isPending}
                    className="w-full bg-[color:var(--primary)] sm:w-auto"
                  >
                    QPay QR үүсгэх
                  </Button>
                </>
              )}
            </CardContent>
            <div className="dms-card-ft-dms">
              <Button variant="ghost" type="button" className="gap-1" onClick={() => setStep(2)}>
                <ChevronLeft className="size-4" />
                Буцах
              </Button>
              <div className="text-xs text-[color:var(--text-muted)]">
                Алхам {step} / {STEPS.length}
              </div>
              <div />
            </div>
          </>
        )}
      </Card>

      <QPayQrModal
        session={qpaySession}
        open={qpayOpen}
        onOpenChange={(o) => {
          setQpayOpen(o)
          if (!o) setQpaySession(null)
        }}
        onPaid={() => {
          setPayCompletedUi(true)
          void queryClient.invalidateQueries({ queryKey: ['applications-my'] })
          void queryClient.invalidateQueries({ queryKey: ['priority'] })
          void queryClient.invalidateQueries({ queryKey: ['contract-me'] })
        }}
      />
    </div>
  )
}
