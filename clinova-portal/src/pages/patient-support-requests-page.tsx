import { Link } from '@tanstack/react-router'
import { ArrowLeft, House, Inbox, LifeBuoy, LoaderCircle, MessageCircle, MessagesSquare, RefreshCw, Send, UserRound } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import Notice from '@/components/notice'
import PatientShell from '@/components/patient-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { useMyTickets, useSendTicketMessage, useSupportCategories } from '@/hooks/use-support-tickets'
import { getErrorMessage } from '@/lib/api'
import { humanize, parseUtc } from '@/lib/patient-appointments'
import type { PatientSupportTicket } from '@/types/support-ticket'

type Tr = (key: string, defaultValue: string, options?: Record<string, string | number>) => string

const grayButton = 'h-10 cursor-pointer rounded-xl bg-foreground/5 px-4 text-[13px] font-bold normal-case tracking-normal text-foreground hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-primary/30'
const statusById: Record<number, string> = { 1: 'Open', 2: 'InProgress', 3: 'Resolved' }
const statusStyle: Record<string, string> = {
  Open: 'border-warm/25 bg-warm/10 text-warm',
  InProgress: 'border-primary/20 bg-primary/10 text-primary',
  Resolved: 'border-border bg-muted text-muted-foreground',
}
const normStatus = (value: string | number) => typeof value === 'number' ? statusById[value] ?? 'Open' : value

function StatusPill({ status, label }: { status: string; label: string }) {
  return <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusStyle[status] ?? statusStyle.Resolved}`}>{label}</span>
}

function Bubble({ mine, text, time, label }: { mine: boolean; text: string; time: string; label: string }) {
  return <div className={`flex items-end gap-2.5 ${mine ? 'flex-row-reverse' : ''}`}>
    <span aria-hidden="true" className={`grid size-8 shrink-0 place-items-center rounded-full ${mine ? 'bg-primary/10 text-primary' : 'bg-foreground/5 text-foreground'}`}>
      {mine ? <UserRound className="size-4" /> : <LifeBuoy className="size-4" />}
    </span>
    <div className={`flex min-w-0 max-w-[82%] flex-col gap-1 ${mine ? 'items-end' : 'items-start'}`}>
      <span className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
        {label}
        <span aria-hidden="true" className="size-0.5 rounded-full bg-muted-foreground/60" />
        <time className="font-semibold">{time}</time>
      </span>
      <p className={`rounded-2xl px-4 py-2.5 text-[15px] leading-7 font-medium break-words whitespace-pre-wrap ${mine ? 'rounded-ee-md bg-primary text-primary-foreground' : 'rounded-es-md border border-border bg-card text-foreground'}`}>{text}</p>
    </div>
  </div>
}

function Conversation({ ticket, myId, h, categoryLabel, statusLabel, stamp, onBack }: {
  ticket: PatientSupportTicket
  myId?: string
  h: Tr
  categoryLabel: string
  statusLabel: string
  stamp: (value: string) => string
  onBack: () => void
}) {
  const send = useSendTicketMessage(ticket.id)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const status = normStatus(ticket.status)
  const resolved = status === 'Resolved'

  // Keep the newest message in view when the conversation opens or grows.
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight }) }, [ticket.id, ticket.messages.length])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (send.isPending) return
    const text = draft.trim()
    if (!text) return setError(h('replyRequired', 'Write a message first.'))
    if (text.length > 3000) return setError(h('messageLong', 'Your message can’t be longer than {{count}} characters.', { count: 3000 }))
    setError(''); setSent(false)
    send.mutate(text, { onSuccess: () => { setDraft(''); setSent(true) } })
  }

  return <section aria-label={h('requestNumber', 'Request #{{id}}', { id: ticket.id })} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:sticky lg:top-28">
    <header className="grid gap-3 border-b border-border/60 p-4 sm:px-5">
      <button type="button" onClick={onBack} className="inline-flex w-fit cursor-pointer items-center gap-1.5 text-sm font-bold text-muted-foreground transition hover:text-foreground lg:hidden"><ArrowLeft className="size-4 rtl:rotate-180" />{h('backToRequests', 'Back to requests')}</button>
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10"><LifeBuoy className="size-5" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-sans text-base font-bold">{h('requestNumber', 'Request #{{id}}', { id: ticket.id })}</h2>
          <p className="mt-0.5 truncate text-xs font-semibold text-muted-foreground">{categoryLabel} · {stamp(ticket.createdAt)}</p>
        </div>
        <StatusPill status={status} label={statusLabel} />
      </div>
    </header>

    <div ref={box} className="grid max-h-[30rem] min-h-64 content-start gap-5 overflow-y-auto bg-muted/20 p-4 sm:p-5 lg:max-h-[calc(100dvh-30rem)]">
      <Bubble mine text={ticket.originalMessage} time={stamp(ticket.createdAt)} label={h('you', 'You')} />
      {ticket.messages.map((item) => <Bubble key={item.id} mine={item.senderId === myId} text={item.message} time={stamp(item.createdAt)} label={item.senderId === myId ? h('you', 'You') : h('supportTeam', 'Support team')} />)}
    </div>

    <form onSubmit={submit} className="grid gap-2.5 border-t border-border/60 bg-card p-4 sm:p-5">
      {resolved && <p className="rounded-xl bg-muted/50 px-3 py-2 text-[13px] leading-6 font-semibold text-muted-foreground">{h('reopenNote', 'This request is resolved. Sending a message will reopen it.')}</p>}
      {(error || send.error) && <Notice message={error || getErrorMessage(send.error)} />}
      {sent && <Notice tone="success" message={h('messageSent', 'Your message was sent.')} />}
      <textarea value={draft} rows={3} maxLength={3000} disabled={send.isPending} aria-label={h('replyLabel', 'Your reply')} placeholder={h('replyPlaceholder', 'Write a message…')} onChange={(event) => { setDraft(event.target.value); setError(''); setSent(false) }} className="w-full resize-none rounded-xl border border-input bg-background/40 px-3 py-2.5 text-base leading-7 font-medium outline-none transition placeholder:text-sm placeholder:font-medium focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/10 disabled:opacity-60" />
      <div className="flex items-center justify-between gap-3">
        <span dir="ltr" className="text-[13px] font-semibold tabular-nums text-muted-foreground">{draft.length}/3000</span>
        <Button type="submit" className="h-10 w-fit cursor-pointer rounded-xl bg-primary px-4 text-[13px] font-bold normal-case tracking-normal text-primary-foreground hover:bg-primary/90" disabled={send.isPending}>
          {send.isPending ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <Send className="size-4 rtl:-scale-x-100" />}
          {h('send', 'Send message')}
        </Button>
      </div>
    </form>
  </section>
}

export default function PatientSupportRequestsPage() {
  const { t, i18n } = useTranslation()
  const auth = useAuth()
  const h: Tr = (key, defaultValue, options) => t('patientPortal.help.' + key, { defaultValue, ...options })
  const s: Tr = (key, defaultValue, options) => t('patientPortal.supportRequests.' + key, { defaultValue, ...options })
  const locale = i18n.resolvedLanguage === 'ar' ? 'ar-EG' : 'en-EG'
  const tickets = useMyTickets()
  const categories = useSupportCategories()
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const stamp = (value: string) => parseUtc(value).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })
  const categoryName = (value: string | number) => {
    const name = typeof value === 'number' ? categories.data?.find((item) => item.id === value)?.name ?? '' : value
    return name ? h('categories.' + name, humanize(name)) : ''
  }
  const statusLabel = (value: string | number) => h('status.' + normStatus(value), humanize(normStatus(value)))
  const items = [...(tickets.data ?? [])].sort((a, b) => parseUtc(b.createdAt).getTime() - parseUtc(a.createdAt).getTime())
  const selected = items.find((item) => item.id === selectedId) ?? null

  return <PatientShell>
    <div>
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <nav aria-label="breadcrumb" className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"><House className="size-3.5" />{t('patientPortal.nav.home', { defaultValue: 'Home' })}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="text-foreground">{t('patientPortal.nav.supportRequests', { defaultValue: 'My Support Requests' })}</span>
        </nav>

        <div className="mt-6 max-w-2xl">
          <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-primary uppercase"><LifeBuoy className="size-3" />{s('eyebrow', 'Support')}</Badge>
          <h1 className="mt-3 font-sans text-3xl font-bold sm:text-5xl">{t('patientPortal.nav.supportRequests', { defaultValue: 'My Support Requests' })}</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">{s('description', 'Track your support requests, read replies from our team, and continue your conversations whenever you need.')}</p>
        </div>

        <div className="mt-8">
          {tickets.isLoading && <div role="status" aria-label={h('loadingRequests', 'Loading your requests')} className="grid gap-3 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-8">
            <div className="grid gap-3">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24 rounded-2xl motion-reduce:animate-none" />)}</div>
            <Skeleton className="hidden h-96 rounded-2xl motion-reduce:animate-none lg:block" />
          </div>}

          {tickets.isError && <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
            <p className="min-w-0 flex-1 text-sm font-bold text-destructive">{getErrorMessage(tickets.error)}</p>
            <Button type="button" variant="ghost" className={grayButton} disabled={tickets.isFetching} onClick={() => tickets.refetch()}><RefreshCw className="size-4" />{t('errors.tryAgain')}</Button>
          </div>}

          {tickets.isSuccess && items.length === 0 && <section className="relative isolate -mt-8 grid place-items-center overflow-hidden px-4 py-20 text-center sm:py-28">
            <div className="relative">
              <span className="relative grid size-16 place-items-center rounded-full bg-primary text-primary-foreground ring-8 ring-primary/10"><Inbox className="size-7" /></span>
              <span className="absolute -end-6 -top-3 size-3 rounded-full bg-primary/40 motion-safe:animate-bounce" />
              <span className="absolute -start-8 top-8 size-2 rounded-full bg-primary/30 motion-safe:animate-pulse" />
              <span className="absolute -end-10 bottom-4 size-2.5 rounded-full bg-primary/25 motion-safe:animate-pulse" />
            </div>
            <h2 className="mt-10 font-sans text-2xl font-bold sm:text-4xl">{s('emptyTitle', 'No support requests yet')}</h2>
            <p className="mt-5 max-w-md text-sm leading-7 font-medium text-muted-foreground sm:text-base">{h('requestsEmpty', 'You haven’t submitted any support requests yet.')}</p>
            <Button className="mt-6 h-10 cursor-pointer rounded-xl bg-primary px-4 text-[13px] font-bold normal-case tracking-normal text-primary-foreground hover:bg-primary/90" render={<Link to="/patient/help" hash="contact" />}><LifeBuoy className="size-4" />{s('goHelp', 'Go to the Help Center')}</Button>
          </section>}

          {items.length > 0 && <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-8">
            <div className={`${selected ? 'hidden lg:block' : 'block'} overflow-hidden rounded-2xl border border-border bg-card shadow-sm`}>
              <ul className="max-h-[calc(100dvh-12rem)] divide-y divide-border/60 overflow-y-auto" aria-label={t('patientPortal.nav.supportRequests', { defaultValue: 'My Support Requests' })}>
                {items.map((ticket) => {
                  const active = ticket.id === selected?.id
                  const replies = ticket.messages.length
                  return <li key={ticket.id}>
                    <button type="button" aria-current={active ? 'true' : undefined} onClick={() => setSelectedId(ticket.id)} className={`group relative flex w-full cursor-pointer items-start gap-3.5 px-4 py-4 text-start outline-none transition-colors focus-visible:bg-muted/50 motion-reduce:transition-none sm:px-5 ${active ? 'bg-primary/5' : 'hover:bg-muted/40'}`}>
                      <span className={`grid size-10 shrink-0 place-items-center rounded-xl transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:shadow-primary/20 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 ${active ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}><LifeBuoy className="size-5" /></span>
                      <span className="grid min-w-0 flex-1 gap-1.5">
                        <span className="flex items-center justify-between gap-3">
                          <strong className="truncate text-[15px] font-bold">{h('requestNumber', 'Request #{{id}}', { id: ticket.id })}</strong>
                          <StatusPill status={normStatus(ticket.status)} label={statusLabel(ticket.status)} />
                        </span>
                        <span className="truncate text-xs font-bold text-primary">{categoryName(ticket.category)}</span>
                        <span className="line-clamp-2 text-sm leading-6 font-medium text-muted-foreground">{ticket.originalMessage}</span>
                        <span className="mt-0.5 flex items-center justify-between gap-2">
                          <time className="text-xs font-semibold text-muted-foreground">{stamp(ticket.createdAt)}</time>
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${replies ? 'text-primary' : 'text-muted-foreground'}`}>
                            <MessageCircle className="size-3.5" />
                            {replies ? s('replies', '{{count}} replies', { count: replies }) : s('noReplies', 'No replies yet')}
                          </span>
                        </span>
                      </span>
                    </button>
                  </li>
                })}
              </ul>
            </div>

            <div className={`${selected ? 'block' : 'hidden lg:block'} min-w-0`}>
              {selected
                ? <Conversation key={selected.id} ticket={selected} myId={auth.user?.id} h={h} categoryLabel={categoryName(selected.category)} statusLabel={statusLabel(selected.status)} stamp={stamp} onBack={() => setSelectedId(null)} />
                : <div className="grid min-h-[26rem] place-items-center rounded-2xl border border-border bg-card px-4 py-16 text-center shadow-sm">
                  <div className="grid justify-items-center">
                    <span className="grid size-16 place-items-center rounded-full bg-primary text-primary-foreground ring-8 ring-primary/10"><MessagesSquare className="size-7" /></span>
                    <h2 className="mt-8 font-sans text-xl font-bold sm:text-2xl">{s('selectTitle', 'Select a request')}</h2>
                    <p className="mt-3 max-w-xs text-sm leading-7 font-medium text-muted-foreground">{s('selectDescription', 'Choose a request from the list to read the conversation.')}</p>
                  </div>
                </div>}
            </div>
          </div>}
        </div>
      </div>
    </div>
  </PatientShell>
}