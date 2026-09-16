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
      return 'border-warm/20 bg-warm/10 text-warm'
  }
}

export default function DoctorInvitationsPage() {
  const { t, i18n } = useTranslation()
  const api = useApi()
  const queryClient = useQueryClient()
  const [view, setView] = useState<InvitationView>('received')
  const [success, setSuccess] = useState('')

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

  function formatDate(value: string) {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
  }

  function runAction(invitationId: number, type: InvitationAction) {
    if (type === 'reject' && !window.confirm(t('invitations.rejectConfirm'))) return
    if (type === 'cancel' && !window.confirm(t('invitations.cancelConfirm'))) return
    action.mutate({ invitationId, type })
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
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-card/70 p-1.5 shadow-sm" role="group" aria-label={t('invitations.viewLabel')}>
            <Button
              type="button"
              variant={view === 'received' ? 'default' : 'ghost'}
              className="h-10 rounded-xl px-4 normal-case tracking-normal"
              aria-pressed={view === 'received'}
              onClick={() => {
                setView('received')
                setSuccess('')
                action.reset()
              }}
            >
              <Inbox />
              {t('invitations.received')}
              <Badge className={view === 'received' ? 'text-primary-foreground/80' : 'text-muted-foreground'}>{received.data?.length ?? 0}</Badge>
            </Button>
            <Button
              type="button"
              variant={view === 'sent' ? 'default' : 'ghost'}
              className="h-10 rounded-xl px-4 normal-case tracking-normal"
              aria-pressed={view === 'sent'}
              onClick={() => {
                setView('sent')
                setSuccess('')
                action.reset()
              }}
            >
              <Send />
              {t('invitations.sent')}
              <Badge className={view === 'sent' ? 'text-primary-foreground/80' : 'text-muted-foreground'}>{sent.data?.length ?? 0}</Badge>
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {success && <Notice tone="success" message={success} />}
          {action.error && <Notice message={getErrorMessage(action.error)} />}

          {activeQuery.isLoading && (
            <Card className="min-h-72 items-center justify-center rounded-3xl border border-border bg-card">
              <LoaderCircle className="size-7 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">{t('invitations.loading')}</p>
            </Card>
          )}

          {activeQuery.isError && (
            <Card className="items-center rounded-3xl border border-destructive/20 bg-card p-8 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
                <X className="size-6" />
              </span>
              <p className="mt-4 text-sm font-semibold text-destructive">{getErrorMessage(activeQuery.error)}</p>
              <Button className="mt-3 rounded-xl normal-case tracking-normal" variant="outline" onClick={() => activeQuery.refetch()}>
                <RefreshCw />
                {t('invitations.retry')}
              </Button>
            </Card>
          )}

          {activeQuery.isSuccess && invitations.length === 0 && (
            <Card className="items-center rounded-3xl border border-dashed border-primary/25 bg-gradient-to-br from-primary/5 via-card to-warm/5 p-10 text-center sm:p-16">
              <span className="grid size-20 place-items-center rounded-3xl bg-primary/10 text-primary shadow-inner">
                {view === 'received' ? <Inbox className="size-9" /> : <Send className="size-9" />}
              </span>
              <h2 className="mt-6 font-heading text-2xl font-bold sm:text-3xl">
                {t(view === 'received' ? 'invitations.emptyReceivedTitle' : 'invitations.emptySentTitle')}
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
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
                  <Card key={invitation.id} className="rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
                    <CardContent className="grid h-full gap-5">
                      <div className="flex items-start justify-between gap-3">
                        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                          {view === 'received' ? <Inbox className="size-6" /> : <Send className="size-6" />}
                        </span>
                        <Badge className={`rounded-full border px-2.5 py-1 text-[10px] ${statusClass(invitation.status)}`}>
                          {t(statusKey(invitation.status))}
                        </Badge>
                      </div>

                      <div className="grid gap-3">
                        <div>
                          <small className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                            {t(view === 'received' ? 'invitations.from' : 'invitations.to')}
                          </small>
                          <strong className="mt-1 flex items-center gap-2 text-base">
                            <UserRound className="size-4 text-primary" />
                            {personName}
                          </strong>
                        </div>
                        <div className="rounded-xl bg-background/45 p-3">
                          <small className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">{t('invitations.clinic')}</small>
                          <strong className="mt-1 flex items-center gap-2 text-sm">
                            <Building2 className="size-4 text-primary" />
                            {invitation.clinicName}
                          </strong>
                        </div>
                        <div className="grid gap-1.5 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-2">
                            <Clock3 className="size-3.5 text-primary" />
                            {t('invitations.sentAt', { date: formatDate(invitation.sentAt) })}
                          </span>
                          {invitation.respondedAt && (
                            <span className="flex items-center gap-2">
                              <Check className="size-3.5 text-primary" />
                              {t('invitations.respondedAt', { date: formatDate(invitation.respondedAt) })}
                            </span>
                          )}
                        </div>
                      </div>

                      {isPending(invitation.status) && (
                        <div className="mt-auto flex flex-wrap gap-2 border-t border-border/50 pt-4">
                          {view === 'received' ? (
                            <>
                              <Button
                                className="h-10 flex-1 rounded-xl normal-case tracking-normal"
                                disabled={action.isPending}
                                onClick={() => runAction(invitation.id, 'accept')}
                              >
                                {isActingOn(invitation.id, 'accept') ? <LoaderCircle className="animate-spin" /> : <Check />}
                                {t('invitations.accept')}
                              </Button>
                              <Button
                                variant="destructive"
                                className="h-10 flex-1 rounded-xl border border-destructive/20 normal-case tracking-normal"
                                disabled={action.isPending}
                                onClick={() => runAction(invitation.id, 'reject')}
                              >
                                {isActingOn(invitation.id, 'reject') ? <LoaderCircle className="animate-spin" /> : <X />}
                                {t('invitations.reject')}
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="destructive"
                              className="h-10 w-full rounded-xl border border-destructive/20 normal-case tracking-normal"
                              disabled={action.isPending}
                              onClick={() => runAction(invitation.id, 'cancel')}
                            >
                              {isActingOn(invitation.id, 'cancel') ? <LoaderCircle className="animate-spin" /> : <X />}
                              {t('invitations.cancel')}
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </DoctorWorkspaceShell>
  )
}
