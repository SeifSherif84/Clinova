import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from '@tanstack/react-router'
import { arEG } from '@daypicker/react/locale/ar-EG'
import { ArrowLeft, CalendarClock, CalendarDays, Clock3, LoaderCircle, RefreshCw, Stethoscope, TriangleAlert, UserRound } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import ConfirmationDialog from '@/components/confirmation-dialog'
import DoctorWorkspaceShell from '@/components/doctor-workspace-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useApi } from '@/hooks/use-api'
import { ApiError, getErrorMessage } from '@/lib/api'
import { egyptToday, monthRange, toIsoDate } from '@/lib/guest-reservation'
import { formatTime, parseSlotDate } from '@/lib/secretary-appointments'
import type { AvailableDay, AvailableSlot } from '@/types/guest-reservation'
import type { SecretaryAppointmentDetails } from '@/types/secretary'

const button = 'h-10 rounded-xl px-4 text-[13px] font-bold normal-case tracking-normal'
const primaryButton = button + ' bg-primary text-primary-foreground hover:bg-primary/90'
const grayButton = button + ' border-transparent bg-foreground/5 text-foreground shadow-none hover:bg-foreground/10 dark:border-transparent dark:bg-foreground/5 dark:hover:bg-foreground/10'
const spinner = <LoaderCircle className="animate-spin motion-reduce:animate-none" />

function SectionCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return <Card className="min-w-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0">
    <div className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-primary/15 via-primary/[0.05] to-transparent p-3.5 dark:bg-none">
      <span className="pointer-events-none absolute -end-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl dark:hidden" />
      <div className="relative flex items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10 [&>svg]:size-4.5">{icon}</span>
        <h3 className="min-w-0 flex-1 truncate font-sans text-base font-bold">{title}</h3>
      </div>
    </div>
    <CardContent className="grid gap-5 p-5">{children}</CardContent>
  </Card>
}

function SummaryRow({ icon, label, last = false, children }: { icon: ReactNode; label: string; last?: boolean; children: ReactNode }) {
  return <div className={`flex items-baseline justify-between gap-3 py-3 ${last ? '' : 'border-b border-dashed border-border/70'}`}>
    <span className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase [&>svg]:size-4 [&>svg]:text-primary/70">{icon}{label}</span>
    <span className="text-end text-sm font-bold">{children}</span>
  </div>
}

export default function SecretaryReschedulePage() {
  const { t, i18n } = useTranslation()
  const api = useApi()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { appointmentId } = useParams({ from: '/secretary/appointments/$appointmentId/reschedule' })
  const id = Number(appointmentId)
  const validId = Number.isInteger(id) && id > 0
  const today = egyptToday()
  const firstMonth = useMemo(() => { const [year, month] = today.split('-').map(Number); return new Date(year, month - 1, 1) }, [today])
  const [month, setMonth] = useState(firstMonth)
  const [date, setDate] = useState('')
  const [slotId, setSlotId] = useState('')
  const [target, setTarget] = useState<{ slot: AvailableSlot; date: string } | null>(null)
  const range = monthRange(month)
  const language = i18n.resolvedLanguage
  const formatDate = (value: string) => parseSlotDate(value)?.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-EG', { weekday: 'long', day: 'numeric', month: 'long' }) ?? value
  const describe = (day: string, start: string, end: string) => `${formatDate(day)} · ${formatTime(start)} – ${formatTime(end)}`

  // Same key as the details page so both share one cached copy of the appointment.
  const details = useQuery({
    queryKey: ['secretary', 'appointments', 'details', id],
    queryFn: () => api.request<SecretaryAppointmentDetails>(`/api/appointments/${id}/management`, {}, { notifyOnError: false }),
    enabled: validId,
    retry: (count, error) => !(error instanceof ApiError && (error.status === 403 || error.status === 404)) && count < 2,
  })
  const data = details.data
  const eligible = data?.appointmentStatus === 'Confirmed'

  const days = useQuery({
    queryKey: ['secretary', 'reschedule', id, 'days', range?.from, range?.to],
    queryFn: () => api.request<AvailableDay[]>(`/api/appointment-slots/secretary-reschedule/appointments/${id}/available-days?from=${range!.from}&to=${range!.to}`, {}, { notifyOnError: false }),
    enabled: Boolean(eligible && range),
  })
  const slots = useQuery({
    queryKey: ['secretary', 'reschedule', id, 'slots', date],
    queryFn: () => api.request<AvailableSlot[]>(`/api/appointment-slots/secretary-reschedule/appointments/${id}/available-slots?date=${date}`, {}, { notifyOnError: false }),
    enabled: Boolean(eligible && date),
  })
  const reschedule = useMutation({
    mutationFn: (newSlotId: number) => api.request<{ message?: string }>(`/api/appointments/${id}/management/reschedule`, { method: 'PATCH', body: JSON.stringify({ newAppointmentSlotId: newSlotId }) }, { notifyOnError: false }),
    onSuccess: (result) => {
      // The details page shows this as a toast once we're back there.
      try { sessionStorage.setItem('secretary-flash-message', result?.message ?? t('secretary.reschedule.successTitle', { defaultValue: 'Appointment rescheduled' })) } catch { /* storage unavailable: skip the toast */ }
      setTarget(null)
      router.history.back()
    },
    // A failure usually means the slot or the appointment changed, so refresh everything.
    onSettled: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: ['secretary', 'appointments'] }),
      queryClient.invalidateQueries({ queryKey: ['secretary', 'reschedule'] }),
    ]),
  })

  const available = useMemo(() => new Set(days.data?.map((day) => day.date)), [days.data])
  const slot = slots.data?.find((item) => String(item.id) === slotId)
  const notSelected = <span className="font-medium text-muted-foreground">{t('secretary.guest.notSelected')}</span>

  function selectDay(value?: Date) {
    setDate(value ? toIsoDate(value) : ''); setSlotId('')
  }
  function closeDialog(open: boolean) {
    if (open || reschedule.isPending) return
    if (reschedule.isError) setSlotId('')
    setTarget(null); reschedule.reset()
  }

  const backLink = (
    <button type="button" className="flex cursor-pointer items-center gap-1.5 text-sm font-bold text-muted-foreground transition hover:text-foreground" onClick={() => router.history.back()}>
      <ArrowLeft className="size-4 rtl:rotate-180" />
      {t('secretary.reschedule.back', { defaultValue: 'Back to appointment' })}
    </button>
  )

  return (
    <DoctorWorkspaceShell active="secretary-appointments" topBackLink={backLink}>
      <div className="mx-auto w-full min-w-0 max-w-screen-2xl p-4 sm:p-6 lg:p-10">
        <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-primary uppercase"><CalendarClock className="size-3" />{t('secretary.workspace')}</Badge>
        <h1 className="mt-2 font-sans text-3xl font-bold sm:text-4xl">{t('secretary.reschedule.title', { defaultValue: 'Reschedule appointment' })}</h1>
        <p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground sm:text-sm">{t('secretary.reschedule.description', { defaultValue: 'Pick a new day and time with the same doctor. The patient will be notified.' })}</p>

        <div className="mt-6">

          {validId && details.isLoading && <p role="status" className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />{t('secretary.appointments.loadingDetails')}</p>}

          {(!validId || details.isError) && <Card className="items-center rounded-3xl border border-destructive/20 bg-card p-8 text-center">
            <p className="text-sm font-bold text-destructive">{validId ? getErrorMessage(details.error) : t('secretary.appointments.notFoundTitle')}</p>
            {validId && <Button variant="outline" className={grayButton + ' mt-3'} disabled={details.isFetching} onClick={() => details.refetch()}>{details.isFetching ? spinner : <RefreshCw />}{t('errors.tryAgain')}</Button>}
          </Card>}

          {data && !eligible && <Card className="items-center rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center">
            <span className="grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground"><TriangleAlert className="size-6" /></span>
            <h2 className="mt-4 font-sans text-xl font-bold">{t('secretary.reschedule.notEligibleTitle', { defaultValue: 'This appointment can’t be rescheduled' })}</h2>
            <p className="mt-2 max-w-md text-xs leading-6 text-muted-foreground sm:text-sm">{t('secretary.reschedule.notEligibleDescription', { defaultValue: 'Only confirmed appointments can be moved to a new time.' })}</p>
            <Button type="button" variant="outline" className={grayButton + ' mt-5'} onClick={() => router.history.back()}><ArrowLeft className="rtl:rotate-180" />{t('secretary.reschedule.back', { defaultValue: 'Back to appointment' })}</Button>
          </Card>}

          {data && eligible && <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,1fr)]">
            <div className="grid min-w-0 content-start gap-5">
              <SectionCard icon={<CalendarDays className="size-5" />} title={t('secretary.guest.scheduleStep')}>
                <div className="grid gap-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-0">
                  <div className="grid content-start gap-3 lg:pe-8">
                    <Label className="text-sm font-bold text-foreground">{t('secretary.guest.dayLabel')}</Label>
                    <div className="relative justify-self-start">
                      <Calendar
                        mode="single"
                        selected={date ? parseSlotDate(date) ?? undefined : undefined}
                        onSelect={selectDay}
                        month={month}
                        onMonthChange={(value) => { setMonth(value); setDate(''); setSlotId('') }}
                        startMonth={firstMonth}
                        showOutsideDays={false}
                        locale={language === 'ar' ? arEG : undefined}
                        dir={i18n.dir()}
                        disabled={(day) => days.isFetching || !available.has(toIsoDate(day))}
                        modifiers={{ available: (day) => available.has(toIsoDate(day)) }}
                        modifiersClassNames={{ available: '[&>button]:bg-primary/10 [&>button]:font-bold [&>button]:text-primary' }}
                      />
                      {days.isFetching && <span role="status" className="absolute inset-0 grid place-items-center rounded-2xl bg-card/60 backdrop-blur-[1px]"><span className="flex items-center gap-2 text-xs font-bold text-muted-foreground"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />{t('secretary.guest.loadingDays')}</span></span>}
                    </div>
                    {days.isError && <p role="alert" className="max-w-80 text-xs font-bold text-destructive">{getErrorMessage(days.error)}</p>}
                    {days.data && !days.data.length && !days.isFetching && <div className="flex max-w-80 items-center gap-3 rounded-2xl border border-warm/20 bg-warm/10 p-3.5">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-warm/15 text-warm"><CalendarDays className="size-4" /></span>
                      <p className="min-w-0 flex-1 text-xs leading-5 font-semibold text-foreground/80">{t('secretary.guest.noDays')}</p>
                    </div>}
                  </div>
                  <div className="grid min-w-0 content-start gap-3 lg:border-s lg:border-border/50 lg:ps-8">
                    <div className="grid gap-1">
                      <Label className="text-sm font-bold text-foreground">{t('secretary.guest.timeLabel')}</Label>
                      {date && <span className="text-sm font-semibold text-primary">{formatDate(date)}</span>}
                    </div>
                    {!date && <div className="grid min-h-56 place-content-center justify-items-center gap-3 text-center">
                      <span className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary"><CalendarDays className="size-6" /></span>
                      <p className="max-w-56 text-sm font-semibold leading-6 text-muted-foreground">{t('secretary.guest.pickDayFirst')}</p>
                    </div>}
                    {date && slots.isLoading && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />{t('secretary.guest.loadingSlots')}</p>}
                    {date && slots.isError && <p role="alert" className="text-xs font-bold text-destructive">{getErrorMessage(slots.error)}</p>}
                    {date && slots.data && !slots.data.length && <p className="text-xs leading-6 text-muted-foreground sm:text-sm">{t('secretary.guest.noSlots')}</p>}
                    {date && slots.data && slots.data.length > 0 && <RadioGroup aria-label={t('secretary.guest.timeLabel')} value={slotId} onValueChange={(value) => setSlotId(String(value))} className="mt-1 grid grid-cols-2 gap-2.5">
                      {slots.data.map((item) => <label key={item.id} className="group relative flex min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-background/45 px-2.5 py-3 text-sm font-bold whitespace-nowrap tabular-nums transition not-has-[[data-checked]]:hover:-translate-y-0.5 not-has-[[data-checked]]:hover:bg-primary/5 dark:not-has-[[data-checked]]:hover:bg-transparent motion-reduce:transition-none motion-reduce:hover:translate-y-0 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/20 has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary has-[[data-checked]]:text-primary-foreground has-[[data-checked]]:shadow-md has-[[data-checked]]:shadow-primary/25">
                        <RadioGroupItem value={String(item.id)} className="pointer-events-none absolute size-px opacity-0" />
                        <Clock3 aria-hidden="true" className="size-4 shrink-0 stroke-[2.25] opacity-80" />
                        <span dir="ltr">{formatTime(item.startTime)} – {formatTime(item.endTime)}</span>
                      </label>)}
                    </RadioGroup>}
                  </div>
                </div>
              </SectionCard>
            </div>

            <div className="min-w-0">
              <Card className="min-w-0 gap-0 overflow-hidden rounded-2xl border-2 border-dashed border-primary/25 bg-gradient-to-b from-primary/[0.07] via-primary/[0.03] to-card p-0 shadow-lg shadow-primary/10 xl:sticky xl:top-24">
                <div className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-primary/15 via-primary/[0.05] to-transparent p-3.5 dark:bg-none">
                  <span className="pointer-events-none absolute -end-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl dark:hidden" />
                  <div className="relative flex items-center gap-2.5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10"><CalendarClock className="size-4.5" /></span>
                    <h3 className="min-w-0 flex-1 truncate font-sans text-base font-bold">{t('secretary.reschedule.summaryTitle', { defaultValue: 'Reschedule summary' })}</h3>
                  </div>
                </div>
                <CardContent className="grid gap-3 p-5">
                  <div className="grid">
                    <SummaryRow icon={<UserRound />} label={t('secretary.appointments.patient')}>{data.patientName}</SummaryRow>
                    <SummaryRow icon={<Stethoscope />} label={t('secretary.guest.doctor')}>{data.doctorName}</SummaryRow>
                    <SummaryRow icon={<CalendarClock />} label={t('secretary.reschedule.current', { defaultValue: 'Current time' })}>
                      <span className="grid justify-items-end gap-0.5">
                        <span>{formatDate(data.slotDate)}</span>
                        <span dir="ltr">{formatTime(data.slotStartTime)} – {formatTime(data.slotEndTime)}</span>
                      </span>
                    </SummaryRow>
                    <SummaryRow icon={<CalendarDays />} label={t('secretary.reschedule.newDate', { defaultValue: 'New date' })}>{date ? formatDate(date) : notSelected}</SummaryRow>
                    <SummaryRow icon={<Clock3 />} label={t('secretary.reschedule.newTime', { defaultValue: 'New time' })} last>{slot ? <span dir="ltr">{formatTime(slot.startTime)} – {formatTime(slot.endTime)}</span> : notSelected}</SummaryRow>
                  </div>

                  <div aria-hidden="true" className="-mt-3 border-t border-dashed border-border" />

                  <Button type="button" className={primaryButton + ' w-full'} disabled={!slot || reschedule.isPending} onClick={() => slot && setTarget({ slot, date })}>{reschedule.isPending ? spinner : <CalendarClock />}{t('secretary.reschedule.submit', { defaultValue: 'Reschedule' })}</Button>
                </CardContent>
              </Card>
            </div>
          </div>}
        </div>
      </div>

      <ConfirmationDialog
        open={Boolean(target)}
        title={t('secretary.reschedule.confirmTitle', { defaultValue: 'Reschedule this appointment?' })}
        description={target && data ? t('secretary.reschedule.confirmDescription', { defaultValue: 'The appointment will move from {{from}} to {{to}}. The patient will be notified.', from: describe(data.slotDate, data.slotStartTime, data.slotEndTime), to: describe(target.date, target.slot.startTime, target.slot.endTime) }) : ''}
        confirmLabel={t('secretary.reschedule.confirm', { defaultValue: 'Reschedule' })}
        cancelLabel={t('secretary.reschedule.keep', { defaultValue: 'Keep current time' })}
        pending={reschedule.isPending}
        error={reschedule.error ? getErrorMessage(reschedule.error) : undefined}
        onConfirm={() => target && reschedule.mutate(target.slot.id)}
        onOpenChange={closeDialog}
      />
    </DoctorWorkspaceShell>
  )
}