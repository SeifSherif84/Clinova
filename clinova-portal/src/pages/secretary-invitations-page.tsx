import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, Check, Clock3, Inbox, LoaderCircle, MailOpen, RefreshCw, UserRound, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ConfirmationDialog from '@/components/confirmation-dialog'
import DoctorWorkspaceShell from '@/components/doctor-workspace-shell'
import Notice from '@/components/notice'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useApi } from '@/hooks/use-api'
import { getErrorMessage } from '@/lib/api'
import type { ReceivedInvitation } from '@/types/invitation'

type Decision = 'accept' | 'reject'

function statusClass(status: string) {
  const value = status.toLowerCase()
  return value === 'accepted' ? 'border-primary/20 bg-primary/10 text-primary' : value === 'rejected' ? 'border-destructive/20 bg-destructive/10 text-destructive' : 'border-warm/20 bg-warm/10 text-warm'
}

export default function SecretaryInvitationsPage() {
  const { t, i18n } = useTranslation()
  const api = useApi()
  const queryClient = useQueryClient()
  const [success, setSuccess] = useState('')
  const [confirmation, setConfirmation] = useState<{ invitationId: number; type: Decision; clinicName: string } | null>(null)

  const received = useQuery({
    queryKey: ['secretary', 'invitations', 'received'],
    queryFn: () => api.request<ReceivedInvitation[]>('/api/secretary-invitations/received', {}, { notifyOnError: false }),
  })
  const decide = useMutation({
    mutationFn: ({ invitationId, type }: { invitationId: number; type: Decision }) => api.request<string>(`/api/secretary-invitations/${type}/${invitationId}`, { method: 'POST' }, { notifyOnError: false }),
    onSuccess: async (_message, variables) => {
      setConfirmation(null)
      setSuccess(t(variables.type === 'accept' ? 'secretary.invitations.acceptSuccess' : 'invitations.rejectSuccess'))
      await queryClient.invalidateQueries({ queryKey: ['secretary'] })
    },
  })

  const formatter = useMemo(() => new Intl.DateTimeFormat(i18n.resolvedLanguage === 'ar' ? 'ar-EG' : 'en-EG', { dateStyle: 'medium', timeStyle: 'short' }), [i18n.resolvedLanguage])
  const invitations = useMemo(() => [...(received.data ?? [])].sort((a, b) => Date.parse(b.sentAt) - Date.parse(a.sentAt)), [received.data])
  const format = (value: string) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : formatter.format(date) }
  const statusLabel = (status: string) => t(status.toLowerCase() === 'accepted' ? 'invitations.statusAccepted' : status.toLowerCase() === 'rejected' ? 'invitations.statusRejected' : 'invitations.statusPending')

  return (
    <DoctorWorkspaceShell active="secretary-invitations">
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-10">
        <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-primary uppercase"><MailOpen className="size-3" />{t('invitations.eyebrow')}</Badge>
        <h1 className="mt-2 font-sans text-3xl font-bold sm:text-4xl">{t('secretary.invitations.title')}</h1>
        <p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground sm:text-sm">{t('secretary.invitations.description')}</p>

        <div className="mt-6 grid gap-4">
          {success && <Notice tone="success" message={success} />}
          {received.isLoading && <Card className="min-h-72 items-center justify-center rounded-3xl border border-border bg-card"><LoaderCircle className="size-7 animate-spin text-primary motion-reduce:animate-none" /><p className="text-xs text-muted-foreground">{t('invitations.loading')}</p></Card>}
          {received.isError && (
            <Card className="items-center rounded-3xl border border-destructive/20 bg-card p-8 text-center">
              <p className="text-sm font-bold text-destructive">{getErrorMessage(received.error)}</p>
              <Button variant="outline" className="mt-3 h-11 rounded-xl text-sm font-bold normal-case tracking-normal" onClick={() => received.refetch()}><RefreshCw />{t('invitations.retry')}</Button>
            </Card>
          )}
          {received.isSuccess && !invitations.length && (
            <section className="relative isolate grid place-items-center overflow-hidden px-4 py-20 text-center sm:py-28">
              <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 grid place-items-center [mask-image:radial-gradient(circle_at_center,black_25%,transparent_70%)]">
                <span className="absolute size-[30rem] rounded-full bg-primary/[0.06] blur-3xl" />
              </div>

              <div className="relative">
                <span className="absolute inset-0 rounded-full bg-primary/15 motion-safe:animate-pulse" />
                <span className="relative grid size-20 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 ring-8 ring-primary/10">
                  <Inbox className="size-8 motion-safe:animate-bounce [animation-duration:2.4s]" />
                </span>
                <span className="absolute -end-6 -top-3 size-3 rounded-full bg-primary/40 motion-safe:animate-pulse" />
                <span className="absolute -start-8 top-8 size-2 rounded-full bg-primary/30 motion-safe:animate-pulse [animation-delay:200ms]" />
                <span className="absolute -end-10 bottom-4 size-2.5 rounded-full bg-primary/25 motion-safe:animate-pulse [animation-delay:400ms]" />
              </div>

              <h2 className="mt-10 font-sans text-2xl font-bold sm:text-4xl">{t('invitations.emptyReceivedTitle')}</h2>
              <p className="mt-5 max-w-md text-sm leading-7 font-medium text-muted-foreground sm:text-base">{t('secretary.invitations.emptyDescription')}</p>
            </section>
          )}
          {received.isSuccess && invitations.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {invitations.map((invitation) => {
                const pending = invitation.status.toLowerCase() === 'pending'
                const busy = decide.isPending && decide.variables?.invitationId === invitation.id
                return (
                  <Card key={invitation.id} className="relative h-full rounded-2xl border border-border bg-card">
                    <Badge className={`absolute end-4 top-4 rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClass(invitation.status)}`}>{statusLabel(invitation.status)}</Badge>
                    <CardContent className="flex h-full flex-col gap-4">
                      <div className="flex items-start gap-3 pe-20">
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><UserRound className="size-5" /></span>
                        <div className="min-w-0">
                          <small className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{t('invitations.from')}</small>
                          <h2 className="line-clamp-2 font-sans text-lg font-bold leading-tight">{invitation.senderName}</h2>
                        </div>
                      </div>
                      <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-background/45">
                        <div className="flex items-center gap-3 px-3 py-2.5"><Building2 className="size-4 shrink-0 text-primary" /><div className="min-w-0"><small className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{t('invitations.clinic')}</small><strong className="block truncate text-sm font-bold">{invitation.clinicName}</strong></div></div>
                        <div className="flex items-center gap-3 px-3 py-2.5"><Clock3 className="size-4 shrink-0 text-primary" /><span className="truncate text-xs font-bold text-muted-foreground">{t('invitations.sentAt', { date: format(invitation.sentAt) })}</span></div>
                      </div>
                      {pending ? (
                        <div className="mt-auto flex flex-wrap gap-2">
                          <Button className="h-11 flex-1 rounded-xl bg-primary text-sm font-bold normal-case text-primary-foreground hover:bg-primary/90" disabled={decide.isPending} onClick={() => { decide.reset(); setSuccess(''); setConfirmation({ invitationId: invitation.id, type: 'accept', clinicName: invitation.clinicName }) }}>
                            {busy && decide.variables?.type === 'accept' ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <Check />}{t('invitations.accept')}
                          </Button>
                          <Button variant="outline" className="h-11 flex-1 rounded-xl border-destructive/20 bg-destructive/5 text-sm font-bold normal-case text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={decide.isPending} onClick={() => { decide.reset(); setSuccess(''); setConfirmation({ invitationId: invitation.id, type: 'reject', clinicName: invitation.clinicName }) }}>
                            {busy && decide.variables?.type === 'reject' ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <X />}{t('invitations.reject')}
                          </Button>
                        </div>
                      ) : invitation.respondedAt && <p className="mt-auto text-xs font-bold text-muted-foreground">{t('invitations.respondedAt', { date: format(invitation.respondedAt) })}</p>}
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
        title={t(confirmation?.type === 'accept' ? 'invitations.acceptConfirmTitle' : 'invitations.rejectConfirmTitle')}
        description={t(confirmation?.type === 'accept' ? 'secretary.invitations.acceptConfirm' : 'invitations.rejectConfirm', { clinic: confirmation?.clinicName })}
        confirmLabel={t(confirmation?.type === 'accept' ? 'invitations.accept' : 'invitations.reject')}
        cancelLabel={t('invitations.keepPending')}
        destructive={confirmation?.type === 'reject'}
        pending={decide.isPending}
        error={decide.error ? getErrorMessage(decide.error) : undefined}
        onConfirm={() => confirmation && decide.mutate(confirmation)}
        onOpenChange={(open) => { if (!open && !decide.isPending) { setConfirmation(null); decide.reset() } }}
      />
    </DoctorWorkspaceShell>
  )
}
