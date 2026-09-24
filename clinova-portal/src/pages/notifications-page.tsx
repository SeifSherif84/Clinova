import { Link } from '@tanstack/react-router'
import { Bell, CheckCheck, LoaderCircle, MailOpen, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import DoctorWorkspaceShell from '@/components/doctor-workspace-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { useNotifications } from '@/hooks/use-notifications'
import { getErrorMessage } from '@/lib/api'

export default function NotificationsPage() {
  const auth = useAuth()
  const content = <NotificationContent />
  const isDoctor = auth.user?.roles.some((role) => role.toLowerCase() === 'doctor')

  if (isDoctor) return <DoctorWorkspaceShell active="notifications">{content}</DoctorWorkspaceShell>
  return <main className="min-h-svh bg-background text-foreground">{content}</main>
}

function NotificationContent() {
  const { t, i18n } = useTranslation()
  const state = useNotifications()

  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-10">
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
            className="h-11 rounded-xl text-sm font-bold normal-case tracking-normal"
            variant="outline"
            disabled={state.isMarkingAll}
            onClick={state.markAllAsRead}
          >
            {state.isMarkingAll
              ? <LoaderCircle className="animate-spin motion-reduce:animate-none" />
              : <CheckCheck />}
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
              className="mt-3 h-11 rounded-xl text-sm font-bold normal-case"
              variant="outline"
              onClick={state.refetch}
            >
              <RefreshCw />
              {t('notifications.retry')}
            </Button>
          </Card>
        )}

        {!state.isLoading && !state.isError && state.notifications.length === 0 && (
          <section className="relative isolate grid place-items-center overflow-hidden px-4 py-20 text-center sm:py-28">
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 grid place-items-center [mask-image:radial-gradient(circle_at_center,black_25%,transparent_70%)]">
              <span className="absolute size-[30rem] rounded-full bg-primary/[0.06] blur-3xl" />
            </div>

            <div className="relative">
              <span className="absolute inset-0 rounded-full bg-primary/20 motion-safe:animate-ping" />
              <span className="relative grid size-24 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 ring-8 ring-primary/10">
                <Bell className="size-10" />
              </span>
              <span className="absolute -end-6 -top-3 size-3 rounded-full bg-primary/40 motion-safe:animate-bounce" />
              <span className="absolute -start-8 top-8 size-2 rounded-full bg-primary/30 motion-safe:animate-pulse" />
              <span className="absolute -end-10 bottom-4 size-2.5 rounded-full bg-primary/25 motion-safe:animate-pulse" />
            </div>

            <h2 className="mt-10 font-heading text-3xl font-bold sm:text-5xl">{t('notifications.emptyTitle')}</h2>
            <span className="mt-5 h-1 w-20 rounded-full bg-gradient-to-r from-transparent via-primary to-transparent" />
            <p className="mt-5 max-w-md text-sm leading-7 font-medium text-muted-foreground sm:text-base">{t('notifications.emptyDescription')}</p>
          </section>
        )}

        {state.notifications.map((item) => (
          <NotificationRow key={item.id} item={item} language={i18n.resolvedLanguage} />
        ))}
      </div>
    </div>
  )
}

type NotificationItem = ReturnType<typeof useNotifications>['notifications'][number]

function NotificationRow({ item, language }: { item: NotificationItem; language?: string }) {
  const { t } = useTranslation()
  const state = useNotifications()
  const isInvitation = item.type.startsWith('Invitation')
  const isMarking = state.markingId === item.id

  return (
    <Card className={`grid gap-4 rounded-2xl border p-5 transition hover:border-primary/30 hover:bg-primary/[0.06] sm:grid-cols-[auto_1fr_auto] sm:items-start ${item.isRead ? 'border-border bg-card' : 'border-primary/20 bg-primary/5'}`}>
      <span className={`grid size-11 place-items-center rounded-xl ${item.isRead ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
        <Bell className="size-5" />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-sans text-lg font-bold leading-tight">{item.title}</h2>
          {!item.isRead && (
            <Badge className="rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
              {t('notifications.new')}
            </Badge>
          )}
        </div>
        <p className="mt-1 text-xs font-bold leading-6 text-muted-foreground sm:text-sm">{item.message}</p>
        <small className="mt-2 block text-[11px] font-bold text-muted-foreground">{new Date(item.createdAt).toLocaleString(language)}</small>
      </div>
      <div className="flex flex-wrap gap-2 sm:justify-end">
        {isInvitation && (
          <Button
            variant="outline"
            className="h-11 rounded-xl text-sm font-bold normal-case tracking-normal"
            render={<Link to="/doctor/invitations" />}
          >
            <MailOpen />
            {t('notifications.viewInvitation')}
          </Button>
        )}
        {!item.isRead && (
          <Button
            className="h-11 rounded-xl text-sm font-bold normal-case tracking-normal"
            disabled={isMarking}
            onClick={() => state.markAsRead(item.id)}
          >
            {isMarking
              ? <LoaderCircle className="animate-spin motion-reduce:animate-none" />
              : <CheckCheck />}
            {t('notifications.markRead')}
          </Button>
        )}
      </div>
    </Card>
  )
}
