import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadEnv } from 'dotenv'
import { z } from 'zod'

const __dirname = dirname(fileURLToPath(import.meta.url))
const serverRoot = resolve(__dirname, '../..')
const serverEnvFile = resolve(serverRoot, '.env')

if (existsSync(serverEnvFile)) {
  loadEnv({ path: serverEnvFile })
} else {
  loadEnv()
}

const processEnv = {
  ...process.env,
  /** .env дээр түгээмэл байдаг `MONGO_URI` → `MONGODB_URI` */
  MONGODB_URI: process.env.MONGODB_URI || process.env.MONGO_URI,
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI эсвэл MONGO_URI тохируулна уу'),
  REDIS_URL: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().min(8),
  JWT_REFRESH_SECRET: z.string().min(8),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),
  WEST_LOGIN_URL: z
    .string()
    .url()
    .default('http://west.edu.mn:3000/api/v1/students/login'),
  /** WEST руу fetch timeout (мс). Сүлжээ удаан / сервер унтарсан үед */
  WEST_FETCH_TIMEOUT_MS: z.coerce.number().min(5000).max(120000).default(45000),
  /** QPay — код доторх default нь sandbox жишээ; QPay талд өөрчлөгдсөн бол .env-ээс бодит key өгнө */
  QPAY_BASE_URL: z.string().url().default('https://merchant-sandbox.qpay.mn'),
  QPAY_CLIENT_ID: z.string().default('TEST_MERCHANT'),
  QPAY_CLIENT_SECRET: z.string().default('WBDUzy8n'),
  QPAY_INVOICE_CODE: z.string().default('TEST_INVOICE'),
  /** Webhook: QPay-аас дуудах — localhost ажиллахгүй, polling ашиглана */
  BACKEND_PUBLIC_URL: z.string().url().optional(),
  /**
   * Зөвхөн NODE_ENV=development-д: QPay руу холболгүй mock invoice (үл төлөгдөхгүй биш — шалгахад төлөгдсөн гэж үзнэ)
   */
  QPAY_MOCK: z.preprocess(
    (val) => {
      if (val === undefined || val === '') return false
      if (typeof val === 'boolean') return val
      const s = String(val).trim().toLowerCase()
      if (s === '0' || s === 'false' || s === 'no') return false
      return s === '1' || s === 'true' || s === 'yes'
    },
    z.boolean(),
  ),
})

export const env = envSchema.parse(processEnv)
