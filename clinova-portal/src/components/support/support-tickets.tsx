import { ChevronDown, Inbox, LoaderCircle, RefreshCw, Send } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import Notice from '@/components/notice'
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

function Bubble({ mine, text, time, label }: { mine: boolean; text: string; time: string; label: string }) {
  return <div className={`flex flex-col gap-1 ${mine ? 'items-end' : 'items-start'}`}>
    <span className="text-[11px] font-bold text-muted-foreground">{label}</span>
    <p className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-[15px] leading-7 font-medium break-words whitespace-pre-wrap ${mine ? 'rounded-ee-md bg-primary text-primary-foreground' : 'rounded-es-md bg-muted text-foreground'}`}>{text}</p>
    <time className="text-[11px] font-semibold text-muted-foreground">{time}</time>
  </div>
}

function Conversation({ ticket, myId, tr, stamp }: { ticket: PatientSupportTicket; myId?: string; tr: Tr; stamp: (value: string) => string }) {
  const send = useSendTicketMessage(ticket.id)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const resolved = normStatus(ticket.status) === 'Resolved'

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (send.isPending) return
    const text = draft.trim()
    if (!text) return setError(tr('replyRequired', 'Write a message first.'))
    if (text.length > 3000) return setError(tr('messageLong', 'Your message can’t be longer than {{count}} characters.', { count: 3000 }))
    setError('')
    send.mutate(text, { onSuccess: () => setDraft('') })
  }

  return <div className="grid gap-4 border-t border-border/60 p-4 sm:p-5">
    <div className="grid max-h-96 gap-4 overflow-y-auto pe-1">
      <Bubble mine text={ticket.originalMessage} time={stamp(ticket.createdAt)} label={tr('you', 'You')} />
      {ticket.messages.map((item) => <Bubble key={item.id} mine={item.senderId === myId} text={item.message} time={stamp(item.createdAt)} label={item.senderId === myId ? tr('you', 'You') : tr('supportTeam', 'Support team')} />)}
    </div>
    {resolved && <p className="text-[13px] leading-6 font-semibold text-muted-foreground">{tr('reopenNote', 'This request is resolved. Sending a message will reopen it.')}</p>}
    <form onSubmit={submit} className="grid gap-2.5">
      {(error || send.error) && <Notice message={error || getErrorMessage(send.error)} />}
      <textarea value={draft} rows={3} maxLength={3000} disabled={send.isPending} aria-label={tr('replyLabel', 'Your reply')} placeholder={tr('replyPlaceholder', 'Write a message…')} onChange={(event) => { setDraft(event.target.value); setError('') }} className="w-full resize-y rounded-xl border border-input bg-background/40 px-3 py-2.5 text-base leading-7 font-medium outline-none transition placeholder:text-sm placeholder:font-medium focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/10 disabled:opacity-60" />
      <Button type="submit" className="h-10 w-fit cursor-pointer rounded-xl px-4 text-[13px] font-bold normal-case tracking-normal" disabled={send.isPending}>
        {send.isPending ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <Send className="size-4 rtl:-scale-x-100" />}
        {tr('send', 'Send message')}
      </Button>
    </form>
  </div>
}

export default function SupportTickets() {
  const { t, i18n } = useTranslation()
  const auth = useAuth()
  const tr: Tr = (key, defaultValue, options) => t('patientPortal.help.' + key, { defaultValue, ...options })
  const locale = i18n.resolvedLanguage === 'ar' ? 'ar-EG' : 'en-EG'
  const tickets = useMyTickets()
  const categories = useSupportCategories()
  const [openId, setOpenId] = useState<number | null>(null)
  const stamp = (value: string) => parseUtc(value).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })
  const categoryName = (value: string | number) => {
    const name = typeof value === 'number' ? categories.data?.find((item) => item.id === value)?.name ?? '' : value
    return name ? tr('categories.' + name, humanize(name)) : ''
  }
  const statusLabel = (value: string | number) => tr('status.' + normStatus(value), humanize(normStatus(value)))

  if (tickets.isLoading) return <div role="status" aria-label={tr('loadingRequests', 'Loading your requests')} className="grid gap-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-20 rounded-2xl motion-reduce:animate-none" />)}</div>

  if (tickets.isError) return <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
    <p className="min-w-0 flex-1 text-sm font-bold text-destructive">{getErrorMessage(tickets.error)}</p>
    <Button type="button" variant="ghost" className={grayButton} disabled={tickets.isFetching} onClick={() => tickets.refetch()}><RefreshCw className="size-4" />{t('errors.tryAgain')}</Button>
  </div>

  const items = tickets.data ?? []
  if (!items.length) return <div className="grid place-items-center rounded-3xl border border-dashed border-primary/25 bg-card/50 px-4 py-12 text-center">
    <span className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary"><Inbox className="size-6" /></span>
    <p className="mt-4 max-w-sm text-sm leading-7 font-semibold text-muted-foreground">{tr('requestsEmpty', 'You haven’t submitted any support requests yet.')}</p>
  </div>

  return <ul className="grid gap-3">
    {items.map((ticket) => {
      const open = openId === ticket.id
      const status = normStatus(ticket.status)
      return <li key={ticket.id} className="overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/25">
        <button type="button" aria-expanded={open} onClick={() => setOpenId(open ? null : ticket.id)} className="flex w-full cursor-pointer items-center gap-3 px-4 py-4 text-start focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none sm:px-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <strong className="text-[15px] font-bold">{tr('requestNumber', 'Request #{{id}}', { id: ticket.id })}</strong>
              <span className="text-sm font-semibold text-muted-foreground">{categoryName(ticket.category)}</span>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusStyle[status] ?? statusStyle.Resolved}`}>{statusLabel(ticket.status)}</span>
            </div>
            <p className="mt-1.5 truncate text-sm font-medium text-muted-foreground">{ticket.originalMessage}</p>
            <time className="mt-1 block text-xs font-semibold text-muted-foreground">{stamp(ticket.createdAt)}</time>
          </div>
          <ChevronDown className={`size-5 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180 text-primary' : ''}`} />
        </button>
        {open && <Conversation ticket={ticket} myId={auth.user?.id} tr={tr} stamp={stamp} />}
      </li>
    })}
  </ul>
}