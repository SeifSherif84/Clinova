import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { CalendarClock, ChevronLeft, ChevronRight, Headset, LoaderCircle, RefreshCw, RotateCcw, SearchX, UserRound } from 'lucide-react'
import { useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import AdminShell from '@/components/admin-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminTickets } from '@/hooks/use-admin-support-tickets'
import { getErrorMessage } from '@/lib/api'
import { ticketStatuses, ticketStatusTone } from '@/lib/admin-support-tickets'
import type { TicketStatus } from '@/types/admin-support-ticket'

const pageSize = 10
const grayButtonClass = 'h-10 rounded-xl px-4 text-[13px] font-bold normal-case tracking-normal border-transparent bg-foreground/5 text-foreground shadow-none hover:bg-foreground/10 dark:border-transparent dark:bg-foreground/5 dark:hover:bg-foreground/10'

export default function AdminSupportTicketsPage() {
  const { t, i18n } = useTranslation()
  const search = useSearch({ from: '/admin/support-tickets' })
  const navigate = useNavigate({ from: '/admin/support-tickets' })
  const resultsRef = useRef<HTMLElement>(null)
  const tickets = useAdminTickets(search, pageSize)
  const page = tickets.data

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.resolvedLanguage === 'ar' ? 'ar-EG' : 'en-EG', { dateStyle: 'medium', timeStyle: 'short' }),
    [i18n.resolvedLanguage],
  )
  function formatDate(value: string) {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
  }

  const statusOptions: { value: TicketStatus | undefined; label: string }[] = [
    { value: undefined, label: t('admin.supportTickets.all') },
    ...ticketStatuses.map((value) => ({ value, label: t('admin.supportTickets.status.' + value) })),
  ]

  // Changing the filter returns to the first page.
  function setStatus(status: TicketStatus | undefined) {
    navigate({ search: { status }, replace: true, resetScroll: false })
  }

  function goTo(pageIndex: number) {
    navigate({ search: (current) => ({ ...current, pageIndex: pageIndex > 1 ? pageIndex : undefined }), resetScroll: false })
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    resultsRef.current?.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  return (
    <AdminShell>
      <div className="mx-auto w-full min-w-0 max-w-screen-2xl p-4 sm:p-6 lg:p-10">
        <div>
          <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-primary uppercase"><Headset className="size-3" />{t('admin.supportTickets.eyebrow')}</Badge>
          <h1 className="mt-2 font-sans text-3xl font-bold sm:text-4xl">{t('admin.supportTickets.title')}</h1>
          <p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground sm:text-sm">{t('admin.supportTickets.description')}</p>
        </div>

        <div role="group" aria-label={t('admin.supportTickets.filterLabel')} className="-mx-1 mt-6 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
          {statusOptions.map((option) => {
            const selected = search.status === option.value
            return (
              <button
                key={option.label}
                type="button"
                aria-pressed={selected}
                onClick={() => setStatus(option.value)}
                className={`h-10 shrink-0 rounded-full border px-4 text-[13px] font-bold whitespace-nowrap transition focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none motion-reduce:transition-none ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'}`}
              >
                {option.label}
              </button>
            )
          })}
        </div>

        <section ref={resultsRef} className="mt-6 scroll-mt-24" aria-busy={tickets.isFetching}>
          {page && page.totalCount > 0 && (
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground/70" role="status">
              {tickets.isFetching && <LoaderCircle className="size-3.5 animate-spin motion-reduce:animate-none" />}
              {t('admin.supportTickets.showing', { from: (page.pageIndex - 1) * page.pageSize + 1, to: (page.pageIndex - 1) * page.pageSize + page.items.length, total: page.totalCount })}
            </div>
          )}

          {tickets.isLoading && (
            <div className="grid gap-3" role="status" aria-label={t('admin.supportTickets.loading')}>
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:p-5">
                  <div className="flex justify-between gap-3"><Skeleton className="h-5 w-44 rounded-lg motion-reduce:animate-none" /><Skeleton className="h-6 w-20 rounded-full motion-reduce:animate-none" /></div>
                  <Skeleton className="h-4 w-full rounded-lg motion-reduce:animate-none" />
                  <Skeleton className="h-4 w-2/3 rounded-lg motion-reduce:animate-none" />
                </div>
              ))}
            </div>
          )}

          {tickets.isError && !page && (
            <Card className="items-center rounded-3xl border border-destructive/20 bg-card p-5 text-center sm:p-8">
              <p className="text-sm font-bold text-destructive">{getErrorMessage(tickets.error)}</p>
              <Button variant="outline" className={grayButtonClass + ' mt-3'} disabled={tickets.isFetching} onClick={() => tickets.refetch()}>
                {tickets.isFetching ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <RefreshCw />}
                {t('admin.supportTickets.retry')}
              </Button>
            </Card>
          )}

          {page && page.items.length === 0 && (
            <section className="relative isolate grid place-items-center overflow-hidden px-4 py-14 text-center sm:py-24">
              <div className="relative">
                <span className="absolute inset-0 rounded-full bg-primary/15 motion-safe:animate-pulse" />
                <span className="relative grid size-20 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 ring-8 ring-primary/10">
                  {search.status ? <SearchX className="size-8" /> : <Headset className="size-8" />}
                </span>
              </div>
              <h2 className="mt-8 font-sans text-2xl font-bold sm:text-3xl">{t(search.status ? 'admin.supportTickets.noMatchTitle' : 'admin.supportTickets.emptyTitle')}</h2>
              <p className="mt-4 max-w-md text-sm leading-7 font-medium text-muted-foreground sm:text-base">{t(search.status ? 'admin.supportTickets.noMatchDescription' : 'admin.supportTickets.emptyDescription')}</p>
              {search.status && <Button variant="outline" className={grayButtonClass + ' mt-6'} onClick={() => setStatus(undefined)}><RotateCcw />{t('admin.supportTickets.clearFilters')}</Button>}
            </section>
          )}

          {page && page.items.length > 0 && (
            <>
              <ul className={`grid gap-3 transition-opacity motion-reduce:transition-none ${tickets.isPlaceholderData ? 'opacity-60' : ''}`}>
                {page.items.map((ticket) => (
                  <li key={ticket.id}>
                    <Link
                      to="/admin/support-tickets/$ticketId"
                      params={{ ticketId: String(ticket.id) }}
                      search={search}
                      aria-label={`${t('admin.supportTickets.view')} #${ticket.id}`}
                      className="group flex min-w-0 flex-col gap-4 rounded-2xl border border-border bg-card p-4 text-start transition hover:border-primary/30 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none motion-reduce:transition-none sm:p-5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary ring-2 ring-primary/15"><UserRound className="size-5" /></span>
                        <div className="grid min-w-0 flex-1 gap-0.5 text-start">
                          <strong className="truncate font-sans text-base font-bold leading-tight sm:text-lg">{ticket.patientName}</strong>
                          <span className="text-xs font-semibold tabular-nums text-muted-foreground">{t('admin.supportTickets.ticketNumber', { id: ticket.id })}</span>
                        </div>
                        <Badge className={`h-auto shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold ${ticketStatusTone(ticket.status)}`}>{t('admin.supportTickets.status.' + ticket.status, { defaultValue: ticket.status })}</Badge>
                      </div>
                      <p dir="auto" className="line-clamp-3 border-s-[3px] border-primary/40 ps-3.5 text-start text-lg leading-9 font-normal break-words whitespace-pre-line text-foreground">{ticket.originalMessage}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border/60 pt-3 text-xs font-semibold text-muted-foreground">
                        <span className="rounded-full bg-muted px-2.5 py-1">{t('patientPortal.help.categories.' + ticket.category, { defaultValue: ticket.category })}</span>
                        <span className="flex items-center gap-1.5"><CalendarClock className="size-3.5" />{formatDate(ticket.createdAt)}</span>
                        <span className="ms-auto flex items-center gap-1 text-[13px] font-bold text-primary">{t('admin.supportTickets.view')}<ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" /></span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>

              {page.totalPages > 1 && (
                <nav aria-label={t('admin.supportTickets.pagination')} className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-bold text-muted-foreground">{t('admin.supportTickets.pageOf', { page: page.pageIndex, total: page.totalPages })}</span>
                  <div className="flex w-full gap-2 max-sm:[&>button]:flex-1 sm:w-auto">
                    <Button variant="outline" className={grayButtonClass} disabled={page.pageIndex <= 1 || tickets.isFetching} onClick={() => goTo(page.pageIndex - 1)}><ChevronLeft className="rtl:rotate-180" />{t('admin.supportTickets.previous')}</Button>
                    <Button variant="outline" className={grayButtonClass} disabled={page.pageIndex >= page.totalPages || tickets.isFetching} onClick={() => goTo(page.pageIndex + 1)}>{t('admin.supportTickets.next')}<ChevronRight className="rtl:rotate-180" /></Button>
                  </div>
                </nav>
              )}
            </>
          )}
        </section>
      </div>
    </AdminShell>
  )
}