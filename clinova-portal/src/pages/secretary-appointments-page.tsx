import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, Clock3, Filter, LoaderCircle, RefreshCw, RotateCcw, SearchX, Stethoscope, TriangleAlert, UserRound } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import DoctorWorkspaceShell from '@/components/doctor-workspace-shell'
import FormField from '@/components/form-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useApi } from '@/hooks/use-api'
import { getErrorMessage } from '@/lib/api'
import { formatTime, parseSlotDate, statusTone, toAppointmentsQuery } from '@/lib/secretary-appointments'
import { appointmentStatuses, depositPaymentStatuses, type PaginatedResult, type SecretaryAppointment, type SecretaryAppointmentFilters } from '@/types/secretary'

const pageSize = 12
const debounceMs = 400
const triggerClass = 'h-12 w-full rounded-xl border border-input bg-background/40 px-3 focus-visible:border-primary/50'
const buttonClass = 'h-11 rounded-xl text-sm font-bold normal-case tracking-normal'
const badgeClass = 'rounded-full border px-2.5 py-1 text-[10px] font-bold'
type TextFilter = 'doctorName' | 'patientSearch'

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
            <p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground sm:text-sm">{t('secretary.appointments.description')}</p>
          </div>
          <Button className={buttonClass + ' bg-primary px-5 text-primary-foreground hover:bg-primary/90'} render={<Link to="/secretary/guest-booking" search={{ doctorId: undefined }} />}><CalendarPlus />{t('secretary.guest.title')}</Button>
        </div>

        <Card className="mt-6 rounded-2xl border border-border bg-card">
          <CardHeader className="!pb-3 border-b border-border/40">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 font-sans text-xl font-bold normal-case tracking-normal">
                <span className="grid size-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"><Filter className="size-5" /></span>
                {t('secretary.appointments.filters')}
                {activeFilters > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">{activeFilters}</span>}
              </CardTitle>
              {activeFilters > 0 && <Button variant="outline" className={buttonClass} onClick={clearFilters}><RotateCcw />{t('secretary.appointments.clearFilters')}</Button>}
            </div>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <FormField id="secretaryPatientFilter" type="search" label={t('secretary.appointments.patient')} value={patientDraft} maxLength={100} placeholder={t('secretary.appointments.patientPlaceholder')} icon={<UserRound size={18} />} onChange={(event) => setPatientDraft(event.target.value)} />
              <FormField id="secretaryDoctorFilter" type="search" label={t('secretary.appointments.doctor')} value={doctorDraft} maxLength={100} placeholder={t('secretary.appointments.doctorPlaceholder')} icon={<Stethoscope size={18} />} onChange={(event) => setDoctorDraft(event.target.value)} />
              <FormField id="secretaryDateFilter" type="date" label={t('secretary.appointments.date')} value={search.slotDate ?? ''} icon={<CalendarDays size={18} />} onChange={(event) => setFilters({ slotDate: event.target.value || undefined })} />
              <div className="grid gap-2">
                <Label className="text-xs font-semibold text-foreground/80">{t('secretary.appointments.status')}</Label>
                <Select items={appointmentItems} value={search.appointmentStatus ?? 'all'} onValueChange={(value) => setFilters({ appointmentStatus: appointmentStatuses.find((item) => item === value) })}>
                  <SelectTrigger className={triggerClass}><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl border border-border bg-popover text-popover-foreground">
                    {appointmentItems.map((item) => <SelectItem className="rounded-lg" key={item.value} value={item.value}>{item.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <span id="secretaryPaymentFilter" className="text-xs font-semibold text-foreground/80">{t('secretary.appointments.depositStatus')}</span>
              <div role="radiogroup" aria-labelledby="secretaryPaymentFilter" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
                <div className="flex shrink-0 gap-1 rounded-full border border-border bg-card/70 p-1.5">
                  {paymentOptions.map((option) => {
                    const selected = search.depositPaymentStatus === option.value
                    return <button key={option.label} type="button" role="radio" aria-checked={selected} onClick={() => setFilters({ depositPaymentStatus: option.value })} className={`h-9 shrink-0 rounded-full px-4 text-sm font-bold whitespace-nowrap transition focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none motion-reduce:transition-none ${selected ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground'}`}>{option.label}</button>
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <section ref={resultsRef} className="mt-6 scroll-mt-24" aria-busy={appointments.isFetching}>
          {page && page.totalCount > 0 && <div className="mb-4 flex items-center gap-2 text-xs font-bold text-muted-foreground" role="status">
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

          {page && !page.items.length && <Card className="items-center rounded-3xl border border-dashed border-primary/25 bg-gradient-to-br from-primary/5 via-card to-warm/5 px-6 py-14 text-center">
            <span className="relative grid place-items-center">
              <span className="absolute inset-0 animate-ping rounded-3xl bg-primary/10 motion-reduce:animate-none" />
              <span className="relative grid size-20 place-items-center rounded-3xl bg-primary/10 text-primary shadow-inner">{activeFilters ? <SearchX className="size-9" /> : <CalendarDays className="size-9" />}</span>
            </span>
            <h2 className="mt-6 font-heading text-2xl font-bold sm:text-3xl">{t(activeFilters ? 'secretary.appointments.noMatchTitle' : 'secretary.appointments.emptyTitle')}</h2>
            <p className="mt-2 max-w-md text-xs leading-6 text-muted-foreground sm:text-sm">{t(activeFilters ? 'secretary.appointments.noMatchDescription' : 'secretary.appointments.emptyDescription')}</p>
            {activeFilters > 0 && <Button variant="outline" className={buttonClass + ' mt-5'} onClick={clearFilters}><RotateCcw />{t('secretary.appointments.clearFilters')}</Button>}
          </Card>}

          {page && page.items.length > 0 && <>
            <div className={`grid gap-6 transition-opacity motion-reduce:transition-none ${appointments.isPlaceholderData ? 'opacity-60' : ''}`}>
              {groupByDate(page.items).map((group) => {
                const date = parseSlotDate(group.date)
                const relative = date ? relativeDays[dayKey(date)] : undefined
                return <div key={group.date} className="grid gap-3">
                  <h2 className="flex items-center gap-2 text-sm font-bold">
                    <CalendarDays className="size-4 text-primary" />
                    {relative && <span className="text-primary">{relative} ·</span>}
                    {date ? date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : group.date}
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{group.items.length}</span>
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {group.items.map((appointment) => <Link key={appointment.appointmentId} to="/secretary/appointments/$appointmentId" params={{ appointmentId: String(appointment.appointmentId) }} search={search} className="group grid gap-4 rounded-2xl border border-border bg-card p-5 text-start transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                      <div className="flex items-start justify-between gap-3">
                        <span className="flex items-center gap-2 font-sans text-lg font-bold"><Clock3 className="size-4 text-primary" /><span dir="ltr">{formatTime(appointment.slotStartTime)} – {formatTime(appointment.slotEndTime)}</span></span>
                        <Badge className={`${badgeClass} ${statusTone(appointment.depositPaymentStatus)}`}>{t('secretary.appointments.deposit')}: {status(appointment.depositPaymentStatus)}</Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary/15"><UserRound className="size-5" /></span>
                        <div className="min-w-0 flex-1">
                          <strong className="block truncate font-sans text-lg font-bold leading-tight">{appointment.patientName}</strong>
                          <span className="mt-1 flex items-center gap-1.5 text-xs font-bold text-muted-foreground"><Stethoscope className="size-3.5 shrink-0" /><span className="truncate">{appointment.doctorName}</span></span>
                        </div>
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition group-hover:text-primary rtl:rotate-180" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2 border-t border-border/40 pt-3">
                        <Badge className={`${badgeClass} ${statusTone(appointment.appointmentStatus)}`}>{status(appointment.appointmentStatus)}</Badge>
                        {appointment.depositPaymentMethodType && <Badge className={`${badgeClass} border-border bg-background text-muted-foreground`}>{t('secretary.paymentMethod.' + appointment.depositPaymentMethodType, { defaultValue: appointment.depositPaymentMethodType })}</Badge>}
                        {appointment.remainingPaymentStatus && <Badge className={`${badgeClass} ${statusTone(appointment.remainingPaymentStatus)}`}>{t('secretary.appointments.remaining')}: {status(appointment.remainingPaymentStatus)}</Badge>}
                        {appointment.requiresManualRefundAction && <Badge className={`${badgeClass} border-warm/20 bg-warm/10 text-warm`}><TriangleAlert className="size-3" />{t('secretary.appointments.refundAction')}</Badge>}
                      </div>
                    </Link>)}
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
