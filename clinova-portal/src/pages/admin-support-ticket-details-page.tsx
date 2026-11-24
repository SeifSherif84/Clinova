import { Link, useParams, useSearch } from '@tanstack/react-router'
import { Activity, ArrowLeft, Check, Copy, Headset, LifeBuoy, LoaderCircle, MessageSquareText, RefreshCw, Send, UserRound } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import AdminShell from '@/components/admin-shell'
import Notice from '@/components/notice'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminTicket, useSendAdminReply, useUpdateTicketStatus } from '@/hooks/use-admin-support-tickets'
import { useAuth } from '@/hooks/use-auth'
import { getErrorMessage } from '@/lib/api'
import { maxReplyLength, ticketStatuses, ticketStatusTone } from '@/lib/admin-support-tickets'
import type { TicketStatus } from '@/types/admin-support-ticket'

const grayButtonClass = 'h-10 rounded-xl px-4 text-[13px] font-bold normal-case tracking-normal border-transparent bg-foreground/5 text-foreground shadow-none hover:bg-foreground/10 dark:border-transparent dark:bg-foreground/5 dark:hover:bg-foreground/10'

export default function AdminSupportTicketDetailsPage() {
  const { t, i18n } = useTranslation()
  const auth = useAuth()
  const { ticketId } = useParams({ from: '/admin/support-tickets/$ticketId' })
  const search = useSearch({ from: '/admin/support-tickets/$ticketId' })
  const id = Number(ticketId)
  const ticket = useAdminTicket(id)
  const reply = useSendAdminReply(id)
  const changeStatus = useUpdateTicketStatus(id)
  const [draft, setDraft] = useState('')
  const [success, setSuccess] = useState('')
  const [actionError, setActionError] = useState('')
  const [pendingStatus, setPendingStatus] = useState<TicketStatus | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const data = ticket.data
  const messageCount = data?.messages.length ?? 0
  const statusIndex = data ? ticketStatuses.indexOf(data.status) : -1
  const [copied, setCopied] = useState(false)

  async function copyPatientId(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.resolvedLanguage === 'ar' ? 'ar-EG' : 'en-EG', { dateStyle: 'medium', timeStyle: 'short' }),
    [i18n.resolvedLanguage],
  )
  function formatDate(value: string) {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
  }

  // Keep the newest message in view when the conversation grows.
  useEffect(() => {
    const element = listRef.current
    if (element) element.scrollTop = element.scrollHeight
  }, [messageCount])

  const trimmed = draft.trim()
  const canSend = trimmed.length > 0 && draft.length <= maxReplyLength && !reply.isPending

  function send() {
    if (!canSend) return
    setSuccess('')
    setActionError('')
    reply.mutate(trimmed, {
      // The draft is only cleared once the backend confirms; a failure keeps the text.
      onSuccess: () => { setDraft(''); setSuccess(t('admin.supportTickets.replySent')) },
      onError: (error) => setActionError(getErrorMessage(error)),
    })
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    send()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      send()
    }
  }

  function updateStatus(status: TicketStatus) {
    if (!data || data.status === status || changeStatus.isPending) return
    setSuccess('')
    setActionError('')
    setPendingStatus(status)
    changeStatus.mutate(status, {
      onSuccess: () => setSuccess(t('admin.supportTickets.statusUpdated')),
      onError: (error) => setActionError(getErrorMessage(error)),
      onSettled: () => setPendingStatus(null),
    })
  }

  const backLink = (
    <Link to="/admin/support-tickets" search={search} className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition hover:text-foreground">
      <ArrowLeft className="size-4 rtl:rotate-180" />{t('admin.supportTickets.back')}
    </Link>
  )

  if (!Number.isInteger(id) || id <= 0) {
    return <AdminShell><div className="mx-auto w-full max-w-screen-2xl p-4 sm:p-6 lg:p-10">{backLink}<div className="mt-4"><Notice message={t('admin.supportTickets.invalidId')} /></div></div></AdminShell>
  }

  return (
    <AdminShell>
      <div className="mx-auto w-full min-w-0 max-w-screen-2xl p-4 sm:p-6 lg:p-10">
        {backLink}
        {success && <Notice tone="success" message={success} />}
        {actionError && <Notice message={actionError} />}

        {ticket.isLoading && (
          <div className="mt-6 grid gap-4" role="status" aria-label={t('admin.supportTickets.detailsLoading')}>
            <Skeleton className="h-10 w-64 rounded-xl motion-reduce:animate-none" />
            <Skeleton className="h-32 w-full rounded-2xl motion-reduce:animate-none" />
            <Skeleton className="h-72 w-full rounded-2xl motion-reduce:animate-none" />
          </div>
        )}

        {ticket.isError && !data && (
          <Card className="mt-6 items-center rounded-3xl border border-destructive/20 bg-card p-5 text-center sm:p-8">
            <p className="text-sm font-bold text-destructive">{getErrorMessage(ticket.error)}</p>
            <Button variant="outline" className={grayButtonClass + ' mt-3'} disabled={ticket.isFetching} onClick={() => ticket.refetch()}>
              {ticket.isFetching ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <RefreshCw />}
              {t('admin.supportTickets.retry')}
            </Button>
          </Card>
        )}

        {data && (
          <>
            <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-primary uppercase"><Headset className="size-3" />{t('admin.supportTickets.ticketNumber', { id: data.id })}</Badge>
                <h1 className="mt-2 font-sans text-2xl font-bold break-words sm:text-4xl">{data.patientName}</h1>
              </div>
              <Badge className={`h-auto rounded-full border px-3.5 py-1.5 text-xs font-bold ${ticketStatusTone(data.status)}`}>{t('admin.supportTickets.status.' + data.status, { defaultValue: data.status })}</Badge>
            </div>

            <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="grid min-w-0 gap-5">
                <section className="overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-border/60 bg-primary/[0.04] px-4 py-2.5 sm:px-5">
                    <h2 className="flex items-center gap-2 text-xs font-bold tracking-wider text-primary uppercase"><MessageSquareText className="size-4" />{t('admin.supportTickets.originalMessage')}</h2>
                    <time dateTime={data.createdAt} className="text-xs font-semibold text-muted-foreground">{formatDate(data.createdAt)}</time>
                  </div>
                  <p dir="auto" className="px-4 py-3.5 text-start text-lg leading-9 font-normal break-words whitespace-pre-line text-foreground sm:px-5">{data.originalMessage}</p>
                </section>

                <section className="min-w-0 rounded-2xl border border-border bg-card">
                  <h2 className="border-b border-border/60 px-5 py-4 text-sm font-bold">{t('admin.supportTickets.conversation')}</h2>
                  <div ref={listRef} className="grid max-h-[32rem] min-h-40 content-start gap-4 overflow-y-auto bg-muted/20 p-4 sm:gap-5 sm:p-5" aria-live="polite">
                    {data.messages.length === 0 && (
                      <div className="grid place-items-center gap-2 py-8 text-center">
                        <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary"><MessageSquareText className="size-6" /></span>
                        <p className="max-w-xs text-sm leading-6 font-semibold text-muted-foreground">{t('admin.supportTickets.noMessages')}</p>
                      </div>
                    )}
                    {data.messages.map((message) => {
                      const fromPatient = message.senderId === data.patientId
                      const mine = message.senderId === auth.user?.id
                      return (
                        <div key={message.id} className={`flex min-w-0 items-end gap-2.5 ${fromPatient ? '' : 'flex-row-reverse'}`}>
                          <span aria-hidden="true" className={`grid size-8 shrink-0 place-items-center rounded-full ${fromPatient ? 'bg-foreground/5 text-foreground' : 'bg-primary/10 text-primary'}`}>
                            {fromPatient ? <UserRound className="size-4" /> : <LifeBuoy className="size-4" />}
                          </span>
                          <div className={`flex min-w-0 max-w-[88%] flex-col gap-1 sm:max-w-[82%] ${fromPatient ? 'items-start' : 'items-end'}`}>
                            <span className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                              {fromPatient ? data.patientName : mine ? t('admin.supportTickets.you') : t('admin.supportTickets.supportTeam')}
                              <span aria-hidden="true" className="size-0.5 rounded-full bg-muted-foreground/60" />
                              <time dateTime={message.createdAt} className="font-semibold">{formatDate(message.createdAt)}</time>
                            </span>
                            <p dir="auto" className={`rounded-2xl px-3.5 py-2.5 text-start text-[15px] leading-7 font-medium break-words whitespace-pre-line sm:px-4 ${fromPatient ? 'rounded-es-md border border-border bg-card text-foreground' : 'rounded-ee-md bg-primary text-primary-foreground'}`}>{message.message}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <form onSubmit={handleSubmit} className="grid gap-2.5 border-t border-border/60 p-4 sm:p-5">
                    <label htmlFor="adminTicketReply" className="text-xs font-bold text-foreground/80">{t('admin.supportTickets.replyLabel')}</label>
                    <textarea
                      id="adminTicketReply"
                      dir="auto"
                      value={draft}
                      maxLength={maxReplyLength}
                      rows={4}
                      disabled={reply.isPending}
                      placeholder={t('admin.supportTickets.replyPlaceholder')}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={handleKeyDown}
                      className="min-h-28 w-full resize-y rounded-xl border border-input bg-background/40 p-3.5 text-start text-base leading-7 outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/10 disabled:opacity-60 sm:text-sm"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <small className={`text-[11px] font-semibold tabular-nums ${draft.length >= maxReplyLength ? 'text-destructive' : 'text-muted-foreground'}`}>{draft.length}/{maxReplyLength}</small>
                      <Button type="submit" className="h-10 w-full cursor-pointer rounded-xl px-5 text-[13px] font-bold normal-case tracking-normal sm:w-auto" disabled={!canSend}>
                        {reply.isPending ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <Send className="size-4 rtl:-scale-x-100" />}
                        {t(reply.isPending ? 'admin.supportTickets.sending' : 'admin.supportTickets.send')}
                      </Button>
                    </div>
                  </form>
                </section>
              </div>

              <aside className="grid min-w-0 gap-5 sm:max-lg:grid-cols-2 sm:max-lg:items-start">
                <section className="overflow-hidden rounded-2xl border border-border bg-card" aria-label={t('admin.supportTickets.statusTitle')}>
                  <div className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-primary/15 via-primary/[0.05] to-transparent p-3.5 dark:bg-none">
                    <span className="pointer-events-none absolute -end-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl dark:hidden" />
                    <div className="relative flex items-center gap-2.5">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10"><Activity className="size-4.5" /></span>
                      <h2 className="min-w-0 flex-1 truncate font-sans text-base font-bold normal-case tracking-normal">{t('admin.supportTickets.statusTitle')}</h2>
                    </div>
                  </div>

                  <div role="radiogroup" aria-label={t('admin.supportTickets.statusTitle')} className="grid gap-1 p-3">
                    {ticketStatuses.map((status, index) => {
                      const current = data.status === status
                      const updating = pendingStatus === status
                      const passed = statusIndex > index
                      return (
                        <div key={status} className="relative">
                          {index < ticketStatuses.length - 1 && <span aria-hidden="true" className={`absolute start-[1.625rem] top-[2.5rem] h-5 w-px ${passed ? 'bg-primary/40' : 'bg-border'}`} />}
                          <button
                            type="button"
                            role="radio"
                            aria-checked={current}
                            disabled={current || changeStatus.isPending}
                            onClick={() => updateStatus(status)}
                            className={`group flex h-12 w-full items-center gap-3 rounded-xl px-3 text-start text-[13px] font-bold transition focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none disabled:cursor-not-allowed motion-reduce:transition-none ${current ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground disabled:opacity-60 dark:hover:bg-transparent'}`}
                          >
                            <span className={`grid size-7 shrink-0 place-items-center rounded-full transition motion-reduce:transition-none ${current ? 'bg-primary text-primary-foreground ring-4 ring-primary/15' : passed ? 'bg-primary/15 text-primary' : 'border-2 border-border bg-card text-transparent group-hover:border-primary/40'}`}>
                              {updating ? <LoaderCircle className="size-3.5 animate-spin motion-reduce:animate-none" /> : current ? <span className="size-2 rounded-full bg-current" /> : passed ? <Check className="size-3.5" strokeWidth={3} /> : null}
                            </span>
                            <span className="min-w-0 flex-1 truncate">{t('admin.supportTickets.status.' + status)}</span>
                            {current && <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-bold text-primary">{t('admin.supportTickets.currentStatus', { defaultValue: 'Current' })}</span>}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-border bg-card" aria-label={t('admin.supportTickets.detailsTitle', { defaultValue: 'Ticket details' })}>
                  <div className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-primary/15 via-primary/[0.05] to-transparent p-3.5 dark:bg-none">
                    <span className="pointer-events-none absolute -end-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl dark:hidden" />
                    <div className="relative flex items-center gap-2.5">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10"><UserRound className="size-4.5" /></span>
                      <h2 className="min-w-0 flex-1 truncate font-sans text-base font-bold normal-case tracking-normal">{t('admin.supportTickets.detailsTitle', { defaultValue: 'Ticket details' })}</h2>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="min-w-0">
                      <small className="block text-xs font-semibold text-muted-foreground">{t('admin.supportTickets.patient')}</small>
                      <strong className="block text-base leading-tight font-bold break-words">{data.patientName}</strong>
                    </div>

                    <dl className="mt-4 divide-y divide-border/60 border-t border-border/60">
                      <div className="grid gap-1.5 py-3.5">
                        <dt className="text-xs font-semibold text-muted-foreground">{t('admin.supportTickets.patientId')}</dt>
                        <dd className="flex items-center gap-2">
                          <span dir="ltr" className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-muted/50 px-2.5 py-1.5 text-start font-mono text-xs font-semibold whitespace-nowrap text-foreground/80 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{data.patientId}</span>
                          <button
                            type="button"
                            aria-label={t('admin.supportTickets.copyId', { defaultValue: 'Copy patient ID' })}
                            title={t('admin.supportTickets.copyId', { defaultValue: 'Copy patient ID' })}
                            onClick={() => void copyPatientId(data.patientId)}
                            className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none motion-reduce:transition-none"
                          >
                            {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
                          </button>
                        </dd>
                      </div>
                      <div className="grid gap-1.5 py-3.5">
                        <dt className="text-xs font-semibold text-muted-foreground">{t('admin.supportTickets.category')}</dt>
                        <dd className="text-sm font-bold">{t('patientPortal.help.categories.' + data.category, { defaultValue: data.category })}</dd>
                      </div>
                      <div className="grid gap-1.5 pt-3.5">
                        <dt className="text-xs font-semibold text-muted-foreground">{t('admin.supportTickets.createdAt')}</dt>
                        <dd className="text-sm font-bold">{formatDate(data.createdAt)}</dd>
                      </div>
                    </dl>
                  </div>
                </section>
              </aside>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  )
}