import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { CalendarDays, CalendarPlus, Clock3, House, RefreshCw, Stethoscope, Timer, Undo2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Notice from '@/components/notice'
import PatientShell from '@/components/patient-shell'
import StatusPill from '@/components/patient-status-pill'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useApi } from '@/hooks/use-api'
import { getErrorMessage } from '@/lib/api'
import { atTime, classify, daysUntil, formatClock, humanize, parseDay, parseUtc, statusTone, toneText, type AppointmentGroup } from '@/lib/patient-appointments'
import type { PatientAppointment } from '@/types/patient-appointment'

type Tr = (key: string, defaultValue: string, options?: Record<string, string | number>) => string
type Tab = 'all' | 'upcoming' | 'past' | 'cancelled'
type Row = { item: PatientAppointment; group: AppointmentGroup }

const tabs: Tab[] = ['all', 'upcoming', 'past', 'cancelled']
const primaryButton = 'h-10 cursor-pointer rounded-xl bg-primary px-4 text-[13px] font-bold normal-case tracking-normal text-primary-foreground hover:bg-primary/90'
const grayButton = 'h-10 cursor-pointer rounded-xl bg-foreground/5 px-4 text-[13px] font-bold normal-case tracking-normal text-foreground hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-primary/30'
const startOf = (item: PatientAppointment) => atTime(item.slotDate, item.slotStartTime).getTime()

// Consecutive grouping: the list is already sorted, so equal months sit next to each other.
function byMonth(rows: Row[], locale: string) {
  const out: { key: string; label: string; rows: Row[] }[] = []
  for (const row of rows) {
    const day = parseDay(row.item.slotDate)
    const key = `${day.getFullYear()}-${day.getMonth()}`
    const last = out.at(-1)
    if (last?.key === key) last.rows.push(row)
    else out.push({ key, label: day.toLocaleDateString(locale, { month: 'long', year: 'numeric' }), rows: [row] })
  }
  return out
}

function DateTile({ day, locale, muted, highlight = false }: { day: Date; locale: string; muted: boolean; highlight?: boolean }) {
  return <span aria-hidden="true" className={`grid size-14 shrink-0 place-items-center rounded-2xl leading-none sm:size-16 ${muted ? 'bg-muted text-muted-foreground' : highlight ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'bg-primary/10 text-primary'}`}>
    <span className="grid justify-items-center gap-1">
      <small className="text-[11px] font-bold">{day.toLocaleDateString(locale, { month: 'short' })}</small>
      <strong className="font-sans text-2xl font-bold tabular-nums">{day.toLocaleDateString(locale, { day: 'numeric' })}</strong>
    </span>
  </span>
}

function AppointmentRow({ row, locale, tr, status, money, isNext = false }: { row: Row; locale: string; tr: Tr; status: (value: string) => string; money: (value: number) => string; isNext?: boolean }) {
  const { item, group } = row
  const day = parseDay(item.slotDate)
  const hasRefund = item.requestedDepositRefundAmount != null || Boolean(item.depositRefundStatus)
  const held = item.reservationExpiresAt && String(item.appointmentStatus) === 'PendingPayment'

  return <Link
    to="/patient/appointments/$appointmentId"
    params={{ appointmentId: String(item.appointmentId) }}
    className={`group -mx-3 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-3 rounded-2xl px-3 py-3 sm:gap-y-4 sm:gap-x-4 transition-colors hover:bg-primary/[0.06] focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none motion-reduce:transition-none sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-x-6 ${isNext ? 'bg-primary/[0.04]' : ''}`}
  >
    <DateTile day={day} locale={locale} muted={group !== 'upcoming'} highlight={isNext} />

    <div className="min-w-0">
      {isNext && <p className="mb-2 text-sm font-bold text-primary">
        {tr('nextVisit', 'Your next visit')} {new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(daysUntil(item.slotDate), 'day')}
      </p>}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 sm:flex-nowrap">
          <h3 className="min-w-0 font-sans text-base font-bold max-sm:w-full sm:truncate sm:text-lg">{item.doctorName}</h3>
          <span aria-hidden="true" className="hidden h-4 w-px shrink-0 bg-muted-foreground/40 sm:block" />
          <span className="min-w-0 text-sm font-semibold text-muted-foreground sm:truncate">{item.clinicName}</span>
        </div>
        <StatusPill status={item.appointmentStatus} label={status(item.appointmentStatus)} />
      </div>
      <p className="mt-1.5 flex min-w-0 items-center gap-2 text-sm font-bold">
        <Clock3 className="size-4 shrink-0 text-primary" />
        <span dir="ltr" className="shrink-0 whitespace-nowrap">{formatClock(item.slotDate, item.slotStartTime, locale)} – {formatClock(item.slotDate, item.slotEndTime, locale)}</span>
      </p>
    </div>

    <div className="col-span-2 grid gap-1.5 border-t border-border/50 pt-4 text-sm sm:col-span-1 sm:justify-items-end sm:border-0 sm:pt-0 sm:text-end">
      <span className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground">
        {tr('deposit', 'Deposit')} <strong dir="ltr" className="font-bold text-foreground tabular-nums">{money(item.depositAmount)}</strong>
        <span aria-hidden="true" className="h-4 w-px shrink-0 bg-muted-foreground/40" />
        <span className={`font-bold ${toneText[statusTone(item.depositPaymentStatus)]}`}>{status(item.depositPaymentStatus)}</span>
      </span>
      {hasRefund && <span className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground">
        <Undo2 className="size-3.5 shrink-0 text-primary" />
        {tr('refund', 'Refund')}
        {item.requestedDepositRefundAmount != null && <strong dir="ltr" className="font-bold text-foreground tabular-nums">{money(item.requestedDepositRefundAmount)}</strong>}
        {item.depositRefundStatus && <><span aria-hidden="true" className="h-4 w-px shrink-0 bg-muted-foreground/40" /><span className={`font-bold ${toneText[statusTone(item.depositRefundStatus)]}`}>{status(item.depositRefundStatus)}</span></>}
      </span>}
      {held && <span className="inline-flex items-center gap-1.5 font-bold text-warm">
        <Timer className="size-3.5 shrink-0" />
        {tr('heldUntil', 'Held until {{time}}', { time: parseUtc(item.reservationExpiresAt as string).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) })}
      </span>}
    </div>
  </Link>
}

function ListSkeleton({ label }: { label: string }) {
  return <div role="status" aria-label={label} className="mt-8 divide-y divide-border/60">
    {Array.from({ length: 4 }, (_, index) => <div key={index} className="flex items-center gap-4 py-5">
      <Skeleton className="size-14 shrink-0 rounded-2xl motion-reduce:animate-none sm:size-16" />
      <div className="grid flex-1 gap-2.5"><Skeleton className="h-5 w-48 max-w-full motion-reduce:animate-none" /><Skeleton className="h-4 w-36 max-w-full motion-reduce:animate-none" /><Skeleton className="h-4 w-52 max-w-full motion-reduce:animate-none" /></div>
      <Skeleton className="hidden h-12 w-40 rounded-xl sm:block motion-reduce:animate-none" />
    </div>)}
  </div>
}

function EmptyState({ tr }: { tr: Tr }) {
  return <section className="relative isolate grid place-items-center overflow-hidden px-4 py-14 text-center sm:py-28">
    <div className="relative">
      <span className="relative grid size-16 place-items-center rounded-full bg-primary text-primary-foreground ring-8 ring-primary/10"><CalendarDays className="size-7" /></span>
      <span className="absolute -end-6 -top-3 size-3 rounded-full bg-primary/40 motion-safe:animate-bounce" />
      <span className="absolute -start-8 top-8 size-2 rounded-full bg-primary/30 motion-safe:animate-pulse" />
      <span className="absolute -end-10 bottom-4 size-2.5 rounded-full bg-primary/25 motion-safe:animate-pulse" />
    </div>
    <h2 className="mt-8 font-sans text-2xl font-bold sm:mt-10 sm:text-4xl">{tr('emptyTitle', 'No appointments yet')}</h2>
    <p className="mt-5 max-w-md text-sm leading-7 font-medium text-muted-foreground sm:text-base">{tr('emptyDescription', 'When you book a visit, it will show up here so you can follow its status and payments.')}</p>
    <Button className={primaryButton + ' mt-6'} render={<Link to="/patient/doctors" />}><Stethoscope className="size-4" />{tr('findDoctor', 'Find a doctor')}</Button>
  </section>
}

export default function PatientAppointmentsPage() {
  const { t, i18n } = useTranslation()
  const api = useApi()
  const locale = i18n.resolvedLanguage === 'ar' ? 'ar-EG' : 'en-EG'
  const tr: Tr = (key, defaultValue, options) => t('patientPortal.appointments.' + key, { defaultValue, ...options })
  const status = (value: string) => t('secretary.status.' + value, { defaultValue: humanize(value) })
  const money = (value: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP', maximumFractionDigits: 2 }).format(value)
  const [tab, setTab] = useState<Tab>('all')
  const [flash, setFlash] = useState('')

  // The doctor page leaves the booking confirmation here before redirecting.
  useEffect(() => {
    const message = sessionStorage.getItem('flash')
    if (message) { sessionStorage.removeItem('flash'); setFlash(message) }
  }, [])

  const appointments = useQuery({
    queryKey: ['patient', 'appointments', 'list'],
    queryFn: () => api.request<PatientAppointment[]>('/api/appointments', {}, { notifyOnError: false }),
  })

  const lists = useMemo(() => {
    const now = new Date()
    const rows: Row[] = (appointments.data ?? []).map((item) => ({ item, group: classify(item, now) }))
    const upcoming = rows.filter((row) => row.group === 'upcoming').sort((a, b) => startOf(a.item) - startOf(b.item))
    const rest = rows.filter((row) => row.group !== 'upcoming').sort((a, b) => startOf(b.item) - startOf(a.item))
    return { upcoming, rest, past: rest.filter((row) => row.group === 'past'), cancelled: rest.filter((row) => row.group === 'cancelled') }
  }, [appointments.data])

  const counts: Record<Tab, number> = { all: appointments.data?.length ?? 0, upcoming: lists.upcoming.length, past: lists.past.length, cancelled: lists.cancelled.length }
  const visible = tab === 'all' ? [...lists.upcoming, ...lists.rest] : lists[tab]
  const sections = tab === 'all'
    ? [
      { key: 'upcoming', label: tr('sectionUpcoming', 'Upcoming'), rows: lists.upcoming },
      { key: 'earlier', label: tr('sectionEarlier', 'Earlier'), rows: lists.rest },
    ].filter((section) => section.rows.length)
    : byMonth(lists[tab], locale)
  const next = lists.upcoming.find((row) => row.item.appointmentStatus === 'Confirmed')?.item
  const tabLabels: Record<Tab, string> = { all: tr('tabAll', 'All'), upcoming: tr('tabUpcoming', 'Upcoming'), past: tr('tabPast', 'Past'), cancelled: tr('tabCancelled', 'Cancelled') }

  return <PatientShell>
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-16">
      <nav aria-label="breadcrumb" className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"><House className="size-3.5" />{t('patientPortal.nav.home', { defaultValue: 'Home' })}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="text-foreground">{t('patientPortal.nav.appointments', { defaultValue: 'My Appointments' })}</span>
      </nav>

      <div className="mt-6 w-full">
        {flash && <Notice tone="success" message={flash} />}

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-primary uppercase"><CalendarDays className="size-3" />{tr('eyebrow', 'My appointments')}</Badge>
            <h1 className="mt-3 font-sans text-2xl font-bold min-[400px]:text-3xl sm:text-5xl">{tr('title', 'Your appointments')}</h1>
            <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">{tr('description', 'Every visit you have booked, with its status and payments, in one place.')}</p>
          </div>
          <Button className={primaryButton + ' w-full sm:w-auto'} render={<Link to="/patient/doctors" />}><CalendarPlus className="size-4" />{tr('book', 'Book an appointment')}</Button>
        </div>

        {appointments.isLoading && <ListSkeleton label={tr('loading', 'Loading your appointments')} />}

        {appointments.isError && <div className="mt-8 flex flex-wrap items-center gap-3 rounded-3xl border border-destructive/20 bg-destructive/5 p-4 sm:p-6">
          <p className="min-w-0 flex-1 text-sm font-bold text-destructive">{getErrorMessage(appointments.error)}</p>
          <Button type="button" variant="ghost" className={grayButton} disabled={appointments.isFetching} onClick={() => appointments.refetch()}><RefreshCw className="size-4" />{t('errors.tryAgain')}</Button>
        </div>}

        {appointments.data && appointments.data.length === 0 && <EmptyState tr={tr} />}

        {appointments.data && appointments.data.length > 0 && <>

          <div role="radiogroup" aria-label={tr('filterLabel', 'Filter appointments')} className="-mx-1 mt-8 flex gap-2 overflow-x-auto px-1 pb-1">
            {tabs.map((key) => {
              const selected = tab === key
              return <button key={key} type="button" role="radio" aria-checked={selected} onClick={() => setTab(key)} className={`inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 sm:h-9 text-[13px] font-bold whitespace-nowrap transition focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none motion-reduce:transition-none ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'}`}>
                {tabLabels[key]}
                <span className={`rounded-full px-1.5 text-[11px] tabular-nums ${selected ? 'bg-primary-foreground/20' : 'bg-muted'}`}>{counts[key]}</span>
              </button>
            })}
          </div>

          {visible.length === 0
            ? <div className="relative isolate mt-8 grid place-items-center overflow-hidden px-4 py-14 text-center">
              <div className="relative">
                <span className="relative grid size-14 place-items-center rounded-full bg-primary text-primary-foreground ring-8 ring-primary/10"><CalendarDays className="size-6" /></span>
                <span className="absolute -end-6 -top-3 size-3 rounded-full bg-primary/40 motion-safe:animate-bounce" />
                <span className="absolute -start-8 top-8 size-2 rounded-full bg-primary/30 motion-safe:animate-pulse" />
                <span className="absolute -end-10 bottom-4 size-2.5 rounded-full bg-primary/25 motion-safe:animate-pulse" />
              </div>
              <h2 className="mt-6 font-sans text-lg font-bold">{tr('filteredTitle', 'Nothing in this view')}</h2>
              <p className="mt-1 max-w-sm text-sm leading-7 font-medium text-muted-foreground">{tr('filteredDescription', 'You have no appointments that match this filter.')}</p>
              <Button type="button" className={primaryButton + ' mt-4'} onClick={() => setTab('all')}>{tr('showAll', 'Show all appointments')}</Button>
            </div>
            : <div className="mt-6 grid gap-10">
              {sections.map((section) => <section key={section.key} aria-label={section.label}>
                <h2 className="flex items-center gap-3 text-sm font-bold text-muted-foreground">
                  {section.label}
                  <span className="ms-auto text-xs tabular-nums">{section.rows.length}</span>
                </h2>
                <div className="mt-1 divide-y divide-border/60">
                  {section.rows.map((row) => <AppointmentRow key={row.item.appointmentId} row={row} locale={locale} tr={tr} status={status} money={money} isNext={row.item.appointmentId === next?.appointmentId} />)}
                </div>
              </section>)}
            </div>}

          <p className="mt-8 text-sm font-semibold text-muted-foreground" aria-live="polite">{tr('showing', 'Showing {{shown}} of {{total}}', { shown: visible.length, total: counts.all })}</p>
        </>}
      </div>
    </div>
  </PatientShell>
}