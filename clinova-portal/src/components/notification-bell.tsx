import { Link } from '@tanstack/react-router'
import { Bell, CheckCheck, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNotifications } from '@/hooks/use-notifications'

export default function NotificationBell() {
  const { t, i18n } = useTranslation()
  const state = useNotifications()
  const [open, setOpen] = useState(false)

  return <DropdownMenu open={open} onOpenChange={setOpen}>
    <DropdownMenuTrigger render={<Button variant="outline" size="icon" className="relative rounded-xl border-border bg-card/40 text-muted-foreground" aria-label={t('notifications.open', { count: state.unreadCount })} />}>
      <Bell className="size-4" />
      {state.unreadCount > 0 && <span className="absolute -end-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full border border-warm/20 bg-warm/10 px-1 text-[10px] font-bold leading-5 text-warm">{state.unreadCount > 99 ? '99+' : state.unreadCount}</span>}
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" sideOffset={8} className="w-[min(24rem,calc(100dvw-2rem))] overflow-hidden rounded-2xl border border-border bg-card p-0 text-foreground shadow-md" aria-label={t('notifications.title')}>
      <DropdownMenuGroup>
        <DropdownMenuLabel className="flex items-center justify-between gap-3 border-b border-border p-4 normal-case tracking-normal">
          <span><strong className="block text-sm text-foreground">{t('notifications.title')}</strong><span className="block text-[11px] font-normal text-muted-foreground">{t('notifications.unreadCount', { count: state.unreadCount })}</span></span>
        </DropdownMenuLabel>
      </DropdownMenuGroup>
      {state.unreadCount > 0 && <DropdownMenuItem className="mx-2 mt-2 rounded-xl px-3 py-3 text-sm font-bold normal-case tracking-normal text-primary" disabled={state.isMarkingAll} onClick={state.markAllAsRead}>
        {state.isMarkingAll ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <CheckCheck />}{t('notifications.markAllRead')}
      </DropdownMenuItem>}
      <NotificationPreview state={state} language={i18n.resolvedLanguage} />
      <DropdownMenuSeparator className="m-0" />
      <DropdownMenuItem className="rounded-none p-3 text-center text-xs font-bold normal-case tracking-normal text-primary" render={<Link to="/notifications" />}>
        <span className="w-full">{t('notifications.viewAll')}</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
}

type NotificationState = ReturnType<typeof useNotifications>

function NotificationPreview({ state, language }: { state: NotificationState; language?: string }) {
  const { t } = useTranslation()

  if (state.isLoading) return <div className="grid min-h-28 place-items-center"><LoaderCircle className="animate-spin text-primary motion-reduce:animate-none" /></div>
  if (state.notifications.length === 0) return <p className="p-6 text-center text-xs text-muted-foreground">{t('notifications.emptyDescription')}</p>

  return <div className="max-h-96 overflow-y-auto p-2">
    {state.notifications.slice(0, 5).map((item) => <DropdownMenuItem key={item.id} className={`items-start rounded-xl p-3 text-start normal-case tracking-normal ${item.isRead ? '' : 'bg-primary/5'}`} onClick={() => !item.isRead && state.markAsRead(item.id)}>
      <span className={`mt-1 size-2 shrink-0 rounded-full ${item.isRead ? 'bg-muted-foreground/25' : 'bg-warm'}`} />
      <span className="min-w-0 flex-1"><strong className="block truncate text-xs text-foreground">{item.title}</strong><span className="mt-1 line-clamp-2 block text-[11px] font-normal leading-5 text-muted-foreground">{item.message}</span><small className="mt-1 block text-[10px] font-normal text-muted-foreground">{new Date(item.createdAt).toLocaleString(language)}</small></span>
      {state.markingId === item.id && <LoaderCircle className="size-3.5 animate-spin text-primary motion-reduce:animate-none" />}
    </DropdownMenuItem>)}
  </div>
}
