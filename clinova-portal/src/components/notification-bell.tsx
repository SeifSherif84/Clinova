import { Link } from '@tanstack/react-router'
import { ArrowRight, Bell, CheckCheck, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNotifications } from '@/hooks/use-notifications'

export default function NotificationBell() {
  const { t, i18n } = useTranslation()
  const state = useNotifications()
  const [open, setOpen] = useState(false)

  return <DropdownMenu open={open} onOpenChange={setOpen}>
    <DropdownMenuTrigger render={<Button variant="outline" size="icon" className="relative size-10 rounded-xl border-border bg-card text-muted-foreground shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary" aria-label={t('notifications.open', { count: state.unreadCount })} />}>
      <Bell className="size-5" />
      {state.unreadCount > 0 && <span className="absolute -end-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full border-2 border-background bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">{state.unreadCount > 99 ? '99+' : state.unreadCount}</span>}
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" sideOffset={10} className="w-[min(26rem,calc(100dvw-2rem))] overflow-hidden rounded-3xl border border-border bg-card p-0 text-foreground shadow-xl" aria-label={t('notifications.title')}>
      <DropdownMenuGroup>
        <DropdownMenuLabel className="flex items-center gap-3 border-b border-border bg-gradient-to-b from-primary/5 to-transparent p-4 normal-case tracking-normal">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Bell className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block text-base font-bold leading-tight text-foreground">{t('notifications.title')}</strong>
            <span className="mt-0.5 block text-xs font-medium text-muted-foreground">{t('notifications.unreadCount', { count: state.unreadCount })}</span>
          </span>
          {state.unreadCount > 0 && (
            <button
              type="button"
              disabled={state.isMarkingAll}
              onClick={state.markAllAsRead}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1.5 text-[11px] font-bold text-primary outline-none transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-60"
            >
              {state.isMarkingAll ? <LoaderCircle className="size-3.5 animate-spin motion-reduce:animate-none" /> : <CheckCheck className="size-3.5" />}
              {t('notifications.markAllRead')}
            </button>
          )}
        </DropdownMenuLabel>
      </DropdownMenuGroup>
      <NotificationPreview state={state} language={i18n.resolvedLanguage} />
      <DropdownMenuItem className="group m-0 justify-center gap-2 rounded-none border-t border-border bg-muted/30 p-3.5 text-center text-sm font-bold normal-case tracking-normal text-primary" render={<Link to="/notifications" />}>
        {t('notifications.viewAll')}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
}

type NotificationState = ReturnType<typeof useNotifications>

function NotificationPreview({ state, language }: { state: NotificationState; language?: string }) {
  const { t } = useTranslation()

  if (state.isLoading) return <div className="grid min-h-28 place-items-center"><LoaderCircle className="animate-spin text-primary motion-reduce:animate-none" /></div>
  if (state.notifications.length === 0) return <div className="grid place-items-center gap-3 p-8 text-center">
    <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Bell className="size-7" /></span>
    <p className="max-w-64 text-xs font-medium leading-6 text-muted-foreground">{t('notifications.emptyDescription')}</p>
  </div>

  return <div className="grid max-h-96 gap-1.5 overflow-y-auto p-2.5">
    {state.notifications.slice(0, 5).map((item) => {
      return <DropdownMenuItem key={item.id} className={`relative items-start gap-3 overflow-hidden rounded-2xl border p-3 ps-4 text-start normal-case tracking-normal hover:bg-primary/[0.07]! focus:bg-primary/[0.07]! data-highlighted:bg-primary/[0.07]! ${item.isRead ? 'border-transparent' : 'border-primary/15 bg-primary/5'}`} onClick={() => !item.isRead && state.markAsRead(item.id)}>
        <span className="min-w-0 flex-1">
          <strong className="block truncate pe-14 text-sm font-bold text-foreground">{item.title}</strong>
          <span className={`mt-0.5 line-clamp-2 block text-xs font-bold leading-5 ${item.isRead ? 'text-muted-foreground' : 'text-foreground/80'}`}>{item.message}</span>
          <small className="mt-1.5 block text-[11px] font-bold text-muted-foreground/80">{new Date(item.createdAt).toLocaleString(language)}</small>
        </span>
        {!item.isRead && <span className="absolute end-3 top-3 rounded-full border border-primary/15 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-primary uppercase">{t('notifications.new')}</span>}
        {state.markingId === item.id && <LoaderCircle className="absolute end-3 bottom-3 size-3.5 animate-spin text-primary motion-reduce:animate-none" />}
      </DropdownMenuItem>
    })}
  </div>
}