import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, Check, Clock3, Inbox, LoaderCircle, MailOpen, RefreshCw, Send, UserRound, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import DoctorWorkspaceShell from '@/components/doctor-workspace-shell'
import Notice from '@/components/notice'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useApi } from '@/hooks/use-api'
import { getErrorMessage } from '@/lib/api'
import type { InvitationAction, ReceivedInvitation, SentInvitation } from '@/types/invitation'
import ConfirmationDialog from '@/components/confirmation-dialog'

type InvitationView = 'received' | 'sent'

function isPending(status: string) {
  return status.toLowerCase() === 'pending'
}

function statusKey(status: string) {
  switch (status.toLowerCase()) {
    case 'accepted':
      return 'invitations.statusAccepted' as const
    case 'rejected':
      return 'invitations.statusRejected' as const
    default:
      return 'invitations.statusPending' as const
  }
}

function statusClass(status: string) {
  switch (status.toLowerCase()) {
    case 'accepted':
      return 'border-primary/20 bg-primary/10 text-primary'
    case 'rejected':
      return 'border-destructive/20 bg-destructive/10 text-destructive'
    default:
      return 'border-border bg-muted text-muted-foreground'
  }
}

export default function DoctorInvitationsPage() {
  const { t, i18n } = useTranslation()
  const api = useApi()
  const queryClient = useQueryClient()
  const [view, setView] = useState<InvitationView>('received')
  const [success, setSuccess] = useState('')
  const [confirmation, setConfirmation] = useState<{ invitationId: number; type: InvitationAction } | null>(null)

  const received = useQuery({
    queryKey: ['doctor', 'invitations', 'received'],
    queryFn: () => api.request<ReceivedInvitation[]>('/api/invitations/received', {}, { notifyOnError: false }),
  })
  const sent = useQuery({
    queryKey: ['doctor', 'invitations', 'sent'],
    queryFn: () => api.request<SentInvitation[]>('/api/invitations/sent', {}, { notifyOnError: false }),
  })

  const action = useMutation({
    mutationFn: ({ invitationId, type }: { invitationId: number; type: InvitationAction }) =>
      api.request<string>(`/api/invitations/${type}/${invitationId}`, { method: 'POST' }, { notifyOnError: false }),
    onMutate: () => {
      setSuccess('')
    },
    onSuccess: async (_message, variables) => {
      setConfirmation(null)
      const messageKey = variables.type === 'accept'
        ? 'invitations.acceptSuccess'
        : variables.type === 'reject'
          ? 'invitations.rejectSuccess'
          : 'invitations.cancelSuccess'
      setSuccess(t(messageKey))
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['doctor', 'invitations'] }),
        variables.type === 'accept'
          ? queryClient.invalidateQueries({ queryKey: ['doctor', 'clinics'] })
          : Promise.resolve(),
      ])
    },
  })

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.resolvedLanguage === 'ar' ? 'ar-EG' : 'en-EG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }),
    [i18n.resolvedLanguage],
  )

  const activeQuery = view === 'received' ? received : sent
  const invitations = useMemo(
    () => [...(activeQuery.data ?? [])].sort((a, b) => Date.parse(b.sentAt) - Date.parse(a.sentAt)),
    [activeQuery.data],
  )
  const confirmationCopy = confirmation?.type === 'accept'
    ? { title: t('invitations.acceptConfirmTitle'), description: t('invitations.acceptConfirm'), label: t('invitations.accept') }
    : confirmation?.type === 'reject'
      ? { title: t('invitations.rejectConfirmTitle'), description: t('invitations.rejectConfirm'), label: t('invitations.reject') }
      : { title: t('invitations.cancelConfirmTitle'), description: t('invitations.cancelConfirm'), label: t('invitations.cancel') }

  function formatDate(value: string) {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
  }

  function runAction(invitationId: number, type: InvitationAction) {
    setSuccess('')
    action.reset()
    setConfirmation({ invitationId, type })
  }

  function isActingOn(invitationId: number, type: InvitationAction) {
    return action.isPending
      && action.variables?.invitationId === invitationId
      && action.variables.type === type
  }

  return (
    <DoctorWorkspaceShell active="invitations">
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-primary uppercase">
              <MailOpen className="size-3" />
              {t('invitations.eyebrow')}
            </Badge>
            <h1 className="mt-2 font-sans text-3xl font-bold sm:text-4xl">{t('invitations.title')}</h1>
            <p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground sm:text-sm">{t('invitations.description')}</p>
          </div>
<div className="flex items-center gap-2 rounded-full border border-border bg-card/70 p-2" role="group" aria-label={t('invitations.viewLabel')}>
  <Button
    type="button"
    variant={view === 'received' ? 'default' : 'ghost'}
    className="h-11 rounded-full px-5 text-sm font-bold normal-case tracking-normal cursor-pointer"
    aria-pressed={view === 'received'}
    onClick={() => {
      setView('received')
      setSuccess('')
      action.reset()
    }}
  >
<Inbox />
{t('invitations.received')}
<Badge className={view === 'received' ? 'rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs text-primary-foreground' : 'rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'}>{received.data?.length ?? 0}</Badge>
  </Button>
  <Button
    type="button"
    variant={view === 'sent' ? 'default' : 'ghost'}
    className="h-11 rounded-full px-5 text-sm font-bold normal-case tracking-normal cursor-pointer"
    aria-pressed={view === 'sent'}
    onClick={() => {
      setView('sent')
      setSuccess('')
      action.reset()
    }}
  >
<Send />
{t('invitations.sent')}
<Badge className={view === 'sent' ? 'rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs text-primary-foreground' : 'rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'}>{sent.data?.length ?? 0}</Badge>
  </Button>
</div>
        </div>

        <div className="mt-6 grid gap-4">
          {success && <Notice tone="success" message={success} />}
          {action.error && <Notice message={getErrorMessage(action.error)} />}

          {activeQuery.isLoading && (
            <Card className="min-h-72 items-center justify-center rounded-3xl border border-border bg-card">
              <LoaderCircle className="size-7 animate-spin text-primary motion-reduce:animate-none" />
              <p className="text-xs text-muted-foreground">{t('invitations.loading')}</p>
            </Card>
          )}

          {activeQuery.isError && (
            <Card className="items-center rounded-3xl border border-destructive/20 bg-card p-8 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
                <X className="size-6" />
              </span>
              <p className="mt-4 text-sm font-bold text-destructive">{getErrorMessage(activeQuery.error)}</p>
              <Button className="mt-3 h-11 rounded-xl text-sm font-bold normal-case tracking-normal cursor-pointer" variant="outline" onClick={() => activeQuery.refetch()}>
                <RefreshCw />
                {t('invitations.retry')}
              </Button>
            </Card>
          )}

{activeQuery.isSuccess && invitations.length === 0 && (
  <Card className="items-center rounded-3xl border border-dashed border-primary/25 bg-gradient-to-br from-primary/5 via-card to-warm/5 p-10 text-center sm:p-16">
    <div className="relative grid place-items-center">
      <span className="absolute size-24 animate-ping rounded-full bg-primary/10 motion-reduce:animate-none" />
      <span className="relative grid size-20 place-items-center rounded-3xl bg-primary/10 text-primary shadow-inner">
        {view === 'received' ? <Inbox className="size-9" /> : <Send className="size-9" />}
      </span>
    </div>
    <h2 className="mt-6 font-heading text-2xl font-bold sm:text-3xl">
      {t(view === 'received' ? 'invitations.emptyReceivedTitle' : 'invitations.emptySentTitle')}
    </h2>
    <p className="mt-2 max-w-lg text-xs leading-6 text-muted-foreground sm:text-sm">
      {t(view === 'received' ? 'invitations.emptyReceivedDescription' : 'invitations.emptySentDescription')}
    </p>
  </Card>
)}

          {activeQuery.isSuccess && invitations.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {invitations.map((invitation) => {
                const personName = view === 'received'
                  ? (invitation as ReceivedInvitation).senderName
                  : (invitation as SentInvitation).receiverName

                return (
<Card key={invitation.id} className="h-full rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
  <CardContent className="flex h-full flex-col gap-4">
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <UserRound className="size-6" />
        </span>
        <div className="min-w-0">
          <small className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
            {t(view === 'received' ? 'invitations.from' : 'invitations.to')}
          </small>
          <h2 className="truncate font-sans text-lg font-bold leading-tight">{personName}</h2>
        </div>
      </div>
      <Badge className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClass(invitation.status)}`}>
        {t(statusKey(invitation.status))}
      </Badge>
    </div>

    <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-muted/30">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <Building2 className="size-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <small className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{t('invitations.clinic')}</small>
          <strong className="block truncate text-sm font-bold">{invitation.clinicName}</strong>
        </div>
      </div>
      <div className="flex items-center gap-3 px-3 py-2.5">
        <Clock3 className="size-4 shrink-0 text-primary" />
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-muted-foreground">
          {t('invitations.sentAt', { date: formatDate(invitation.sentAt) })}
        </span>
      </div>
    </div>

    <div className="mt-auto">
      {isPending(invitation.status) ? (
        <div className="flex flex-wrap gap-2">
          {view === 'received' ? (
            <>
              <Button
                className="h-10 flex-1 gap-1.5 rounded-xl bg-primary text-sm font-semibold normal-case tracking-normal text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.98] cursor-pointer"
                disabled={action.isPending}
                onClick={() => runAction(invitation.id, 'accept')}
              >
                {isActingOn(invitation.id, 'accept') ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <Check className="size-4" />}
                {t('invitations.accept')}
              </Button>
              <Button
                variant="destructive"
                className="h-10 flex-1 gap-1.5 rounded-xl border border-destructive/20 bg-destructive/10 text-sm font-semibold normal-case tracking-normal text-destructive shadow-none transition-all hover:bg-destructive/15 hover:text-destructive active:scale-[0.98] cursor-pointer"
                disabled={action.isPending}
                onClick={() => runAction(invitation.id, 'reject')}
              >
                {isActingOn(invitation.id, 'reject') ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <X className="size-4" />}
                {t('invitations.reject')}
              </Button>
            </>
          ) : (
            <Button
              variant="destructive"
              className="h-10 w-full gap-1.5 rounded-xl border border-destructive/20 bg-destructive/10 text-sm font-semibold normal-case tracking-normal text-destructive shadow-none transition-all hover:bg-destructive/15 hover:text-destructive active:scale-[0.98] cursor-pointer"
              disabled={action.isPending}
              onClick={() => runAction(invitation.id, 'cancel')}
            >
              {isActingOn(invitation.id, 'cancel') ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <X className="size-4" />}
              {t('invitations.cancel')}
            </Button>
          )}
        </div>
      ) : invitation.respondedAt && (
        <div className={`flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold ${invitation.status.toLowerCase() === 'rejected' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
          {invitation.status.toLowerCase() === 'rejected' ? <X className="size-4 shrink-0" /> : <Check className="size-4 shrink-0" />}
          <span className="truncate">{t('invitations.respondedAt', { date: formatDate(invitation.respondedAt) })}</span>
        </div>
      )}
    </div>
  </CardContent>
</Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <ConfirmationDialog
        open={Boolean(confirmation)}
        title={confirmationCopy.title}
        description={confirmationCopy.description}
        confirmLabel={confirmationCopy.label}
        cancelLabel={t('invitations.keepPending')}
        destructive={confirmation?.type !== 'accept'}
        pending={action.isPending}
        error={action.error ? getErrorMessage(action.error) : undefined}
        onConfirm={() => confirmation && action.mutate(confirmation)}
        onOpenChange={(open) => {
          if (!open && !action.isPending) {
            setConfirmation(null)
            action.reset()
          }
        }}
      />
    </DoctorWorkspaceShell>
  )
}
