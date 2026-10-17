import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Filter, LoaderCircle, RefreshCw, RotateCcw, Search, Stethoscope, TriangleAlert, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import DoctorWorkspaceShell from '@/components/doctor-workspace-shell'
import SecretaryAppointmentDialog from '@/components/secretary-appointment-dialog'
import FormField from '@/components/form-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useApi } from '@/hooks/use-api'
import { getErrorMessage } from '@/lib/api'
import { formatTime, parseSlotDate, statusTone } from '@/lib/secretary-appointments'
import { appointmentStatuses, paymentStatuses, type PaginatedResult, type SecretaryAppointment, type SecretaryAppointmentFilters } from '@/types/secretary'

const pageSize = 9
const emptyFilters: SecretaryAppointmentFilters = { doctorName: '', slotDate: '', appointmentStatus: '', paymentStatus: '', pageIndex: 1 }
const triggerClass = 'h-12 w-full rounded-xl border border-input bg-background/40 px-3 focus-visible:border-primary/50'
const outlineButton = 'h-11 rounded-xl text-sm font-bold normal-case tracking-normal'

function toQuery(filters: SecretaryAppointmentFilters) {
  const params = new URLSearchParams({ PageIndex: String(filters.pageIndex), PageSize: String(pageSize) })
  if (filters.doctorName.trim()) params.set('DoctorName', filters.doctorName.trim())
  if (filters.slotDate) params.set('SlotDate', filters.slotDate)
  if (filters.appointmentStatus) params.set('AppointmentStatus', filters.appointmentStatus)
  if (filters.paymentStatus) params.set('PaymentStatus', filters.paymentStatus)
  return params.toString()
}

export default function SecretaryAppointmentsPage() {
  const { t, i18n } = useTranslation()
  const api = useApi()
  const [draft, setDraft] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const [openId, setOpenId] = useState<number | null>(null)
  const locale = i18n.resolvedLanguage === 'ar' ? 'ar-EG' : 'en-EG'

  const appointments = useQuery({
    queryKey: ['secretary', 'appointments', 'list', filters],
    queryFn: () => api.request<PaginatedResult<SecretaryAppointment>>('/api/appointments/management?' + toQuery(filters), {}, { notifyOnError: false }),
    placeholderData: keepPreviousData,
  })
  const page = appointments.data
  const status = (value: string) => t('secretary.status.' + value, { defaultValue: value })
  const statusItems = (values: readonly string[]) => [{ value: 'all', label: t('secretary.appointments.all') }, ...values.map((value) => ({ value, label: status(value) }))]

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFilters({ ...draft, pageIndex: 1 })
  }
  function reset() { setDraft(emptyFilters); setFilters(emptyFilters) }
  function goTo(pageIndex: number) { setFilters((current) => ({ ...current, pageIndex })) }

  return (
    <DoctorWorkspaceShell active="secretary-appointments">
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-10">
        <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-primary uppercase"><CalendarDays className="size-3" />{t('secretary.workspace')}</Badge>
        <h1 className="mt-2 font-sans text-3xl font-bold sm:text-4xl">{t('secretary.appointments.title')}</h1>
        <p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground sm:text-sm">{t('secretary.appointments.description')}</p>

        <Card className="mt-6 rounded-2xl border border-border bg-card">
          <CardHeader className="!pb-3 border-b border-border/40">
            <CardTitle className="flex items-center gap-2 font-sans text-xl font-bold normal-case tracking-normal">
              <span className="grid size-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"><Filter className="size-5" /></span>{t('secretary.appointments.filters')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4" onSubmit={apply}>
              <FormField id="secretaryDoctorFilter" label={t('secretary.appointments.doctor')} value={draft.doctorName} maxLength={100} placeholder={t('secretary.appointments.doctorPlaceholder')} icon={<Search size={18} />} onChange={(event) => setDraft({ ...draft, doctorName: event.target.value })} />
              <FormField id="secretaryDateFilter" type="date" label={t('secretary.appointments.date')} value={draft.slotDate} icon={<CalendarDays size={18} />} onChange={(event) => setDraft({ ...draft, slotDate: event.target.value })} />
              {(['appointmentStatus', 'paymentStatus'] as const).map((key) => {
                const items = statusItems(key === 'appointmentStatus' ? appointmentStatuses : paymentStatuses)
                return <div key={key} className="grid gap-2">
                  <Label className="text-xs font-semibold text-foreground/80">{t(key === 'appointmentStatus' ? 'secretary.appointments.status' : 'secretary.appointments.payment')}</Label>
                  <Select items={items} value={draft[key] || 'all'} onValueChange={(value) => setDraft({ ...draft, [key]: value === 'all' || !value ? '' : value })}>
                    <SelectTrigger className={triggerClass}><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl border border-border bg-popover text-popover-foreground">
                      {items.map((item) => <SelectItem className="rounded-lg" key={item.value} value={item.value}>{item.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              })}
              <div className="flex flex-wrap gap-2 sm:col-span-2 xl:col-span-4">
                <Button type="submit" className={outlineButton + ' bg-primary px-5 text-primary-foreground hover:bg-primary/90'}><Search />{t('secretary.appointments.apply')}</Button>
                <Button type="button" variant="outline" className={outlineButton} onClick={reset}><RotateCcw />{t('secretary.appointments.reset')}</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6">
          {appointments.isLoading && <p role="status" className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />{t('secretary.appointments.loading')}</p>}
          {appointments.isError && <Card className="items-center rounded-3xl border border-destructive/20 bg-card p-8 text-center">
            <p className="text-sm font-bold text-destructive">{getErrorMessage(appointments.error)}</p>
            <Button variant="outline" className={outlineButton + ' mt-3'} disabled={appointments.isFetching} onClick={() => appointments.refetch()}>{appointments.isFetching ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <RefreshCw />}{t('invitations.retry')}</Button>
          </Card>}
          {page && !page.items.length && <Card className="items-center rounded-3xl border border-dashed border-primary/25 bg-gradient-to-br from-primary/5 via-card to-warm/5 px-6 py-14 text-center">
            <span className="relative grid place-items-center">
              <span className="absolute inset-0 animate-ping rounded-3xl bg-primary/10 motion-reduce:animate-none" />
              <span className="relative grid size-20 place-items-center rounded-3xl bg-primary/10 text-primary shadow-inner"><CalendarDays className="size-9" /></span>
            </span>
            <h2 className="mt-6 font-heading text-2xl font-bold sm:text-3xl">{t('secretary.appointments.emptyTitle')}</h2>
            <p className="mt-2 max-w-md text-xs leading-6 text-muted-foreground sm:text-sm">{t('secretary.appointments.emptyDescription')}</p>
          </Card>}
          {page && page.items.length > 0 && <>
            <div className={`grid gap-4 md:grid-cols-2 xl:grid-cols-3 ${appointments.isPlaceholderData ? 'opacity-60' : ''}`}>
              {page.items.map((appointment) => {
                const date = parseSlotDate(appointment.slotDate)
                return <button key={appointment.appointmentId} type="button" onClick={() => setOpenId(appointment.appointmentId)} className="grid gap-4 rounded-2xl border border-border bg-card p-5 text-start transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none motion-reduce:transition-none">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusTone(appointment.appointmentStatus)}`}>{status(appointment.appointmentStatus)}</Badge>
                    <Badge className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusTone(appointment.paymentStatus)}`}>{status(appointment.paymentStatus)}</Badge>
                    {appointment.requiresManualRefundAction && <Badge className="rounded-full border border-warm/20 bg-warm/10 px-2.5 py-1 text-[10px] font-bold text-warm"><TriangleAlert className="size-3" />{t('secretary.appointments.refundAction')}</Badge>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><UserRound className="size-5" /></span>
                    <div className="min-w-0"><small className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{t('secretary.appointments.patient')}</small><strong className="block truncate font-sans text-lg font-bold leading-tight">{appointment.patientName}</strong></div>
                  </div>
                  <div className="grid gap-2 text-xs font-bold text-muted-foreground">
                    <span className="flex items-center gap-2"><Stethoscope className="size-3.5 shrink-0 text-primary" /><span className="truncate">{appointment.doctorName}</span></span>
                    <span className="flex items-center gap-2"><CalendarDays className="size-3.5 shrink-0 text-primary" />{date ? date.toLocaleDateString(locale, { dateStyle: 'medium' }) : appointment.slotDate}</span>
                    <span className="flex items-center gap-2"><Clock3 className="size-3.5 shrink-0 text-primary" /><span dir="ltr">{formatTime(appointment.startTime)} – {formatTime(appointment.endTime)}</span></span>
                  </div>
                </button>
              })}
            </div>
            {page.totalPages > 1 && <nav aria-label={t('secretary.appointments.pagination')} className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold text-muted-foreground">{t('secretary.appointments.pageOf', { page: page.pageIndex, total: page.totalPages })}</span>
              <div className="flex gap-2">
                <Button variant="outline" className={outlineButton} disabled={page.pageIndex <= 1 || appointments.isFetching} onClick={() => goTo(page.pageIndex - 1)}><ChevronLeft className="rtl:rotate-180" />{t('secretary.appointments.previous')}</Button>
                <Button variant="outline" className={outlineButton} disabled={page.pageIndex >= page.totalPages || appointments.isFetching} onClick={() => goTo(page.pageIndex + 1)}>{t('secretary.appointments.next')}<ChevronRight className="rtl:rotate-180" /></Button>
              </div>
            </nav>}
          </>}
        </div>
      </div>
      <SecretaryAppointmentDialog appointmentId={openId} onClose={() => setOpenId(null)} />
    </DoctorWorkspaceShell>
  )
}
