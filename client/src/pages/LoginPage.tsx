import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useLocation } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check } from 'lucide-react'
import { api } from '@/lib/api'
import { invalidateSessionCache } from '@/lib/session'
import type { AuthUser } from '@/stores/auth-store'
import { useAuth } from '@/stores/auth-store'

const REMEMBER_KEY = 'dms_remember_west_login'

const westSchema = z.object({
  loginName: z.string().min(3),
  password: z.string().min(4),
})

const localSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const registerSchema = z.object({
  studentId: z.string().min(4),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  gender: z.enum(['', 'M', 'F']),
  region: z.string().optional(),
  level: z.string().optional(),
})

const fieldLight =
  'login-field-light-dms flex h-12 min-h-12 w-full rounded-2xl border px-4 text-base shadow-none outline-none transition-[border-color,box-shadow] md:text-[1rem] focus-visible:ring-[3px] focus-visible:ring-[#0033a0]/28'

const selectLight =
  'login-field-light-dms flex h-12 min-h-12 w-full rounded-2xl border px-4 text-base outline-none md:text-[1rem] focus-visible:border-[#0033a0] focus-visible:ring-[3px] focus-visible:ring-[#0033a0]/28'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setUser = useAuth((s) => s.setUser)

  const flashMessage =
    typeof location.state === 'object' &&
    location.state !== null &&
    'message' in location.state &&
    typeof (location.state as { message?: unknown }).message === 'string'
      ? (location.state as { message: string }).message
      : null

  const [westError, setWestError] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const [regError, setRegError] = useState<string | null>(null)
  const [rememberWest, setRememberWest] = useState(false)
  const [authTab, setAuthTab] = useState('email')

  const westForm = useForm<z.infer<typeof westSchema>>({
    resolver: zodResolver(westSchema),
    defaultValues: { loginName: '', password: '' },
  })

  const localForm = useForm<z.infer<typeof localSchema>>({
    resolver: zodResolver(localSchema),
    defaultValues: { email: '', password: '' },
  })

  const regForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      studentId: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      gender: '',
    },
  })

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(REMEMBER_KEY)
      if (saved) {
        westForm.setValue('loginName', saved)
        setRememberWest(true)
      }
    } catch {
      /* ignore */
    }
  }, [westForm])

  async function onWest(values: z.infer<typeof westSchema>) {
    setWestError(null)
    try {
      const { data } = await api.post<{ user: AuthUser }>('/auth/login', {
        mode: 'west',
        ...values,
      })
      try {
        if (rememberWest) sessionStorage.setItem(REMEMBER_KEY, values.loginName)
        else sessionStorage.removeItem(REMEMBER_KEY)
      } catch {
        /* ignore */
      }
      invalidateSessionCache()
      setUser(data.user)
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      setWestError(formatApiErr(err))
    }
  }

  async function onLocal(values: z.infer<typeof localSchema>) {
    setLocalError(null)
    try {
      const { data } = await api.post<{ user: AuthUser }>('/auth/login', {
        mode: 'local',
        ...values,
      })
      invalidateSessionCache()
      setUser(data.user)
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      setLocalError(formatApiErr(err))
    }
  }

  async function onRegister(values: z.infer<typeof registerSchema>) {
    setRegError(null)
    try {
      const gender = values.gender === '' ? undefined : values.gender
      const payload = {
        studentId: values.studentId,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        region: values.region || undefined,
        level: values.level || undefined,
        ...(gender ? { gender } : {}),
      }
      const { data } = await api.post<{ user: AuthUser }>('/auth/register', payload)
      invalidateSessionCache()
      setUser(data.user)
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      setRegError(formatApiErr(err))
    }
  }

  return (
    <div className="login-stage-dms login-light-theme-dms">
      <div className="login-bg-shapes-dms" aria-hidden>
        <div className="blob b1" />
        <div className="blob b2" />
        <div className="blob b3" />
      </div>

      <div className="login-shell-dms w-full px-4 sm:px-6 lg:pr-12 xl:pr-16">
        <div className="login-stack-end-dms">
          <div className="glass-card-dms login-card-light-dms min-w-0">
            <div className="glass-card-inner-dms">
            <div className="mb-7 text-center sm:mb-8">
              <img
                src="/num-logo-login.png"
                alt="Монгол Улсын Их Сургууль"
                width={320}
                height={140}
                decoding="async"
                className="mx-auto h-auto w-full max-w-[min(100%,280px)] object-contain sm:max-w-[320px]"
              />
              <p className="mt-4 text-lg font-semibold leading-snug tracking-tight text-[#003371] sm:text-xl">
                Дотуур байрны ухаалаг үйлчилгээ
              </p>
              <h2 className="mt-8 text-xl font-semibold tracking-tight text-[#0033a0] drop-shadow-none sm:text-2xl">
                Нэвтрэх
              </h2>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-slate-600 sm:text-base sm:leading-relaxed">
                WEST эрх, имэйл/нууц үг (демо), эсвэл шинэ элсэгчийн бүртгэл.
              </p>
            </div>

            {flashMessage ? (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-[0.9375rem] leading-relaxed text-emerald-900 sm:text-base">
                {flashMessage}
              </div>
            ) : null}

          <Tabs value={authTab} onValueChange={setAuthTab} className="w-full gap-0">
            <TabsList className="mb-7 grid h-auto w-full shrink-0 grid-cols-3 gap-1.5 rounded-2xl border border-[#0033a0]/18 bg-slate-50 p-2 shadow-inner shadow-slate-200/80 sm:gap-2">
              <TabsTrigger
                value="email"
                className="h-auto min-h-12 rounded-xl px-2 py-2 text-center text-xs leading-tight font-semibold tracking-tight text-slate-600 transition-colors data-active:bg-[#0033a0] data-active:text-white data-active:shadow-md sm:min-h-13 sm:px-3 sm:text-[0.9375rem]"
              >
                И-мэйлээр
              </TabsTrigger>
              <TabsTrigger
                value="west"
                className="h-auto min-h-12 rounded-xl px-2 py-2 text-center text-xs leading-tight font-semibold tracking-tight text-slate-600 transition-colors data-active:bg-[#0033a0] data-active:text-white data-active:shadow-md sm:min-h-13 sm:px-3 sm:text-[0.9375rem]"
              >
                WEST
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="h-auto min-h-12 rounded-xl px-2 py-2 text-center text-xs leading-tight font-semibold tracking-tight text-slate-600 transition-colors data-active:bg-[#0033a0] data-active:text-white data-active:shadow-md sm:min-h-13 sm:px-3 sm:text-[0.9375rem]"
              >
                Бүртгэл
              </TabsTrigger>
            </TabsList>

            <TabsContent value="west" className="mt-0 space-y-5 outline-none">
              <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5 text-[0.9375rem] leading-relaxed text-red-900 sm:text-base">
                <strong className="font-semibold text-red-950">WEST</strong> нь{' '}
                <strong className="font-semibold">west.edu.mn</strong> руу холбогдоно — удаан эсвэл 45 сек хүртэл
                хүлээгдэж <strong className="font-semibold">503</strong> өгөх нь хэвийн.{' '}
                <button
                  type="button"
                  className="font-semibold text-[#0033a0] underline decoration-[#0033a0]/40 underline-offset-2 hover:decoration-[#0033a0]"
                  onClick={() => setAuthTab('email')}
                >
                  «И-мэйлээр» таб
                </button>
                -аар демо нэвтрэлт (шууд).
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5 text-[0.9375rem] leading-relaxed text-amber-950 sm:text-base sm:leading-relaxed">
                Шинэ элсэгч эхлээд <strong className="font-semibold">&quot;Шинэ бүртгэл&quot;</strong>-ээр данс үүсгэнэ
                үү. WEST нууц үг нь&nbsp;
                <a
                  href="https://auth.num.edu.mn/"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-medium text-[#0033a0] underline underline-offset-2 hover:text-[#002a85]"
                >
                  албан ёсны нэвтрэлт
                </a>
                -тэй ижил байна.
              </div>

              {westError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5 text-[0.9375rem] leading-relaxed text-red-900 sm:text-base">
                  {westError}
                </div>
              ) : null}

              <form className="space-y-5" onSubmit={westForm.handleSubmit(onWest)}>
                <div className="space-y-2.5">
                  <Label htmlFor="loginName" className="text-[0.9375rem] font-medium tracking-wide text-slate-700 md:text-base">
                    Хэрэглэгчийн нэр
                  </Label>
                  <Input
                    id="loginName"
                    autoComplete="username"
                    placeholder="Жишээ: 22b1num1234"
                    className={fieldLight}
                    {...westForm.register('loginName')}
                  />
                  {westForm.formState.errors.loginName ? (
                    <p className="text-sm text-red-600">{westForm.formState.errors.loginName.message}</p>
                  ) : null}
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="password" className="text-[0.9375rem] font-medium tracking-wide text-slate-700 md:text-base">
                    Нууц үг
                  </Label>
                  <PasswordInput
                    id="password"
                    autoComplete="current-password"
                    className={fieldLight}
                    {...westForm.register('password')}
                  />
                  {westForm.formState.errors.password ? (
                    <p className="text-sm text-red-600">{westForm.formState.errors.password.message}</p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <label className="flex cursor-pointer items-center gap-2.5 text-[0.9375rem] text-slate-700 select-none hover:text-slate-900 md:text-base">
                    <input
                      type="checkbox"
                      checked={rememberWest}
                      onChange={(e) => setRememberWest(e.target.checked)}
                      className="size-4.5 rounded-md border-slate-300 bg-white text-brand-primary accent-[#0033a0]"
                    />
                    Намайг сана
                  </label>
                  <button
                    type="button"
                    className="text-[0.9375rem] font-medium text-[#0033a0] underline decoration-[#0033a0]/35 underline-offset-[3px] transition-colors hover:text-[#002a85] hover:decoration-[#002a85]/55 md:text-base"
                    onClick={() => window.open('https://auth.num.edu.mn/', '_blank')}
                  >
                    Нууц үг сэргээх
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={westForm.formState.isSubmitting}
                  className="mt-1 h-12 min-h-12 w-full rounded-2xl bg-[#0033a0] text-base font-semibold tracking-tight text-white shadow-[0_10px_32px_-10px_rgba(0,51,160,0.55)] transition-[transform,background-color,box-shadow] hover:bg-[#002a85] hover:shadow-[0_14px_36px_-10px_rgba(0,51,160,0.5)] active:scale-[0.99] sm:h-13 sm:text-[1.0625rem]"
                >
                  Нэвтрэх
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="email" className="mt-0 space-y-5 outline-none">
              <div className="rounded-2xl border border-[#0033a0]/22 bg-sky-50 px-5 py-3.5 text-[0.9375rem] leading-relaxed text-slate-800 sm:text-base">
                <strong className="font-semibold text-[#0033a0]">Демо ба орон нутгийн</strong> данс:{' '}
                <code className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-sm text-slate-900">
                  admin@dms.demo
                </code>
                ,{' '}
                <code className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-sm text-slate-900">
                  staff@dms.demo
                </code>{' '}
                гэх мэт. Нууц үг:{' '}
                <code className="rounded border border-slate-200 bg-white font-mono text-[0.9375rem] text-slate-900">
                  Demo123456!
                </code>{' '}
                (
                <span className="text-slate-600">seed: </span>
                <code className="font-mono text-xs text-slate-800">npm run seed:users</code>
                <span className="text-slate-600"> — server/</span>).
                <span className="mt-3 block">
                  <button
                    type="button"
                    className="rounded-xl border border-[#0033a0]/35 bg-white px-3 py-2 text-sm font-semibold text-[#0033a0] shadow-sm hover:bg-slate-50"
                    onClick={() => {
                      localForm.setValue('email', 'student@dms.demo')
                      localForm.setValue('password', 'Demo123456!')
                    }}
                  >
                    Оюутан демо бөглөх (student@dms.demo)
                  </button>
                </span>
              </div>

              {localError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5 text-[0.9375rem] leading-relaxed text-red-900 sm:text-base">
                  {localError}
                </div>
              ) : null}

              <form className="space-y-5" onSubmit={localForm.handleSubmit(onLocal)}>
                <div className="space-y-2.5">
                  <Label htmlFor="localEmail" className="text-[0.9375rem] font-medium tracking-wide text-slate-700 md:text-base">
                    И-мэйл
                  </Label>
                  <Input
                    id="localEmail"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@dms.demo"
                    className={fieldLight}
                    {...localForm.register('email')}
                  />
                  {localForm.formState.errors.email ? (
                    <p className="text-sm text-red-600">{localForm.formState.errors.email.message}</p>
                  ) : null}
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="localPassword" className="text-[0.9375rem] font-medium tracking-wide text-slate-700 md:text-base">
                    Нууц үг
                  </Label>
                  <PasswordInput
                    id="localPassword"
                    autoComplete="current-password"
                    className={fieldLight}
                    {...localForm.register('password')}
                  />
                  {localForm.formState.errors.password ? (
                    <p className="text-sm text-red-600">{localForm.formState.errors.password.message}</p>
                  ) : null}
                </div>
                <Button
                  type="submit"
                  disabled={localForm.formState.isSubmitting}
                  className="h-12 min-h-12 w-full rounded-2xl bg-[#0033a0] text-base font-semibold tracking-tight text-white shadow-[0_10px_32px_-10px_rgba(0,51,160,0.55)] transition-[transform,background-color,box-shadow] hover:bg-[#002a85] hover:shadow-[0_14px_36px_-10px_rgba(0,51,160,0.5)] active:scale-[0.99] sm:h-13 sm:text-[1.0625rem]"
                >
                  Нэвтрэх
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-0 space-y-5 outline-none">
              {regError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5 text-[0.9375rem] text-red-900 sm:text-base">
                  {regError}
                </div>
              ) : null}
              <p className="text-[0.9375rem] leading-relaxed text-slate-600 sm:text-base sm:leading-relaxed">
                Та <strong className="font-semibold text-[#0033a0]">...@num.edu.mn</strong> эсвэл{' '}
                <strong className="font-semibold text-[#0033a0]">...@stud.num.edu.mn</strong> хаяг болон WEST-тэй тохируулсан орон нутгийн
                имэйл ашиглаж болно.
              </p>
              <form className="grid gap-5" onSubmit={regForm.handleSubmit(onRegister)}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2.5">
                    <Label htmlFor="studentId" className="text-[0.9375rem] font-medium text-slate-700 md:text-base">
                      Оюутны код
                    </Label>
                    <Input id="studentId" className={fieldLight} {...regForm.register('studentId')} />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="email" className="text-[0.9375rem] font-medium text-slate-700 md:text-base">
                      И-мэйл
                    </Label>
                    <Input id="email" type="email" className={fieldLight} {...regForm.register('email')} />
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2.5">
                    <Label htmlFor="firstName" className="text-[0.9375rem] font-medium text-slate-700 md:text-base">
                      Нэр
                    </Label>
                    <Input id="firstName" className={fieldLight} {...regForm.register('firstName')} />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="lastName" className="text-[0.9375rem] font-medium text-slate-700 md:text-base">
                      Овог
                    </Label>
                    <Input id="lastName" className={fieldLight} {...regForm.register('lastName')} />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="regPass" className="text-[0.9375rem] font-medium text-slate-700 md:text-base">
                    Нууц үг
                  </Label>
                  <PasswordInput id="regPass" autoComplete="new-password" className={fieldLight} {...regForm.register('password')} />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2.5">
                    <Label htmlFor="gender" className="text-[0.9375rem] font-medium text-slate-700 md:text-base">
                      Хүйс
                    </Label>
                    <select id="gender" className={selectLight} {...regForm.register('gender')}>
                      <option value="" className="bg-white text-slate-900">
                        Сонгохгүй
                      </option>
                      <option value="M" className="bg-white text-slate-900">
                        Эрэгтэй
                      </option>
                      <option value="F" className="bg-white text-slate-900">
                        Эмэгтэй
                      </option>
                    </select>
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="region" className="text-[0.9375rem] font-medium text-slate-700 md:text-base">
                      Бүс / аймаг
                    </Label>
                    <Input id="region" className={fieldLight} {...regForm.register('region')} />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="level" className="text-[0.9375rem] font-medium text-slate-700 md:text-base">
                    Түвшин
                  </Label>
                  <Input id="level" className={fieldLight} {...regForm.register('level')} />
                </div>
                <Button
                  type="submit"
                  disabled={regForm.formState.isSubmitting}
                  className="h-12 min-h-12 w-full rounded-2xl bg-[#0033a0] text-base font-semibold tracking-tight text-white shadow-[0_10px_32px_-10px_rgba(0,51,160,0.55)] transition-[transform,background-color,box-shadow] hover:bg-[#002a85] sm:h-13 sm:text-[1.0625rem]"
                >
                  Бүртгэл үүсгэх
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          </div>
        </div>

          <div className="login-intro-below-dms login-hero-dms">
            <div className="eyebrow">
              <img
                src="/brand-muis-logo.png"
                alt=""
                width={24}
                height={24}
                decoding="async"
                className="size-6 shrink-0 object-contain"
              />
              МУИС · DMS
            </div>
            <h1 className="login-intro-below-title-dms">Тавтай морилно уу</h1>
            <p>
              Та Монгол Улсын Их Сургуулийн{' '}
              <strong className="font-semibold text-[#0033a0]">дотуур байрны мэдээллийн систем (DMS)</strong>
              &nbsp; руу тавтай морилно уу. WEST SIS, имэйл эсвэл шинэ элсэгчийн бүртгэлээр нэвтрэнэ үү.
            </p>
            <ul>
              <li>
                <span className="check">
                  <Check className="size-[11px]" strokeWidth={2.5} aria-hidden />
                </span>
                Өрөө захиалга, гэрээ, төлбөр нэг цэгээс
              </li>
              <li>
                <span className="check">
                  <Check className="size-[11px]" strokeWidth={2.5} aria-hidden />
                </span>
                Өдөр тутмын үйлчилгээ (зочин, чөлөө, санал)
              </li>
              <li>
                <span className="check">
                  <Check className="size-[11px]" strokeWidth={2.5} aria-hidden />
                </span>
                Нэгдсэн хандалтын орчинтой ойртсон нэвтрэлт
              </li>
            </ul>
            <div className="login-mongolian-script-dms">
              <img
                src="/dms-mongolian-script.png"
                alt=""
                className="login-mongolian-script-img-dms mx-auto max-h-[132px] w-auto max-w-full object-contain"
                width={280}
                height={160}
                decoding="async"
              />
            </div>
            <p className="mt-4 text-sm text-slate-600">
              Албан ёсны орчин:&nbsp;
              <a
                href="https://auth.num.edu.mn/"
                target="_blank"
                rel="noreferrer noopener"
                className="font-medium text-[#0033a0] underline decoration-[#0033a0]/35 underline-offset-2 hover:text-[#002a85]"
              >
                auth.num.edu.mn
              </a>
            </p>
          </div>
        </div>
      </div>

      <p className="login-stage-footer-dms relative z-10 mt-10 text-[0.8125rem] leading-relaxed text-slate-600 sm:mt-12 sm:text-sm">
        © {new Date().getFullYear()} МУИС · Дотуур байрны мэдээллийн систем (DMS) — өрөө захиалга, гэрээ, төлбөр нэг
        цэгээс.
      </p>
    </div>
  )
}

function formatApiErr(err: unknown) {
  if (axios.isAxiosError(err)) {
    if (!err.response && (err.code === 'ERR_NETWORK' || err.message?.includes('502'))) {
      return 'Серверт холбогдож чадсангүй. server/ дотор `npm run dev` ажиллуулж (порт 4000), MongoDB асаалттыг шалгана уу.'
    }
    if (err.response?.status === 502) {
      const d502 = err.response?.data as { error?: string } | undefined
      return typeof d502?.error === 'string'
        ? d502.error
        : 'Сервер 502 буцаасан (прокси эсвэл QPay алдаа). Backend порт 4000 асаалттай эсэхийг шалгаад WEST-ийн оронд «И-мэйлээр» таб ашиглана уу.'
    }
    if (err.response?.status === 503) {
      const d503 = err.response?.data as { error?: string } | undefined
      return typeof d503?.error === 'string'
        ? d503.error
        : 'Үйлчилгээ түр зогссон эсвэл сүлжээг шалгана уу.'
    }
    if (err.response?.status === 401) {
      const d401 = err.response?.data as { error?: unknown } | undefined
      if (typeof d401?.error === 'string') {
        if (d401.error === 'Invalid credentials') {
          return 'И-мэйл/хэрэглэгчийн нэр эсвэл нууц үг тохирохгүй байна. Демо: «И-мэйлээр» таб — admin@dms.demo / Demo123456! (эсвэл server/ дээр npm run seed:users).'
        }
        return d401.error
      }
      return 'Нэвтрэх эрхгүй эсвэл баталгаажуулалт амжилтгүй.'
    }
    const d = err.response?.data as { error?: unknown } | undefined
    if (typeof d?.error === 'string') return d.error
    if (d?.error && typeof d.error === 'object') {
      return JSON.stringify(d.error)
    }
    return err.message || 'Хүсэлт амжилтгүй'
  }
  if (err instanceof Error) return err.message
  return 'Тодорхойгүй алдаа'
}
