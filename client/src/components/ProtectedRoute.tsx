import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/stores/auth-store'

export function ProtectedRoute() {
  const { user, hydrated } = useAuth()
  const location = useLocation()

  if (!hydrated) {
    return (
      <div className="dms-auth-loading flex min-h-svh items-center justify-center text-muted-foreground">
        Ачааллаж байна…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
