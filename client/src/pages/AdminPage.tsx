import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowDown,
  ArrowRightLeft,
  ArrowUp,
  BedDouble,
  CalendarClock,
  CreditCard,
  Download,
  Package,
  Plus,
  ShieldAlert,
  Trash2,
  Users,
} from 'lucide-react'
import { DmsBanner, DmsStatCard, PageHeaderDms } from '@/components/dms/PageChrome'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import axios from 'axios'
import { api } from '@/lib/api'
import { formatMnt } from '@/lib/format'
import { CAMPUS_AIMAG_LABEL, CAMPUS_DATE_COLUMN_LABEL, CAMPUS_LOCALITY_LABEL } from '@/lib/campus-region'
import { cn } from '@/lib/utils'
import { useAuth } from '@/stores/auth-store'

const ADMIN_TABS = ['rooms', 'payments', 'exits', 'room-changes', 'users', 'violations', 'duty', 'inventory'] as const
const ADMIN_USERS_PAGE = 50
type AdminTab = (typeof ADMIN_TABS)[number]

type DutyRosterRow = {
  _id: string
  sequence: number
  userId: string
  userStatus?: string
  firstName?: string
  lastName?: string
  studentId?: string
  rosterEligibleDuty: boolean
}

type ViolationRow = {
  _id: string
  userId: { _id: string; studentId?: string; firstName?: string; lastName?: string; email?: string } | string
  type: 'WARN' | 'CANCEL'
  category: string
  description: string
  violatedAt: string
  createdAt?: string
}

type InventoryItem = {
  _id: string
  itemName: string
  quantity: number
  condition: string
  unitPrice: number
  roomId: { _id: string; roomNumber: number } | string
}

function todayMn() {
  return new Date().toLocaleDateString('mn-MN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

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

function paymentStatusMn(status: string) {
  const map: Record<string, string> = {
    pending: 'Хүлээгдэж буй',
    paid: 'Төлөгдсөн',
    failed: 'Амжилтгүй',
  }
  return map[status] ?? status
}

function exitStatusMn(status: string) {
  const map: Record<string, string> = {
    pending: 'Хүлээгдэж буй',
    approved: 'Зөвшөөрсөн',
    rejected: 'Буцаасан',
  }
  return map[status] ?? status
}

function roomChangeStatusMn(status: string) {
  const map: Record<string, string> = {
    pending: 'Хүлээгдэж буй',
    resolved: 'Шийдвэрлэсэн',
    rejected: 'Татгалзсан',
  }
  return map[status] ?? status
}

function roleMn(role: string) {
  const map: Record<string, string> = {
    student: 'Оюутан',
    staff: 'Ажилтан',
    admin: 'Админ',
    accountant: 'Нягтлан',
  }
  return map[role] ?? role
}

function accountStatusMn(status: string, isDisabled: boolean) {
  if (isDisabled || status === 'suspended') return 'Хориглосон'
  if (status === 'active') return 'Идэвхтэй'
  const map: Record<string, string> = {
    pending_verification: 'Баталгаажуулах хүлээгдэж буй',
  }
  return map[status] ?? status
}

function fmtAdminDt(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('mn-MN')
}

function axiosErrMsg(e: unknown): string {
  if (axios.isAxiosError(e) && e.response?.data && typeof e.response.data === 'object') {
    const err = (e.response.data as { error?: unknown }).error
    if (typeof err === 'string') return err
  }
  return 'Алдаа гарлаа'
}

type ApplicationRow = {
  _id: string
  userId: string
  status: string
  createdAt: string
  priorityTier?: number
}

type ContractRow = {
  _id: string
  userId: string
  status: string
}

type PaymentRow = {
  _id: string
  userId: unknown
  amount: number
  status: string
  createdAt?: string
}

type ExitAdminRow = {
  _id: string
  userId: string
  user: {
    id: string
    studentId?: string
    registerNumber?: string
    firstName?: string
    lastName?: string
    email?: string
  } | null
  requestedExitDate: string
  reason: string
  status: string
  adminNote?: string
  createdAt?: string
}

type RoomChangeAdminRow = {
  _id: string
  userId: string
  user: ExitAdminRow['user']
  reason: string
  preferences?: string
  status: string
  resolution?: string
  resolvedAt?: string
  createdAt?: string
  assignedRoomId?: string
  assignedRoom?: { dormName: string; roomNumber: number } | null
}

type AdminUserRow = {
  _id: string
  email: string
  firstName: string
  lastName: string
  studentId?: string
  registerNumber?: string
  phone?: string
  role: string
  status: string
  isDisabled: boolean
  westLoginName?: string
  level?: string
  region?: string
  gender?: string
  school?: string
  program?: string
  createdAt?: string
  updatedAt?: string
}

export function AdminPage() {
  const user = useAuth((s) => s.user)
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const rawTab = searchParams.get('tab')
  const normalizedTab = rawTab === 'students' ? 'users' : rawTab
  const tab: AdminTab =
    normalizedTab && (ADMIN_TABS as readonly string[]).includes(normalizedTab)
      ? (normalizedTab as AdminTab)
      : 'rooms'

  function setTab(next: string) {
    if (!(ADMIN_TABS as readonly string[]).includes(next)) return
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        if (next === 'rooms') p.delete('tab')
        else p.set('tab', next)
        return p
      },
      { replace: true },
    )
  }
  const [exitStatusFilter, setExitStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>(
    'pending',
  )
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [rcRejectOpen, setRcRejectOpen] = useState(false)
  const [rcRejectId, setRcRejectId] = useState<string | null>(null)
  const [rcRejectNote, setRcRejectNote] = useState('')
  const [rcResolveOpen, setRcResolveOpen] = useState(false)
  const [rcResolveId, setRcResolveId] = useState<string | null>(null)
  const [rcResolveRoomId, setRcResolveRoomId] = useState('')
  const [rcResolveNote, setRcResolveNote] = useState('')
  const [rcResolveErr, setRcResolveErr] = useState<string | null>(null)
  const [rcStatusFilter, setRcStatusFilter] = useState<
    'all' | 'pending' | 'resolved' | 'rejected'
  >('pending')

  const [selectedExitIds, setSelectedExitIds] = useState<Set<string>>(new Set())
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false)
  const [bulkRejectNote, setBulkRejectNote] = useState('')
  const [violationTypeFilter, setViolationTypeFilter] = useState<'all' | 'WARN' | 'CANCEL'>('all')
  const [newViolation, setNewViolation] = useState({ userId: '', type: 'WARN' as 'WARN' | 'CANCEL', category: '', description: '' })
  const [violationFormOpen, setViolationFormOpen] = useState(false)
  const [dutyAddOpen, setDutyAddOpen] = useState(false)
  const [dutyStudentCode, setDutyStudentCode] = useState('')
  const [dutyPickSearchDraft, setDutyPickSearchDraft] = useState('')
  const [dutyPickSearchDeb, setDutyPickSearchDeb] = useState('')
  const [dutyAddErr, setDutyAddErr] = useState<string | null>(null)

  const [userSearchDraft, setUserSearchDraft] = useState('')
  const [debouncedUserSearch, setDebouncedUserSearch] = useState('')
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedUserSearch(userSearchDraft.trim()), 400)
    return () => window.clearTimeout(t)
  }, [userSearchDraft])

  useEffect(() => {
    if (!dutyAddOpen) return
    const t = window.setTimeout(() => setDutyPickSearchDeb(dutyPickSearchDraft.trim()), 350)
    return () => window.clearTimeout(t)
  }, [dutyPickSearchDraft, dutyAddOpen])

  const [userRoleFilter, setUserRoleFilter] = useState<
    'all' | 'student' | 'staff' | 'admin' | 'accountant'
  >('all')
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [userListSkip, setUserListSkip] = useState(0)
  const [detailUser, setDetailUser] = useState<AdminUserRow | null>(null)

  useEffect(() => {
    setUserListSkip(0)
  }, [debouncedUserSearch, userRoleFilter, userStatusFilter])

  const overview = useQuery({
    queryKey: ['admin-pending-overview'],
    queryFn: async () => {
      const { data } = await api.get<{
        applications: ApplicationRow[]
        contractsPendingSignature: ContractRow[]
      }>('/admin/pending-overview')
      return data
    },
  })

  const payments = useQuery({
    queryKey: ['admin-payments-overview', { limit: 500 }],
    queryFn: async () => {
      const { data } = await api.get<{ payments: PaymentRow[] }>('/admin/payments/overview', {
        params: { limit: 500 },
      })
      const list = data.payments
      return Array.isArray(list) ? list : []
    },
  })

  const exitAdmin = useQuery({
    queryKey: ['admin-exit-requests', exitStatusFilter],
    queryFn: async () => {
      const { data } = await api.get<{ exitRequests: ExitAdminRow[]; pendingCount: number }>(
        '/admin/exit-requests',
        { params: { status: exitStatusFilter } },
      )
      return data
    },
  })

  const approveExit = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/admin/exit-requests/${id}/approve`)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-exit-requests'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-pending-overview'] })
    },
  })

  const rejectExit = useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      await api.post(`/admin/exit-requests/${id}/reject`, { note })
    },
    onSuccess: () => {
      setRejectOpen(false)
      setRejectId(null)
      setRejectNote('')
      void queryClient.invalidateQueries({ queryKey: ['admin-exit-requests'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-pending-overview'] })
    },
  })

  const roomChangesAdmin = useQuery({
    queryKey: ['admin-room-change-requests', rcStatusFilter],
    queryFn: async () => {
      const { data } = await api.get<{
        roomChangeRequests: RoomChangeAdminRow[]
        pendingCount: number
      }>('/admin/room-change-requests', { params: { status: rcStatusFilter } })
      return data
    },
  })

  const roomsForAssignment = useQuery({
    queryKey: ['admin-rooms-for-assignment'],
    queryFn: async () => {
      const { data } = await api.get<{
        rooms: {
          id: string
          roomNumber: number
          dormName: string
          dormGenderType: string
          currentOccupancy: number
          maxOccupancy: number
          status: string
        }[]
      }>('/admin/rooms-for-assignment')
      return data.rooms
    },
    enabled: tab === 'room-changes',
  })

  const resolveRoomChange = useMutation({
    mutationFn: async (payload: { id: string; assignedRoomId: string; note?: string }) =>
      api.post(`/admin/room-change-requests/${payload.id}/resolve`, {
        assignedRoomId: payload.assignedRoomId,
        note: payload.note?.trim() ? payload.note.trim() : undefined,
      }),
    onMutate: () => {
      setRcResolveErr(null)
    },
    onSuccess: () => {
      setRcResolveOpen(false)
      setRcResolveId(null)
      setRcResolveRoomId('')
      setRcResolveNote('')
      void queryClient.invalidateQueries({ queryKey: ['admin-room-change-requests'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-rooms-for-assignment'] })
    },
    onError: (e) => {
      setRcResolveErr(axiosErrMsg(e))
    },
  })

  const rejectRoomChange = useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      await api.post(`/admin/room-change-requests/${id}/reject`, { note })
    },
    onSuccess: () => {
      setRcRejectOpen(false)
      setRcRejectId(null)
      setRcRejectNote('')
      void queryClient.invalidateQueries({ queryKey: ['admin-room-change-requests'] })
    },
  })

  const adminUsers = useQuery({
    queryKey: [
      'admin-users',
      {
        search: debouncedUserSearch,
        role: userRoleFilter,
        status: userStatusFilter,
        skip: userListSkip,
        limit: ADMIN_USERS_PAGE,
      },
    ],
    queryFn: async () => {
      const { data } = await api.get<{
        users: AdminUserRow[]
        total: number
        skip: number
        limit: number
      }>('/admin/users', {
        params: {
          search: debouncedUserSearch || undefined,
          role: userRoleFilter,
          status: userStatusFilter,
          skip: userListSkip,
          limit: ADMIN_USERS_PAGE,
        },
      })
      return data
    },
    enabled: tab === 'users',
  })

  const bulkApproveExit = useMutation({
    mutationFn: async (ids: string[]) => api.post('/admin/exit-requests/bulk-approve', { ids }),
    onSuccess: () => {
      setSelectedExitIds(new Set())
      void queryClient.invalidateQueries({ queryKey: ['admin-exit-requests'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-pending-overview'] })
    },
  })

  const bulkRejectExit = useMutation({
    mutationFn: async ({ ids, note }: { ids: string[]; note: string }) =>
      api.post('/admin/exit-requests/bulk-reject', { ids, note }),
    onSuccess: () => {
      setSelectedExitIds(new Set())
      setBulkRejectOpen(false)
      setBulkRejectNote('')
      void queryClient.invalidateQueries({ queryKey: ['admin-exit-requests'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-pending-overview'] })
    },
  })

  const violations = useQuery({
    queryKey: ['admin-violations', violationTypeFilter],
    queryFn: async () => {
      const { data } = await api.get<{ violations: ViolationRow[]; total: number }>('/admin/violations', {
        params: { type: violationTypeFilter, limit: 100 },
      })
      return data
    },
    enabled: tab === 'violations',
  })

  const createViolation = useMutation({
    mutationFn: async (v: typeof newViolation) => api.post('/admin/violations', v),
    onSuccess: () => {
      setViolationFormOpen(false)
      setNewViolation({ userId: '', type: 'WARN', category: '', description: '' })
      void queryClient.invalidateQueries({ queryKey: ['admin-violations'] })
    },
  })

  const inventoryItems = useQuery({
    queryKey: ['admin-inventory'],
    queryFn: async () => {
      const { data } = await api.get<{ items: InventoryItem[]; total: number }>('/inventory')
      return data
    },
    enabled: tab === 'inventory',
  })

  const dutyRoster = useQuery({
    queryKey: ['admin-duty-roster'],
    queryFn: async () => {
      const { data } = await api.get<{ entries: DutyRosterRow[]; eligibleActive: number }>(
        '/admin/duty/roster',
      )
      return data
    },
    enabled: tab === 'duty',
  })

  const dutyWeek = useQuery({
    queryKey: ['admin-duty-week', 14],
    queryFn: async () => {
      const { data } = await api.get<{
        schedule: { dateKey: string; assignedUserId: string | null; nameHint: string }[]
      }>('/admin/duty/preview-week', { params: { days: 14 } })
      return data.schedule
    },
    enabled: tab === 'duty',
  })

  const syncDutyRoster = useMutation({
    mutationFn: async () => api.post('/admin/duty/sync-roster-from-students'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-duty-roster'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-duty-week'] })
    },
  })

  const dutyPickStudents = useQuery({
    queryKey: ['admin-duty-pick-users', dutyPickSearchDeb],
    queryFn: async () => {
      const { data } = await api.get<{ users: AdminUserRow[] }>('/admin/users', {
        params: {
          role: 'student',
          search: dutyPickSearchDeb.length >= 2 ? dutyPickSearchDeb : undefined,
          limit: 40,
          skip: 0,
        },
      })
      return data.users
    },
    enabled: dutyAddOpen && dutyPickSearchDeb.length >= 2,
  })

  const addDutyMember = useMutation({
    mutationFn: async (body: { userId?: string; studentId?: string }) => {
      await api.post('/admin/duty/roster/members', body)
    },
    onSuccess: () => {
      setDutyAddErr(null)
      setDutyStudentCode('')
      setDutyPickSearchDraft('')
      setDutyPickSearchDeb('')
      setDutyAddOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['admin-duty-roster'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-duty-week'] })
    },
    onError: (e) => setDutyAddErr(axiosErrMsg(e)),
  })

  const deleteDutyMember = useMutation({
    mutationFn: async (entryId: string) => api.delete(`/admin/duty/roster/members/${entryId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-duty-roster'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-duty-week'] })
    },
    onError: (e) => window.alert(axiosErrMsg(e)),
  })

  const moveDutyMember = useMutation({
    mutationFn: async ({
      entryId,
      direction,
    }: {
      entryId: string
      direction: 'up' | 'down'
    }) => api.patch(`/admin/duty/roster/members/${entryId}/move`, { direction }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-duty-roster'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-duty-week'] })
    },
    onError: (e) => window.alert(axiosErrMsg(e)),
  })

  const patchUserAction = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'activate' | 'suspend' }) => {
      const { data } = await api.patch<{ user: AdminUserRow }>(`/admin/users/${id}`, { action })
      return data.user
    },
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-duty-roster'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-duty-week'] })
      setDetailUser((prev) => (prev && prev._id === updated._id ? updated : prev))
    },
  })

  const apps = overview.data?.applications ?? []
  const contracts = overview.data?.contractsPendingSignature ?? []
  const payRows = payments.data ?? []
  const payPendingRows = payRows.filter((p) => p.status === 'pending')
  const payPaidRows = payRows.filter((p) => p.status === 'paid')
  const payFailedRows = payRows.filter((p) => p.status === 'failed')
  const pendingPay = payPendingRows.length
  const pendingPaySum = payPendingRows.reduce((s, p) => s + p.amount, 0)
  const paidSum = payPaidRows.reduce((s, p) => s + p.amount, 0)
  const overdueLike = payFailedRows.length
  const exitPending = exitAdmin.data?.pendingCount ?? 0
  const exitRows = exitAdmin.data?.exitRequests ?? []
  const rcPending = roomChangesAdmin.data?.pendingCount ?? 0
  const rcRows = roomChangesAdmin.data?.roomChangeRequests ?? []
  const adminUserRows = adminUsers.data?.users ?? []
  const adminUserTotal = adminUsers.data?.total ?? 0
  const adminUsersHasNext = userListSkip + ADMIN_USERS_PAGE < adminUserTotal

  function studentDisplay(userId: string, user: ExitAdminRow['user']) {
    if (user) {
      const name = `${user.lastName ?? ''} ${user.firstName ?? ''}`.trim()
      const reg = user.registerNumber?.trim()
      const sid = user.studentId?.trim()
      const numId = reg || sid
      if (name && numId) return `${name} · ${numId}`
      if (name) return name
      if (numId) return numId
      const em = user.email?.trim()
      if (em) return em
      return userId.slice(-8)
    }
    return userId.slice(-8)
  }

  function studentLabel(r: ExitAdminRow) {
    return studentDisplay(r.userId, r.user)
  }

  function openReject(id: string) {
    setRejectId(id)
    setRejectNote('')
    setRejectOpen(true)
  }

  function openRcReject(id: string) {
    setRcRejectId(id)
    setRcRejectNote('')
    setRcRejectOpen(true)
  }

  function openRcResolve(id: string) {
    setRcResolveId(id)
    setRcResolveRoomId('')
    setRcResolveNote('')
    setRcResolveErr(null)
    setRcResolveOpen(true)
  }

  const awaitingPaymentCount = apps.filter((a) => a.status === 'payment_pending').length
  const loadingTop = overview.isLoading || payments.isLoading
  const loadingRc = roomChangesAdmin.isLoading

  const isDutyAdmin = user?.role === 'admin'

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
        crumbs={['Удирдлага']}
        title="Админ консол"
        sub={`${roleLabel ? `${roleLabel} · ` : ''}${todayMn()} · очерть: өрөөний хүсэлт (~200), төлбөр (сонгосон ≤500)`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'gap-2 border-[color:var(--border-strong)]',
              )}
            >
              <BedDouble className="size-4" />
              Тойм
            </Link>
            <Link
              to="/payments"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'gap-2 border-[color:var(--border-strong)]',
              )}
            >
              <CreditCard className="size-4" />
              Төлбөрийн хуудас
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <DmsStatCard
          label="Өрөөний pipeline"
          value={loadingTop ? '…' : apps.length}
          delta={`≤200 очерть · төлбөр хүлээж: ${awaitingPaymentCount}`}
        />
        <DmsStatCard
          label="Гарын үсэг (гэрээ)"
          value={loadingTop ? '…' : contracts.length}
          delta="Цахим гарын үсэг хүлээгдэж буй"
        />
        <DmsStatCard
          label="Төлбөр — хүлээгдэж буй"
          value={loadingTop ? '…' : formatMnt(pendingPaySum)}
          delta={`${pendingPay} бичлэг · ≤500`}
        />
        <DmsStatCard
          label="Төлбөр — батлагдсан"
          value={loadingTop ? '…' : formatMnt(paidSum)}
          delta={`${payPaidRows.length} бичлэг · амжилтгүй: ${overdueLike}`}
        />
        <DmsStatCard label="Гарах хүлээж буй" value={exitPending} delta="«Байраас гарах» таб" />
        <DmsStatCard
          label="Өрөө солих — хүлээж буй"
          value={loadingRc ? '…' : rcPending}
          delta="«Өрөө солих» таб"
        />
      </div>

      {(exitPending > 0 ||
        rcPending > 0 ||
        contracts.length > 0 ||
        payPendingRows.length > 0) && (
        <DmsBanner variant="warn" className="items-start sm:items-center">
          <AlertTriangle className="mt-0.5 size-[18px] shrink-0" />
          <div className="min-w-0 flex-1 text-sm">
            <div className="font-medium">Анхааруулах дараалал</div>
            <ul className="mt-1 space-y-0.5 text-[color:var(--text-muted)]">
              {exitPending > 0 ? (
                <li>
                  Байраас гарах: <strong>{exitPending}</strong> хүлээгдэж байна
                </li>
              ) : null}
              {rcPending > 0 ? (
                <li>
                  Өрөө солих: <strong>{rcPending}</strong> хүлээгдэж байна
                </li>
              ) : null}
              {contracts.length > 0 ? (
                <li>
                  Цахим гарын үсэг: <strong>{contracts.length}</strong> гэрээ
                </li>
              ) : null}
              {payPendingRows.length > 0 ? (
                <li>
                  Хүлээгдэж буй төлбөр: <strong>{formatMnt(pendingPaySum)}</strong> ({payPendingRows.length}{' '}
                  бичлэг)
                </li>
              ) : null}
            </ul>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {exitPending > 0 ? (
              <Button size="sm" variant="outline" onClick={() => setTab('exits')}>
                Гарах таб
              </Button>
            ) : null}
            {rcPending > 0 ? (
              <Button size="sm" variant="outline" onClick={() => setTab('room-changes')}>
                Өрөө солих таб
              </Button>
            ) : null}
          </div>
        </DmsBanner>
      )}

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList
          variant="line"
          className="mb-4 w-full flex-wrap justify-start gap-0 border-b border-[color:var(--border)] bg-transparent p-0 h-auto rounded-none"
        >
          <TabsTrigger value="rooms" className="rounded-none px-4 pb-3">
            Өрөө / хүсэлт
          </TabsTrigger>
          <TabsTrigger value="payments" className="rounded-none px-4 pb-3">
            Төлбөр
          </TabsTrigger>
          <TabsTrigger value="exits" className="rounded-none px-4 pb-3">
            Байраас гарах
          </TabsTrigger>
          <TabsTrigger value="room-changes" className="rounded-none px-4 pb-3 gap-1.5">
            <ArrowRightLeft className="size-3.5 opacity-70 max-sm:hidden" />
            Өрөө солих
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-none px-4 pb-3 gap-1.5">
            <Users className="size-3.5 opacity-70 max-sm:hidden" />
            Хэрэглэгчид
          </TabsTrigger>
          <TabsTrigger value="violations" className="rounded-none px-4 pb-3 gap-1.5">
            <ShieldAlert className="size-3.5 opacity-70 max-sm:hidden" />
            Зөрчил
          </TabsTrigger>
          <TabsTrigger value="duty" className="rounded-none px-4 pb-3 gap-1.5">
            <CalendarClock className="size-3.5 opacity-70 max-sm:hidden" />
            Жижүүр
          </TabsTrigger>
          <TabsTrigger value="inventory" className="rounded-none px-4 pb-3 gap-1.5">
            <Package className="size-3.5 opacity-70 max-sm:hidden" />
            Эд хогшил
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rooms" className="mt-0 outline-none">
          <Card className="border-[color:var(--border)] p-0 shadow-[var(--sh-1)]">
            <div className="dms-card-hd">
              <div>
                <h3>Өрөөний хүсэлт</h3>
                <p className="sub">
                  Очерьт доторх мөрүүд — нэг оюутан олон дамжлагад байвал давхар тоологдоно
                </p>
              </div>
            </div>
            <div className="dms-card-bd px-0">
              {overview.isLoading ? (
                <p className="px-6 pb-6 text-sm text-muted-foreground">Ачааллаж байна…</p>
              ) : apps.length === 0 ? (
                <div className="empty-dms mx-6 mb-6">
                  <div className="ttl">Бичлэг алга</div>
                  <div>Seed ажиллуулснаар жишээ мөр гарна.</div>
                </div>
              ) : (
                <div className="table-wrap-dms rounded-none border-x-0">
                  <table className="table-dms">
                    <thead>
                      <tr>
                        <th>Лавлах</th>
                        <th>Оюутан (ID)</th>
                        <th>Төлөв</th>
                        <th>Эрэмбэ</th>
                        <th>Илгээсэн</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...apps]
                        .sort(
                          (a, b) =>
                            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                        )
                        .map((a) => (
                        <tr key={a._id}>
                          <td className="font-mono text-xs">{a._id.slice(-8)}</td>
                          <td className="font-mono text-xs text-[color:var(--text-muted)]">
                            {String(a.userId).slice(-8)}
                          </td>
                          <td>
                            <Badge variant="secondary" className="text-xs">
                              {applicationStatusMn(a.status)}
                            </Badge>
                          </td>
                          <td className="num">{a.priorityTier ?? '—'}</td>
                          <td className="text-xs">
                            {new Date(a.createdAt).toLocaleString('mn-MN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-0 outline-none">
          <Card className="border-[color:var(--border)] p-0 shadow-[var(--sh-1)]">
            <div className="dms-card-hd">
              <div>
                <h3>Төлбөрийн бичлэг</h3>
                <p className="sub">
                  Сүүлийн {payRows.length} бүртгэл (хамгийн ихдээ 500) — санхүүгийн бүрэн тайлан биш
                </p>
              </div>
            </div>
            <div className="dms-card-bd px-0">
              {payments.isLoading ? (
                <p className="px-6 pb-6 text-sm text-muted-foreground">Ачааллаж байна…</p>
              ) : payRows.length === 0 ? (
                <div className="empty-dms mx-6 mb-6">
                  <div className="ttl">Төлбөр алга</div>
                </div>
              ) : (
                <div className="table-wrap-dms rounded-none border-x-0">
                  <table className="table-dms">
                    <thead>
                      <tr>
                        <th>Лавлах</th>
                        <th>Оюутан</th>
                        <th className="text-right">Дүн</th>
                        <th>Төлөв</th>
                        <th>Огноо</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payRows.map((p) => (
                        <tr key={p._id}>
                          <td className="font-mono text-xs">{p._id.slice(-8)}</td>
                          <td className="font-mono text-xs text-[color:var(--text-muted)]">
                            {String(p.userId).slice(-8)}
                          </td>
                          <td className="num text-right font-medium">{formatMnt(p.amount)}</td>
                          <td>
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-xs font-medium',
                                p.status === 'paid'
                                  ? 'bg-[color:var(--ok-50)] text-[color:var(--ok-700)]'
                                  : p.status === 'pending'
                                    ? 'bg-[color:var(--warn-50)] text-[color:var(--warn-700)]'
                                    : 'bg-[color:var(--err-50)] text-[color:var(--err-700)]',
                              )}
                            >
                              {paymentStatusMn(p.status)}
                            </span>
                          </td>
                          <td className="text-xs">
                            {p.createdAt ? new Date(p.createdAt).toLocaleDateString('mn-MN') : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="exits" className="mt-0 outline-none">
          <Card className="border-[color:var(--border)] p-0 shadow-[var(--sh-1)]">
            <div className="dms-card-hd flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3>Байраас гарах хүсэлт</h3>
                <p className="sub">Зөвшөөрөх / буцаах (түүхэнд хадгална)</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['pending', 'all', 'approved', 'rejected'] as const).map((st) => (
                  <Button
                    key={st}
                    type="button"
                    size="sm"
                    variant={exitStatusFilter === st ? 'default' : 'outline'}
                    className={cn(
                      exitStatusFilter === st &&
                        'bg-[color:var(--primary)] text-white hover:bg-[color:var(--primary)]/90',
                    )}
                    onClick={() => setExitStatusFilter(st)}
                  >
                    {st === 'pending'
                      ? 'Хүлээгдэж буй'
                      : st === 'all'
                        ? 'Бүгд'
                        : st === 'approved'
                          ? 'Зөвшөөрсөн'
                          : 'Буцаасан'}
                  </Button>
                ))}
              </div>
            </div>
            {selectedExitIds.size > 0 && (
              <div className="flex items-center gap-3 border-b border-[color:var(--border)] bg-[color:var(--primary-soft)]/30 px-6 py-3">
                <span className="text-sm font-medium">{selectedExitIds.size} мөр сонгогдсон</span>
                <Button
                  size="sm"
                  className="bg-[color:var(--ok-500)] hover:bg-[color:var(--ok-500)]/90"
                  disabled={bulkApproveExit.isPending}
                  onClick={() => bulkApproveExit.mutate([...selectedExitIds])}
                >
                  Бүгдийг зөвшөөрөх
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setBulkRejectNote(''); setBulkRejectOpen(true) }}
                >
                  Бүгдийг буцаах
                </Button>
                <Button size="sm" variant="ghost" className="ml-auto text-xs" onClick={() => setSelectedExitIds(new Set())}>
                  Цуцлах
                </Button>
              </div>
            )}
            <div className="dms-card-bd px-0">
              {exitAdmin.isLoading ? (
                <p className="px-6 pb-6 text-sm text-muted-foreground">Ачааллаж байна…</p>
              ) : exitRows.length === 0 ? (
                <div className="empty-dms mx-6 mb-6">
                  <div className="ttl">Бичлэг алга</div>
                  <div>Энэ шүүлтүүр дор харагдах хүсэлт байхгүй.</div>
                </div>
              ) : (
                <div className="table-wrap-dms rounded-none border-x-0">
                  <table className="table-dms">
                    <thead>
                      <tr>
                        {exitStatusFilter === 'pending' && (
                          <th className="w-8">
                            <input
                              type="checkbox"
                              className="size-4"
                              checked={selectedExitIds.size === exitRows.filter(r => r.status === 'pending').length && exitRows.filter(r => r.status === 'pending').length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedExitIds(new Set(exitRows.filter(r => r.status === 'pending').map(r => r._id)))
                                } else {
                                  setSelectedExitIds(new Set())
                                }
                              }}
                            />
                          </th>
                        )}
                        <th>Оюутан</th>
                        <th>Гарах өдөр</th>
                        <th>Шалтгаан</th>
                        <th>Төлөв</th>
                        <th className="text-right">Үйлдэл</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exitRows.map((r) => (
                        <tr key={r._id} className={selectedExitIds.has(r._id) ? 'bg-[color:var(--primary-soft)]/20' : ''}>
                          {exitStatusFilter === 'pending' && (
                            <td>
                              {r.status === 'pending' && (
                                <input
                                  type="checkbox"
                                  className="size-4"
                                  checked={selectedExitIds.has(r._id)}
                                  onChange={(e) => {
                                    setSelectedExitIds(prev => {
                                      const next = new Set(prev)
                                      if (e.target.checked) next.add(r._id)
                                      else next.delete(r._id)
                                      return next
                                    })
                                  }}
                                />
                              )}
                            </td>
                          )}
                          <td className="text-sm font-medium">{studentLabel(r)}</td>
                          <td className="num text-xs">
                            {new Date(r.requestedExitDate).toLocaleDateString('mn-MN')}
                          </td>
                          <td className="max-w-[14rem] text-xs leading-snug text-[color:var(--text-muted)]">
                            {r.reason}
                            {r.adminNote ? (
                              <span className="mt-1 block text-red-700 dark:text-red-300">
                                Алба: {r.adminNote}
                              </span>
                            ) : null}
                          </td>
                          <td>
                            <Badge variant="secondary" className="text-xs">
                              {exitStatusMn(r.status)}
                            </Badge>
                          </td>
                          <td className="text-right">
                            {r.status === 'pending' ? (
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  className="bg-[color:var(--ok-500)] hover:bg-[color:var(--ok-500)]/90"
                                  disabled={approveExit.isPending}
                                  onClick={() => approveExit.mutate(r._id)}
                                >
                                  Зөвшөөрөх
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={rejectExit.isPending}
                                  onClick={() => openReject(r._id)}
                                >
                                  Буцаах
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="room-changes" className="mt-0 outline-none">
          <Card className="border-[color:var(--border)] p-0 shadow-[var(--sh-1)]">
            <div className="dms-card-hd flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3>Өрөө солих хүсэлт</h3>
                <p className="sub">Шийдвэрлэх / татгалзах (түүхэнд хадгална)</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['pending', 'all', 'resolved', 'rejected'] as const).map((st) => (
                  <Button
                    key={st}
                    type="button"
                    size="sm"
                    variant={rcStatusFilter === st ? 'default' : 'outline'}
                    className={cn(
                      rcStatusFilter === st &&
                        'bg-[color:var(--primary)] text-white hover:bg-[color:var(--primary)]/90',
                    )}
                    onClick={() => setRcStatusFilter(st)}
                  >
                    {st === 'pending'
                      ? 'Хүлээгдэж буй'
                      : st === 'all'
                        ? 'Бүгд'
                        : st === 'resolved'
                          ? 'Шийдвэрлэсэн'
                          : 'Татгалзсан'}
                  </Button>
                ))}
              </div>
            </div>
            <div className="dms-card-bd px-0">
              {roomChangesAdmin.isLoading ? (
                <p className="px-6 pb-6 text-sm text-muted-foreground">Ачааллаж байна…</p>
              ) : rcRows.length === 0 ? (
                <div className="empty-dms mx-6 mb-6">
                  <div className="ttl">Бичлэг алга</div>
                  <div>Энэ шүүлтүүр дор харагдах хүсэлт байхгүй.</div>
                </div>
              ) : (
                <div className="table-wrap-dms rounded-none border-x-0">
                  <table className="table-dms">
                    <thead>
                      <tr>
                        <th>Оюутан</th>
                        <th>Шалтгаан</th>
                        <th>Сонголт</th>
                        <th>Төлөв</th>
                        <th className="text-right">Үйлдэл</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rcRows.map((r) => (
                        <tr key={r._id}>
                          <td className="text-sm font-medium">{studentDisplay(r.userId, r.user)}</td>
                          <td className="max-w-[14rem] text-xs leading-snug text-[color:var(--text-muted)]">
                            {r.reason}
                            {r.status === 'resolved' && r.assignedRoom ? (
                              <span className="mt-1 block font-medium text-foreground">
                                Системд оноосон өрөө: {r.assignedRoom.dormName} · №{r.assignedRoom.roomNumber}
                              </span>
                            ) : null}
                            {r.resolution && r.status !== 'pending' ? (
                              <span
                                className={cn(
                                  'mt-1 block',
                                  r.status === 'rejected'
                                    ? 'text-red-700 dark:text-red-300'
                                    : 'text-emerald-800 dark:text-emerald-200',
                                )}
                              >
                                Алба: {r.resolution}
                              </span>
                            ) : null}
                          </td>
                          <td className="max-w-[12rem] text-xs leading-snug text-[color:var(--text-muted)]">
                            {r.preferences?.trim() ? r.preferences : '—'}
                          </td>
                          <td>
                            <Badge variant="secondary" className="text-xs">
                              {roomChangeStatusMn(r.status)}
                            </Badge>
                          </td>
                          <td className="text-right">
                            {r.status === 'pending' ? (
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  className="bg-[color:var(--ok-500)] hover:bg-[color:var(--ok-500)]/90"
                                  disabled={resolveRoomChange.isPending}
                                  onClick={() => openRcResolve(r._id)}
                                >
                                  Шийдвэрлэх
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={rejectRoomChange.isPending}
                                  onClick={() => openRcReject(r._id)}
                                >
                                  Татгалзах
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-0 outline-none">
          <Card className="border-[color:var(--border)] p-0 shadow-[var(--sh-1)]">
            <div className="dms-card-hd flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h3>Хэрэглэгчид</h3>
                <p className="sub">
                  Нийт бүртгэлээс хайлт, шүүлт — мөр дараад дэлгэрэнгүй. Зөвхөн админ нэвтрэлтийг хориглох /
                  идэвхжүүлнэ.
                </p>
              </div>
              <div className="flex w-full max-w-md flex-col gap-2 sm:max-w-lg">
                <Label htmlFor="admin-user-search" className="sr-only">
                  Хайлт
                </Label>
                <Input
                  id="admin-user-search"
                  placeholder="И-мэйл, овог нэр, оюутны код, РД, WEST нэр…"
                  value={userSearchDraft}
                  onChange={(e) => setUserSearchDraft(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>
            <div className="dms-card-bd border-t border-[color:var(--border)] px-4 pb-4 pt-3">
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="mr-1 self-center text-xs text-muted-foreground">Эрх:</span>
                {(['all', 'student', 'staff', 'admin', 'accountant'] as const).map((r) => (
                  <Button
                    key={r}
                    type="button"
                    size="sm"
                    variant={userRoleFilter === r ? 'default' : 'outline'}
                    className={cn(
                      userRoleFilter === r &&
                        'bg-[color:var(--primary)] text-white hover:bg-[color:var(--primary)]/90',
                    )}
                    onClick={() => setUserRoleFilter(r)}
                  >
                    {r === 'all' ? 'Бүгд' : roleMn(r)}
                  </Button>
                ))}
              </div>
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="mr-1 self-center text-xs text-muted-foreground">Төлөв:</span>
                {(['all', 'active', 'inactive'] as const).map((s) => (
                  <Button
                    key={s}
                    type="button"
                    size="sm"
                    variant={userStatusFilter === s ? 'default' : 'outline'}
                    className={cn(
                      userStatusFilter === s &&
                        'bg-[color:var(--primary)] text-white hover:bg-[color:var(--primary)]/90',
                    )}
                    onClick={() => setUserStatusFilter(s)}
                  >
                    {s === 'all' ? 'Бүгд' : s === 'active' ? 'Идэвхтэй' : 'Идэвхгүй'}
                  </Button>
                ))}
              </div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                <span>
                  Нийт: <strong className="text-foreground">{adminUserTotal}</strong>
                  {adminUsers.isFetching ? ' · шинэчилж байна…' : null}
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={userListSkip <= 0 || adminUsers.isLoading}
                    onClick={() => setUserListSkip((s) => Math.max(0, s - ADMIN_USERS_PAGE))}
                  >
                    Өмнөх
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!adminUsersHasNext || adminUsers.isLoading}
                    onClick={() => setUserListSkip((s) => s + ADMIN_USERS_PAGE)}
                  >
                    Дараах
                  </Button>
                </div>
              </div>
              {adminUsers.isLoading ? (
                <p className="py-6 text-sm text-muted-foreground">Ачааллаж байна…</p>
              ) : adminUserRows.length === 0 ? (
                <div className="empty-dms py-8">
                  <div className="ttl">Хэрэглэгч олдсонгүй</div>
                  <div className="text-sm text-[color:var(--text-muted)]">
                    Шүүлтүүр эсвэл хайлтыг өөрчилж үзнэ үү.
                  </div>
                </div>
              ) : (
                <div className="table-wrap-dms rounded-lg border border-[color:var(--border)]">
                  <table className="table-dms">
                    <thead>
                      <tr>
                        <th>Овог нэр</th>
                        <th>И-мэйл</th>
                        <th>Оюутан / РД</th>
                        <th>Эрх</th>
                        <th>Төлөв</th>
                        <th>Утас</th>
                        <th>Шинэчилсэн</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminUserRows.map((u) => (
                        <tr
                          key={u._id}
                          role="button"
                          tabIndex={0}
                          className="cursor-pointer hover:bg-muted/40"
                          onClick={() => setDetailUser(u)}
                          onKeyDown={(ev) => {
                            if (ev.key === 'Enter' || ev.key === ' ') {
                              ev.preventDefault()
                              setDetailUser(u)
                            }
                          }}
                        >
                          <td className="text-sm font-medium">
                            {`${u.lastName ?? ''} ${u.firstName ?? ''}`.trim() || '—'}
                          </td>
                          <td className="max-w-[12rem] truncate text-xs">{u.email || '—'}</td>
                          <td className="font-mono text-xs text-[color:var(--text-muted)]">
                            {u.studentId?.trim() || u.registerNumber?.trim() || '—'}
                          </td>
                          <td>
                            <Badge variant="secondary" className="text-xs">
                              {roleMn(u.role)}
                            </Badge>
                          </td>
                          <td>
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-xs font-medium',
                                u.isDisabled || u.status === 'suspended'
                                  ? 'bg-[color:var(--err-50)] text-[color:var(--err-700)]'
                                  : u.status === 'active'
                                    ? 'bg-[color:var(--ok-50)] text-[color:var(--ok-700)]'
                                    : 'bg-muted text-muted-foreground',
                              )}
                            >
                              {accountStatusMn(u.status, u.isDisabled)}
                            </span>
                          </td>
                          <td className="text-xs">{u.phone?.trim() || '—'}</td>
                          <td className="text-xs text-[color:var(--text-muted)]">
                            {fmtAdminDt(u.updatedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="violations" className="mt-0 outline-none">
          <Card className="border-[color:var(--border)] p-0 shadow-[var(--sh-1)]">
            <div className="dms-card-hd flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3>Зөрчил / сануулгын бүртгэл</h3>
                <p className="sub">Нийт {violations.data?.total ?? 0} бичлэг</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['all', 'WARN', 'CANCEL'] as const).map((t) => (
                  <Button
                    key={t}
                    type="button"
                    size="sm"
                    variant={violationTypeFilter === t ? 'default' : 'outline'}
                    className={cn(violationTypeFilter === t && 'bg-[color:var(--primary)] text-white hover:bg-[color:var(--primary)]/90')}
                    onClick={() => setViolationTypeFilter(t)}
                  >
                    {t === 'all' ? 'Бүгд' : t === 'WARN' ? 'Сануулга' : 'Цуцлалт'}
                  </Button>
                ))}
                <Button size="sm" className="bg-[color:var(--primary)] gap-1" onClick={() => setViolationFormOpen(true)}>
                  + Зөрчил бүртгэх
                </Button>
              </div>
            </div>
            {violationFormOpen && (
              <div className="border-b border-[color:var(--border)] bg-[color:var(--surface-2)] px-6 py-4 space-y-3">
                <p className="text-sm font-semibold">Шинэ зөрчил</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Оюутны ID (MongoDB)</label>
                    <input
                      className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-ring"
                      placeholder="6…"
                      value={newViolation.userId}
                      onChange={(e) => setNewViolation(v => ({ ...v, userId: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Төрөл</label>
                    <select
                      className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm outline-none"
                      value={newViolation.type}
                      onChange={(e) => setNewViolation(v => ({ ...v, type: e.target.value as 'WARN' | 'CANCEL' }))}
                    >
                      <option value="WARN">Сануулга (WARN)</option>
                      <option value="CANCEL">Цуцлалт (CANCEL)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Ангилал</label>
                    <input
                      className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-ring"
                      placeholder="Дүрэм зөрчсөн, гэмтээсэн..."
                      value={newViolation.category}
                      onChange={(e) => setNewViolation(v => ({ ...v, category: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-medium">Тайлбар</label>
                    <input
                      className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-ring"
                      placeholder="Дэлгэрэнгүй тайлбар..."
                      value={newViolation.description}
                      onChange={(e) => setNewViolation(v => ({ ...v, description: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-[color:var(--primary)]"
                    disabled={createViolation.isPending || !newViolation.userId || !newViolation.category || !newViolation.description}
                    onClick={() => createViolation.mutate(newViolation)}
                  >
                    {createViolation.isPending ? 'Хадгалж байна…' : 'Хадгалах'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setViolationFormOpen(false)}>Болих</Button>
                </div>
              </div>
            )}
            <div className="dms-card-bd px-0">
              {violations.isLoading ? (
                <p className="px-6 pb-6 text-sm text-muted-foreground">Ачааллаж байна…</p>
              ) : !violations.data?.violations.length ? (
                <div className="empty-dms mx-6 mb-6">
                  <div className="ttl">Зөрчил бүртгэгдээгүй</div>
                </div>
              ) : (
                <div className="table-wrap-dms rounded-none border-x-0">
                  <table className="table-dms">
                    <thead>
                      <tr>
                        <th>Оюутан</th>
                        <th>Төрөл</th>
                        <th>Ангилал</th>
                        <th>Тайлбар</th>
                        <th>Огноо</th>
                      </tr>
                    </thead>
                    <tbody>
                      {violations.data.violations.map((v) => {
                        const u = v.userId && typeof v.userId === 'object' ? v.userId as { studentId?: string; firstName?: string; lastName?: string } : null
                        return (
                          <tr key={v._id}>
                            <td className="text-sm">
                              {u ? `${u.lastName ?? ''} ${u.firstName ?? ''}`.trim() || u.studentId || '—' : String(v.userId).slice(-8)}
                            </td>
                            <td>
                              <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', v.type === 'WARN' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800')}>
                                {v.type === 'WARN' ? 'Сануулга' : 'Цуцлалт'}
                              </span>
                            </td>
                            <td className="text-xs">{v.category}</td>
                            <td className="max-w-[16rem] text-xs text-[color:var(--text-muted)]">{v.description}</td>
                            <td className="text-xs">{new Date(v.violatedAt).toLocaleDateString('mn-MN')}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="duty" className="mt-0 outline-none">
          <div className="space-y-6">
            <Card className="border-[color:var(--border)] p-0 shadow-[var(--sh-1)]">
              <div className="dms-card-hd flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3>Өдрийн жижүүрийн жагсаалт</h3>
                  <p className="sub">
                    Бүртгэлтэй оюутан ээлжээ дарааллаар {CAMPUS_AIMAG_LABEL} ({CAMPUS_LOCALITY_LABEL}) кампусын
                    өдөрт эргэнэ. Сервер асахад{' '}
                    <strong>идэвхтэй</strong> оюутан автоматаар жагсаалтад синклоно — шинэ бүртгэл ч
                    нэмэгдэнэ.
                  </p>
                  <p className="sub mt-1 text-xs">
                    Маргаашийн жижүүр хүнд өдөр эхэлхэд <strong>/мэдэгдэлд</strong> нэг удаа сануулга орно.
                  </p>
                  {!isDutyAdmin ? (
                    <p className="sub mt-1 text-xs text-amber-800 dark:text-amber-200">
                      Жагсаалтад нэмэх, хасах, эрэмбээ солихыг зөвхөн <strong>админ</strong> хийнэ.
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {isDutyAdmin ? (
                    <Button type="button" size="sm" variant="default" className="gap-1.5" onClick={() => setDutyAddOpen(true)}>
                      <Plus className="size-4" />
                      Жагсаалтанд нэмэх
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={syncDutyRoster.isPending}
                    onClick={() => syncDutyRoster.mutate()}
                  >
                    {syncDutyRoster.isPending ? 'Синклэж байна…' : 'Идэвхтэй оюутанг синк'}
                  </Button>
                </div>
              </div>
              <div className="dms-card-bd border-t border-[color:var(--border)] px-6 py-4 text-sm">
                {dutyRoster.isLoading ? (
                  <p className="text-muted-foreground">Ачааллаж байна…</p>
                ) : (
                  <p className="text-muted-foreground">
                    Жижүүр тооцоолж болох хэрэглэгчид:{' '}
                    <strong>{dutyRoster.data?.eligibleActive ?? 0}</strong> · Нийт бичлэг:{' '}
                    <strong>{dutyRoster.data?.entries.length ?? 0}</strong>
                  </p>
                )}
              </div>
              <div className="dms-card-bd px-0 pb-4">
                {dutyRoster.isLoading ? null : dutyRoster.data?.entries?.length === 0 ? (
                  <div className="empty-dms mx-6 mb-2">
                    <div className="ttl">Жагсаалт хоосон</div>
                    <div>«Синк» дарж идэвхтэй оюутанг автоматаар нэмэгдүүлнэ. Админ эрхээр гараар бас нэмнэ үү.</div>
                  </div>
                ) : (
                  <div className="table-wrap-dms rounded-none border-x-0">
                    <table className="table-dms">
                      <thead>
                        <tr>
                          <th>Ээлж</th>
                          <th>Оюутан</th>
                          <th>Төлөв</th>
                          <th>Жижүүр тооцоололд орно</th>
                          {isDutyAdmin ? <th className="w-[1%] whitespace-nowrap">Үйлдэл</th> : null}
                        </tr>
                      </thead>
                      <tbody>
                        {(dutyRoster.data?.entries ?? []).map((e, rowIdx, arr) => {
                          const name = `${e.lastName ?? ''} ${e.firstName ?? ''}`.trim() || '—'
                          const busyDuty = deleteDutyMember.isPending || moveDutyMember.isPending
                          return (
                            <tr key={e._id}>
                              <td className="num">{e.sequence}</td>
                              <td className="text-sm font-medium">{name}</td>
                              <td className="text-xs">{e.userStatus ?? '—'}</td>
                              <td>
                                {e.rosterEligibleDuty ? (
                                  <Badge variant="secondary" className="text-[10px] text-emerald-800">
                                    Тийм
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                    Үгүй (идэвхгүй/батлаагүй)
                                  </Badge>
                                )}
                              </td>
                              {isDutyAdmin ? (
                                <td className="text-right align-middle">
                                  <div className="flex justify-end gap-0.5">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon-sm"
                                      className="size-8"
                                      disabled={busyDuty || rowIdx === 0}
                                      title="Ээлжээ дээш"
                                      aria-label="Дээш"
                                      onClick={() => moveDutyMember.mutate({ entryId: e._id, direction: 'up' })}
                                    >
                                      <ArrowUp className="size-3.5" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon-sm"
                                      className="size-8"
                                      disabled={busyDuty || rowIdx >= arr.length - 1}
                                      title="Ээлжээ доош"
                                      aria-label="Доош"
                                      onClick={() => moveDutyMember.mutate({ entryId: e._id, direction: 'down' })}
                                    >
                                      <ArrowDown className="size-3.5" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="icon-sm"
                                      className="size-8"
                                      disabled={busyDuty}
                                      title="Жагсаалтаас хасах"
                                      aria-label="Хасах"
                                      onClick={() => {
                                        if (
                                          window.confirm(
                                            `${name}-г жижүүрийн очертьоос хасах уу?`,
                                          )
                                        )
                                          deleteDutyMember.mutate(e._id)
                                      }}
                                    >
                                      <Trash2 className="size-3.5" />
                                    </Button>
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

            <Card className="border-[color:var(--border)] p-0 shadow-[var(--sh-1)]">
              <div className="dms-card-hd">
                <div>
                  <h3>14 хоногийн урьдчилсан томилгоо</h3>
                  <p className="sub">
                    Ээлжийн дүрэм: {CAMPUS_LOCALITY_LABEL} суурины кампусын өдрийг үндэслэн давтагдах ээлжийн индекс
                  </p>
                </div>
              </div>
              <div className="dms-card-bd px-0 pb-6">
                {dutyWeek.isLoading ? (
                  <p className="px-6 text-sm text-muted-foreground">Ачааллаж байна…</p>
                ) : (
                  <div className="table-wrap-dms rounded-none border-x-0">
                    <table className="table-dms">
                      <thead>
                        <tr>
                          <th>{CAMPUS_DATE_COLUMN_LABEL}</th>
                          <th>Жижүүр томилох</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(dutyWeek.data ?? []).map((row) => (
                          <tr key={row.dateKey}>
                            <td className="tabular-nums">{row.dateKey}</td>
                            <td className="text-sm">{row.nameHint}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="mt-0 outline-none">
          <Card className="border-[color:var(--border)] p-0 shadow-[var(--sh-1)]">
            <div className="dms-card-hd flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3>Эд хогшлын бүртгэл</h3>
                <p className="sub">Нийт {inventoryItems.data?.total ?? 0} бичлэг</p>
              </div>
              <a
                href="/api/v1/inventory"
                target="_blank"
                rel="noreferrer"
                className={cn('inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground')}
              >
                <Download className="size-3.5" />
                JSON экспорт
              </a>
            </div>
            <div className="dms-card-bd px-0">
              {inventoryItems.isLoading ? (
                <p className="px-6 pb-6 text-sm text-muted-foreground">Ачааллаж байна…</p>
              ) : !inventoryItems.data?.items.length ? (
                <div className="empty-dms mx-6 mb-6">
                  <div className="ttl">Бичлэг алга</div>
                  <div>POST /api/v1/inventory-ээр эд хогшил нэмнэ.</div>
                </div>
              ) : (
                <div className="table-wrap-dms rounded-none border-x-0">
                  <table className="table-dms">
                    <thead>
                      <tr>
                        <th>Нэр</th>
                        <th>Тоо</th>
                        <th>Нөхцөл</th>
                        <th className="text-right">Нэгж үнэ</th>
                        <th>Өрөө</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryItems.data.items.map((item) => {
                        const room = item.roomId && typeof item.roomId === 'object' ? item.roomId as { roomNumber: number } : null
                        return (
                          <tr key={item._id}>
                            <td className="font-medium text-sm">{item.itemName}</td>
                            <td className="num">{item.quantity}</td>
                            <td className="text-xs">{item.condition}</td>
                            <td className="num text-right">{item.unitPrice > 0 ? `₮${item.unitPrice.toLocaleString()}` : '—'}</td>
                            <td className="text-xs">{room ? `№${room.roomNumber}` : '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dutyAddOpen} onOpenChange={(o) => {
        setDutyAddOpen(o)
        if (!o) {
          setDutyAddErr(null)
          setDutyStudentCode('')
          setDutyPickSearchDraft('')
          setDutyPickSearchDeb('')
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Жижүүрийн жагсаалтад оюутан нэмэх</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-sm">
            {dutyAddErr ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-900 dark:border-red-900 dark:bg-red-950/35 dark:text-red-100">
                {dutyAddErr}
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="duty-student-code">Оюутны код</Label>
              <div className="flex flex-wrap gap-2">
                <Input
                  id="duty-student-code"
                  className="max-w-[14rem]"
                  placeholder="Жишээ: 23B081001"
                  value={dutyStudentCode}
                  disabled={addDutyMember.isPending}
                  onChange={(ev) => {
                    setDutyStudentCode(ev.target.value)
                    setDutyAddErr(null)
                  }}
                  onKeyDown={(ev) => {
                    if (ev.key !== 'Enter') return
                    const s = dutyStudentCode.trim()
                    if (s.length < 2) return
                    void addDutyMember.mutateAsync({ studentId: s }).catch(() => {})
                  }}
                />
                <Button
                  type="button"
                  className="bg-[color:var(--primary)]"
                  disabled={addDutyMember.isPending || dutyStudentCode.trim().length < 2}
                  onClick={() => {
                    const s = dutyStudentCode.trim()
                    if (s.length < 2) {
                      setDutyAddErr('Оюутны кодыг оруулна уу')
                      return
                    }
                    addDutyMember.mutate({ studentId: s })
                  }}
                >
                  {addDutyMember.isPending ? 'Нэмэж байна…' : 'Кодоор нэмэх'}
                </Button>
              </div>
            </div>
            <div className="space-y-2 border-t border-[color:var(--border)] pt-4">
              <Label htmlFor="duty-search">Эсвэл хайхаар сонгоно уу</Label>
              <Input
                id="duty-search"
                placeholder="Овог, нэр, и-мэйл, кодоор (2-с багагүй үсэг)"
                value={dutyPickSearchDraft}
                disabled={addDutyMember.isPending}
                onChange={(ev) => {
                  setDutyPickSearchDraft(ev.target.value)
                  setDutyAddErr(null)
                }}
              />
              {dutyPickSearchDeb.length > 0 && dutyPickSearchDeb.length < 2 ? (
                <p className="text-xs text-muted-foreground">Хайлт дарж дор хаяж 2 тэмдэгт оруулна уу.</p>
              ) : null}
              {dutyPickStudents.isLoading ? (
                <p className="text-xs text-muted-foreground">Хайж байна…</p>
              ) : dutyPickStudents.data?.length === 0 && dutyPickSearchDeb.length >= 2 ? (
                <p className="text-xs text-muted-foreground">Илэрц байхгүй.</p>
              ) : dutyPickStudents.data && dutyPickStudents.data.length > 0 ? (
                <ul className="max-h-48 divide-y divide-[color:var(--border)] overflow-y-auto rounded-md border border-[color:var(--border)] bg-[color:var(--surface-2)]">
                  {dutyPickStudents.data.map((u) => {
                    const dn = `${u.lastName ?? ''} ${u.firstName ?? ''}`.trim()
                    const sid = u.studentId?.trim()
                    const already = dutyRoster.data?.entries.some((row) => row.userId === u._id)
                    return (
                      <li key={u._id} className="flex items-center gap-2 px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{dn || u.email}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {[sid ? `Код ${sid}` : '', u.email].filter(Boolean).join(' · ') || u._id}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={addDutyMember.isPending || Boolean(already)}
                          title={already ? 'Жагсаалтад аль хэдийн орсон' : undefined}
                          onClick={() => addDutyMember.mutate({ userId: u._id })}
                        >
                          {already ? 'Очерть' : 'Нэмэх'}
                        </Button>
                      </li>
                    )
                  })}
                </ul>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDutyAddOpen(false)}>
              Хаах
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkRejectOpen} onOpenChange={setBulkRejectOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk буцаах — {selectedExitIds.size} хүсэлт</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="bulk-reject-note">Нийтлэг шалтгаан</Label>
            <textarea
              id="bulk-reject-note"
              rows={3}
              minLength={3}
              value={bulkRejectNote}
              onChange={(e) => setBulkRejectNote(e.target.value)}
              placeholder="Жишээ: Хугацаа зөрчсөн"
              className={cn(
                'flex min-h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none',
                'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
              )}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBulkRejectOpen(false)}>Болих</Button>
            <Button
              variant="destructive"
              disabled={bulkRejectExit.isPending || bulkRejectNote.trim().length < 3}
              onClick={() => bulkRejectExit.mutate({ ids: [...selectedExitIds], note: bulkRejectNote.trim() })}
            >
              {bulkRejectExit.isPending ? 'Илгээж байна…' : 'Буцаах'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={detailUser !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDetailUser(null)
            patchUserAction.reset()
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Хэрэглэгч — дэлгэрэнгүй</DialogTitle>
          </DialogHeader>
          {detailUser ? (
            <div className="space-y-4 py-1 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Овог нэр
                  </div>
                  <div className="font-medium">
                    {`${detailUser.lastName ?? ''} ${detailUser.firstName ?? ''}`.trim() || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    И-мэйл
                  </div>
                  <div className="break-all">{detailUser.email || '—'}</div>
                </div>
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Оюутны код
                  </div>
                  <div className="font-mono text-xs">{detailUser.studentId?.trim() || '—'}</div>
                </div>
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    РД
                  </div>
                  <div className="font-mono text-xs">{detailUser.registerNumber?.trim() || '—'}</div>
                </div>
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Утас
                  </div>
                  <div>{detailUser.phone?.trim() || '—'}</div>
                </div>
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    WEST нэр
                  </div>
                  <div className="font-mono text-xs">{detailUser.westLoginName?.trim() || '—'}</div>
                </div>
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Эрх
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {roleMn(detailUser.role)}
                  </Badge>
                </div>
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Төлөв (DB)
                  </div>
                  <div>{detailUser.status}</div>
                </div>
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Харагдах төлөв
                  </div>
                  <div>{accountStatusMn(detailUser.status, detailUser.isDisabled)}</div>
                </div>
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Хориглосон эсэх
                  </div>
                  <div>{detailUser.isDisabled ? 'Тийм' : 'Үгүй'}</div>
                </div>
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Түвшин / Бүс
                  </div>
                  <div className="text-xs">
                    {[detailUser.level, detailUser.region].filter(Boolean).join(' · ') || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Хүйс
                  </div>
                  <div>
                    {detailUser.gender === 'M'
                      ? 'Эрэгтэй'
                      : detailUser.gender === 'F'
                        ? 'Эмэгтэй'
                        : '—'}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Сургууль / Хөтөлбөр
                  </div>
                  <div className="text-xs">
                    {[detailUser.school, detailUser.program].filter(Boolean).join(' · ') || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Бүртгэсэн
                  </div>
                  <div className="text-xs text-muted-foreground">{fmtAdminDt(detailUser.createdAt)}</div>
                </div>
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Шинэчилсэн
                  </div>
                  <div className="text-xs text-muted-foreground">{fmtAdminDt(detailUser.updatedAt)}</div>
                </div>
              </div>

              {user?.role === 'admin' &&
              detailUser.role !== 'admin' &&
              detailUser._id !== user.id ? (
                <div className="space-y-2 border-t border-[color:var(--border)] pt-4">
                  <div className="text-xs font-medium text-muted-foreground">Админ үйлдэл</div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="bg-[color:var(--ok-500)] hover:bg-[color:var(--ok-500)]/90"
                      disabled={
                        patchUserAction.isPending ||
                        (!detailUser.isDisabled && detailUser.status === 'active')
                      }
                      onClick={() =>
                        patchUserAction.mutate({ id: detailUser._id, action: 'activate' })
                      }
                    >
                      Идэвхжүүлэх
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={
                        patchUserAction.isPending ||
                        detailUser.isDisabled ||
                        detailUser.status === 'suspended'
                      }
                      onClick={() =>
                        patchUserAction.mutate({ id: detailUser._id, action: 'suspend' })
                      }
                    >
                      Хориглох (нэвтрэхгүй)
                    </Button>
                  </div>
                  {patchUserAction.isError ? (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {axiosErrMsg(patchUserAction.error)}
                    </p>
                  ) : null}
                </div>
              ) : user?.role !== 'admin' ? (
                <p className="border-t border-[color:var(--border)] pt-3 text-xs text-muted-foreground">
                  Зөвхөн админ хэрэглэгч эрх / нэвтрэлтийн төлөв өөрчилнө.
                </p>
              ) : detailUser.role === 'admin' ? (
                <p className="border-t border-[color:var(--border)] pt-3 text-xs text-muted-foreground">
                  Админ эрхтэй хэрэглэгчийн төлөв сервер дээр өөр замаар өөрчилнө.
                </p>
              ) : detailUser._id === user.id ? (
                <p className="border-t border-[color:var(--border)] pt-3 text-xs text-muted-foreground">
                  Өөрийн бүртгэлийг эндээс өөрчилж болохгүй.
                </p>
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDetailUser(null)}>
              Хаах
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Байраас гарах — буцаах</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="reject-note">Оюутанд харагдах шалтгаан</Label>
            <textarea
              id="reject-note"
              rows={4}
              minLength={5}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Жишээ: Огноог зөв зааж дахин оруулна уу"
              className={cn(
                'flex min-h-24 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none',
                'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
                'dark:bg-input/30',
              )}
            />
            <p className="text-[11px] text-muted-foreground">Хамгийн багадаа 5 тэмдэгт.</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>
              Болих
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={
                rejectExit.isPending ||
                !rejectId ||
                rejectNote.trim().length < 5
              }
              onClick={() => {
                if (rejectId && rejectNote.trim().length >= 5) {
                  rejectExit.mutate({ id: rejectId, note: rejectNote.trim() })
                }
              }}
            >
              Буцаах
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rcResolveOpen} onOpenChange={setRcResolveOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Өрөө солих — шийдвэрлэх</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Оюутны идэвхтэй гэрээний өрөөг сонгосон өрөөр шинэчилнө (Самбар, Гэрээ, «миний өрөө»).
            </p>
            {roomsForAssignment.isLoading ? (
              <p className="text-sm text-muted-foreground">Өрөөний жагсаалт ачааллаж байна…</p>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="rc-resolve-room">Шинэ өрөө</Label>
                <select
                  id="rc-resolve-room"
                  required
                  value={rcResolveRoomId}
                  onChange={(e) => setRcResolveRoomId(e.target.value)}
                  className={cn(
                    'flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm',
                    'outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
                    'dark:bg-input/30',
                  )}
                >
                  <option value="">— Сонгох —</option>
                  {(roomsForAssignment.data ?? []).map((rm) => {
                    const full = rm.currentOccupancy >= rm.maxOccupancy
                    const maint = rm.status === 'maintenance'
                    const labelExtra = maint ? ' [засвар]' : full ? ' [дүүрсэн]' : ''
                    return (
                      <option
                        key={rm.id}
                        value={rm.id}
                        disabled={maint || full}
                      >
                        {rm.dormName} · Өрөө {rm.roomNumber}
                        {labelExtra ? ` ${labelExtra}` : ` (${rm.currentOccupancy}/${rm.maxOccupancy})`}
                      </option>
                    )
                  })}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="rc-resolve-note">Тайлбар (сонголттой)</Label>
              <textarea
                id="rc-resolve-note"
                rows={3}
                value={rcResolveNote}
                onChange={(e) => setRcResolveNote(e.target.value)}
                placeholder="Оюутанд мэдэгдэлд үзэгдэнэ."
                className={cn(
                  'flex min-h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none',
                  'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
                  'dark:bg-input/30',
                )}
              />
            </div>
            {rcResolveErr ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
                {rcResolveErr}
              </div>
            ) : null}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setRcResolveOpen(false)}>
              Болих
            </Button>
            <Button
              type="button"
              disabled={resolveRoomChange.isPending || !rcResolveId || !rcResolveRoomId.trim()}
              className="bg-[color:var(--ok-500)] hover:bg-[color:var(--ok-500)]/90"
              onClick={() => {
                if (rcResolveId && rcResolveRoomId.trim()) {
                  resolveRoomChange.mutate({
                    id: rcResolveId,
                    assignedRoomId: rcResolveRoomId.trim(),
                    note: rcResolveNote.trim() || undefined,
                  })
                }
              }}
            >
              Шийдвэрлээд өрөө шилжүүлэх
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rcRejectOpen} onOpenChange={setRcRejectOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Өрөө солих — татгалзах</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="rc-reject-note">Оюутанд харагдах шалтгаан</Label>
            <textarea
              id="rc-reject-note"
              rows={4}
              minLength={5}
              value={rcRejectNote}
              onChange={(e) => setRcRejectNote(e.target.value)}
              placeholder="Жишээ: Одоогийн байранд үлдэх шийдвэр гаргалаа"
              className={cn(
                'flex min-h-24 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none',
                'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
                'dark:bg-input/30',
              )}
            />
            <p className="text-[11px] text-muted-foreground">Хамгийн багадаа 5 тэмдэгт.</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setRcRejectOpen(false)}>
              Болих
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={
                rejectRoomChange.isPending ||
                !rcRejectId ||
                rcRejectNote.trim().length < 5
              }
              onClick={() => {
                if (rcRejectId && rcRejectNote.trim().length >= 5) {
                  rejectRoomChange.mutate({ id: rcRejectId, note: rcRejectNote.trim() })
                }
              }}
            >
              Татгалзах
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
