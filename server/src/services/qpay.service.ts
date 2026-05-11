/**
 * QPay Merchant API v2 (Sodon-Sondor төслийн qpayService-тэй ижил логик)
 * Sandbox: https://merchant-sandbox.qpay.mn · ENV-ээр production руу шилжүүлнэ.
 */

import { env } from '../config/env.js'

/** Production-д идэвхжихгүй — буруугаар бодит төлбөр mock болохоос сэргийлнэ */
function qpayDevMock(): boolean {
  return env.NODE_ENV === 'development' && env.QPAY_MOCK
}

type QpayTokenResponse = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
}

type QpayInvoiceResponse = {
  invoice_id?: string
  qr_text?: string
  qr_image?: string
  qPay_shortUrl?: string
  qPay_deeplink?: { name?: string; description?: string; logo?: string; link?: string }[]
}

type QpayCheckResponse = {
  count?: number
  rows?: { payment_id?: string }[]
}

let _token: string | null = null
let _tokenExpiry = 0
let _refreshToken: string | null = null

/** QPAY_MOCK: эхний polling-д шууд төлөгдсөн гэж үзвэл өргөдөл `paid` болж дахин QR 400 өгнө */
const mockInvoiceFirstCheckAt = new Map<string, number>()
const MOCK_INVOICE_PAID_AFTER_MS = 12_000

async function request<T>(
  method: string,
  path: string,
  body: Record<string, unknown> | null,
  authHeader: string,
): Promise<T> {
  const base = env.QPAY_BASE_URL.replace(/\/$/, '')
  const url = new URL(path.startsWith('http') ? path : `${base}${path}`)
  const payload = body ? JSON.stringify(body) : ''
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: payload || undefined,
  })
  const text = await res.text()
  let parsed: unknown = {}
  try {
    parsed = text ? JSON.parse(text) : {}
  } catch {
    throw new Error(`QPay invalid JSON: ${text.slice(0, 200)}`)
  }
  if (!res.ok) {
    const p =
      typeof parsed === 'object' && parsed && parsed !== null
        ? (parsed as { message?: string; error?: string })
        : null
    const apiMsg = [p?.message, p?.error].filter(Boolean).join(' — ') || `QPay HTTP ${res.status}`
    /** Sandbox-ийн жишээ credential устсан эсвэл production-д sandbox key ашигласан гэх мэт */
    const hint =
      p?.error === 'AUTHENTICATION_FAILED' || res.status === 401
        ? ' (QPay merchant: серверийн .env доторх QPAY_CLIENT_ID болон QPAY_CLIENT_SECRET нь merchant.qpay.mn / sandbox-д баталгаажуулсан үнэхээр тааруулна уу — энэ нь оюутны нэвтрэх нэр биш.)'
        : ''
    throw new Error(`${apiMsg}${hint}`)
  }
  return parsed as T
}

async function getToken(): Promise<string> {
  const now = Date.now()
  if (_token && now < _tokenExpiry - 60_000) return _token

  if (_refreshToken) {
    try {
      const data = await request<QpayTokenResponse>('POST', '/v2/auth/refresh', null, `Bearer ${_refreshToken}`)
      if (data.access_token) {
        _token = data.access_token
        _refreshToken = data.refresh_token ?? _refreshToken
        _tokenExpiry = (data.expires_in ?? 3600) * 1000 + now
        return _token
      }
    } catch {
      _refreshToken = null
    }
  }

  const basic = Buffer.from(`${env.QPAY_CLIENT_ID}:${env.QPAY_CLIENT_SECRET}`).toString('base64')
  const data = await request<QpayTokenResponse>('POST', '/v2/auth/token', null, `Basic ${basic}`)
  if (!data.access_token) throw new Error('QPay: access_token алга')
  _token = data.access_token
  _refreshToken = data.refresh_token ?? null
  _tokenExpiry = (data.expires_in ?? 3600) * 1000 + now
  return _token
}

export async function createInvoice(args: {
  senderInvoiceNo: string
  amount: number
  description: string
  callbackUrl: string
  receiverData?: { register?: string; name?: string; email?: string; phone?: string }
}) {
  if (qpayDevMock()) {
    const id = `MOCK-${args.senderInvoiceNo}`
    return {
      invoice_id: id,
      qr_text: `DMS_MOCK|${id}|MNT${args.amount}`,
      qr_image: undefined,
      qPay_shortUrl: undefined,
      qPay_deeplink: [{ name: 'Mock', description: 'QPAY_MOCK/dev', link: '#' }],
    }
  }

  const token = await getToken()
  const safeDesc = args.description.replace(/[^\w\s.А-Яа-яӨҮЁөүё-]/g, '').slice(0, 200) || 'DMS payment'
  const amountStr = String(Math.round(args.amount * 100) / 100)

  const body: Record<string, unknown> = {
    invoice_code: env.QPAY_INVOICE_CODE,
    sender_invoice_no: String(args.senderInvoiceNo),
    invoice_receiver_code: args.receiverData?.register || 'terminal',
    invoice_description: safeDesc,
    sender_branch_code: 'BRANCH1',
    amount: args.amount,
    callback_url: args.callbackUrl,
    invoice_receiver_data: {
      register: args.receiverData?.register,
      name: args.receiverData?.name,
      email: args.receiverData?.email,
      phone: args.receiverData?.phone,
    },
    lines: [
      {
        tax_product_code: '6401',
        line_description: safeDesc.slice(0, 100),
        line_quantity: '1.00',
        line_unit_price: `${amountStr}.00`,
        note: 'DMS',
      },
    ],
    transactions: [{ description: safeDesc.slice(0, 100), amount: amountStr, accounts: [] }],
  }

  return request<QpayInvoiceResponse>('POST', '/v2/invoice', body, `Bearer ${token}`)
}

export async function checkPayment(invoiceId: string): Promise<QpayCheckResponse> {
  if (qpayDevMock() && invoiceId.startsWith('MOCK-')) {
    const now = Date.now()
    let started = mockInvoiceFirstCheckAt.get(invoiceId)
    if (started === undefined) {
      started = now
      mockInvoiceFirstCheckAt.set(invoiceId, started)
    }
    if (now - started >= MOCK_INVOICE_PAID_AFTER_MS) {
      return { count: 1, rows: [{ payment_id: `mock-${now}` }] }
    }
    return { count: 0, rows: [] }
  }

  const token = await getToken()
  return request<QpayCheckResponse>(
    'POST',
    '/v2/payment/check',
    {
      object_type: 'INVOICE',
      object_id: invoiceId,
      offset: { page_number: 1, page_limit: 100 },
    },
    `Bearer ${token}`,
  )
}

export async function cancelInvoice(invoiceId: string): Promise<void> {
  if (qpayDevMock() && invoiceId.startsWith('MOCK-')) return

  const token = await getToken()
  await request('DELETE', `/v2/invoice/${invoiceId}`, null, `Bearer ${token}`)
}
