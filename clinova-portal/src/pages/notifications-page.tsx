import { Link } from '@tanstack/react-router'
import { Bell, CheckCheck, CircleCheck, CircleX, LoaderCircle, LogOut, MailOpen, RefreshCw, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import DoctorWorkspaceShell from '@/components/doctor-workspace-shell'
import PatientShell from '@/components/patient-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { useNotifications } from '@/hooks/use-notifications'
import { getErrorMessage } from '@/lib/api'

export default function NotificationsPage() {
  const auth = useAuth()
  const content = <NotificationContent />
  // Clinic staff get the shared workspace shell; it renders the sidebar for their role.
  const isStaff = auth.user?.roles.some((role) => ['doctor', 'secretary'].includes(role.toLowerCase()))

  if (isStaff) return <DoctorWorkspaceShell active="notifications">{content}</DoctorWorkspaceShell>
  return <PatientShell hideFooter>{content}</PatientShell>
}

function NotificationContent() {
  const { t, i18n } = useTranslation()
  const state = useNotifications()

  return (
    <div className="mx-auto w-full min-w-0 max-w-screen-2xl p-4 sm:p-6 lg:p-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-primary uppercase">
            <Bell className="size-3" />
            {t('notifications.eyebrow')}
          </Badge>
          <h1 className="mt-2 font-sans text-3xl font-bold sm:text-4xl">{t('notifications.title')}</h1>
          <p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground sm:text-sm">{t('notifications.description')}</p>
        </div>
        {state.unreadCount > 0 && (
          <Button
            className="h-10 w-full cursor-pointer rounded-xl bg-foreground/5 px-4 text-[13px] font-bold normal-case tracking-normal hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-primary/30 sm:w-fit"
            variant="ghost"
            disabled={state.isMarkingAll}
            onClick={state.markAllAsRead}
          >
            {state.isMarkingAll
              ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
              : <CheckCheck className="size-4" />}
            {t('notifications.markAllRead')}
          </Button>
        )}
      </div>

      <div className="mt-6 grid gap-4">
        {state.isLoading && (
          <Card className="min-h-72 items-center justify-center rounded-3xl border border-border bg-card">
            <LoaderCircle className="size-7 animate-spin text-primary motion-reduce:animate-none" />
            <p className="text-xs text-muted-foreground">{t('notifications.loading')}</p>
          </Card>
        )}

        {state.isError && (
          <Card className="items-center rounded-3xl border border-destructive/20 bg-card p-8 text-center">
            <p className="text-sm font-bold text-destructive">{getErrorMessage(state.error)}</p>
            <Button
              className="mt-3 h-10 w-fit cursor-pointer rounded-xl bg-foreground/5 px-4 text-[13px] font-bold normal-case tracking-normal hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-primary/30"
              variant="ghost"
              onClick={state.refetch}
            >
              <RefreshCw className="size-4" />
              {t('notifications.retry')}
            </Button>
          </Card>
        )}

        {!state.isLoading && !state.isError && state.notifications.length === 0 && (
          <section className="relative isolate grid place-items-center overflow-hidden px-4 py-14 text-center sm:py-28">

            <div className="relative">
              <span className="absolute inset-0 rounded-full bg-primary/15 motion-safe:animate-pulse" />
              <span className="relative grid size-20 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 ring-8 ring-primary/10">
                <Bell className="size-8 motion-safe:animate-bounce [animation-duration:2.4s]" />
              </span>
              <span className="absolute -end-6 -top-3 size-3 rounded-full bg-primary/40 motion-safe:animate-pulse" />
              <span className="absolute -start-8 top-8 size-2 rounded-full bg-primary/30 motion-safe:animate-pulse [animation-delay:200ms]" />
              <span className="absolute -end-10 bottom-4 size-2.5 rounded-full bg-primary/25 motion-safe:animate-pulse [animation-delay:400ms]" />
            </div>

            <h2 className="mt-8 font-sans text-2xl font-bold sm:mt-10 sm:text-4xl">{t('notifications.emptyTitle')}</h2>
            <p className="mt-4 max-w-md text-sm leading-7 font-medium text-muted-foreground sm:mt-5 sm:text-base">{t('notifications.emptyDescription')}</p>
          </section>
        )}

        {state.notifications.length > 0 && (
          <ul className="grid gap-3" aria-label={t('notifications.title')}>
            {state.notifications.map((item) => (
              <li key={item.id}>
                <NotificationRow item={item} language={i18n.resolvedLanguage} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

type NotificationItem = ReturnType<typeof useNotifications>['notifications'][number]

// Visual meaning per notification type. Falls back to a neutral bell for unknown types.
function notificationStyle(type: string): { icon: LucideIcon; tile: string } {
  const value = type.toLowerCase()
  if (value.includes('accept')) return { icon: CircleCheck, tile: 'bg-primary/10 text-primary' }
  if (value.includes('reject') || value.includes('declin')) return { icon: CircleX, tile: 'bg-destructive/10 text-destructive' }
  if (value.includes('left') || value.includes('remov')) return { icon: LogOut, tile: 'bg-warm/10 text-warm' }
  if (value.includes('invitation')) return { icon: MailOpen, tile: 'bg-primary/10 text-primary' }
  return { icon: Bell, tile: 'bg-muted text-muted-foreground' }
}

function relativeTime(value: string, language?: string) {
  const diff = (new Date(value).getTime() - Date.now()) / 1000
  const formatter = new Intl.RelativeTimeFormat(language, { numeric: 'auto' })
  const units: [Intl.RelativeTimeFormatUnit, number][] = [['day', 86400], ['hour', 3600], ['minute', 60]]
  for (const [unit, seconds] of units) {
    if (Math.abs(diff) >= seconds) return formatter.format(Math.round(diff / seconds), unit)
  }
  return formatter.format(0, 'second')
}

function NotificationRow({ item, language }: { item: NotificationItem; language?: string }) {
  const { t } = useTranslation()
  const state = useNotifications()
  const isInvitation = item.type.startsWith('Invitation')
  const isMarking = state.markingId === item.id
  const { icon: Icon, tile } = notificationStyle(item.type)
  const created = new Date(item.createdAt)

  return (
    <article
      aria-label={item.title}
      className={`group relative grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-3 overflow-hidden rounded-2xl border p-4 transition-colors motion-reduce:transition-none sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-4 sm:p-5 ${item.isRead ? 'border-border bg-card hover:bg-muted/30' : 'border-primary/20 bg-primary/[0.04] hover:bg-primary/[0.07]'}`}
    >

      <span aria-hidden="true" className={`grid size-10 shrink-0 place-items-center rounded-xl sm:size-11 ${tile}`}>
        <Icon className="size-5" />
      </span>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <h2 className={`font-sans text-base leading-tight ${item.isRead ? 'font-semibold text-foreground/80' : 'font-bold text-foreground'}`}>{item.title}</h2>
          {!item.isRead && (
            <Badge className="rounded-full border border-primary/15 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              {t('notifications.new')}
            </Badge>
          )}
        </div>
        <p className="mt-1 text-sm leading-6 font-medium text-muted-foreground">{item.message}</p>
        <time dateTime={created.toISOString()} title={created.toLocaleString(language)} className="mt-1.5 block text-xs font-semibold text-muted-foreground/80">
          {relativeTime(item.createdAt, language)}
        </time>
      </div>

      {(isInvitation || !item.isRead) && (
        <div className="col-span-2 grid grid-cols-2 gap-2 sm:col-span-1 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
          {isInvitation && (
            <Button
              variant="ghost"
              className="h-10 w-full cursor-pointer rounded-xl bg-foreground/5 px-4 text-[13px] font-bold normal-case tracking-normal hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-primary/30 sm:w-fit"
              render={<Link to="/doctor/invitations" />}
            >
              <MailOpen className="size-4" />
              {t('notifications.viewInvitation')}
            </Button>
          )}
          {!item.isRead && (
            <Button
              className="h-10 w-full cursor-pointer rounded-xl bg-primary px-4 text-[13px] font-bold normal-case tracking-normal text-primary-foreground hover:bg-primary/90 sm:w-fit"
              disabled={isMarking}
              onClick={() => state.markAsRead(item.id)}
            >
              {isMarking
                ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
                : <CheckCheck className="size-4" />}
              {t('notifications.markRead')}
            </Button>
          )}
        </div>
      )}
    </article>
  )
}