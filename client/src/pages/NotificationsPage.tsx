import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ChevronDown, ExternalLink } from 'lucide-react'
import { PageHeaderDms } from '@/components/dms/PageChrome'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

type NotifRow = {
  _id: string
  title: string
  message: string
  read: boolean
  createdAt: string
  link?: string
}

function formatMnVerbose(iso: string) {
  try {
    return new Date(iso).toLocaleString('mn-MN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function NotificationsPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', { limit: 100 }],
    queryFn: async () => {
      const { data: body } = await api.get<{ notifications: NotifRow[]; unreadCount: number }>(
        '/notifications',
        { params: { limit: 100 } },
      )
      return body
    },
  })

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllRead = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const rows = data?.notifications ?? []
  const unreadCount = data?.unreadCount ?? 0

  const filtered = useMemo(() => {
    if (filter === 'unread') return rows.filter((r) => !r.read)
    return rows
  }, [rows, filter])

  useEffect(() => {
    setExpandedId(null)
  }, [filter])

  useEffect(() => {
    if (expandedId && !filtered.some((r) => r._id === expandedId)) {
      setExpandedId(null)
    }
  }, [filtered, expandedId])

  function toggleExpand(n: NotifRow) {
    const opening = expandedId !== n._id
    setExpandedId(opening ? n._id : null)
    if (opening && !n.read) markRead.mutate(n._id)
  }

  return (
    <div className="space-y-8">
      <PageHeaderDms
        crumbs={['Үндсэн', 'Мэдэгдэл']}
        title="Мэдэгдлийн төв"
        sub={`Уншаагүй: ${isLoading ? '…' : unreadCount} · Нийт илгээлт: ${isLoading ? '…' : rows.length} (хамгийн ихдээ 100)`}
        action={
          data && data.unreadCount > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              Бүгдийг уншсан болгох
            </Button>
          ) : null
        }
      />

      {!isLoading && rows.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {(['all', 'unread'] as const).map((f) => (
            <Button
              key={f}
              type="button"
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              className={cn(
                filter === f &&
                  'bg-[color:var(--primary)] text-white hover:bg-[color:var(--primary)]/90',
              )}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? `Бүгд (${rows.length})` : `Уншаагүй (${unreadCount})`}
            </Button>
          ))}
        </div>
      ) : null}

      <Card className="border-[color:var(--border)] shadow-[var(--sh-1)]">
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Ачааллаж байна…</p>
          ) : filtered.length === 0 ? (
            <div className="empty-dms p-10">
              <Bell className="mx-auto mb-3 size-10 text-muted-foreground opacity-40" />
              <div className="ttl">
                {rows.length === 0 ? 'Мэдэгдэл байхгүй' : 'Энэ шүүлтүүр дор юм алга'}
              </div>
              <div>
                {rows.length === 0
                  ? 'Захиалга, төлбөр, гэрээний шинэчлэл болон албаны зарлал энд харагдана.'
                  : '«Бүгд» шүүлтүүр руу шилжээд бүх түүхийг үзнэ үү.'}
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-[color:var(--border)]">
              {filtered.map((n) => {
                const expanded = expandedId === n._id
                const hasLink = Boolean(n.link?.trim().startsWith('/'))
                return (
                  <li key={n._id} className="bg-[color:var(--surface)]">
                    <button
                      type="button"
                      className={cn(
                        'flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/40',
                        !n.read && 'bg-primary/[0.06]',
                      )}
                      onClick={() => toggleExpand(n)}
                      aria-expanded={expanded}
                    >
                      <span
                        className={cn(
                          'mt-1.5 size-2 shrink-0 rounded-full',
                          n.read ? 'bg-muted-foreground/25' : 'bg-[color:var(--primary)]',
                        )}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2 gap-y-1">
                          <span className="font-semibold leading-snug">{n.title}</span>
                          {!n.read ? (
                            <Badge variant="default" className="text-[10px] font-semibold uppercase">
                              Шинэ
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] font-normal">
                              Уншсан
                            </Badge>
                          )}
                        </div>
                        <p
                          className={cn(
                            'text-sm leading-relaxed text-muted-foreground',
                            !expanded && 'line-clamp-2',
                          )}
                        >
                          {n.message}
                        </p>
                        <p className="text-[11px] tabular-nums text-muted-foreground">
                          {formatMnVerbose(n.createdAt)}
                        </p>
                      </div>
                      <ChevronDown
                        className={cn(
                          'mt-0.5 size-5 shrink-0 text-muted-foreground transition-transform duration-200',
                          expanded && 'rotate-180',
                        )}
                        aria-hidden
                      />
                    </button>

                    {expanded ? (
                      <div className="border-t border-[color:var(--border)] bg-muted/25 px-5 py-5 sm:pl-[3.25rem]">
                        <div className="space-y-4">
                          <div>
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Бүрэн агуулга
                            </p>
                            <div className="rounded-[var(--r-md)] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
                              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                                {n.message}
                              </p>
                            </div>
                          </div>

                          <dl className="grid gap-3 rounded-[var(--r-md)] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-xs sm:grid-cols-2">
                            <div>
                              <dt className="font-medium text-muted-foreground">Илгээсэн</dt>
                              <dd className="mt-0.5 tabular-nums">{formatMnVerbose(n.createdAt)}</dd>
                            </div>
                            <div>
                              <dt className="font-medium text-muted-foreground">Төлөв</dt>
                              <dd className="mt-0.5">{n.read ? 'Уншсан' : 'Уншаагүй'}</dd>
                            </div>
                            <div className="sm:col-span-2">
                              <dt className="font-medium text-muted-foreground">Лавлах</dt>
                              <dd className="mt-0.5 font-mono text-[11px]">{n._id}</dd>
                            </div>
                            {hasLink ? (
                              <div className="sm:col-span-2">
                                <dt className="font-medium text-muted-foreground">Холбоос</dt>
                                <dd className="mt-0.5 font-mono text-[11px] break-all">{n.link}</dd>
                              </div>
                            ) : null}
                          </dl>

                          <div className="flex flex-wrap gap-2">
                            {!n.read ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={markRead.isPending}
                                onClick={() => markRead.mutate(n._id)}
                              >
                                Уншсан болгох
                              </Button>
                            ) : null}
                            {hasLink ? (
                              <Link
                                to={n.link!.trim()}
                                className={cn(
                                  buttonVariants({ size: 'sm' }),
                                  'gap-1.5 bg-[color:var(--primary)] text-primary-foreground hover:bg-[color:var(--primary)]/90',
                                )}
                              >
                                <ExternalLink className="size-3.5" />
                                Холбоост шилжих
                              </Link>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Цэсний колокны доорх жагсаалттай ижил өгөгдөл —{' '}
        <Link to="/dashboard" className="underline underline-offset-2">
          самбар руу буцах
        </Link>
      </p>
    </div>
  )
}
