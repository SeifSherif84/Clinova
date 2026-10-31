import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, Clock3, LoaderCircle, RefreshCw, RotateCcw, SearchX, Stethoscope, UserRound } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import DoctorWorkspaceShell from '@/components/doctor-workspace-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useApi } from '@/hooks/use-api'
import { getErrorMessage } from '@/lib/api'
import { formatTime, parseSlotDate, toAppointmentsQuery } from '@/lib/secretary-appointments'
import { appointmentStatuses, depositPaymentStatuses, type PaginatedResult, type SecretaryAppointment, type SecretaryAppointmentFilters } from '@/types/secretary'

const pageSize = 12
const debounceMs = 400
const buttonClass = 'h-11 rounded-xl text-sm font-bold normal-case tracking-normal'
type TextFilter = 'doctorName' | 'patientSearch'

// Presentational-only status grouping for the list's color accents; the backend's own
// status strings are used as-is and never altered or re-mapped for logic purposes.
const positiveStatuses = new Set(['Confirmed', 'Completed', 'Paid', 'Succeeded', 'Refunded'])
const negativeStatuses = new Set(['Cancelled', 'NoShow', 'Expired', 'Failed', 'Rejected'])
function statusTextClass(value: string) {
  if (positiveStatuses.has(value)) return 'text-primary'
  if (negativeStatuses.has(value)) return 'text-destructive'
  return 'text-muted-foreground'
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

// Items arrive sorted by date then start time, so consecutive grouping keeps that order.
function groupByDate(items: SecretaryAppointment[]) {
  const groups: { date: string; items: SecretaryAppointment[] }[] = []
  for (const item of items) {
    const last = groups.at(-1)
    if (last?.date === item.slotDate) last.items.push(item)
    else groups.push({ date: item.slotDate, items: [item] })
  }
  return groups
}

export default function SecretaryAppointmentsPage() {
  const { t, i18n } = useTranslation()
  const api = useApi()
  const search = useSearch({ from: '/secretary/appointments' })
  const navigate = useNavigate({ from: '/secretary/appointments' })
  const locale = i18n.resolvedLanguage === 'ar' ? 'ar-EG' : 'en-EG'

  const resultsRef = useRef<HTMLElement>(null)
  // Any filter change returns to the first page; replace keeps typing out of the back stack,
  // and resetScroll: false stops the router jumping to the top while the user is filtering.
  const setFilters = useCallback((patch: SecretaryAppointmentFilters) => {
    navigate({ search: (current) => ({ ...current, ...patch, pageIndex: undefined }), replace: true, resetScroll: false })
  }, [navigate])
  const [doctorDraft, setDoctorDraft] = useDebouncedFilter('doctorName', search.doctorName, setFilters)
  const [patientDraft, setPatientDraft] = useDebouncedFilter('patientSearch', search.patientSearch, setFilters)

  const appointments = useQuery({
    queryKey: ['secretary', 'appointments', 'list', search],
    queryFn: () => api.request<PaginatedResult<SecretaryAppointment>>('/api/appointments/management?' + toAppointmentsQuery(search, pageSize), {}, { notifyOnError: false }),
    placeholderData: keepPreviousData,
  })
  const page = appointments.data
  const activeFilters = [search.doctorName, search.patientSearch, search.slotDate, search.appointmentStatus, search.depositPaymentStatus].filter(Boolean).length
  const status = (value: string) => t('secretary.status.' + value, { defaultValue: value })
  const appointmentItems = [{ value: 'all', label: t('secretary.appointments.all') }, ...appointmentStatuses.map((value) => ({ value, label: status(value) }))]
  const paymentOptions = [{ value: undefined, label: t('secretary.appointments.all') }, ...depositPaymentStatuses.map((value) => ({ value, label: status(value) }))]

  const today = new Date()
  const relativeDays: Record<string, string> = {
    [dayKey(today)]: t('secretary.appointments.today'),
    [dayKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1))]: t('secretary.appointments.tomorrow'),
    [dayKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1))]: t('secretary.appointments.yesterday'),
  }

  function clearFilters() {
    setDoctorDraft('')
    setPatientDraft('')
    navigate({ search: {}, replace: true, resetScroll: false })
  }
  // A new page brings the user to the start of the results, not the top of the screen.
  function goTo(pageIndex: number) {
    navigate({ search: (current) => ({ ...current, pageIndex: pageIndex > 1 ? pageIndex : undefined }), resetScroll: false })
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    resultsRef.current?.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  return (
    <DoctorWorkspaceShell active="secretary-appointments">
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-primary uppercase"><CalendarDays className="size-3" />{t('secretary.workspace')}</Badge>
            <h1 className="mt-2 font-sans text-3xl font-bold sm:text-4xl">{t('secretary.appointments.title')}</h1>
          </div>
          <Button className={buttonClass + ' bg-primary px-5 text-primary-foreground hover:bg-primary/90'} render={<Link to="/secretary/guest-booking" search={{ doctorId: undefined }} />}><CalendarPlus />{t('secretary.guest.title')}</Button>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="group relative min-w-40 max-w-64 flex-1">
              <UserRound className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <input type="search" id="secretaryPatientFilter" value={patientDraft} maxLength={100} placeholder={t('secretary.appointments.patientPlaceholder')} onChange={(event) => setPatientDraft(event.target.value)} className="h-10 w-full rounded-xl border border-input bg-background/40 ps-9 pe-3 text-sm outline-none transition focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/10" />
            </div>
            <div className="group relative min-w-40 max-w-64 flex-1">
              <Stethoscope className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <input type="search" id="secretaryDoctorFilter" value={doctorDraft} maxLength={100} placeholder={t('secretary.appointments.doctorPlaceholder')} onChange={(event) => setDoctorDraft(event.target.value)} className="h-10 w-full rounded-xl border border-input bg-background/40 ps-9 pe-3 text-sm outline-none transition focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/10" />
            </div>
            <div className="relative w-56 shrink-0">
              <input
                type="date"
                id="secretaryDateFilter"
                value={search.slotDate ?? ''}
                onChange={(event) => setFilters({ slotDate: event.target.value || undefined })}
                className="h-10 w-full rounded-xl border border-input bg-background/40 px-3 text-sm text-foreground outline-none transition focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/10 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:rounded-md [&::-webkit-calendar-picker-indicator]:p-1 [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:transition [&::-webkit-calendar-picker-indicator]:hover:bg-primary/10 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
              />
            </div>
            <Select items={appointmentItems} value={search.appointmentStatus ?? 'all'} onValueChange={(value) => setFilters({ appointmentStatus: appointmentStatuses.find((item) => item === value) })}>
              <SelectTrigger className="h-10 w-auto min-w-36 shrink-0 rounded-xl border border-input bg-background/40 px-3"><SelectValue /></SelectTrigger>
              <SelectContent className="w-56 rounded-xl border border-border bg-popover text-popover-foreground">
                {appointmentItems.map((item) => <SelectItem className="rounded-lg" key={item.value} value={item.value}>{item.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {activeFilters > 0 && <Button variant="outline" className="ms-auto h-10 shrink-0 rounded-xl border-border/60 bg-background/45 px-3.5 text-xs font-bold normal-case text-muted-foreground transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:text-primary" onClick={clearFilters}><RotateCcw className="size-3.5" />{t('secretary.appointments.clearFilters')}</Button>}
          </div>
          <div role="radiogroup" aria-label={t('secretary.appointments.depositStatus')} className="-mx-1 mt-2.5 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
            {paymentOptions.map((option) => {
              const selected = search.depositPaymentStatus === option.value
              return <button key={option.label} type="button" role="radio" aria-checked={selected} onClick={() => setFilters({ depositPaymentStatus: option.value })} className={`h-8 shrink-0 rounded-full border px-3.5 text-xs font-bold whitespace-nowrap transition focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none motion-reduce:transition-none ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'}`}>{option.label}</button>
            })}
          </div>
        </div>

        <section ref={resultsRef} className="mt-6 scroll-mt-24" aria-busy={appointments.isFetching}>
          {page && page.totalCount > 0 && <div className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground/70" role="status">
            {appointments.isFetching && <LoaderCircle className="size-3.5 animate-spin motion-reduce:animate-none" />}
            {t('secretary.appointments.showing', { from: (page.pageIndex - 1) * page.pageSize + 1, to: (page.pageIndex - 1) * page.pageSize + page.items.length, total: page.totalCount })}
          </div>}

          {appointments.isLoading && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" role="status" aria-label={t('secretary.appointments.loading')}>
            {Array.from({ length: 6 }, (_, index) => <div key={index} className="grid gap-4 rounded-2xl border border-border bg-card p-5">
              <div className="flex justify-between"><Skeleton className="h-6 w-28 rounded-lg motion-reduce:animate-none" /><Skeleton className="h-6 w-20 rounded-full motion-reduce:animate-none" /></div>
              <div className="flex items-center gap-3"><Skeleton className="size-11 rounded-xl motion-reduce:animate-none" /><Skeleton className="h-5 w-40 rounded-lg motion-reduce:animate-none" /></div>
              <Skeleton className="h-4 w-32 rounded-lg motion-reduce:animate-none" />
            </div>)}
          </div>}

          {appointments.isError && !page && <Card className="items-center rounded-3xl border border-destructive/20 bg-card p-8 text-center">
            <p className="text-sm font-bold text-destructive">{getErrorMessage(appointments.error)}</p>
            <Button variant="outline" className={buttonClass + ' mt-3'} disabled={appointments.isFetching} onClick={() => appointments.refetch()}>{appointments.isFetching ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <RefreshCw />}{t('invitations.retry')}</Button>
          </Card>}

          {page && !page.items.length && (
            <section className="relative isolate grid place-items-center overflow-hidden px-4 py-20 text-center sm:py-28">
              <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 grid place-items-center [mask-image:radial-gradient(circle_at_center,black_25%,transparent_70%)]">
                <span className="absolute size-[30rem] rounded-full bg-primary/[0.06] blur-3xl" />
              </div>

              <div className="relative">
                <span className="absolute inset-0 rounded-full bg-primary/20 motion-safe:animate-ping" />
                <span className="relative grid size-20 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 ring-8 ring-primary/10">
                  {activeFilters ? <SearchX className="size-8" /> : <CalendarDays className="size-8" />}
                </span>
                <span className="absolute -end-6 -top-3 size-3 rounded-full bg-primary/40 motion-safe:animate-bounce" />
                <span className="absolute -start-8 top-8 size-2 rounded-full bg-primary/30 motion-safe:animate-pulse" />
                <span className="absolute -end-10 bottom-4 size-2.5 rounded-full bg-primary/25 motion-safe:animate-pulse" />
              </div>

              <h2 className="mt-10 font-sans text-2xl font-bold sm:text-4xl">{t(activeFilters ? 'secretary.appointments.noMatchTitle' : 'secretary.appointments.emptyTitle')}</h2>
              <p className="mt-5 max-w-md text-sm leading-7 font-medium text-muted-foreground sm:text-base">{t(activeFilters ? 'secretary.appointments.noMatchDescription' : 'secretary.appointments.emptyDescription')}</p>
              {activeFilters > 0 && <Button variant="outline" className={buttonClass + ' mt-6'} onClick={clearFilters}><RotateCcw />{t('secretary.appointments.clearFilters')}</Button>}
            </section>
          )}

          {page && page.items.length > 0 && <>
            <div className={`grid gap-7 transition-opacity motion-reduce:transition-none ${appointments.isPlaceholderData ? 'opacity-60' : ''}`}>
              {groupByDate(page.items).map((group) => {
                const date = parseSlotDate(group.date)
                const relative = date ? relativeDays[dayKey(date)] : undefined
                return <div key={group.date} className="grid gap-3">
                  <h2 className="flex w-full items-center gap-2 text-sm font-bold">
                    <CalendarDays className="size-4 text-primary" />
                    {relative && <span className="text-primary">{relative} ·</span>}
                    {date ? date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : group.date}
                    <span className="ms-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{group.items.length}</span>
                  </h2>
                  <div className="grid gap-2.5">
                    {group.items.map((appointment) => (
                      <Link
                        key={appointment.appointmentId}
                        to="/secretary/appointments/$appointmentId"
                        params={{ appointmentId: String(appointment.appointmentId) }}
                        search={search}
                        className="group flex flex-col gap-3 rounded-2xl border border-primary/10 bg-primary/[0.03] p-4 text-start transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 motion-reduce:transition-none sm:flex-row sm:items-center sm:gap-5 sm:p-5"
                      >
                        <span className="flex shrink-0 items-center gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10"><Clock3 className="size-4.5" /></span>
                          <span dir="ltr" className="whitespace-nowrap font-sans text-sm font-bold sm:text-base">{formatTime(appointment.slotStartTime)} – {formatTime(appointment.slotEndTime)}</span>
                        </span>

                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <span className="grid size-10 shrink-0 place-items-center text-primary"><UserRound className="size-5" /></span>
                          <div className="min-w-0 flex-1">
                            <strong className="block truncate font-sans text-sm font-bold leading-tight sm:text-base">{appointment.patientName}</strong>
                            <span className="mt-1 flex items-center gap-1.5 text-sm font-bold text-muted-foreground"><Stethoscope className="size-4 shrink-0" /><span className="truncate">{appointment.doctorName}</span></span>
                          </div>
                          <ChevronRight className="size-4 shrink-0 text-muted-foreground transition group-hover:text-primary sm:hidden rtl:rotate-180" />
                        </div>

                        <div className="flex flex-col gap-1.5 pt-3 text-sm sm:w-auto sm:shrink-0 sm:items-end sm:pt-0 sm:ps-5 sm:text-end">
                          <span className={`flex items-center gap-1.5 font-bold ${statusTextClass(appointment.appointmentStatus)}`}>
                            {status(appointment.appointmentStatus)}
                          </span>
                          <span className="flex items-center gap-1.5 font-bold text-muted-foreground">
                            {appointment.depositPaymentMethodType && <span className="flex items-center gap-1.5 truncate"><span className="truncate">{t('secretary.paymentMethod.' + appointment.depositPaymentMethodType, { defaultValue: appointment.depositPaymentMethodType })}</span><span aria-hidden="true" className="h-3.5 w-px shrink-0 bg-muted-foreground/40" /></span>}
                            <span className={statusTextClass(appointment.depositPaymentStatus)}>{status(appointment.depositPaymentStatus)}</span>
                          </span>
                          {appointment.requiresManualRefundAction && (
                            <span className="mt-0.5 inline-flex w-fit items-center gap-1.5 self-start rounded-full border border-destructive/25 bg-destructive/10 px-2.5 py-1 text-xs font-bold text-destructive shadow-sm sm:self-end">
                              <span className="relative flex size-2">
                                <span className="absolute inline-flex size-full rounded-full bg-destructive/60 motion-safe:animate-ping" />
                                <span className="relative inline-flex size-2 rounded-full bg-destructive" />
                              </span>
                              {t('secretary.appointments.refundAction')}
                            </span>
                          )}
                        </div>

                        <ChevronRight className="hidden size-4 shrink-0 text-muted-foreground transition group-hover:text-primary sm:block rtl:rotate-180" />
                      </Link>
                    ))}
                  </div>
                </div>
              })}
            </div>
            {page.totalPages > 1 && <nav aria-label={t('secretary.appointments.pagination')} className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold text-muted-foreground">{t('secretary.appointments.pageOf', { page: page.pageIndex, total: page.totalPages })}</span>
              <div className="flex gap-2">
                <Button variant="outline" className={buttonClass} disabled={page.pageIndex <= 1 || appointments.isFetching} onClick={() => goTo(page.pageIndex - 1)}><ChevronLeft className="rtl:rotate-180" />{t('secretary.appointments.previous')}</Button>
                <Button variant="outline" className={buttonClass} disabled={page.pageIndex >= page.totalPages || appointments.isFetching} onClick={() => goTo(page.pageIndex + 1)}>{t('secretary.appointments.next')}<ChevronRight className="rtl:rotate-180" /></Button>
              </div>
            </nav>}
          </>}
        </section>
      </div>
    </DoctorWorkspaceShell>
  )
}

// Text filters update locally on every keystroke and reach the URL once typing pauses.
function useDebouncedFilter(key: TextFilter, value: string | undefined, setFilters: (patch: SecretaryAppointmentFilters) => void) {
  const [draft, setDraft] = useState(value ?? '')
  const [synced, setSynced] = useState(value)
  if (value !== synced) {
    // The URL changed from outside (back button, clear), so mirror it in the input.
    setSynced(value)
    if ((value ?? '') !== draft.trim()) setDraft(value ?? '')
  }
  useEffect(() => {
    const next = draft.trim() || undefined
    if (next === value) return
    const timer = setTimeout(() => setFilters({ [key]: next }), debounceMs)
    return () => clearTimeout(timer)
  }, [draft, key, value, setFilters])
  return [draft, setDraft] as const
}