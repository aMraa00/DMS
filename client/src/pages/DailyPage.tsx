import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import axios from 'axios'
import {
  CalendarDays,
  DoorOpen,
  Layers,
  MessageSquareWarning,
  User,
  CalendarClock,
  Utensils,
  Newspaper,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react'
import { DmsBanner, PageHeaderDms } from '@/components/dms/PageChrome'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useAuth } from '@/stores/auth-store'

/* ── Категорийн нэрс (backend-тэй таарах ёстой) ── */
const COMPLAINT_CATEGORIES = [
  { key: 'maintenance_plumbing', label: 'Сантехник / Ус', emoji: '🚿' },
  { key: 'maintenance_electric', label: 'Цахилгаан', emoji: '⚡' },
  { key: 'maintenance_furniture', label: 'Тавилга / Тоног', emoji: '🛏️' },
  { key: 'maintenance_internet', label: 'Интернет / WiFi', emoji: '📶' },
  { key: 'maintenance_heating', label: 'Халаалт', emoji: '🔥' },
  { key: 'noise', label: 'Дуу чимээ', emoji: '🔊' },
  { key: 'cleanliness', label: 'Цэвэр байдал', emoji: '🧹' },
  { key: 'safety', label: 'Аюулгүй байдал', emoji: '🔒' },
  { key: 'other', label: 'Бусад', emoji: '💬' },
] as const

const BOOKING_RESOURCES = [
  { key: 'washing_machine_1', label: 'Угаалгын машин №1', emoji: '🫧' },
  { key: 'washing_machine_2', label: 'Угаалгын машин №2', emoji: '🫧' },
  { key: 'washing_machine_3', label: 'Угаалгын машин №3', emoji: '🫧' },
  { key: 'dryer_1', label: 'Хатаагч №1', emoji: '💨' },
  { key: 'study_room_a', label: 'Номын өрөө А', emoji: '📚' },
  { key: 'study_room_b', label: 'Номын өрөө Б', emoji: '📚' },
  { key: 'common_room', label: 'Нийтийн өрөө', emoji: '🛋️' },
  { key: 'gym', label: 'Дасгалын танхим', emoji: '💪' },
] as const

const BULLETIN_TYPES = [
  { key: 'sell', label: 'Зарна', color: 'bg-green-100 text-green-800' },
  { key: 'buy', label: 'Худалдаж авна', color: 'bg-blue-100 text-blue-800' },
  { key: 'lost', label: 'Алдсан', color: 'bg-red-100 text-red-800' },
  { key: 'found', label: 'Олдсон', color: 'bg-amber-100 text-amber-800' },
  { key: 'announce', label: 'Зарлал', color: 'bg-purple-100 text-purple-800' },
  { key: 'service', label: 'Үйлчилгээ', color: 'bg-cyan-100 text-cyan-800' },
] as const

/* ── Хоолны цагийн хуваарь (static) ── */
const CAFETERIA_SCHEDULE = [
  { meal: 'Өглөөний цай', time: '07:30 – 09:00', icon: '☕', days: 'Бүх өдөр' },
  { meal: 'Үдийн хоол', time: '12:00 – 13:30', icon: '🍲', days: 'Бүх өдөр' },
  { meal: 'Оройн хоол', time: '18:00 – 19:30', icon: '🍽️', days: 'Бүх өдөр' },
  { meal: 'Шөнийн чай (тусгай)', time: '21:00 – 22:00', icon: '🍵', days: 'Баасан – Бямба' },
]

/* ── Туслах функцүүд ── */
function formatApiErr(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const d = e.response?.data as { error?: unknown } | undefined
    if (typeof d?.error === 'string') return d.error
    if (d?.error && typeof d.error === 'object') return JSON.stringify(d.error)
  }
  return e instanceof Error ? e.message : 'Алдаа'
}

function minExitNoticeIsoDate() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 7)
  return d.toISOString().slice(0, 10)
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function statusBadge(status: string) {
  if (status === 'approved' || status === 'resolved' || status === 'active') return 'bg-[color:var(--ok-50)] text-[color:var(--ok-700)]'
  if (status === 'rejected' || status === 'cancelled') return 'bg-[color:var(--err-50)] text-[color:var(--err-700)]'
  return 'bg-[color:var(--warn-50)] text-[color:var(--warn-700)]'
}

function statusLabel(s: string) {
  const m: Record<string, string> = {
    pending: 'Хүлээгдэж буй', approved: 'Зөвшөөрсөн', rejected: 'Буцаасан',
    resolved: 'Шийдвэрлэсэн', active: 'Идэвхтэй', cancelled: 'Цуцлагдсан', completed: 'Дууссан',
  }
  return m[s] ?? s
}

/* ── Тип тодорхойлолт ── */
type ExitRow = { _id: string; requestedExitDate: string; reason: string; status: string; adminNote?: string }
type GuestRow = { _id: string; guestName: string; checkIn: string; checkOut: string; status: string }
type LeaveRow = { _id: string; leaveDate: string; returnDate: string; reason: string; status: string }
type ComplaintRow = { _id: string; title: string; category: string; status: string; createdAt: string }
type StorageRow = { _id: string; description: string; status: string; createdAt: string }
type BookingRow = { _id: string; resource: string; date: string; timeSlot: string; status: string }
type SlotInfo = { slot: string; available: boolean; mine: boolean; bookingId?: string }
type BulletinRow = {
  _id: string; type: string; title: string; body: string; contactPhone?: string
  price?: number; createdAt: string; expiresAt?: string
  userId: { firstName?: string; lastName?: string; studentId?: string } | string
}

/* ════════════════════════════════════════════════════════════ */
export function DailyPage() {
  const user = useAuth((s) => s.user)
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('guest')

  /* ── Зочин ── */
  const [guest, setGuest] = useState({ name: '', date: '', time: '14:00', phone: '', relationship: '', purpose: '' })
  const guestMy = useQuery({
    queryKey: ['guest-passes-my'],
    queryFn: async () => {
      const { data } = await api.get<{ guestPasses: GuestRow[] }>('/daily/guest-passes/my')
      return data.guestPasses
    },
  })
  const createGuest = useMutation({
    mutationFn: async () => {
      if (!guest.name || !guest.date || !guest.phone) throw new Error('Нэр, огноо, утас оруулна уу')
      const checkIn = new Date(`${guest.date}T${guest.time}:00`)
      const checkOut = new Date(`${guest.date}T19:59:00`)
      await api.post('/daily/guest-passes', {
        guestName: guest.name, guestPhone: guest.phone,
        relationship: guest.relationship || 'Танил', purpose: guest.purpose || undefined,
        checkIn, checkOut,
      })
    },
    onSuccess: () => {
      setGuest({ name: '', date: '', time: '14:00', phone: '', relationship: '', purpose: '' })
      void queryClient.invalidateQueries({ queryKey: ['guest-passes-my'] })
    },
  })

  /* ── Түр чөлөө ── */
  const [leave, setLeave] = useState({ from: '', to: '', reason: '' })
  const leaveMy = useQuery({
    queryKey: ['leave-requests-my'],
    queryFn: async () => {
      const { data } = await api.get<{ leaveRequests: LeaveRow[] }>('/daily/leave-requests/my')
      return data.leaveRequests
    },
  })
  const createLeave = useMutation({
    mutationFn: async () => {
      if (!leave.from || !leave.to || !leave.reason) throw new Error('Бүх талбарыг бөглөнө үү')
      await api.post('/daily/leave-requests', {
        leaveDate: leave.from, returnDate: leave.to, reason: leave.reason,
      })
    },
    onSuccess: () => {
      setLeave({ from: '', to: '', reason: '' })
      void queryClient.invalidateQueries({ queryKey: ['leave-requests-my'] })
    },
  })

  /* ── Гарах ── */
  const exitMin = useMemo(() => minExitNoticeIsoDate(), [])
  const [exit, setExit] = useState({ date: '', reason: '' })
  const [exitErr, setExitErr] = useState<string | null>(null)
  const exitMy = useQuery({
    queryKey: ['exit-requests-my'],
    queryFn: async () => {
      const { data } = await api.get<{ exitRequests: ExitRow[] }>('/daily/exit-requests/my')
      return data.exitRequests
    },
  })
  const createExit = useMutation({
    mutationFn: async () => {
      await api.post('/daily/exit-requests', { requestedExitDate: exit.date, reason: exit.reason })
    },
    onSuccess: () => {
      setExitErr(null)
      setExit({ date: '', reason: '' })
      void queryClient.invalidateQueries({ queryKey: ['exit-requests-my'] })
    },
    onError: (e) => setExitErr(formatApiErr(e)),
  })

  /* ── Санал гомдол / Засвар ── */
  const [complaint, setComplaint] = useState({ title: '', content: '', category: 'other' as string })
  const complaintMy = useQuery({
    queryKey: ['complaints-my'],
    queryFn: async () => {
      const { data } = await api.get<{ complaints: ComplaintRow[] }>('/daily/complaints/my')
      return data.complaints
    },
  })
  const createComplaint = useMutation({
    mutationFn: async () => {
      await api.post('/daily/complaints', complaint)
    },
    onSuccess: () => {
      setComplaint({ title: '', content: '', category: 'other' })
      void queryClient.invalidateQueries({ queryKey: ['complaints-my'] })
    },
  })

  /* ── Агуулах ── */
  const [storage, setStorage] = useState({ description: '', summerPeriodLabel: '' })
  const storageMy = useQuery({
    queryKey: ['storage-requests-my'],
    queryFn: async () => {
      const { data } = await api.get<{ storageRequests: StorageRow[] }>('/daily/storage-requests/my')
      return data.storageRequests
    },
  })
  const createStorage = useMutation({
    mutationFn: async () => {
      await api.post('/daily/storage-requests', { description: storage.description, summerPeriodLabel: storage.summerPeriodLabel || undefined })
    },
    onSuccess: () => {
      setStorage({ description: '', summerPeriodLabel: '' })
      void queryClient.invalidateQueries({ queryKey: ['storage-requests-my'] })
    },
  })

  /* ── Захиалга (Booking) ── */
  const [bookResource, setBookResource] = useState<string>(BOOKING_RESOURCES[0].key)
  const [bookDate, setBookDate] = useState(todayIso())
  const slots = useQuery({
    queryKey: ['booking-slots', bookResource, bookDate],
    queryFn: async () => {
      const { data } = await api.get<{ slots: SlotInfo[] }>('/bookings/slots', { params: { resource: bookResource, date: bookDate } })
      return data.slots
    },
    enabled: tab === 'booking',
  })
  const myBookings = useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => {
      const { data } = await api.get<{ bookings: BookingRow[] }>('/bookings/my')
      return data.bookings
    },
    enabled: tab === 'booking',
  })
  const createBooking = useMutation({
    mutationFn: async (slot: string) => {
      await api.post('/bookings', { resource: bookResource, date: bookDate, timeSlot: slot })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['booking-slots'] })
      void queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
    },
  })
  const cancelBooking = useMutation({
    mutationFn: async (id: string) => api.delete(`/bookings/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['booking-slots'] })
      void queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
    },
  })

  /* ── Нийтийн самбар (Bulletin) ── */
  const [bulletinFilter, setBulletinFilter] = useState<string>('all')
  const [newBulletin, setNewBulletin] = useState({ type: 'announce' as string, title: '', body: '', contactPhone: '', price: '' })
  const [showBulletinForm, setShowBulletinForm] = useState(false)
  const bulletins = useQuery({
    queryKey: ['bulletins', bulletinFilter],
    queryFn: async () => {
      const { data } = await api.get<{ items: BulletinRow[]; total: number }>('/bulletins', { params: { type: bulletinFilter } })
      return data
    },
    enabled: tab === 'bulletin',
  })
  const createBulletin = useMutation({
    mutationFn: async () => {
      await api.post('/bulletins', {
        ...newBulletin,
        price: newBulletin.price ? Number(newBulletin.price) : undefined,
      })
    },
    onSuccess: () => {
      setShowBulletinForm(false)
      setNewBulletin({ type: 'announce', title: '', body: '', contactPhone: '', price: '' })
      void queryClient.invalidateQueries({ queryKey: ['bulletins'] })
      void queryClient.invalidateQueries({ queryKey: ['my-bulletins'] })
    },
  })
  const deleteBulletin = useMutation({
    mutationFn: async (id: string) => api.delete(`/bulletins/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bulletins'] })
      void queryClient.invalidateQueries({ queryKey: ['my-bulletins'] })
    },
  })

  /* ── Хэрэглэгчийн нэр ── */
  const greetName = user?.firstName ?? 'Оюутан'

  /* ════ JSX ════ */
  return (
    <div className="space-y-6">
      <PageHeaderDms
        crumbs={['Үйлчилгээ']}
        title="Өдөр тутмын үйлчилгээ"
        sub={`Сайн байна уу, ${greetName} — зочин, чөлөө, засвар, захиалга, зар самбар.`}
      />

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList variant="line" className="mb-2 w-full flex-wrap justify-start gap-0 border-b border-[color:var(--border)] bg-transparent p-0 h-auto rounded-none overflow-x-auto">
          {[
            { val: 'guest', icon: <User className="size-3.5" />, label: 'Зочин' },
            { val: 'leave', icon: <CalendarDays className="size-3.5" />, label: 'Чөлөө' },
            { val: 'exit', icon: <DoorOpen className="size-3.5" />, label: 'Гарах' },
            { val: 'complaint', icon: <MessageSquareWarning className="size-3.5" />, label: 'Засвар / Гомдол' },
            { val: 'storage', icon: <Layers className="size-3.5" />, label: 'Агуулах' },
            { val: 'booking', icon: <CalendarClock className="size-3.5" />, label: 'Захиалга' },
            { val: 'cafeteria', icon: <Utensils className="size-3.5" />, label: 'Хоолны цаг' },
            { val: 'bulletin', icon: <Newspaper className="size-3.5" />, label: 'Зар самбар' },
          ].map(({ val, icon, label }) => (
            <TabsTrigger key={val} value={val} className="gap-1.5 rounded-none px-3 pb-3 shrink-0">
              {icon}{label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="grid-dms grid-dms-2 gap-6 pt-4">
          <div className="min-w-0 space-y-4">

            {/* ─── ЗОЧИН ─── */}
            <TabsContent value="guest" className="mt-0 outline-none">
              <Card className="border-[color:var(--border)] shadow-[var(--sh-1)]">
                <div className="dms-card-hd"><div><h3>Зочны зөвшөөрөл</h3><p className="sub">Зочин 20:00-аас өмнө байрыг орхих ёстой</p></div></div>
                <CardContent className="space-y-4 pt-0">
                  <DmsBanner variant="info"><div><div className="ttl">Журмын дагуу</div><div className="msg">Зочин дотуур байранд 20:00 хүртэл байж болно. Гарах цагийг зөв зааж өгнө үү.</div></div></DmsBanner>
                  {createGuest.isError && <p className="text-sm text-red-600">{formatApiErr(createGuest.error)}</p>}
                  {createGuest.isSuccess && <DmsBanner variant="ok"><div className="ttl">Хүсэлт илгээгдлээ — хянагдаж байна</div></DmsBanner>}
                  <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); createGuest.mutate() }}>
                    <div className="grid-dms grid-dms-2 gap-4">
                      <div className="space-y-2"><Label>Зочны нэр</Label><Input required value={guest.name} onChange={(e) => setGuest(s => ({ ...s, name: e.target.value }))} /></div>
                      <div className="space-y-2"><Label>Утас</Label><Input type="tel" placeholder="+976" value={guest.phone} onChange={(e) => setGuest(s => ({ ...s, phone: e.target.value }))} /></div>
                    </div>
                    <div className="grid-dms grid-dms-2 gap-4">
                      <div className="space-y-2"><Label>Огноо</Label><Input type="date" required min={todayIso()} value={guest.date} onChange={(e) => setGuest(s => ({ ...s, date: e.target.value }))} /></div>
                      <div className="space-y-2">
                        <Label>Гарах цаг <span className="text-[11px] font-normal text-muted-foreground">(≤ 20:00)</span></Label>
                        <Input type="time" max="19:59" value={guest.time} onChange={(e) => setGuest(s => ({ ...s, time: e.target.value }))} className={cn(guest.time >= '20:00' && 'border-red-400')} />
                        {guest.time >= '20:00' && <p className="text-xs text-red-600">20:00-аас өмнө байх ёстой</p>}
                      </div>
                    </div>
                    <div className="space-y-2"><Label>Хамаарал</Label><Input placeholder="Эцэг эх, найз, ах дүү..." value={guest.relationship} onChange={(e) => setGuest(s => ({ ...s, relationship: e.target.value }))} /></div>
                    <div className="space-y-2"><Label>Зорилго (заавал биш)</Label><Input placeholder="Айлчлал, тусламж..." value={guest.purpose} onChange={(e) => setGuest(s => ({ ...s, purpose: e.target.value }))} /></div>
                    <Button type="submit" disabled={createGuest.isPending || guest.time >= '20:00'} className="bg-[color:var(--primary)]">
                      {createGuest.isPending ? 'Илгээж байна…' : 'Хүсэлт илгээх'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── ТҮР ЧӨЛӨӨ ─── */}
            <TabsContent value="leave" className="mt-0 outline-none">
              <Card className="border-[color:var(--border)] shadow-[var(--sh-1)]">
                <div className="dms-card-hd"><div><h3>Түр чөлөө</h3><p className="sub">1–3 хоног — хэтэрвэл гарах хүсэлт гаргана</p></div></div>
                <CardContent className="space-y-4 pt-0">
                  <DmsBanner variant="info"><div><div className="ttl">3 өдрөөс илүү бол «Гарах» таб</div></div></DmsBanner>
                  {createLeave.isError && <p className="text-sm text-red-600">{formatApiErr(createLeave.error)}</p>}
                  {createLeave.isSuccess && <DmsBanner variant="ok"><div className="ttl">Хүсэлт илгээгдлээ</div></DmsBanner>}
                  <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); createLeave.mutate() }}>
                    <div className="grid-dms grid-dms-2 gap-4">
                      <div className="space-y-2"><Label>Явах огноо</Label><Input type="date" required min={todayIso()} value={leave.from} onChange={(e) => setLeave(s => ({ ...s, from: e.target.value }))} /></div>
                      <div className="space-y-2"><Label>Буцах огноо</Label><Input type="date" required min={leave.from || todayIso()} value={leave.to} onChange={(e) => setLeave(s => ({ ...s, to: e.target.value }))} /></div>
                    </div>
                    {leave.from && leave.to && (new Date(leave.to).getTime() - new Date(leave.from).getTime()) / 86400000 > 3 && (
                      <p className="text-xs text-amber-600">⚠️ 3 хоногоос их чөлөо авахаар бол «Гарах» хүсэлт илгээнэ үү.</p>
                    )}
                    <div className="space-y-2">
                      <Label>Шалтгаан</Label>
                      <textarea required minLength={5} rows={3} value={leave.reason} onChange={(e) => setLeave(s => ({ ...s, reason: e.target.value }))} className="flex min-h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30" />
                    </div>
                    <Button type="submit" disabled={createLeave.isPending} className="bg-[color:var(--primary)]">
                      {createLeave.isPending ? 'Илгээж байна…' : 'Илгээх'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── ГАРАХ ─── */}
            <TabsContent value="exit" className="mt-0 outline-none">
              <Card className="border-[color:var(--border)] shadow-[var(--sh-1)]">
                <div className="dms-card-hd"><div><h3>Байраас гарах</h3><p className="sub">Журмын 3.3.2 — дор хаяж 7 хоногийн өмнө</p></div></div>
                <CardContent className="space-y-4 pt-0">
                  {exitErr && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{exitErr}</div>}
                  <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setExitErr(null); createExit.mutate() }}>
                    <div className="space-y-2">
                      <Label>Гарах өдөр</Label>
                      <Input type="date" required min={exitMin} value={exit.date} onChange={(e) => setExit(s => ({ ...s, date: e.target.value }))} />
                      <p className="text-xs text-muted-foreground">Хамгийн эрт: {exitMin}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Шалтгаан</Label>
                      <textarea required minLength={5} rows={4} value={exit.reason} onChange={(e) => setExit(s => ({ ...s, reason: e.target.value }))} className="flex min-h-24 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30" />
                    </div>
                    <Button type="submit" disabled={createExit.isPending} className="bg-[color:var(--primary)]">
                      {createExit.isPending ? 'Илгээж байна…' : 'Хүсэлт илгээх'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── ЗАСВАР / ГОМДОЛ ─── */}
            <TabsContent value="complaint" className="mt-0 outline-none">
              <Card className="border-[color:var(--border)] shadow-[var(--sh-1)]">
                <div className="dms-card-hd"><div><h3>Засварын хүсэлт / Гомдол</h3><p className="sub">Категори сонгоход ажилтанд тусгайлан мэдэгдэл очно</p></div></div>
                <CardContent className="space-y-4 pt-0">
                  {createComplaint.isSuccess && <DmsBanner variant="ok"><div className="ttl">Хүсэлт бүртгэгдлээ</div></DmsBanner>}
                  {createComplaint.isError && <p className="text-sm text-red-600">{formatApiErr(createComplaint.error)}</p>}
                  <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); createComplaint.mutate() }}>
                    <div className="space-y-2">
                      <Label>Ангилал</Label>
                      <div className="flex flex-wrap gap-2">
                        {COMPLAINT_CATEGORIES.map(({ key, label, emoji }) => (
                          <button
                            key={key} type="button"
                            onClick={() => setComplaint(s => ({ ...s, category: key }))}
                            className={cn(
                              'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                              complaint.category === key
                                ? 'border-[color:var(--primary)] bg-[color:var(--primary-soft)] text-[color:var(--primary)]'
                                : 'border-[color:var(--border)] text-muted-foreground hover:border-[color:var(--primary)]/50',
                            )}
                          >
                            <span>{emoji}</span>{label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2"><Label>Гарчиг</Label><Input required minLength={3} value={complaint.title} onChange={(e) => setComplaint(s => ({ ...s, title: e.target.value }))} placeholder="Товч тайлбар..." /></div>
                    <div className="space-y-2">
                      <Label>Дэлгэрэнгүй</Label>
                      <textarea required minLength={10} rows={4} value={complaint.content} onChange={(e) => setComplaint(s => ({ ...s, content: e.target.value }))} className="flex min-h-24 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30" />
                    </div>
                    <Button type="submit" disabled={createComplaint.isPending} className="bg-[color:var(--primary)]">
                      {createComplaint.isPending ? 'Илгээж байна…' : 'Илгээх'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── АГУУЛАХ ─── */}
            <TabsContent value="storage" className="mt-0 outline-none">
              <Card className="border-[color:var(--border)] shadow-[var(--sh-1)]">
                <div className="dms-card-hd"><div><h3>Зуны агуулах</h3><p className="sub">Зуны амралтын үеэр эд хэрэгслээ хадгалуулах</p></div></div>
                <CardContent className="space-y-4 pt-0">
                  {createStorage.isSuccess && <DmsBanner variant="ok"><div className="ttl">Хүсэлт бүртгэгдлээ</div></DmsBanner>}
                  {createStorage.isError && <p className="text-sm text-red-600">{formatApiErr(createStorage.error)}</p>}
                  <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); createStorage.mutate() }}>
                    <div className="space-y-2">
                      <Label>Хадгалах зүйлийн тайлбар</Label>
                      <textarea required minLength={5} rows={4} placeholder="Жишээ: 1 чемодан, 2 уут хувцас..." value={storage.description} onChange={(e) => setStorage(s => ({ ...s, description: e.target.value }))} className="flex min-h-24 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30" />
                    </div>
                    <div className="space-y-2"><Label>Улирлын хугацаа (заавал биш)</Label><Input placeholder="Жишээ: 2026 зун" value={storage.summerPeriodLabel} onChange={(e) => setStorage(s => ({ ...s, summerPeriodLabel: e.target.value }))} /></div>
                    <Button type="submit" disabled={createStorage.isPending} className="bg-[color:var(--primary)]">
                      {createStorage.isPending ? 'Илгээж байна…' : 'Хүсэлт илгээх'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── ЗАХИАЛГА ─── */}
            <TabsContent value="booking" className="mt-0 outline-none space-y-4">
              <Card className="border-[color:var(--border)] shadow-[var(--sh-1)]">
                <div className="dms-card-hd"><div><h3>Угаалга / Өрөө захиалга</h3><p className="sub">7 хоногийн хүрээнд нэг нөөцөд өдөрт ≤2 цаг</p></div></div>
                <CardContent className="space-y-4 pt-0">
                  <div className="grid-dms grid-dms-2 gap-4">
                    <div className="space-y-2">
                      <Label>Нөөц</Label>
                      <select
                        className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-ring"
                        value={bookResource}
                        onChange={(e) => setBookResource(e.target.value)}
                      >
                        {BOOKING_RESOURCES.map(({ key, label, emoji }) => (
                          <option key={key} value={key}>{emoji} {label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Өдөр</Label>
                      <Input type="date" min={todayIso()} value={bookDate} onChange={(e) => setBookDate(e.target.value)} />
                    </div>
                  </div>
                  {slots.isLoading ? (
                    <p className="text-sm text-muted-foreground">Ачааллаж байна…</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {(slots.data ?? []).map(({ slot, available, mine, bookingId }) => (
                        <button
                          key={slot} type="button"
                          disabled={!available && !mine}
                          onClick={() => {
                            if (mine && bookingId) cancelBooking.mutate(bookingId)
                            else if (available) createBooking.mutate(slot)
                          }}
                          className={cn(
                            'rounded-lg border px-2 py-2 text-xs font-medium transition-colors',
                            mine
                              ? 'border-[color:var(--primary)] bg-[color:var(--primary-soft)] text-[color:var(--primary)]'
                              : available
                                ? 'border-[color:var(--border)] hover:border-[color:var(--primary)]/50 hover:bg-[color:var(--primary-soft)]/30'
                                : 'cursor-not-allowed border-transparent bg-muted text-muted-foreground opacity-40',
                          )}
                        >
                          {slot.slice(0, 5)}
                          {mine && <span className="ml-1 text-[10px]">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground">Өөрийн цагийг дахин дарж цуцална.</p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── ХООЛНЫ ЦАГ ─── */}
            <TabsContent value="cafeteria" className="mt-0 outline-none">
              <Card className="border-[color:var(--border)] shadow-[var(--sh-1)]">
                <div className="dms-card-hd"><div><h3>Хоолны газрын хуваарь</h3><p className="sub">Дотуур байрны хоолны цаг</p></div></div>
                <CardContent className="space-y-3 pt-0">
                  {CAFETERIA_SCHEDULE.map(({ meal, time, icon, days }) => (
                    <div key={meal} className="flex items-center gap-4 rounded-[var(--r-md)] border border-[color:var(--border)] px-4 py-3">
                      <span className="text-2xl">{icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{meal}</div>
                        <div className="text-xs text-muted-foreground">{days}</div>
                      </div>
                      <div className="tabular-nums text-sm font-semibold text-[color:var(--primary)]">{time}</div>
                    </div>
                  ))}
                  <DmsBanner variant="info">
                    <div><div className="ttl">Тэмдэглэл</div><div className="msg">Баярын болон тусгай өдрүүдэд цаг өөрчлөгдөж болно. Тухайн үеийн зарлалыг «Зар самбар» болон «Мэдэгдэл» хэсгээс харна уу.</div></div>
                  </DmsBanner>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── ЗАР САМБАР ─── */}
            <TabsContent value="bulletin" className="mt-0 outline-none space-y-4">
              <Card className="border-[color:var(--border)] shadow-[var(--sh-1)]">
                <div className="dms-card-hd flex-col gap-3 sm:flex-row sm:items-center">
                  <div><h3>Нийтийн зар самбар</h3><p className="sub">Зарна, авна, алдсан, олдсон, зарлал</p></div>
                  <Button size="sm" className="bg-[color:var(--primary)] gap-1 shrink-0" onClick={() => setShowBulletinForm((v) => !v)}>
                    <Plus className="size-3.5" />{showBulletinForm ? 'Болих' : 'Зар нийтлэх'}
                  </Button>
                </div>
                {showBulletinForm && (
                  <div className="border-t border-[color:var(--border)] bg-[color:var(--surface-2)] px-6 py-4 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {BULLETIN_TYPES.map(({ key, label }) => (
                        <button key={key} type="button"
                          onClick={() => setNewBulletin(v => ({ ...v, type: key }))}
                          className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-colors', newBulletin.type === key ? 'border-[color:var(--primary)] bg-[color:var(--primary-soft)] text-[color:var(--primary)]' : 'border-[color:var(--border)] text-muted-foreground')}
                        >{label}</button>
                      ))}
                    </div>
                    <Input placeholder="Гарчиг" value={newBulletin.title} onChange={(e) => setNewBulletin(v => ({ ...v, title: e.target.value }))} />
                    <textarea rows={3} placeholder="Дэлгэрэнгүй..." value={newBulletin.body} onChange={(e) => setNewBulletin(v => ({ ...v, body: e.target.value }))} className="flex min-h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
                    <div className="grid-dms grid-dms-2 gap-3">
                      <Input placeholder="Утас (заавал биш)" value={newBulletin.contactPhone} onChange={(e) => setNewBulletin(v => ({ ...v, contactPhone: e.target.value }))} />
                      <Input type="number" placeholder="Үнэ ₮ (заавал биш)" value={newBulletin.price} onChange={(e) => setNewBulletin(v => ({ ...v, price: e.target.value }))} />
                    </div>
                    <Button size="sm" disabled={createBulletin.isPending || !newBulletin.title || !newBulletin.body} onClick={() => createBulletin.mutate()} className="bg-[color:var(--primary)]">
                      {createBulletin.isPending ? 'Нийтэлж байна…' : 'Нийтлэх'}
                    </Button>
                  </div>
                )}
                <div className="border-t border-[color:var(--border)] px-6 py-3 flex flex-wrap gap-2">
                  {[{ key: 'all', label: 'Бүгд' }, ...BULLETIN_TYPES].map(({ key, label }) => (
                    <button key={key} type="button"
                      onClick={() => setBulletinFilter(key)}
                      className={cn('rounded-full border px-3 py-1 text-xs font-medium', bulletinFilter === key ? 'border-[color:var(--primary)] bg-[color:var(--primary-soft)] text-[color:var(--primary)]' : 'border-[color:var(--border)] text-muted-foreground')}
                    >{label}</button>
                  ))}
                </div>
                <CardContent className="space-y-3 pt-0">
                  {bulletins.isLoading ? (
                    <p className="text-sm text-muted-foreground">Ачааллаж байна…</p>
                  ) : !bulletins.data?.items.length ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Зар байхгүй байна.</p>
                  ) : (
                    <div className="space-y-3">
                      {bulletins.data.items.map((b) => {
                        const typeInfo = BULLETIN_TYPES.find(t => t.key === b.type)
                        const author = typeof b.userId === 'object' ? `${b.userId.lastName ?? ''} ${b.userId.firstName ?? ''}`.trim() || b.userId.studentId || '?' : '?'
                        const isOwn = typeof b.userId === 'object' ? String((b.userId as { _id?: string })._id) === user?.id : String(b.userId) === user?.id
                        return (
                          <div key={b._id} className="rounded-[var(--r-md)] border border-[color:var(--border)] p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', typeInfo?.color ?? 'bg-gray-100 text-gray-700')}>{typeInfo?.label ?? b.type}</span>
                                <span className="font-semibold text-sm">{b.title}</span>
                              </div>
                              {isOwn && (
                                <button type="button" onClick={() => deleteBulletin.mutate(b._id)} className="shrink-0 text-muted-foreground hover:text-red-500">
                                  <Trash2 className="size-3.5" />
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{b.body}</p>
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                              <span>{author}</span>
                              {b.price && <span className="font-semibold text-foreground">₮{b.price.toLocaleString()}</span>}
                              {b.contactPhone && <span>📞 {b.contactPhone}</span>}
                              <span>{new Date(b.createdAt).toLocaleDateString('mn-MN')}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

          </div>

          {/* ─── БАРУУН ТАЛ: Миний хүсэлтүүд ─── */}
          <div className="h-fit space-y-4">
            <Card className="border-[color:var(--border)] shadow-[var(--sh-1)]">
              <div className="dms-card-hd"><div><h3>Миний хүсэлтүүд</h3><p className="sub">Бодит серверийн өгөгдөл</p></div></div>
              <CardContent className="space-y-4 pt-0">

                {/* Зочин */}
                {!!guestMy.data?.length && (
                  <Section title="Зочин">
                    {guestMy.data.slice(0, 3).map((r) => (
                      <ReqRow key={r._id} label={r.guestName} sub={new Date(r.checkIn).toLocaleDateString('mn-MN')} status={r.status} />
                    ))}
                  </Section>
                )}

                {/* Чөлөө */}
                {!!leaveMy.data?.length && (
                  <Section title="Түр чөлөө">
                    {leaveMy.data.slice(0, 3).map((r) => (
                      <ReqRow key={r._id} label={`${new Date(r.leaveDate).toLocaleDateString('mn-MN')} – ${new Date(r.returnDate).toLocaleDateString('mn-MN')}`} sub={r.reason.slice(0, 60)} status={r.status} />
                    ))}
                  </Section>
                )}

                {/* Гарах */}
                {!!exitMy.data?.length && (
                  <Section title="Байраас гарах">
                    {exitMy.data.slice(0, 3).map((r) => (
                      <ReqRow key={r._id} label={new Date(r.requestedExitDate).toLocaleDateString('mn-MN')} sub={r.adminNote ?? r.reason.slice(0, 60)} status={r.status} />
                    ))}
                  </Section>
                )}

                {/* Гомдол */}
                {!!complaintMy.data?.length && (
                  <Section title="Засвар / Гомдол">
                    {complaintMy.data.slice(0, 3).map((r) => (
                      <ReqRow key={r._id} label={r.title} sub={COMPLAINT_CATEGORIES.find(c => c.key === r.category)?.label ?? r.category} status={r.status} />
                    ))}
                  </Section>
                )}

                {/* Захиалга */}
                {!!myBookings.data?.length && (
                  <Section title="Захиалга">
                    {myBookings.data.slice(0, 3).map((r) => {
                      const res = BOOKING_RESOURCES.find(b => b.key === r.resource)
                      return <ReqRow key={r._id} label={res?.label ?? r.resource} sub={`${r.date} · ${r.timeSlot}`} status={r.status} />
                    })}
                  </Section>
                )}

                {/* Агуулах */}
                {!!storageMy.data?.length && (
                  <Section title="Агуулах">
                    {storageMy.data.slice(0, 2).map((r) => (
                      <ReqRow key={r._id} label={r.description.slice(0, 50)} sub={new Date(r.createdAt).toLocaleDateString('mn-MN')} status={r.status} />
                    ))}
                  </Section>
                )}

                {!guestMy.data?.length && !leaveMy.data?.length && !exitMy.data?.length && !complaintMy.data?.length && !myBookings.data?.length && !storageMy.data?.length && (
                  <p className="text-sm text-muted-foreground">Хүсэлт байхгүй байна.</p>
                )}
              </CardContent>
            </Card>

            {/* Хурдан санамж */}
            <Card className="border-[color:var(--border)] shadow-[var(--sh-1)]">
              <div className="dms-card-hd"><div><h3>Санамж</h3></div></div>
              <CardContent className="space-y-2 pt-0 text-xs text-muted-foreground">
                <p className="flex gap-2"><CheckCircle2 className="size-3.5 mt-0.5 shrink-0 text-[color:var(--ok-500)]" />Зочин 20:00-аас өмнө явах ёстой</p>
                <p className="flex gap-2"><CheckCircle2 className="size-3.5 mt-0.5 shrink-0 text-[color:var(--ok-500)]" />Чөлөо 3 хоногоос ихгүй</p>
                <p className="flex gap-2"><CheckCircle2 className="size-3.5 mt-0.5 shrink-0 text-[color:var(--ok-500)]" />Гарах хүсэлт 7 хоногийн өмнө</p>
                <p className="flex gap-2"><CheckCircle2 className="size-3.5 mt-0.5 shrink-0 text-[color:var(--ok-500)]" />Угаалга: нэг нөөцөд өдөрт ≤2 цаг</p>
                <p className="flex gap-2"><CheckCircle2 className="size-3.5 mt-0.5 shrink-0 text-[color:var(--ok-500)]" />Зар самбарын хугацаа 14 хоног</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Tabs>
    </div>
  )
}

/* ─── Туслах бяцхан component-ууд ─── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">{title}</p>
      <div className="flex flex-col divide-y divide-[color:var(--border)] rounded-lg border border-[color:var(--border)]">
        {children}
      </div>
    </div>
  )
}

function ReqRow({ label, sub, status }: { label: string; sub?: string; status: string }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 text-sm">
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{label}</div>
        {sub && <div className="truncate text-[11px] text-[color:var(--text-muted)]">{sub}</div>}
      </div>
      <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-medium', statusBadge(status))}>
        {statusLabel(status)}
      </span>
    </div>
  )
}
