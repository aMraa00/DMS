import { create } from 'zustand'

export type AuthUser = {
  id: string
  studentId?: string
  registerNumber?: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  /** Дотоод нууц үг тохируулсан эсэх (имэйлээр нэвтрэх) */
  hasPassword?: boolean
  role: string
  gender?: string
  region?: string
  level?: string
  status?: string
  avatarUrl?: string
}

type AuthState = {
  user: AuthUser | null
  hydrated: boolean
  setUser: (u: AuthUser | null) => void
  setHydrated: (v: boolean) => void
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  setUser: (user) => set({ user }),
  setHydrated: (hydrated) => set({ hydrated }),
}))
