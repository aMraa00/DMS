import { useMemo } from 'react'
import { Link, Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRightLeft,
  CreditCard,
  FileText,
  Home,
  Leaf,
  Shield,
  ClipboardList,
  Menu,
} from 'lucide-react'
import { api } from '@/lib/api'
import { studentHasConfirmedRoomBooking } from '@/lib/student-room-booking'
import { invalidateSessionCache } from '@/lib/session'
import { useAuth } from '@/stores/auth-store'
import { buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { NotificationBell } from '@/components/NotificationBell'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const links = [
  { to: '/dashboard', label: 'Хяналтын самбар', icon: Home, end: true },
  { to: '/apply', label: 'Өрөө захиалга', icon: ClipboardList },
  { to: '/payments', label: 'Төлбөр', icon: CreditCard },
  { to: '/contract', label: 'Гэрээ', icon: FileText },
  { to: '/daily', label: 'Өдөр тутмын', icon: Leaf },
]

function canSeeAdmin(role: string | undefined) {
  return role === 'admin' || role === 'staff' || role === 'accountant'
}

export function RoleRoute({ roles }: { roles: string[] }) {
  const { user } = useAuth()
  if (!user) return null
  if (!roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

/** Оюутны хүсэлт/үйл явц — админ ажилтан нягтлан энд орохгүй */
export function StudentRoute() {
  const { user } = useAuth()
  if (!user) return null
  if (user.role !== 'student') return <Navigate to="/dashboard" replace />
  return <Outlet />
}

export function AppLayout() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()

  const applicationsMy = useQuery({
    queryKey: ['applications-my'],
    queryFn: async () => {
      const { data } = await api.get<{ applications: { status: string }[] }>('/applications/my')
      return data.applications
    },
    enabled: user?.role === 'student',
  })

  const navLinks = useMemo(() => {
    const role = user?.role
    const booked =
      role === 'student' && studentHasConfirmedRoomBooking(applicationsMy.data ?? [])

    if (role && role !== 'student') {
      return links.filter((l) =>
        !['/apply', '/daily', '/contract', '/room-change'].includes(l.to),
      )
    }

    return links.map((l) => {
      if (l.to !== '/apply') return l
      return booked
        ? { to: '/room-change', label: 'Өрөө солих хүсэлт', icon: ArrowRightLeft }
        : l
    })
  }, [user?.role, applicationsMy.data])

  async function logout() {
    try {
      await api.post('/auth/logout')
    } catch {
      /* ignore */
    }
    invalidateSessionCache()
    setUser(null)
    navigate('/login')
  }

  const initials =
    ((user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '')).toUpperCase() || 'M'

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(isActive ? 'active' : undefined)

  return (
    <div className="app-shell-dms">
      <header className="app-header-dms">
        <div className="app-header-inner-dms">
          <Sheet>
            <SheetTrigger
              className={cn(
                buttonVariants({ variant: 'outline', size: 'icon-sm' }),
                'md:hidden',
              )}
              aria-label="Цэс"
            >
              <Menu className="size-4" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <div className="mt-8 flex flex-col gap-1">
                {navLinks.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    className={cn(buttonVariants({ variant: 'ghost' }), 'justify-start gap-2')}
                  >
                    <l.icon className="size-4" />
                    {l.label}
                  </Link>
                ))}
                {canSeeAdmin(user?.role) ? (
                  <Link
                    to="/admin"
                    className={cn(buttonVariants({ variant: 'ghost' }), 'justify-start gap-2')}
                  >
                    <Shield className="size-4" />
                    Админ
                  </Link>
                ) : null}
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/dashboard" className="brand-dms min-w-0 shrink">
            <img
              src="/brand-muis-logo.png"
              alt="МУИС"
              width={34}
              height={34}
              decoding="async"
              className="brand-logo-dms"
            />
            <div>
              <div>DMS · МУИС</div>
              <div className="brand-meta-dms">Дотуур байрны мэдээллийн систем</div>
            </div>
          </Link>

          <nav className="nav-top-dms hidden md:flex">
            {navLinks.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={navLinkClass}>
                <l.icon className="size-4 opacity-80" />
                {l.label}
              </NavLink>
            ))}
            {canSeeAdmin(user?.role) ? (
              <NavLink to="/admin" className={navLinkClass}>
                <Shield className="size-4 opacity-80" />
                Админ
              </NavLink>
            ) : null}
          </nav>

          <div className="header-right-dms flex items-center gap-0">
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-2')}
              >
                <Avatar className="size-7">
                  {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden lg:inline">{user?.firstName}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>Профайл</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/notifications')}>Мэдэгдэл</DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>Гарах</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="app-main-dms">
        <Outlet />
      </main>
    </div>
  )
}
