import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, CalendarClock, CircleAlert, LoaderCircle, RefreshCw, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Notice from '@/components/notice'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useApi } from '@/hooks/use-api'
import { getErrorMessage } from '@/lib/api'
import { formatClock, parseDay } from '@/lib/patient-appointments'
import type { PatientAppointmentDetails } from '@/types/patient-appointment'

interface AvailableDay { dayName: string; date: string }
interface AvailableSlot { id: number; startTime: string; endTime: string }

const horizonDays = 30
const grayButton = 'h-10 cursor-pointer rounded-xl bg-foreground/5 px-4 text-[13px] font-bold normal-case tracking-normal text-foreground hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-primary/30'
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const sameTime = (a: string, b: string) => a.slice(0, 5) === b.slice(0, 5)

export default function RescheduleAppointmentDialog({ d, onClose, onDone }: { d: PatientAppointmentDetails; onClose: () => void; onDone: (message: string) => void }) {
  const { t, i18n } = useTranslation()
  const api = useApi()
  const queryClient = useQueryClient()
  const locale = i18n.resolvedLanguage === 'ar' ? 'ar-EG' : 'en-EG'
  const tr = (key: string, defaultValue: string, options?: Record<string, string | number>) => t('patientPortal.appointments.reschedule.' + key, { defaultValue, ...options })
  const base = ['patient', 'appointments', 'reschedule', d.appointmentId] as const

  const [date, setDate] = useState<string | null>(null)
  const [slotId, setSlotId] = useState<number | null>(null)
  const [step, setStep] = useState<'pick' | 'confirm'>('pick')
  const range = useMemo(() => { const from = new Date(); const to = new Date(); to.setDate(to.getDate() + horizonDays); return { from: iso(from), to: iso(to) } }, [])

  const days = useQuery({
    queryKey: [...base, 'days', range.from],
    queryFn: () => api.request<AvailableDay[]>(`/api/appointment-slots/patient-reschedule/appointments/${d.appointmentId}/available-days?From=${range.from}&To=${range.to}`, {}, { notifyOnError: false }),
    gcTime: 0,
    retry: false,
  })
  const slots = useQuery({
    queryKey: [...base, 'slots', date],
    queryFn: () => api.request<AvailableSlot[]>(`/api/appointment-slots/patient-reschedule/appointments/${d.appointmentId}/available-slots?Date=${date}`, {}, { notifyOnError: false }),
    enabled: date != null,
    gcTime: 0,
    retry: false,
  })
  const reschedule = useMutation({
    mutationFn: (newAppointmentSlotId: number) => api.request<{ message: string }>(`/api/appointments/${d.appointmentId}/reschedule`, { method: 'PATCH', body: JSON.stringify({ newAppointmentSlotId }) }, { notifyOnError: false }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['patient', 'appointments'] })
      onDone(result.message)
      onClose()
    },
    // The slot may have been taken or the appointment may no longer be eligible: reload everything and let the patient retry.
    onError: () => {
      setStep('pick'); setSlotId(null)
      void days.refetch(); if (date) void slots.refetch()
      void queryClient.invalidateQueries({ queryKey: ['patient', 'appointments', 'details', d.appointmentId] })
    },
  })

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape' && !reschedule.isPending) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, reschedule.isPending])

  // The current slot is never offered as a new time.
  const options = (slots.data ?? []).filter((slot) => !(date === d.slotDate && sameTime(slot.startTime, d.slotStartTime)))
  const selected = options.find((slot) => slot.id === slotId)
  const fmtDate = (value: string) => parseDay(value).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })
  const fmtRange = (day: string, start: string, end: string) => `${formatClock(day, start, locale)} – ${formatClock(day, end, locale)}`
  const retry = t('errors.tryAgain')

  function chooseDate(value: string) {
    if (value === date) return
    setDate(value); setSlotId(null); reschedule.reset()
  }

  return <div className="fixed inset-0 z-50 grid place-items-end bg-black/60 backdrop-blur-sm sm:place-items-center sm:p-4" onClick={() => { if (!reschedule.isPending) onClose() }}>
    <div role="dialog" aria-modal="true" aria-label={tr('title', 'Reschedule appointment')} onClick={(event) => event.stopPropagation()} className="max-h-[92svh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-border bg-card shadow-2xl sm:rounded-3xl">
      <div className="sticky top-0 z-10 relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-primary/15 via-primary/[0.05] to-transparent p-3.5 pe-14 dark:bg-none">
        <span className="pointer-events-none absolute -end-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl dark:hidden" />
        <div className="relative flex items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10"><CalendarClock className="size-4.5" /></span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-sans text-base font-bold normal-case tracking-normal">{tr('title', 'Reschedule appointment')}</h3>
          </div>
        </div>
        <button type="button" aria-label={tr('close', 'Close')} disabled={reschedule.isPending} onClick={onClose} className="absolute end-3 top-1/2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-lg bg-foreground/5 hover:bg-foreground/10 disabled:opacity-50"><X className="size-4" /></button>
      </div>

      <div className="grid gap-5 p-5">
        <div className="relative isolate overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-primary/5">
          <span aria-hidden="true" className="pointer-events-none absolute -end-10 -top-10 -z-10 size-32 rounded-full bg-primary/10 blur-2xl" />
          <div className="flex items-start gap-3 p-4">
            <CircleAlert className="mt-0.5 size-6 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-sm font-bold">{tr('sameTitle', 'Reschedule with the same doctor & clinic')}</p>
              <p className="mt-1 text-[13px] leading-6 font-medium text-muted-foreground">{tr('sameText', 'Your appointment will be moved to another available time with the same doctor at the same clinic. You cannot change the doctor or clinic when rescheduling.')}</p>
            </div>
          </div>
          <div className="grid divide-y divide-border/50 border-t border-border/50 bg-card/60 sm:grid-cols-2 sm:divide-x sm:divide-y-0 rtl:sm:divide-x-reverse">
            <div className="min-w-0 px-4 py-3">
              <small className="block text-[11px] font-semibold text-muted-foreground">{tr('doctorLabel', 'Doctor')}</small>
              <strong className="block truncate text-sm font-bold">{d.doctorName}</strong>
            </div>
            <div className="min-w-0 px-4 py-3">
              <small className="block text-[11px] font-semibold text-muted-foreground">{tr('clinicLabel', 'Clinic')}</small>
              <strong className="block truncate text-sm font-bold">{d.clinicName}</strong>
            </div>
          </div>
        </div>

        {reschedule.error && <Notice message={getErrorMessage(reschedule.error)} />}

        {step === 'pick' && <>
          <div>
            <p className="text-[13px] font-bold tracking-wider text-muted-foreground uppercase">1 · {tr('chooseDay', 'Choose a day')}</p>
            {days.isLoading && <div className="mt-2 flex gap-2">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-20 w-16 shrink-0 rounded-2xl" />)}</div>}
            {days.isError && <div className="mt-2 flex flex-wrap items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
              <p className="min-w-0 flex-1 text-sm font-bold text-destructive">{getErrorMessage(days.error)}</p>
              <Button type="button" variant="ghost" className={grayButton} disabled={days.isFetching} onClick={() => days.refetch()}><RefreshCw className="size-4" />{retry}</Button>
            </div>}
            {days.data && days.data.length === 0 && <p className="mt-2 rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">{tr('noDays', 'No available days in the next 30 days.')}</p>}
            {days.data && days.data.length > 0 && <div role="radiogroup" aria-label={tr('chooseDay', 'Choose a day')} className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-2">
              {days.data.map((day) => {
                const value = parseDay(day.date)
                const active = day.date === date
                return <button key={day.date} type="button" role="radio" aria-checked={active} onClick={() => chooseDate(day.date)} className={`grid w-16 shrink-0 cursor-pointer justify-items-center gap-0.5 rounded-2xl border py-3 transition focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none motion-reduce:transition-none ${active ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'border-border hover:border-primary/30'}`}>
                  <span className="text-[11px] font-bold uppercase opacity-80">{value.toLocaleDateString(locale, { weekday: 'short' })}</span>
                  <span className="font-sans text-xl font-bold tabular-nums">{value.toLocaleDateString(locale, { day: 'numeric' })}</span>
                  <span className="text-[11px] font-semibold opacity-80">{value.toLocaleDateString(locale, { month: 'short' })}</span>
                </button>
              })}
            </div>}
          </div>

          <div>
            <p className="text-[13px] font-bold tracking-wider text-muted-foreground uppercase">2 · {tr('chooseTime', 'Choose a time')}</p>
            {date == null && <p className="mt-2 text-sm text-muted-foreground">{tr('dayFirst', 'Select a day to see available times.')}</p>}
            {slots.isLoading && <div className="mt-2 grid grid-cols-3 gap-2">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}</div>}
            {slots.isError && <div className="mt-2 flex flex-wrap items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
              <p className="min-w-0 flex-1 text-sm font-bold text-destructive">{getErrorMessage(slots.error)}</p>
              <Button type="button" variant="ghost" className={grayButton} disabled={slots.isFetching} onClick={() => slots.refetch()}><RefreshCw className="size-4" />{retry}</Button>
            </div>}
            {slots.data && options.length === 0 && <p className="mt-2 rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">{tr('noSlots', 'No available times on this day.')}</p>}
            {options.length > 0 && <div role="radiogroup" aria-label={tr('chooseTime', 'Choose a time')} className="mt-2 grid grid-cols-3 gap-2">
              {options.map((slot) => {
                const active = slot.id === slotId
                return <button key={slot.id} type="button" role="radio" aria-checked={active} onClick={() => setSlotId(slot.id)} className={`h-10 cursor-pointer rounded-xl border text-[13px] font-bold tabular-nums transition focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none motion-reduce:transition-none ${active ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25' : 'border-border hover:border-primary/30 hover:bg-primary/5'}`}>
                  {formatClock(date as string, slot.startTime, locale)}
                </button>
              })}
            </div>}
          </div>

          <Button type="button" className="h-12 w-full cursor-pointer rounded-xl text-sm font-bold normal-case tracking-normal" disabled={!selected} onClick={() => setStep('confirm')}>
            {tr('continue', 'Confirm reschedule')}<ArrowRight className="size-4 rtl:rotate-180" />
          </Button>
        </>}

        {step === 'confirm' && date && selected && <>
          <div className="grid gap-3">
            <div className="grid items-stretch gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">{tr('current', 'Current appointment')}</p>
                <p className="mt-3 text-sm font-semibold text-muted-foreground">{fmtDate(d.slotDate)}</p>
                <p dir="ltr" className="mt-1 text-start font-sans text-xl font-bold tabular-nums text-muted-foreground line-through decoration-muted-foreground/50">{fmtRange(d.slotDate, d.slotStartTime, d.slotEndTime)}</p>
              </div>
              <span aria-hidden="true" className="grid place-items-center text-muted-foreground"><ArrowRight className="size-5 rotate-90 sm:rotate-0 rtl:sm:rotate-180" /></span>
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-sm shadow-primary/10">
                <p className="text-[11px] font-bold tracking-wider text-primary uppercase">{tr('next', 'New appointment')}</p>
                <p className="mt-3 text-sm font-semibold text-foreground/80">{fmtDate(date)}</p>
                <p dir="ltr" className="mt-1 text-start font-sans text-xl font-bold tabular-nums text-primary">{fmtRange(date, selected.startTime, selected.endTime)}</p>
              </div>
            </div>
            <p className="text-[13px] leading-6 font-medium text-muted-foreground">{tr('moveNote', 'Your appointment will be moved to the new time. Payment details stay the same.')}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="ghost" className={grayButton + ' w-full'} disabled={reschedule.isPending} onClick={() => setStep('pick')}>{tr('goBack', 'Go back')}</Button>
            <Button type="button" className="h-10 w-full cursor-pointer rounded-xl text-[13px] font-bold normal-case tracking-normal" disabled={reschedule.isPending} onClick={() => reschedule.mutate(selected.id)}>
              {reschedule.isPending && <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />}{tr('confirm', 'Confirm reschedule')}
            </Button>
          </div>
        </>}
      </div>
    </div>
  </div>
}