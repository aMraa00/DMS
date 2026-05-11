import { Navigate } from 'react-router-dom'
import { useAuth } from '@/stores/auth-store'

import type { ReactNode } from 'react'

export function GuestRoute({ children }: { children: ReactNode }) {
  const { user, hydrated } = useAuth()

  if (!hydrated) {
    return (
      <div className="dms-auth-loading flex min-h-svh items-center justify-center text-muted-foreground">
        Ачааллаж байна…
      </div>
    )
  }

  if (user) return <Navigate to="/dashboard" replace />

  return children
}
