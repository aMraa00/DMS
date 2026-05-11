import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

/** Албаны эрхээр олон хэрэглэгчид аппын «Мэдэгдэл» хүргэх — оюутны хяналтын самбарын «Үйл ажиллагаа»-д харагдана. */
export function BroadcastAnnouncementCard() {
  const queryClient = useQueryClient()
  const [bcTitle, setBcTitle] = useState('')
  const [bcMessage, setBcMessage] = useState('')
  const [bcAudience, setBcAudience] = useState<'students' | 'all'>('students')
  const [banner, setBanner] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const broadcastAnnouncement = useMutation({
    mutationFn: async (body: {
      title: string
      message: string
      audience: 'students' | 'all'
    }) => {
      const { data } = await api.post<{ ok: boolean; recipientCount: number }>(
        '/admin/notifications/broadcast',
        body,
      )
      return data
    },
    onSuccess: (data) => {
      setBanner({
        kind: 'ok',
        text:
          data.recipientCount === 0
            ? 'Хүлээн авагч олдсонгүй (идэвхтэй оюутан байхгүй байна).'
            : `${data.recipientCount} хэрэглэгчид мэдэгдэл илгээгдлээ.`,
      })
      setBcTitle('')
      setBcMessage('')
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: () => {
      setBanner({
        kind: 'err',
        text: 'Илгээхэд алдаа гарлаа. Сүлжээ, эрхээ шалгаад дахин оролдоно уу.',
      })
    },
  })

  return (
    <Card className="border-[color:var(--border)] shadow-[var(--sh-1)]">
      <div className="dms-card-hd">
        <div>
          <h3>Мэдэгдэл оруулах</h3>
          <p className="sub">
            Оюутнуудын «Хяналтын самбар» дахь «Үйл ажиллагаа» хэсэгт харагдана (цахим төлбөр, гэрээний мэдэгдэлтэй нэг жагсаалт).
          </p>
        </div>
      </div>
      <CardContent className="space-y-4 pt-0">
        {banner ? (
          <div
            className={cn(
              'rounded-lg border px-4 py-3 text-sm',
              banner.kind === 'ok'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100'
                : 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100',
            )}
          >
            {banner.text}
          </div>
        ) : null}
        <form
          className="space-y-4 max-w-2xl"
          onSubmit={(e) => {
            e.preventDefault()
            setBanner(null)
            const title = bcTitle.trim()
            const message = bcMessage.trim()
            if (title.length < 1 || message.length < 5) return
            broadcastAnnouncement.mutate({
              title,
              message,
              audience: bcAudience,
            })
          }}
        >
          <div className="space-y-2">
            <span className="text-sm font-medium leading-none">Хүлээн авагчид</span>
            <div className="flex flex-wrap gap-2">
              {(['students', 'all'] as const).map((a) => (
                <Button
                  key={a}
                  type="button"
                  size="sm"
                  variant={bcAudience === a ? 'default' : 'outline'}
                  className={cn(
                    bcAudience === a &&
                      'bg-[color:var(--primary)] text-white hover:bg-[color:var(--primary)]/90',
                  )}
                  onClick={() => setBcAudience(a)}
                >
                  {a === 'students' ? 'Бүх идэвхтэй оюутан' : 'Бүх идэвхтэй хэрэглэгч'}
                </Button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              «Бүх хэрэглэгч» нь админ, ажилтан нягтланг орно — зөвхөн системийн зарлалд ашиглана уу.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-bc-title">Гарчиг</Label>
            <Input
              id="staff-bc-title"
              value={bcTitle}
              onChange={(e) => setBcTitle(e.target.value)}
              placeholder="Жишээ: Байрны хурал"
              maxLength={200}
              className="font-medium"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-bc-message">Агуулга</Label>
            <textarea
              id="staff-bc-message"
              rows={6}
              value={bcMessage}
              onChange={(e) => setBcMessage(e.target.value)}
              placeholder={`Жишээ: 2026 оны 5 сарын 9-нд 18:00 цагаас байрны хуралтай тул бүгд лекцийн А зааланд ирнэ үү.`}
              className={cn(
                'flex min-h-32 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none',
                'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
                'dark:bg-input/30',
              )}
            />
            <p className="text-[11px] text-muted-foreground">Хамгийн багадаа 5 тэмдэгт.</p>
          </div>
          <Button
            type="submit"
            className="bg-[color:var(--primary)]"
            disabled={
              broadcastAnnouncement.isPending ||
              bcTitle.trim().length < 1 ||
              bcMessage.trim().length < 5
            }
          >
            {broadcastAnnouncement.isPending ? 'Илгээж байна…' : 'Мэдэгдэл оруулах'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
