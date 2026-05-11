import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

export function NotificationBell() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data: body } = await api.get<{ notifications: NotifRow[]; unreadCount: number }>(
        '/notifications',
      )
      return body
    },
    refetchInterval: 45_000,
    refetchOnWindowFocus: true,
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
  const unread = data?.unreadCount ?? 0

  function openItem(n: NotifRow) {
    if (!n.read) markRead.mutate(n._id)
    const dest = n.link?.trim()
    if (dest?.startsWith('/')) {
      navigate(dest)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
          'relative inline-flex items-center justify-center',
        )}
        aria-label="Мэдэгдэл"
      >
        <Bell className="size-5" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(22rem,calc(100vw-1.5rem))] p-0">
        <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
          <DropdownMenuLabel className="p-0 text-sm font-semibold">Мэдэгдэл</DropdownMenuLabel>
          {unread > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 shrink-0 text-xs"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              Бүгд уншсан
            </Button>
          ) : null}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">Ачааллаж…</div>
          ) : rows.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              Шинэ мэдэгдэл алга
            </div>
          ) : (
            <>
              {rows.map((n) => {
                const hasDest = Boolean(n.link?.trim().startsWith('/'))
                return (
                  <DropdownMenuItem
                    key={n._id}
                    className={cn(
                      'flex-col items-start gap-0.5 rounded-none py-3',
                      hasDest ? 'cursor-pointer hover:bg-accent/80' : 'cursor-default opacity-95',
                      !n.read && 'bg-primary/5 focus:bg-primary/10',
                    )}
                    onClick={() => openItem(n)}
                  >
                    <span className="w-full font-medium leading-snug">{n.title}</span>
                    <span className="w-full text-xs font-normal leading-snug text-muted-foreground">
                      {n.message}
                    </span>
                    <span className="text-[10px] font-normal text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString('mn-MN')}
                    </span>
                  </DropdownMenuItem>
                )
              })}
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
