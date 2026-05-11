import { useEffect, useRef, useState } from 'react'
import {
  CheckCircle2,
  ExternalLink,
  QrCode,
  RefreshCw,
  Smartphone,
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatMnt } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export type QPaySession = {
  paymentId: string
  total: number
  qrImage?: string
  qrText?: string
  shortUrl?: string
  deeplinks?: { link?: string; logo?: string; name?: string; description?: string }[]
}

type Props = {
  session: QPaySession | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onPaid?: () => void
}

export function QPayQrModal({ session, open, onOpenChange, onPaid }: Props) {
  const [paid, setPaid] = useState(false)
  const [checking, setChecking] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onPaidRef = useRef(onPaid)
  onPaidRef.current = onPaid

  useEffect(() => {
    if (!open || !session) {
      setPaid(false)
      return
    }
    setPaid(false)
  }, [open, session?.paymentId])

  useEffect(() => {
    if (!open || !session || paid) return

    const tick = async () => {
      try {
        const { data } = await api.get<{ paid: boolean }>(`/payments/qpay/check/${session.paymentId}`)
        if (data.paid) {
          if (pollRef.current) clearInterval(pollRef.current)
          setPaid(true)
          onPaidRef.current?.()
        }
      } catch {
        /* алдааг дүлийгээр үлдээнэ — polling үргэлжилнэ */
      }
    }

    pollRef.current = setInterval(() => void tick(), 5000)
    void tick()

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [open, session, paid])

  async function manualCheck() {
    if (!session) return
    setChecking(true)
    try {
      const { data } = await api.get<{ paid: boolean }>(`/payments/qpay/check/${session.paymentId}`)
      if (data.paid) {
        if (pollRef.current) clearInterval(pollRef.current)
        setPaid(true)
        onPaidRef.current?.()
      }
    } finally {
      setChecking(false)
    }
  }

  function close() {
    if (pollRef.current) clearInterval(pollRef.current)
    onOpenChange(false)
  }

  function openDeepLink(link: string) {
    window.location.href = link
    if (session?.shortUrl) {
      setTimeout(() => {
        if (!document.hidden) window.open(session.shortUrl, '_blank')
      }, 1500)
    }
  }

  if (!session) return null

  const b64 = session.qrImage?.replace(/\s/g, '')
  const fallbackSrc = session.qrText
    ? `https://api.qrserver.com/v1/create-qr-code/?size=208x208&margin=4&data=${encodeURIComponent(session.qrText)}`
    : null
  const imgSrc = b64 ? `data:image/png;base64,${b64}` : fallbackSrc

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-md"
        showCloseButton={false}
      >
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md">
                <QrCode className="size-5" />
              </div>
              <div>
                <DialogTitle>QPay төлбөр</DialogTitle>
                <p className="text-xs text-muted-foreground">Банкны апп-аар скан хийн төлнө</p>
              </div>
            </div>
            <Button variant="ghost" size="icon-sm" type="button" onClick={() => close()} aria-label="Хаах">
              ×
            </Button>
          </div>
        </DialogHeader>

        {paid ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="flex size-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="size-12 text-green-600" />
            </div>
            <p className="text-lg font-semibold text-green-600">Амжилттай!</p>
            <p className="text-center text-sm text-muted-foreground">
              {formatMnt(session.total)} төлөгдлөө
            </p>
            <Button type="button" className="mt-2 w-full" onClick={() => close()}>
              Хаах
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-full rounded-2xl bg-muted/50 py-3 text-center">
              <p className="text-2xl font-bold tabular-nums text-primary">{formatMnt(session.total)}</p>
            </div>

            {imgSrc ? (
              <div className="rounded-2xl border-2 border-violet-100 bg-white p-3 shadow-md dark:border-violet-900/40">
                <img
                  src={imgSrc}
                  alt="QPay QR"
                  className="size-52 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            ) : (
              <div className="flex size-52 items-center justify-center rounded-2xl border-2 border-dashed border-muted">
                <QrCode className="size-16 text-muted-foreground/40" />
              </div>
            )}

            {session.shortUrl ? (
              <a
                href={session.shortUrl}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-700"
              >
                <ExternalLink className="size-4" />
                Хөтчөөр нэвтрэх
              </a>
            ) : null}

            {session.deeplinks && session.deeplinks.length > 0 ? (
              <div className="w-full">
                <p className="mb-2 text-center text-xs font-semibold text-muted-foreground">
                  Банкны апп-аар төлөх
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {session.deeplinks.slice(0, 8).map((dl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => dl.link && openDeepLink(dl.link)}
                      className="flex flex-col items-center gap-1 rounded-xl border border-border p-2 text-[10px] transition-colors hover:bg-muted"
                    >
                      {dl.logo ? (
                        <img src={dl.logo} alt="" className="size-9 rounded-lg object-contain" />
                      ) : (
                        <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                          <Smartphone className="size-4 text-muted-foreground" />
                        </div>
                      )}
                      <span className="line-clamp-2 text-center text-muted-foreground">
                        {dl.description || dl.name || 'Банк'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex w-full gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => void manualCheck()}
                disabled={checking}
              >
                <RefreshCw className={cn('size-4', checking && 'animate-spin')} />
                Шалгах
              </Button>
              <Button type="button" variant="secondary" className="flex-1" onClick={() => close()}>
                Хаах
              </Button>
            </div>

            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-1.5 animate-pulse rounded-full bg-green-500" />
              5 сек тутамд автомат шалгана
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
