import { useEffect } from 'react'
import type { AuthUser } from '@/stores/auth-store'
import { useAuth } from '@/stores/auth-store'
import { fetchSession } from '@/lib/session'

export function AuthBootstrap() {
  const { setUser, setHydrated } = useAuth()

  useEffect(() => {
    let cancelled = false
    void fetchSession().then((user: AuthUser | null) => {
      if (!cancelled) setUser(user)
      if (!cancelled) setHydrated(true)
    })
    return () => {
      cancelled = true
    }
  }, [setHydrated, setUser])

  return null
}
