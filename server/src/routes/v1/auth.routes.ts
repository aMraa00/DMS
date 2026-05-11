import path from 'node:path'
import fs from 'node:fs/promises'
import { Router, type Request, type Response, type NextFunction } from 'express'
import multer from 'multer'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { User } from '../../models/User.model.js'
import { env } from '../../config/env.js'
import { authenticate, optionalAccessToken, requireRoles, type AuthedRequest } from '../../middleware/auth.middleware.js'
import { clearAuthCookies, setAuthCookies, AUTH_COOKIES } from '../../utils/cookies.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.js'
import { forgetRefresh, hasRefresh, rememberRefresh } from '../../redis/client.js'
import { westPayloadToProfile, westStudentLogin } from '../../services/west.service.js'
import { createInAppNotification } from '../../services/notification.service.js'
import { appendStudentIfMissingToDutyRoster } from '../../services/duty-roster.service.js'
import type { Role } from '../../types/roles.js'

export const authRouter = Router()

/** Зөвхөн буруу нэвтрэлтийн оролдлогод (амжилттай болон refresh/register тоологдохгүй) */
const LOGIN_FAIL_WINDOW_MS = 5 * 60 * 1000
const LOGIN_FAIL_MAX = 15
const LOGIN_FAIL_MESSAGE =
  'Буруу нэвтрэлтийн оролдлого хэт олон байна. 5 минутын дараа дахин оролдоно уу.'

const loginFailByIp = new Map<string, { count: number; resetAt: number }>()

function clientIp(req: Request): string {
  return String(req.ip ?? req.socket?.remoteAddress ?? 'unknown')
}

function isLoginFlooded(ip: string): boolean {
  const now = Date.now()
  const e = loginFailByIp.get(ip)
  if (!e || now > e.resetAt) return false
  return e.count >= LOGIN_FAIL_MAX
}

function recordFailedLoginAttempt(ip: string) {
  const now = Date.now()
  let e = loginFailByIp.get(ip)
  if (!e || now > e.resetAt) {
    e = { count: 0, resetAt: now + LOGIN_FAIL_WINDOW_MS }
    loginFailByIp.set(ip, e)
  }
  e.count++
}

function resetFailedLoginAttempts(ip: string) {
  loginFailByIp.delete(ip)
}

function refreshTtlSeconds() {
  const m = /^(\d+)([smhd])$/i.exec(env.JWT_REFRESH_EXPIRES.trim())
  if (!m) return 7 * 24 * 3600
  const n = Number(m[1])
  const u = m[2].toLowerCase()
  if (u === 's') return n
  if (u === 'm') return n * 60
  if (u === 'h') return n * 3600
  return n * 86400
}

const refreshTtl = refreshTtlSeconds()

const avatarsDir = path.join(process.cwd(), 'uploads', 'avatars')
const AVATAR_MIME_EXT = new Map<string, string>([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
])

async function unlinkUserAvatarFiles(userId: string) {
  for (const ext of AVATAR_MIME_EXT.values()) {
    const p = path.join(avatarsDir, `${userId}.${ext}`)
    await fs.unlink(p).catch(() => {})
  }
}

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, AVATAR_MIME_EXT.has(file.mimetype))
  },
})

function avatarUploadMw(req: Request, res: Response, next: NextFunction) {
  avatarUpload.single('avatar')(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ error: 'Зургийн хэмжээ 2МБ-с хэтэрсэн байна.' })
        return
      }
      res.status(400).json({ error: 'Файл хүлээж чадсангүй.' })
      return
    }
    if (err) {
      res.status(400).json({ error: 'Файл хүлээж чадсангүй.' })
      return
    }
    next()
  })
}

const loginSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('west'),
    loginName: z.string().min(3),
    password: z.string().min(4),
  }),
  z.object({
    mode: z.literal('local'),
    email: z.string().email(),
    password: z.string().min(6),
  }),
])

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const ip = clientIp(req)
  if (isLoginFlooded(ip)) {
    res.status(429).json({ error: LOGIN_FAIL_MESSAGE })
    return
  }

  try {
    let userDoc = null as InstanceType<typeof User> | null

    if (parsed.data.mode === 'west') {
      const west = await westStudentLogin(
        parsed.data.loginName,
        parsed.data.password,
        env.WEST_LOGIN_URL,
        env.WEST_FETCH_TIMEOUT_MS,
      )
      const profile = westPayloadToProfile(west)
      userDoc = await User.findOneAndUpdate(
        { $or: [{ westLoginName: profile.westLoginName }, { studentId: profile.studentId }] },
        {
          $set: {
            ...profile,
            role: 'student' as Role,
          },
        },
        { upsert: true, new: true },
      )
    } else {
      const emailNorm = parsed.data.email.trim().toLowerCase()
      const passwordNorm = parsed.data.password.trim()
      userDoc = await User.findOne({ email: emailNorm }).select('+passwordHash')
      if (!userDoc?.passwordHash) {
        recordFailedLoginAttempt(ip)
        res.status(401).json({ error: 'Invalid credentials' })
        return
      }
      const ok = await bcrypt.compare(passwordNorm, userDoc.passwordHash)
      if (!ok) {
        recordFailedLoginAttempt(ip)
        res.status(401).json({ error: 'Invalid credentials' })
        return
      }
    }

    if (!userDoc) {
      res.status(500).json({ error: 'Login failed' })
      return
    }

    if (userDoc.isDisabled === true || userDoc.status === 'suspended') {
      res.status(403).json({ error: 'Таны эрх хязгаарлагдсан байна. Албатай холбогдоно уу.' })
      return
    }

    if (userDoc.role === 'student') {
      void appendStudentIfMissingToDutyRoster(userDoc._id)
    }

    const access = signAccessToken(String(userDoc._id), userDoc.role as Role)
    const { token: refresh, jti } = signRefreshToken(String(userDoc._id), userDoc.role as Role)
    await rememberRefresh(String(userDoc._id), jti, refreshTtl)
    setAuthCookies(res, access, refresh)

    const freshUser = await User.findById(userDoc._id).select('+passwordHash')
    if (!freshUser) {
      res.status(500).json({ error: 'Login failed' })
      return
    }
    resetFailedLoginAttempts(ip)
    res.json({
      user: { ...sanitizeUser(freshUser), hasPassword: !!freshUser.passwordHash },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Login error'
    if (parsed.data.mode === 'west') {
      recordFailedLoginAttempt(ip)
      res.status(503).json({ error: msg })
      return
    }
    res.status(400).json({ error: msg })
  }
})

const registerSchema = z.object({
  registerNumber: z.string().optional(),
  studentId: z.string().min(4),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  gender: z.enum(['M', 'F']).optional(),
  region: z.string().optional(),
  level: z.string().optional(),
})

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }
  const existing = await User.findOne({
    $or: [{ email: parsed.data.email }, { studentId: parsed.data.studentId }],
  })
  if (existing) {
    res.status(409).json({ error: 'User already exists' })
    return
  }
  const { password, ...profile } = parsed.data
  const passwordHash = await bcrypt.hash(password, 10)
  const user = await User.create({
    ...profile,
    passwordHash,
    role: 'student',
    status: 'pending_verification',
  })
  await appendStudentIfMissingToDutyRoster(user._id)
  await createInAppNotification(
    String(user._id),
    'Тавтай морилно уу',
    'Бүртгэл амжилттай. Дотуур байрны үйлчилгээг эндээс ашиглана уу.',
    '/dashboard',
  )
  const access = signAccessToken(String(user._id), user.role as Role)
  const { token: refresh, jti } = signRefreshToken(String(user._id), user.role as Role)
  await rememberRefresh(String(user._id), jti, refreshTtl)
  setAuthCookies(res, access, refresh)
  res.status(201).json({ user: { ...sanitizeUser(user), hasPassword: true } })
})

authRouter.post('/refresh', async (req, res) => {
  const rt = req.cookies?.[AUTH_COOKIES.REFRESH_COOKIE]
  if (!rt) {
    clearAuthCookies(res)
    /** SPA bootstrap: алдааны улаан log-гүй “session байхгүй” */
    res.status(204).end()
    return
  }
  try {
    const payload = verifyRefreshToken(rt)
    if (payload.type !== 'refresh') throw new Error('Invalid token')
    const allowed = await hasRefresh(payload.sub, payload.jti)
    if (!allowed) {
      clearAuthCookies(res)
      res.status(204).end()
      return
    }
    const access = signAccessToken(payload.sub, payload.role)
    const { token: refresh, jti } = signRefreshToken(payload.sub, payload.role)
    await forgetRefresh(payload.sub, payload.jti)
    await rememberRefresh(payload.sub, jti, refreshTtl)
    setAuthCookies(res, access, refresh)
    res.json({ ok: true })
  } catch {
    clearAuthCookies(res)
    res.status(204).end()
  }
})

authRouter.post('/logout', async (req, res) => {
  try {
    const rt = req.cookies?.[AUTH_COOKIES.REFRESH_COOKIE]
    if (rt) {
      const payload = verifyRefreshToken(rt)
      if (payload.type === 'refresh') {
        await forgetRefresh(payload.sub, payload.jti)
      }
    }
  } catch {
    /* ignore */
  }
  clearAuthCookies(res)
  res.json({ ok: true })
})

authRouter.get('/me', optionalAccessToken, async (req: AuthedRequest, res) => {
  if (!req.user) {
    res.json({ user: null })
    return
  }
  const user = await User.findById(req.user.id).select('+passwordHash')
  if (!user) {
    res.json({ user: null })
    return
  }
  const hasPassword = !!user.passwordHash
  res.json({ user: { ...sanitizeUser(user), hasPassword } })
})

const patchMeSchema = z.object({
  phone: z.string().trim().max(32).optional(),
})

/** Утасны дугаар зэрэг системийн бүртгэлээ оюутан/ажилтан өөрөө шинэчилнэ */
authRouter.patch('/me', authenticate, async (req: AuthedRequest, res) => {
  const parsed = patchMeSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }
  const user = await User.findById(req.user!.id)
  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  if (parsed.data.phone !== undefined) {
    const next = parsed.data.phone.trim()
    user.phone = next === '' ? undefined : next
  }
  await user.save()
  const fresh = await User.findById(user._id).select('+passwordHash')
  if (!fresh) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  res.json({
    user: { ...sanitizeUser(fresh), hasPassword: !!fresh.passwordHash },
  })
})

authRouter.post('/me/avatar', authenticate, avatarUploadMw, async (req: AuthedRequest, res) => {
  const rf = req as AuthedRequest & { file?: Express.Multer.File }
  const file = rf.file
  const uid = req.user!.id

  if (!file) {
    res.status(400).json({
      error: 'JPEG, PNG эсвэл WebP форматын зураг оруулна уу (хамгийн ихдээ 2МБ).',
    })
    return
  }

  const ext = AVATAR_MIME_EXT.get(file.mimetype)
  if (!ext) {
    res.status(400).json({ error: 'Зөвхөн JPEG, PNG, WebP зураг зөвшөөрөгдөнө.' })
    return
  }

  try {
    await unlinkUserAvatarFiles(uid)
    const dest = path.join(avatarsDir, `${uid}.${ext}`)
    await fs.writeFile(dest, file.buffer)
  } catch {
    res.status(500).json({ error: 'Зургийг хадгалахад алдаа гарлаа.' })
    return
  }

  const rel = `/uploads/avatars/${uid}.${ext}`
  const user = await User.findById(uid)
  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  user.avatarUrl = rel
  await user.save()

  const freshUser = await User.findById(uid).select('+passwordHash')
  if (!freshUser) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  res.json({
    user: { ...sanitizeUser(freshUser), hasPassword: !!freshUser.passwordHash },
  })
})

authRouter.delete('/me/avatar', authenticate, async (req: AuthedRequest, res) => {
  const uid = req.user!.id
  const user = await User.findById(uid)
  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  await unlinkUserAvatarFiles(uid)
  user.avatarUrl = undefined
  await user.save()
  const freshUser = await User.findById(uid).select('+passwordHash')
  if (!freshUser) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  res.json({
    user: { ...sanitizeUser(freshUser), hasPassword: !!freshUser.passwordHash },
  })
})

const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).max(200),
})

/** Одоогийн нууц үг шалгаад шинээр солино. Амжилттай бол session cookie цэвэрлэгдэнэ (дахин нэвтрэх). */
authRouter.post('/me/password', authenticate, async (req: AuthedRequest, res) => {
  const parsed = changePasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }
  const newPw = parsed.data.newPassword.trim()
  const user = await User.findById(req.user!.id).select('+passwordHash')
  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  if (user.passwordHash) {
    const cur = parsed.data.currentPassword?.trim() ?? ''
    if (!cur) {
      res.status(400).json({ error: 'Одоогийн нууц үгээ оруулна уу' })
      return
    }
    const ok = await bcrypt.compare(cur, user.passwordHash)
    if (!ok) {
      res.status(401).json({ error: 'Одоогийн нууц үг буруу байна' })
      return
    }
    if (await bcrypt.compare(newPw, user.passwordHash)) {
      res.status(400).json({ error: 'Шинэ нууц үг өмнөхөөсөө ялгаатай байх ёстой' })
      return
    }
  }

  user.passwordHash = await bcrypt.hash(newPw, 10)
  await user.save()
  clearAuthCookies(res)
  res.json({ ok: true })
})

authRouter.get('/health-admin', authenticate, requireRoles('admin'), (_req, res) => {
  res.json({ ok: true })
})

function sanitizeUser(u: InstanceType<typeof User>) {
  return {
    id: String(u._id),
    registerNumber: u.registerNumber,
    studentId: u.studentId,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phone: u.phone,
    level: u.level,
    school: u.school,
    program: u.program,
    region: u.region,
    gender: u.gender,
    avatarUrl: u.avatarUrl ?? undefined,
    isDisabled: u.isDisabled,
    hasInsurance: u.hasInsurance,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
  }
}
