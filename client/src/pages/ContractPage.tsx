import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Check, Download, PenLine } from 'lucide-react'
import { DmsBanner, PageHeaderDms } from '@/components/dms/PageChrome'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

type ContractMe = {
  _id: string
  status: 'pending_sign' | 'active' | 'cancelled' | 'expired' | string
  signDeadlineAt?: string
  signedAt?: string
  contractNumber?: string
  daysLeftToSign?: number | null
  roomSummary?: { dormName: string; roomNumber: number }
}

function fmtDeadline(iso?: string) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('mn-MN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

function canvasOffset(e: React.PointerEvent, canvas: HTMLCanvasElement) {
  const r = canvas.getBoundingClientRect()
  const scaleX = canvas.width / r.width
  const scaleY = canvas.height / r.height
  return {
    x: (e.clientX - r.left) * scaleX,
    y: (e.clientY - r.top) * scaleY,
  }
}

export function ContractPage() {
  const queryClient = useQueryClient()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const lastPt = useRef({ x: 0, y: 0 })
  const [hasInk, setHasInk] = useState(false)
  const [name, setName] = useState('')
  const [signErr, setSignErr] = useState<string | null>(null)
  const [agreed, setAgreed] = useState({ rules: false, financial: false, conduct: false })
  const allAgreed = agreed.rules && agreed.financial && agreed.conduct && name.trim().length > 2

  const contractQ = useQuery({
    queryKey: ['contract-me'],
    queryFn: async () => {
      const { data } = await api.get<{ contract: ContractMe | null }>('/contracts/me')
      return data.contract
    },
  })

  const layoutCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio ?? 1, 2)
    const w = 340
    const h = 120
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    canvas.width = Math.floor(w * dpr)
    canvas.height = Math.floor(h * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#111827'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    setHasInk(false)
  }, [])

  useEffect(() => {
    layoutCanvas()
  }, [layoutCanvas])

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return
    e.preventDefault()
    canvas.setPointerCapture(e.pointerId)
    drawing.current = true
    const { x, y } = canvasOffset(e, canvas)
    lastPt.current = { x, y }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const { x, y } = canvasOffset(e, canvas)
    ctx.beginPath()
    ctx.moveTo(lastPt.current.x, lastPt.current.y)
    ctx.lineTo(x, y)
    ctx.stroke()
    lastPt.current = { x, y }
    setHasInk(true)
  }

  function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = false
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  const signMut = useMutation({
    mutationFn: async (signatureDataUrl: string) => {
      const id = contractQ.data?._id
      if (!id) throw new Error('Гэрээ олдсонгүй')
      const { data } = await api.post<{ ok: boolean }>(`/contracts/${id}/sign`, {
        signatureDataUrl,
      })
      return data
    },
    onSuccess: () => {
      setSignErr(null)
      void queryClient.invalidateQueries({ queryKey: ['contract-me'] })
    },
    onError: (e: unknown) => {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : null
      setSignErr(typeof msg === 'string' ? msg : 'Илгээхэд алдаа гарлаа')
    },
  })

  function clearPad() {
    layoutCanvas()
    setSignErr(null)
  }

  function submitSign() {
    const canvas = canvasRef.current
    if (!canvas || !hasInk) {
      setSignErr('Дээрх талбарт гарын үсгээ зурна уу.')
      return
    }
    setSignErr(null)
    const url = canvas.toDataURL('image/png')
    if (url.length < 30) {
      setSignErr('Зургийн өгөгдөл хэт богино байна. Дахин зурна уу.')
      return
    }
    signMut.mutate(url)
  }

  const c = contractQ.data
  const pending = c?.status === 'pending_sign'
  const active = c?.status === 'active'
  const loading = contractQ.isLoading

  const deadlineLabel = c?.signDeadlineAt ? fmtDeadline(c.signDeadlineAt) : '2026-05-15'

  return (
    <div className="space-y-6">
      <PageHeaderDms
        crumbs={['Баримт бичиг']}
        title="Цахим гэрээ"
        sub="2026 II улирал · Дотуур байрны түрээс"
        action={
          <Button variant="outline" size="sm" className="gap-2 border-[color:var(--border-strong)]">
            <Download className="size-4" />
            PDF татах
          </Button>
        }
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Гэрээний мэдээлэл ачааллаж байна…</p>
      ) : !c ? (
        <DmsBanner variant="warn" className="items-start">
          <AlertTriangle className="mt-0.5 size-[18px] shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="ttl">Идэвхтэй гэрээ байхгүй</div>
            <div className="msg">
              Гэрээ нь өрөөний төлбөр баталгаажсаны дараа автоматаар үүснэ. Эхлээд өрөө захиалга →
              төлбөрөө төлнө үү.
            </div>
          </div>
        </DmsBanner>
      ) : (
        <>
          {pending && (
            <DmsBanner variant="warn" className="items-center">
              <AlertTriangle className="mt-0.5 size-[18px] shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="ttl">Гарын үсэг хүлээгдэж байна</div>
                <div className="msg">
                  Дуусах хугацаа: {deadlineLabel}
                  {typeof c.daysLeftToSign === 'number'
                    ? ` · ~${c.daysLeftToSign} хоног үлдлээ`
                    : ''}
                  . Доор гарын үсгээ зураад баталгаажуулна уу.
                </div>
              </div>
              <span className="kbd-dms shrink-0">{deadlineLabel}</span>
            </DmsBanner>
          )}

          <div
            className="grid-dms grid-dms-2 gap-6"
            style={{ gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)' }}
          >
            <Card className="border-[color:var(--border)] shadow-[var(--sh-1)]">
              <div className="dms-card-hd">
                <div>
                  <h3>Гэрээний агуулга</h3>
                  <p className="sub">Дотуур байрны түрээслэх гэрээ (ойлгомжтой хураангуй)</p>
                </div>
                <Badge variant={active ? 'default' : 'secondary'} className="shrink-0">
                  {active ? 'Баталгаажсан' : pending ? 'Гарын үсэг хүлээгдэж буй' : c.status}
                </Badge>
              </div>
              <CardContent className="pt-0">
                <article className="contract-paper-dms" aria-label="Гэрээний текст">
                  <p className="doc-eyebrow">Монгол Улсын Их Сургууль</p>
                  <h4 className="doc-title">Дотуур байрны түрээслэх гэрээ</h4>
                  <p className="doc-lead">(Журмын 2-р хавсралт — жишээ хувилбар)</p>
                  <div className="doc-meta">
                    <span>Баримтын төрөл: гэрээний ноорог</span>
                    <span>{c.contractNumber ? `№ ${c.contractNumber}` : '№ SU-2026-II-3041'}</span>
                  </div>
                  {c.roomSummary ? (
                    <p className="doc-meta mt-3 rounded-[var(--r)] border border-[color:var(--border-strong)] bg-[color:var(--surface-2)] px-3 py-2 text-sm font-medium">
                      Оноосон байр: {c.roomSummary.dormName} — өрөө №{c.roomSummary.roomNumber}
                    </p>
                  ) : null}

                  <h5 className="section-h">I. ЕРӨНХИЙ ЗҮЙЛ</h5>
                  <p className="clause">
                    1.1. Энэхүү гэрээ нь Монгол улсын их сургуулийн дотуур байр (цаашид «Байр»)
                    болон оюутан (цаашид «Түрээслэгч») хооронд байгуулагдана.
                  </p>
                  <p className="clause">1.2. Гэрээний хугацаа: 2026-09-01-ээс 2027-06-15 хүртэл.</p>

                  <h5 className="section-h">II. ТӨЛБӨР</h5>
                  <p className="clause">2.1. Сар бүрийн төлбөр: ₮ 220,000.</p>
                  <p className="clause">2.2. Эд хогшлын барьцаа: ₮ 80,000 (нэг удаа).</p>
                  <p className="clause">
                    2.3. Төлбөр төлөгдөөгүй тохиолдолд тухайн сарын 25-ны дотор сануулга илгээгдэнэ.
                  </p>

                  <h5 className="section-h">III. ЁС ЗҮЙ БА ДЭГ ЖУРАМ</h5>
                  <p className="clause">3.1. Орох/гарах цаг: 06:00–23:00.</p>
                  <p className="clause">
                    3.2. Зочин хүлээн авах: 09:00–20:00; шөнөжин зочин үлдэхийг хориглоно.
                  </p>
                  <p className="clause">3.3. Тамхи, согтууруулах ундаа — журмын дагуу.</p>

                  <h5 className="section-h">IV. ЦУЦЛАЛТ</h5>
                  <p className="clause">
                    4.1. Талууд 14 хоногийн өмнө бичгээр мэдэгдэж гэрээг цуцлах боломжтой.
                  </p>
                </article>
              </CardContent>
            </Card>

            <Card className="border-[color:var(--border)] shadow-[var(--sh-1)]">
              <div className="dms-card-hd">
                <div>
                  <h3>Цахим гарын үсэг</h3>
                  <p className="sub">Зураад илгээх — серверт хадгалагдана</p>
                </div>
              </div>
              <CardContent className="pt-0">
                {active ? (
                  <div className="py-6 text-center">
                    <div
                      className={cn(
                        'mx-auto mb-4 flex size-14 items-center justify-center rounded-full',
                        'bg-[color:var(--ok-500)] text-white',
                      )}
                    >
                      <Check className="size-8" strokeWidth={2.5} />
                    </div>
                    <div className="text-base font-semibold">Гэрээ баталгаажлаа</div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {c.signedAt
                        ? new Date(c.signedAt).toLocaleString('mn-MN')
                        : new Date().toLocaleString('mn-MN')}
                    </p>
                  </div>
                ) : pending ? (
                  <div className="flex flex-col gap-4">
                    {(
                      [
                        ['rules', 'Дотуур байрны журамтай танилцаж, хүлээн зөвшөөрнө'],
                        ['financial', 'Санхүүгийн нөхцлийг ойлгож, цаг тухайд нь төлөхөөр зөвшөөрнө'],
                        ['conduct', 'Дэг журам, ёс зүйг сахихаа баталгаажуулна'],
                      ] as const
                    ).map(([k, text]) => (
                      <label key={k} className="flex cursor-pointer gap-3 text-sm leading-snug">
                        <input
                          type="checkbox"
                          checked={agreed[k]}
                          onChange={(e) => setAgreed((prev) => ({ ...prev, [k]: e.target.checked }))}
                          className="mt-1 size-4 shrink-0 rounded border-input accent-[color:var(--primary)]"
                        />
                        <span>{text}</span>
                      </label>
                    ))}
                    <div className="space-y-2">
                      <Label htmlFor="sign-name">Бүтэн нэр</Label>
                      <Input
                        id="sign-name"
                        placeholder="Овог Нэр"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="font-sans"
                      />
                      <p className="text-xs text-muted-foreground">
                        Гарын зургийг доорх талбарт зурна. Текст нь зөвхөн таны мэдээлэлд.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Гарын үсгийн талбар</Label>
                      <canvas
                        ref={canvasRef}
                        className="touch-none rounded-xl border-2 border-dashed border-[color:var(--border)] bg-white"
                        style={{ cursor: 'crosshair', maxWidth: '100%' }}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={clearPad}>
                          Цэвэрлэх
                        </Button>
                      </div>
                    </div>

                    {signErr ? (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                        {signErr}
                      </div>
                    ) : null}

                    <Button
                      type="button"
                      className="gap-2 bg-[color:var(--primary)]"
                      disabled={!allAgreed || !hasInk || signMut.isPending}
                      onClick={submitSign}
                    >
                      <PenLine className="size-4" />
                      {signMut.isPending ? 'Илгээж байна…' : 'Цахим гарын үсэг илгээх'}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Энэ гэрээний төлөв: {c.status}. Дэмжлэгтэй холбогдоно уу.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Card className="border-[color:var(--border)] shadow-[var(--sh-1)]">
        <div className="dms-card-hd">
          <div>
            <h3>Гэрээний түүх</h3>
            <p className="sub">Сүүлийн үйл явдал</p>
          </div>
        </div>
        <CardContent className="pt-0">
          <div className="timeline">
            <div className={cn('tl-item', active ? 'done' : 'active')}>
              <div className="when">{active && c?.signedAt ? fmtDeadline(c.signedAt) : 'Одоо'}</div>
              <div className="what">
                {active
                  ? 'Цахим гарын үсэг серверт бүртгэгдлээ'
                  : pending
                    ? 'Гарын үсэг зурах шат'
                    : 'Гэрээний хувилбар'}
              </div>
            </div>
            <div className="tl-item done">
              <div className="when">2026-05-01</div>
              <div className="what">Өрөөний хүсэлт баталгаажсан</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
