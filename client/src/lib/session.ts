import { api } from '@/lib/api'
import type { AuthUser } from '@/stores/auth-store'

let inflight: Promise<AuthUser | null> | null = null

async function loadSession(): Promise<AuthUser | null> {
  await api.post('/auth/refresh', undefined, { skipRefresh: true }).catch(() => {})
  try {
    const { data } = await api.get<{ user: AuthUser | null }>('/auth/me', { skipRefresh: true })
    return data.user
  } catch {
    /** 502 Bad Gateway эсвэл сервер унтраалттай үед дамжуулахаа үл хамааруулна */
    return null
  }
}

/** Hydration-д StrictMode давхардлыг үл хүлээгдэж, зарим session алдааны улаан log-ийг багасгана. */
export function fetchSession(): Promise<AuthUser | null> {
  if (!inflight) {
    const p = loadSession()
    inflight = p
    void p.finally(() => {
      if (inflight === p) inflight = null
    })
  }
  return inflight
}

export function invalidateSessionCache(): void {
  inflight = null
}
