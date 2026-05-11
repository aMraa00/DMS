import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ArrowRightLeft } from 'lucide-react'
import { PageHeaderDms } from '@/components/dms/PageChrome'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { studentHasConfirmedRoomBooking } from '@/lib/student-room-booking'
import { cn } from '@/lib/utils'

type Row = {
  _id: string
  reason: string
  preferences?: string
  status: string
  resolution?: string
  createdAt?: string
  resolvedAt?: string
  assignedRoom?: { dormName: string; roomNumber: number }
}

function formatApiErr(e: unknown): string {
  const raw =
    e && typeof e === 'object' && 'response' in e
      ? (e as { response?: { data?: { error?: unknown } } }).response?.data?.error
      : undefined
  if (typeof raw === 'string') return raw
  return ''
}

export function RoomChangePage() {
  const queryClient = useQueryClient()
  const [reason, setReason] = useState('')
  const [preferences, setPreferences] = useState('')
  const [formErr, setFormErr] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)

  const appsMy = useQuery({
    queryKey: ['applications-my'],
    queryFn: async () => {
      const { data } = await api.get<{ applications: { status: string }[] }>('/applications/my')
      return data.applications
    },
  })

  const list = useQuery({
    queryKey: ['room-change-requests-my'],
    queryFn: async () => {
      const { data } = await api.get<{ roomChangeRequests: Row[] }>(
        '/daily/room-change-requests/my',
      )
      return data.roomChangeRequests
    },
    enabled: appsMy.isSuccess && studentHasConfirmedRoomBooking(appsMy.data ?? []),
  })

  const submit = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/daily/room-change-requests', {
        reason: reason.trim(),
        preferences: preferences.trim() || undefined,
      })
      return data as { roomChangeRequest?: { _id: string } }
    },
    onSuccess: () => {
      setFormErr(null)
      setOkMsg('Хүсэлт амжилттай илгээгдлээ. Дотуур байрны алба шийдвэрлэнэ.')
      setReason('')
      setPreferences('')
      void queryClient.invalidateQueries({ queryKey: ['room-change-requests-my'] })
    },
    onError: (e: unknown) => {
      setOkMsg(null)
      setFormErr(formatApiErr(e) || 'Илгээхэд алдаа гарлаа.')
    },
  })

  if (appsMy.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeaderDms crumbs={['Үйлчилгээ']} title="Өрөө солих хүсэлт" sub="Ачааллаж байна…" />
        <p className="text-sm text-muted-foreground">Түр хүлээнэ үү.</p>
      </div>
    )
  }

  if (appsMy.isSuccess && !studentHasConfirmedRoomBooking(appsMy.data ?? [])) {
    return <Navigate to="/apply" replace />
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setOkMsg(null)
    setFormErr(null)
    if (reason.trim().length < 15) {
      setFormErr('Шалтгаан дор хаяж 15 тэмдэгт байна.')
      return
    }
    submit.mutate()
  }

  function statusMn(s: string) {
    if (s === 'pending') return 'Хүлээгдэж буй'
    if (s === 'resolved') return 'Шийдвэрлэсэн'
    if (s === 'rejected') return 'Татгалзсан'
    return s
  }

  return (
    <div className="space-y-8">
      <PageHeaderDms
        crumbs={['Үйлчилгээ']}
        title="Өрөө солих хүсэлт"
        sub="Одоогийн захиалгатай өрөөнөөс өөр өрөө рүү шилжих хүсэлт"
      />

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <Card className="border-[color:var(--border)] shadow-[var(--sh-1)]">
        <div className="dms-card-hd">
          <div>
            <h3>Миний илгээсэн хүсэлтүүд</h3>
            <p className="sub">Сүүлийн 50 бичлэг</p>
          </div>
        </div>
        <CardContent className="space-y-3 pt-0">
          {list.isLoading ? (
            <p className="text-sm text-muted-foreground">Ачааллаж байна…</p>
          ) : !list.data?.length ? (
            <p className="text-sm text-muted-foreground">Одоогоор хүсэлт алга.</p>
          ) : (
            <ul className="divide-y divide-[color:var(--border)] rounded-[var(--r-md)] border border-[color:var(--border)]">
              {list.data.map((r) => (
                <li key={r._id} className="px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{statusMn(r.status)}</span>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {r.createdAt ? new Date(r.createdAt).toLocaleString('mn-MN') : ''}
                    </span>
                  </div>
                  <p className="mt-1 leading-relaxed text-muted-foreground">{r.reason}</p>
                  {r.preferences ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Давуу байршил: </span>
                      {r.preferences}
                    </p>
                  ) : null}
                  {r.assignedRoom && r.status === 'resolved' ? (
                    <p className="mt-2 rounded-md bg-[color:var(--primary-soft)] px-2 py-1.5 text-xs font-medium text-[color:var(--primary)]">
                      Одоогийн захиалгын өрөө: {r.assignedRoom.dormName} · №{r.assignedRoom.roomNumber}
                    </p>
                  ) : null}
                  {r.resolution ? (
                    <p className="mt-2 rounded-md bg-muted/50 px-2 py-1.5 text-xs">
                      {r.resolution}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-[color:var(--border)] shadow-[var(--sh-1)]">
        <div className="dms-card-hd">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[var(--r-md)] bg-[color:var(--primary-soft)] text-[color:var(--primary)]">
              <ArrowRightLeft className="size-[18px]" aria-hidden />
            </span>
            <div>
              <h3>Шинэ хүсэлт</h3>
              <p className="sub">
                Яагаад солих шаардлагатайг тодорхой бичнэ үү. Сонголттой давуу тал, хүссэн байршилыг
                доор нэмж болно.
              </p>
            </div>
          </div>
        </div>
        <CardContent className="space-y-4 pt-0">
          {okMsg ? (
            <div className="rounded-[var(--r-md)] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
              {okMsg}
            </div>
          ) : null}
          {formErr ? (
            <div className="rounded-[var(--r-md)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {formErr}
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="rc-reason">Солих шалтгаан</Label>
              <textarea
                id="rc-reason"
                required
                rows={5}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Жишээ: Эрүүл мэндийн шалтгаан, өрөөний хүүхдүүдтэй холбоотой шалтгаан гэх мэт."
                className={cn(
                  'flex min-h-28 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none',
                  'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
                  'dark:bg-input/30',
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rc-pref">Хүссэн өрөө / давуу байршил (сонголттой)</Label>
              <textarea
                id="rc-pref"
                rows={3}
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                placeholder="Хэрэв тодорхой сонголт байвал бичнэ үү."
                className={cn(
                  'flex min-h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none',
                  'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
                  'dark:bg-input/30',
                )}
              />
            </div>
            <Button
              type="submit"
              disabled={submit.isPending}
              className="bg-[color:var(--primary)]"
            >
              {submit.isPending ? 'Илгээж байна…' : 'Хүсэлт илгээх'}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Өмнөх «Өрөө захиалга» урсгал одоо харагдахгүй — та өрөө сонгож захиалгаа баталгаажуулсан байна.{' '}
        <Link to="/dashboard" className="underline underline-offset-2">
          Самбар
        </Link>
      </p>
    </div>
  )
}
