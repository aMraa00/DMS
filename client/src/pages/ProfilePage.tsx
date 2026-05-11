import { useMutation } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeaderDms } from '@/components/dms/PageChrome'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { fetchSession, invalidateSessionCache } from '@/lib/session'
import type { AuthUser } from '@/stores/auth-store'
import { useAuth } from '@/stores/auth-store'

function genderMn(g?: string) {
  if (g === 'M') return 'Эрэгтэй'
  if (g === 'F') return 'Эмэгтэй'
  return '—'
}

export function ProfilePage() {
  const navigate = useNavigate()
  const user = useAuth((s) => s.user)
  const setUser = useAuth((s) => s.setUser)
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwErr, setPwErr] = useState<string | null>(null)
  const [avatarErr, setAvatarErr] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const initials = useMemo(() => {
    const bits = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.trim()
    const fromEmail = user?.email?.[0]?.toUpperCase()
    return (bits.toUpperCase() || fromEmail || 'M').slice(0, 2).toUpperCase()
  }, [user?.firstName, user?.lastName, user?.email])

  useEffect(() => {
    setPhone(user?.phone ?? '')
  }, [user?.phone])

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('avatar', file)
      const { data } = await api.post<{ user: AuthUser }>('/auth/me/avatar', form)
      return data.user
    },
    onSuccess: async (next) => {
      setAvatarErr(null)
      invalidateSessionCache()
      const fresh = await fetchSession()
      setUser(fresh ?? next)
    },
    onError: (e: unknown) => {
      const raw =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { error?: unknown } } }).response?.data?.error
          : undefined
      setAvatarErr(typeof raw === 'string' ? raw : 'Зургийг ачааллахад алдаа гарлаа.')
    },
  })

  const removeAvatar = useMutation({
    mutationFn: async () => {
      const { data } = await api.delete<{ user: AuthUser }>('/auth/me/avatar')
      return data.user
    },
    onSuccess: async (next) => {
      setAvatarErr(null)
      invalidateSessionCache()
      const fresh = await fetchSession()
      setUser(fresh ?? next)
    },
    onError: (e: unknown) => {
      const raw =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { error?: unknown } } }).response?.data?.error
          : undefined
      setAvatarErr(typeof raw === 'string' ? raw : 'Устгахад алдаа гарлаа.')
    },
  })

  const save = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch<{ user: AuthUser }>('/auth/me', {
        phone: phone.trim(),
      })
      return data.user
    },
    onSuccess: async (next) => {
      setErr(null)
      setMsg('Хадгалагдлаа.')
      invalidateSessionCache()
      const fresh = await fetchSession()
      setUser(fresh ?? next)
    },
    onError: (e: unknown) => {
      setMsg(null)
      const raw =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { error?: unknown } } }).response?.data?.error
          : undefined
      setErr(typeof raw === 'string' ? raw : 'Хадгалахад алдаа гарлаа.')
    },
  })

  const changePassword = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ ok: boolean }>('/auth/me/password', {
        ...(user?.hasPassword ? { currentPassword: currentPw } : {}),
        newPassword: newPw.trim(),
      })
      return data
    },
    onSuccess: async () => {
      setPwErr(null)
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
      invalidateSessionCache()
      setUser(null)
      try {
        await api.post('/auth/logout')
      } catch {
        /* cookie аль хэдийн цэвэрлэгдсэн байж болно */
      }
      navigate('/login', {
        replace: true,
        state: {
          message:
            'Нууц үг амжилттай солигдлоо. И-мэйл болон шинэ нууцаараа дахин нэвтэрнэ үү.',
        },
      })
    },
    onError: (e: unknown) => {
      const raw =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { error?: unknown } } }).response?.data?.error
          : undefined
      setPwErr(typeof raw === 'string' ? raw : 'Нууц үг солиход алдаа гарлаа.')
    },
  })

  function submitPassword() {
    setPwErr(null)
    if (newPw.trim().length < 8) {
      setPwErr('Шинэ нууц үг дор хаяж 8 тэмдэгт байна.')
      return
    }
    if (newPw.trim() !== confirmPw.trim()) {
      setPwErr('Шинэ нууц үг давтан оруулалт таарахгүй байна.')
      return
    }
    if (user?.hasPassword && !currentPw.trim()) {
      setPwErr('Одоогийн нууц үгээ оруулна уу.')
      return
    }
    changePassword.mutate()
  }

  function onAvatarFileChange(e: ChangeEvent<HTMLInputElement>) {
    setAvatarErr(null)
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    const okTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!okTypes.includes(f.type)) {
      setAvatarErr('Зөвхөн JPG, PNG, WebP зураг сонгоно уу.')
      return
    }
    if (f.size > 2 * 1024 * 1024) {
      setAvatarErr('Зургийн хэмжээ 2МБ-с бага байх ёстой.')
      return
    }
    uploadAvatar.mutate(f)
  }

  if (!user) return null

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeaderDms
        crumbs={['Үндсэн', 'Профайл']}
        title="Миний профайл"
        sub="Утас, профайлын зураг болон нууц үгээ эндээс шинэчилнэ"
      />

      {msg ? (
        <div className="rounded-[var(--r-md)] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
          {msg}
        </div>
      ) : null}
      {err ? (
        <div className="rounded-[var(--r-md)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {err}
        </div>
      ) : null}
      {avatarErr ? (
        <div className="rounded-[var(--r-md)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {avatarErr}
        </div>
      ) : null}

      <Card className="border-[color:var(--border)] shadow-[var(--sh-1)]">
        <div className="dms-card-hd">
          <div>
            <h3>Хувийн мэдээлэл</h3>
            <p className="sub">Бүртгэлээс авсан талбарууд (ихэнх нь зөвхөн унших)</p>
          </div>
        </div>
        <CardContent className="space-y-4 pt-0">
          <div className="flex flex-col gap-4 border-b border-[color:var(--border)] pb-6 sm:flex-row sm:items-center">
            <Avatar className="size-24 shrink-0">
              <AvatarImage src={user.avatarUrl ?? undefined} alt="" />
              <AvatarFallback className="text-xl font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div>
                <p className="text-sm font-medium">Профайлын зураг</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Дугуй хэлбэрээр харагдана. JPG, PNG эсвэл WebP, хамгийн ихдээ 2МБ.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadAvatar.isPending}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploadAvatar.isPending ? 'Илгээгдэж байна…' : 'Зураг сонгох'}
                </Button>
                {user.avatarUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    disabled={removeAvatar.isPending}
                    onClick={() => removeAvatar.mutate()}
                  >
                    {removeAvatar.isPending ? 'Устгаж байна…' : 'Зураг хасах'}
                  </Button>
                ) : null}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                aria-hidden
                onChange={onAvatarFileChange}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Овог</Label>
              <Input readOnly value={user.lastName} className="bg-muted/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Нэр</Label>
              <Input readOnly value={user.firstName} className="bg-muted/40" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-muted-foreground">И-мэйл</Label>
              <Input readOnly value={user.email} className="bg-muted/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Оюутны код</Label>
              <Input readOnly value={user.studentId ?? '—'} className="bg-muted/40 font-mono text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Регистрийн дугаар</Label>
              <Input readOnly value={user.registerNumber ?? '—'} className="bg-muted/40 font-mono text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Түвшин</Label>
              <Input readOnly value={user.level ?? '—'} className="bg-muted/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Хүйс</Label>
              <Input readOnly value={genderMn(user.gender)} className="bg-muted/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Бүс нутаг</Label>
              <Input readOnly value={user.region ?? '—'} className="bg-muted/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Төлөв</Label>
              <Input readOnly value={user.status ?? '—'} className="bg-muted/40" />
            </div>
          </div>

          <div className="border-t border-[color:var(--border)] pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="profile-phone">Утасны дугаар</Label>
              <Input
                id="profile-phone"
                inputMode="tel"
                autoComplete="tel"
                placeholder="Жишээ: 99112233"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value)
                  setMsg(null)
                }}
              />
              <p className="text-[11px] text-muted-foreground">
                Захиалга, төлбөртэй холбоотой мэдэгдэл хүлээн авахад ашиглана.
              </p>
            </div>
            <Button
              type="button"
              className="mt-4 bg-[color:var(--primary)]"
              disabled={save.isPending || phone.trim() === (user.phone ?? '').trim()}
              onClick={() => save.mutate()}
            >
              {save.isPending ? 'Хадгалж байна…' : 'Хадгалах'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[color:var(--border)] shadow-[var(--sh-1)]">
        <div className="dms-card-hd">
          <div>
            <h3>Нууц үг</h3>
            <p className="sub">
              {user.hasPassword
                ? 'Одоогийн нууцаа баталгаажуулж шинээр солино'
                : 'WEST эсвэл нэг удаагийн нэвтрэлтийн дараа дотоод нууц үг тохируулаагүй бол эхний удаа энд тохируулна'}
            </p>
          </div>
        </div>
        <CardContent className="space-y-4 pt-0">
          {pwErr ? (
            <div className="rounded-[var(--r-md)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {pwErr}
            </div>
          ) : null}

          {user.hasPassword ? (
            <div className="space-y-1.5">
              <Label htmlFor="pw-current">Одоогийн нууц үг</Label>
              <PasswordInput
                id="pw-current"
                autoComplete="current-password"
                value={currentPw}
                onChange={(e) => {
                  setCurrentPw(e.target.value)
                  setPwErr(null)
                }}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Таны бүртгэлд одоогоор и-мэйлээр нэвтрэх нууц үг байхгүй. Доор шинэ нууц үгээ үүсгэнэ үү —
              дараа нь «И-мэйл» табаар нэвтэрч болно.
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="pw-new">Шинэ нууц үг</Label>
            <PasswordInput
              id="pw-new"
              autoComplete="new-password"
              value={newPw}
              onChange={(e) => {
                setNewPw(e.target.value)
                setPwErr(null)
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw-confirm">Шинэ нууц үг (давтах)</Label>
            <PasswordInput
              id="pw-confirm"
              autoComplete="new-password"
              value={confirmPw}
              onChange={(e) => {
                setConfirmPw(e.target.value)
                setPwErr(null)
              }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Нууц үг солигдсоноор аюулгүй байдлын үүднээс энэ төхөөрөмжөөс автоматаар гарна — дахин
            нэвтэрнэ үү.
          </p>
          <Button
            type="button"
            className="bg-[color:var(--primary)]"
            disabled={changePassword.isPending}
            onClick={() => submitPassword()}
          >
            {changePassword.isPending ? 'Шинэчилж байна…' : 'Нууц үг хадгалах'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
