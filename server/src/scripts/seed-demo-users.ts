import bcrypt from 'bcryptjs'
import { User } from '../models/User.model.js'
import type { Role } from '../types/roles.js'

/** Туршилтын нууц үг: `SEED_DEMO_PASSWORD` эсвэл энэ */
const DEMO_PASSWORD_FALLBACK = 'Demo123456!'

type SeedUser = {
  email: string
  firstName: string
  lastName: string
  role: Role
  studentId?: string
  /** Хоосон бол бусад демо хэрэглэгчтэй ижил `SEED_DEMO_PASSWORD` / Demo123456! */
  password?: string
  gender?: 'M' | 'F'
  region?: string
  level?: string
}

const DEMO_USERS: SeedUser[] = [
  {
    email: 'admin@dms.demo',
    firstName: 'Админ',
    lastName: 'Тест',
    role: 'admin',
  },
  {
    email: 'staff@dms.demo',
    firstName: 'Ажилтан',
    lastName: 'Тест',
    role: 'staff',
  },
  {
    email: 'accountant@dms.demo',
    firstName: 'Нягтлан',
    lastName: 'Тест',
    role: 'accountant',
  },
  {
    email: 'student@dms.demo',
    firstName: 'Оюутан',
    lastName: 'Нэг',
    role: 'student',
    studentId: 'DMS-STU-001',
  },
  {
    email: 'student2@dms.demo',
    firstName: 'Оюутан',
    lastName: 'Хоёр',
    role: 'student',
    studentId: 'DMS-STU-002',
  },
  {
    email: 'suhee9643@gmail.com',
    firstName: 'Сүхзандан',
    lastName: 'Даваахүү',
    role: 'student',
    studentId: '24b1num4002',
    password: 'Svhee2747',
    gender: 'M',
    region: 'Ховд',
    level: '2',
  },
]

/**
 * Демо хэрэглэгчдийг idempotent горимоор оруулах — local нэвтрэлт:
 * `{ mode: "local", email, password }` (нууц үгийг процессын төгсгөлд консолоор харуулна)
 */
export async function seedDemoUsers() {
  const raw = process.env.SEED_DEMO_PASSWORD?.trim()
  const demoPassword = raw && raw.length >= 8 ? raw : DEMO_PASSWORD_FALLBACK

  for (const u of DEMO_USERS) {
    const pwd =
      u.password && u.password.length >= 8 ? u.password.trim() : demoPassword
    const passwordHash = await bcrypt.hash(pwd, 10)

    const emailNorm = u.email.toLowerCase().trim()
    const filter =
      u.studentId != null && u.studentId !== ''
        ? { $or: [{ email: emailNorm }, { studentId: u.studentId }] }
        : { email: emailNorm }

    await User.findOneAndUpdate(
      filter,
      {
        $set: {
          firstName: u.firstName,
          lastName: u.lastName,
          email: emailNorm,
          role: u.role,
          status: 'active',
          passwordHash,
          ...(u.studentId ? { studentId: u.studentId } : {}),
          ...(u.gender ? { gender: u.gender } : {}),
          ...(u.region ? { region: u.region.trim() } : {}),
          ...(u.level ? { level: u.level.trim() } : {}),
        },
      },
      { upsert: true },
    )
  }

  return { count: DEMO_USERS.length, demoPassword }
}
