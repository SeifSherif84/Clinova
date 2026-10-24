import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useSearch } from '@tanstack/react-router'
import { ArrowLeftRight, Ban, Banknote, CalendarCheck2, CalendarDays, CalendarPlus, CircleCheckBig, Clock3, LoaderCircle, Phone, ReceiptText, RefreshCw, RotateCcw, Stethoscope, Timer, TriangleAlert, UserRound, Wallet } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { arEG } from 'react-day-picker/locale'
import ClinicNotAssigned from '@/components/clinic-not-assigned'
import ConfirmationDialog from '@/components/confirmation-dialog'
import DoctorAvatar from '@/components/doctor-avatar'
import DoctorWorkspaceShell from '@/components/doctor-workspace-shell'
import FormField from '@/components/form-field'
import Notice from '@/components/notice'
import ProviderLogo from '@/components/payment-provider-logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Progress, ProgressLabel } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useApi } from '@/hooks/use-api'
import { useSecretaryClinic, useSecretaryClinicMembers } from '@/hooks/use-secretary-clinic'
import { getErrorMessage } from '@/lib/api'
import { depositAmount, egyptianPhonePattern, egyptToday, formatMoney, isNotAssignedError, monthRange, readHeldReservation, storeHeldReservation, toIsoDate } from '@/lib/guest-reservation'
import { formatTime, parseSlotDate } from '@/lib/secretary-appointments'
import type { LookupOption } from '@/types/auth'
import type { ClinicDetails } from '@/types/clinic'
import { isManualPaymentProvider } from '@/types/manual-payment-method'
import { BookingType, GuestPaymentMethod, type AvailableDay, type AvailableSlot, type ConfirmGuestPaymentRequest, type CreateGuestReservationRequest, type GuestCheckoutAccount, type GuestReservationCheckout, type HeldReservation } from '@/types/guest-reservation'

const holdMs = 30 * 60 * 1000
const button = 'h-11 rounded-xl text-sm font-bold normal-case tracking-normal'
const primaryButton = button + ' bg-primary px-5 text-primary-foreground hover:bg-primary/90'
const spinner = <LoaderCircle className="animate-spin motion-reduce:animate-none" />
// Selectable tile for radio options; the checked state comes from the Base UI radio inside it.
const optionTile = 'flex min-w-0 cursor-pointer items-center gap-3 rounded-2xl border border-border/60 bg-background/45 p-3 transition hover:border-primary/30 hover:bg-primary/5 has-[[data-checked]]:border-primary/40 has-[[data-checked]]:bg-primary/5 has-[[data-disabled]]:cursor-not-allowed has-[[data-disabled]]:opacity-60'
const bookingTypeKey: Record<number, 'Advance' | 'WalkIn'> = { [BookingType.Advance]: 'Advance', [BookingType.WalkIn]: 'WalkIn' }
const paymentMethodKey: Record<number, 'Cash' | 'ManualTransfer'> = { [GuestPaymentMethod.Cash]: 'Cash', [GuestPaymentMethod.ManualTransfer]: 'ManualTransfer' }

function useLocale() {
  const { i18n } = useTranslation()
  const language = i18n.resolvedLanguage
  return {
    language,
    money: (value: number) => formatMoney(value, language),
    date: (value: string) => parseSlotDate(value)?.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-EG', { weekday: 'long', day: 'numeric', month: 'long' }) ?? value,
  }
}

function SectionCard({ icon, title, step, children }: { icon: ReactNode; title: string; step?: number; children: ReactNode }) {
  const { t } = useTranslation()
  return <Card className="rounded-2xl border border-border bg-card">
    <CardHeader className="!pb-3 border-b border-border/40">
      <CardTitle className="flex items-center gap-2 font-sans text-xl font-bold normal-case tracking-normal">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">{icon}</span>
        <span className="min-w-0">{title}</span>
        {step && <span className="ms-auto rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">{t('secretary.guest.step', { number: step })}</span>}
      </CardTitle>
    </CardHeader>
    <CardContent className="grid gap-5">{children}</CardContent>
  </Card>
}

function SummaryRow({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return <div className="flex min-w-0 items-center gap-3">
    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary [&>svg]:size-4">{icon}</span>
    <div className="min-w-0"><small className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{label}</small><strong className="block truncate text-sm font-bold">{value}</strong></div>
  </div>
}

function MiniStat({ label, value, tone = '' }: { label: string; value: string; tone?: string }) {
  return <div className={`rounded-xl bg-background p-3 ${tone}`}><small className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{label}</small><strong className="text-sm font-bold">{value}</strong></div>
}

function Hint({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return <p className="flex items-center gap-2 text-xs leading-6 text-muted-foreground sm:text-sm [&>svg]:size-4 [&>svg]:shrink-0">{icon}{children}</p>
}

export default function SecretaryGuestBookingPage() {
  const { t } = useTranslation()
  const search = useSearch({ from: '/secretary/guest-booking' })
  const clinic = useSecretaryClinic()
  const notAssigned = isNotAssignedError(clinic.error)
  const [held, setHeld] = useState<HeldReservation | null>(readHeldReservation)
  const [confirmed, setConfirmed] = useState<HeldReservation | null>(null)
  const [notice, setNotice] = useState('')

  function hold(reservation: HeldReservation | null, message = '') {
    storeHeldReservation(reservation)
    setHeld(reservation)
    setNotice(message)
  }

  return (
    <DoctorWorkspaceShell active="secretary-guest-booking">
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-10">
        {notice && <Notice tone="success" message={notice} />}
        <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-primary uppercase"><CalendarPlus className="size-3" />{t('secretary.workspace')}</Badge>
        <h1 className="mt-2 font-sans text-3xl font-bold sm:text-4xl">{t('secretary.guest.title')}</h1>
        <p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground sm:text-sm">{t('secretary.guest.description')}</p>

        <div className="mt-6">
          {clinic.isLoading && <p role="status" className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />{t('secretary.myClinic.loading')}</p>}
          {notAssigned && <ClinicNotAssigned />}
          {clinic.isError && !notAssigned && <Card className="items-center rounded-3xl border border-destructive/20 bg-card p-8 text-center">
            <p className="text-sm font-bold text-destructive">{getErrorMessage(clinic.error)}</p>
            <Button variant="outline" className={button + ' mt-3'} disabled={clinic.isFetching} onClick={() => clinic.refetch()}>{clinic.isFetching ? spinner : <RefreshCw />}{t('errors.tryAgain')}</Button>
          </Card>}
          {clinic.data && (confirmed
            ? <BookingConfirmed reservation={confirmed} onBookAnother={() => { setConfirmed(null); setNotice('') }} />
            : held
              ? <GuestCheckout key={held.checkout.appointmentId} reservation={held} onConfirmed={() => { setConfirmed(held); hold(null) }} onReleased={(message) => hold(null, message)} />
              : <ReservationForm clinic={clinic.data} initialDoctorId={search.doctorId} onReserved={(reservation) => hold(reservation, t('secretary.guest.reserved'))} />)}
        </div>
      </div>
    </DoctorWorkspaceShell>
  )
}

function ReservationForm({ clinic, initialDoctorId, onReserved }: { clinic: ClinicDetails; initialDoctorId?: string; onReserved: (reservation: HeldReservation) => void }) {
  const { t, i18n } = useTranslation()
  const api = useApi()
  const queryClient = useQueryClient()
  const { money, date: formatDate } = useLocale()
  const members = useSecretaryClinicMembers()
  const today = egyptToday()
  const firstMonth = useMemo(() => { const [year, month] = today.split('-').map(Number); return new Date(year, month - 1, 1) }, [today])
  const [pickedDoctorId, setPickedDoctorId] = useState(initialDoctorId ?? '')
  const [month, setMonth] = useState(firstMonth)
  const [date, setDate] = useState('')
  const [slotId, setSlotId] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [bookingType, setBookingType] = useState<number>(BookingType.Advance)
  const [errors, setErrors] = useState<{ name?: string; phone?: string; form?: string }>({})

  // A single doctor is selected for the secretary; an unknown id from the URL is ignored.
  const doctor = members.data?.find((member) => member.id === pickedDoctorId) ?? (members.data?.length === 1 ? members.data[0] : undefined)
  const range = monthRange(month)
  const bookingTypes = useQuery({
    queryKey: ['lookups', 'guest-reservation-booking-types'],
    queryFn: () => api.request<LookupOption[]>('/api/lookups/guest-reservation-booking-types', {}, { notifyOnError: false }),
    staleTime: Infinity,
  })
  const days = useQuery({
    queryKey: ['secretary', 'guest', 'days', doctor?.id, range?.from, range?.to],
    queryFn: () => api.request<AvailableDay[]>(`/api/appointment-slots/guest-reservation/doctors/${encodeURIComponent(doctor!.id)}/available-days?from=${range!.from}&to=${range!.to}`, {}, { notifyOnError: false }),
    enabled: Boolean(doctor && range),
  })
  const slots = useQuery({
    queryKey: ['secretary', 'guest', 'slots', doctor?.id, date],
    queryFn: () => api.request<AvailableSlot[]>(`/api/appointment-slots/guest-reservation/doctors/${encodeURIComponent(doctor!.id)}/available-slots?date=${date}`, {}, { notifyOnError: false }),
    enabled: Boolean(doctor && date),
  })
  const reserve = useMutation({
    mutationFn: ({ slot, body }: { slot: AvailableSlot; body: CreateGuestReservationRequest }) =>
      api.request<GuestReservationCheckout>(`/api/appointments/slots/${slot.id}/guest-reservations`, { method: 'POST', body: JSON.stringify(body) }, { notifyOnError: false }),
    onSuccess: (checkout, { slot }) => {
      void queryClient.invalidateQueries({ queryKey: ['secretary', 'guest'] })
      onReserved({ checkout, doctorName: doctor?.fullName ?? '', date, startTime: slot.startTime, endTime: slot.endTime })
    },
    // The slot may have just been taken; refresh availability so the list stays truthful.
    onError: () => { setSlotId(''); void queryClient.invalidateQueries({ queryKey: ['secretary', 'guest'] }) },
  })

  const available = useMemo(() => new Set(days.data?.map((day) => day.date)), [days.data])
  const slot = slots.data?.find((item) => String(item.id) === slotId)
  const deposit = depositAmount(clinic.consultationFee, clinic.depositPercentage)
  const amounts = (type: number) => type === BookingType.WalkIn ? { now: clinic.consultationFee, later: 0 } : { now: deposit, later: Math.round((clinic.consultationFee - deposit) * 100) / 100 }
  const selectedAmounts = amounts(bookingType)
  const typeOptions = bookingTypes.data ?? Object.entries(bookingTypeKey).map(([id, name]) => ({ id: Number(id), name }))

  function selectDoctor(id: string) {
    if (id === doctor?.id) return
    setPickedDoctorId(id); setDate(''); setSlotId(''); setMonth(firstMonth); reserve.reset()
  }
  function selectDay(value?: Date) {
    setDate(value ? toIsoDate(value) : ''); setSlotId('')
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = name.trim()
    const next = {
      name: trimmed.length < 2 || trimmed.length > 100 ? t('secretary.guest.nameError') : undefined,
      phone: egyptianPhonePattern.test(phone) ? undefined : t('secretary.guest.phoneError'),
      form: slot ? undefined : t('secretary.guest.slotRequired'),
    }
    setErrors(next)
    if (next.name || next.phone || next.form || !slot) return
    reserve.mutate({ slot, body: { bookingType: bookingType as BookingType, guestPatientName: trimmed, guestPatientPhone: phone } })
  }

  return <form noValidate onSubmit={submit} className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,1fr)]">
    {(errors.form || reserve.error) && <Notice message={errors.form || getErrorMessage(reserve.error)} />}
    <div className="grid min-w-0 content-start gap-5">
      <SectionCard icon={<Stethoscope className="size-5" />} title={t('secretary.guest.doctorStep')} step={1}>
        {members.isLoading && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />{t('secretary.guest.loadingDoctors')}</p>}
        {members.isError && <div className="grid justify-items-start gap-2">
          <p className="text-sm font-bold text-destructive">{getErrorMessage(members.error)}</p>
          <Button type="button" variant="outline" className={button} disabled={members.isFetching} onClick={() => members.refetch()}>{members.isFetching ? spinner : <RefreshCw />}{t('errors.tryAgain')}</Button>
        </div>}
        {members.data && !members.data.length && <p className="text-xs leading-6 text-muted-foreground sm:text-sm">{t('secretary.guest.noDoctors')}</p>}
        {members.data && members.data.length > 0 && <RadioGroup aria-label={t('secretary.guest.doctorStep')} value={doctor?.id ?? ''} onValueChange={(value) => selectDoctor(String(value))} className="grid gap-3 sm:grid-cols-2">
          {members.data.map((member) => <label key={member.id} className={optionTile}>
            <RadioGroupItem value={member.id} />
            <DoctorAvatar name={member.fullName} picture={member.profilePicture} />
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-sm font-bold">{member.fullName}</strong>
              <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                <span className="truncate">{member.medicalSpecialty}</span>
                {member.isOwner && <Badge className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{t('secretary.myClinic.owner')}</Badge>}
              </span>
            </span>
          </label>)}
        </RadioGroup>}
      </SectionCard>

      <SectionCard icon={<CalendarDays className="size-5" />} title={t('secretary.guest.scheduleStep')} step={2}>
        {!doctor ? <Hint icon={<Stethoscope className="text-primary" />}>{t('secretary.guest.pickDoctorFirst')}</Hint> : <div className="grid gap-5 lg:grid-cols-[auto_minmax(0,1fr)]">
          <div className="grid content-start gap-2">
            <Label className="text-xs font-semibold text-foreground/80">{t('secretary.guest.dayLabel')}</Label>
            <div className="relative justify-self-start rounded-2xl border border-border/60 bg-background/45">
              <Calendar
                mode="single"
                selected={date ? parseSlotDate(date) ?? undefined : undefined}
                onSelect={selectDay}
                month={month}
                onMonthChange={(value) => { setMonth(value); setDate(''); setSlotId('') }}
                startMonth={firstMonth}
                showOutsideDays={false}
                locale={i18n.resolvedLanguage === 'ar' ? arEG : undefined}
                dir={i18n.dir()}
                disabled={(day) => days.isFetching || !available.has(toIsoDate(day))}
                modifiers={{ available: (day) => available.has(toIsoDate(day)) }}
                modifiersClassNames={{ available: '[&>button]:bg-primary/10 [&>button]:text-primary' }}
              />
              {days.isFetching && <span role="status" className="absolute inset-0 grid place-items-center rounded-2xl bg-card/60 backdrop-blur-[1px]"><span className="flex items-center gap-2 text-xs font-bold text-muted-foreground"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />{t('secretary.guest.loadingDays')}</span></span>}
            </div>
            {days.isError && <p role="alert" className="max-w-80 text-xs font-bold text-destructive">{getErrorMessage(days.error)}</p>}
            {days.data && !days.data.length && !days.isFetching && <p className="max-w-80 text-xs leading-6 text-muted-foreground">{t('secretary.guest.noDays')}</p>}
          </div>
          <div className="grid min-w-0 content-start gap-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <Label className="text-xs font-semibold text-foreground/80">{t('secretary.guest.timeLabel')}</Label>
              {date && <span className="text-xs font-bold text-primary">{formatDate(date)}</span>}
            </div>
            {!date && <Hint icon={<CalendarDays className="text-primary" />}>{t('secretary.guest.pickDayFirst')}</Hint>}
            {date && slots.isLoading && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />{t('secretary.guest.loadingSlots')}</p>}
            {date && slots.isError && <p role="alert" className="text-xs font-bold text-destructive">{getErrorMessage(slots.error)}</p>}
            {date && slots.data && !slots.data.length && <p className="text-xs leading-6 text-muted-foreground sm:text-sm">{t('secretary.guest.noSlots')}</p>}
            {date && slots.data && slots.data.length > 0 && <RadioGroup aria-label={t('secretary.guest.timeLabel')} value={slotId} onValueChange={(value) => setSlotId(String(value))} className="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-2">
              {slots.data.map((item) => <label key={item.id} className="flex cursor-pointer items-center justify-center rounded-xl border border-border/60 bg-background/45 px-3 py-2.5 text-sm font-bold whitespace-nowrap tabular-nums transition hover:border-primary/30 hover:bg-primary/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/20 has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary has-[[data-checked]]:text-primary-foreground">
                <RadioGroupItem value={String(item.id)} className="sr-only" />
                <span dir="ltr">{formatTime(item.startTime)} – {formatTime(item.endTime)}</span>
              </label>)}
            </RadioGroup>}
          </div>
        </div>}
      </SectionCard>

      <SectionCard icon={<UserRound className="size-5" />} title={t('secretary.guest.detailsStep')} step={3}>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField className="content-start" id="guestName" label={t('secretary.guest.name')} placeholder={t('secretary.guest.namePlaceholder')} value={name} maxLength={100} autoComplete="off" icon={<UserRound size={18} />} error={errors.name} onChange={(event) => { setName(event.target.value); setErrors((current) => ({ ...current, name: undefined })) }} />
          <FormField className="content-start" id="guestPhone" type="tel" dir="ltr" inputMode="numeric" label={t('secretary.guest.phone')} placeholder="01012345678" value={phone} maxLength={11} autoComplete="off" hint={t('secretary.guest.phoneHint')} icon={<Phone size={18} />} error={errors.phone} onChange={(event) => { setPhone(event.target.value.replace(/\D/g, '')); setErrors((current) => ({ ...current, phone: undefined })) }} />
        </div>
        <div className="grid gap-2">
          <Label className="text-xs font-semibold text-foreground/80">{t('secretary.guest.bookingType')}</Label>
          <RadioGroup aria-label={t('secretary.guest.bookingType')} value={String(bookingType)} onValueChange={(value) => setBookingType(Number(value))} className="grid gap-3 sm:grid-cols-2">
            {typeOptions.map((option) => {
              const key = bookingTypeKey[option.id]
              const split = amounts(option.id)
              return <label key={option.id} className={optionTile + ' items-start p-4'}>
                <RadioGroupItem value={String(option.id)} className="mt-0.5" />
                <span className="grid min-w-0 flex-1 gap-1">
                  <strong className="text-sm font-bold">{key ? t(`secretary.guest.types.${key}`) : option.name}</strong>
                  {key && <span className="text-xs leading-5 text-muted-foreground">{t(`secretary.guest.typeHints.${key}`)}</span>}
                  <span className="mt-1 text-xs font-bold text-primary">{t('secretary.guest.collectNow')}: {money(split.now)}</span>
                </span>
              </label>
            })}
          </RadioGroup>
        </div>
      </SectionCard>
    </div>

    <div className="min-w-0">
      <Card className="rounded-2xl border border-border bg-card xl:sticky xl:top-24">
        <CardHeader className="!pb-3 border-b border-border/40">
          <CardTitle className="flex items-center gap-2 font-sans text-xl font-bold normal-case tracking-normal">
            <span className="grid size-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"><ReceiptText className="size-5" /></span>{t('secretary.guest.summaryTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <SummaryRow icon={<Stethoscope />} label={t('secretary.guest.doctor')} value={doctor?.fullName ?? <span className="text-muted-foreground">{t('secretary.guest.notSelected')}</span>} />
          <SummaryRow icon={<CalendarDays />} label={t('secretary.guest.date')} value={date ? formatDate(date) : <span className="text-muted-foreground">{t('secretary.guest.notSelected')}</span>} />
          <SummaryRow icon={<Clock3 />} label={t('secretary.guest.time')} value={slot ? <span dir="ltr">{formatTime(slot.startTime)} – {formatTime(slot.endTime)}</span> : <span className="text-muted-foreground">{t('secretary.guest.notSelected')}</span>} />
          <SummaryRow icon={<Banknote />} label={t('secretary.guest.fee')} value={money(clinic.consultationFee)} />
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label={t('secretary.guest.collectNow')} value={money(selectedAmounts.now)} tone="ring-1 ring-primary/15" />
            <MiniStat label={t('secretary.guest.later')} value={money(selectedAmounts.later)} />
          </div>
          <Hint icon={<Timer className="text-warm" />}>{t('secretary.guest.holdNote')}</Hint>
          <Button type="submit" className={primaryButton + ' w-full'} disabled={reserve.isPending}>{reserve.isPending ? spinner : <CalendarCheck2 />}{t('secretary.guest.reserve')}</Button>
        </CardContent>
      </Card>
    </div>
  </form>
}

function useCountdown(expiresAt: string) {
  const deadline = new Date(expiresAt).getTime()
  const [now, setNow] = useState(() => Date.now())
  const remaining = Math.max(0, deadline - now)
  const expired = remaining <= 0
  useEffect(() => {
    if (expired) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [expired])
  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)
  return { remaining, expired, label: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`, percent: Math.min(100, (remaining / holdMs) * 100) }
}

function GuestCheckout({ reservation, onConfirmed, onReleased }: { reservation: HeldReservation; onConfirmed: () => void; onReleased: (message?: string) => void }) {
  const { t, i18n } = useTranslation()
  const api = useApi()
  const queryClient = useQueryClient()
  const { money, date: formatDate } = useLocale()
  const { checkout } = reservation
  const countdown = useCountdown(checkout.reservationExpiresAt)
  const [method, setMethod] = useState<number | null>(null)
  const [accountId, setAccountId] = useState('')
  const [formError, setFormError] = useState('')
  const [confirmCancel, setConfirmCancel] = useState(false)
  const methods = useQuery({
    queryKey: ['lookups', 'guest-reservation-payment-methods'],
    queryFn: () => api.request<LookupOption[]>('/api/lookups/guest-reservation-payment-methods', {}, { notifyOnError: false }),
    staleTime: Infinity,
  })
  const accounts = useQuery({
    queryKey: ['secretary', 'guest', 'accounts'],
    queryFn: () => api.request<GuestCheckoutAccount[]>('/api/manual-payment-methods/guest-checkout', {}, { notifyOnError: false }),
    enabled: method === GuestPaymentMethod.ManualTransfer,
  })
  const refresh = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['secretary', 'appointments'] }),
    queryClient.invalidateQueries({ queryKey: ['secretary', 'guest'] }),
  ])
  const confirm = useMutation({
    mutationFn: (body: ConfirmGuestPaymentRequest) => api.request<string>(`/api/appointments/${checkout.appointmentId}/guest-checkout/confirm-payment`, { method: 'POST', body: JSON.stringify(body) }, { notifyOnError: false }),
    onSuccess: () => { void refresh(); onConfirmed() },
  })
  const cancel = useMutation({
    mutationFn: () => api.request<string>(`/api/appointments/${checkout.appointmentId}/guest-checkout/Cancel-payment`, { method: 'DELETE' }, { notifyOnError: false }),
    onSuccess: () => { setConfirmCancel(false); void refresh(); onReleased(t('secretary.guest.cancelled')) },
  })
  const busy = confirm.isPending || cancel.isPending
  const failed = Boolean(confirm.error || cancel.error)
  const methodOptions = methods.data ?? Object.entries(paymentMethodKey).map(([id, name]) => ({ id: Number(id), name }))
  const typeKey = checkout.bookingType === 'Advance' || checkout.bookingType === 'WalkIn' ? checkout.bookingType : null
  const expiresAt = new Date(checkout.reservationExpiresAt).toLocaleTimeString(i18n.resolvedLanguage === 'ar' ? 'ar-EG' : 'en-EG', { hour: 'numeric', minute: '2-digit' })
  const lowTime = countdown.remaining < 5 * 60 * 1000

  function submit() {
    if (!method) return setFormError(t('secretary.guest.methodRequired'))
    if (method === GuestPaymentMethod.ManualTransfer && !accountId) return setFormError(t('secretary.guest.accountRequired'))
    setFormError('')
    confirm.mutate(method === GuestPaymentMethod.ManualTransfer
      ? { guestReservationPaymentMethod: GuestPaymentMethod.ManualTransfer, clinicManualPaymentMethodId: Number(accountId) }
      : { guestReservationPaymentMethod: GuestPaymentMethod.Cash })
  }

  return <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,1fr)]">
    {(formError || confirm.error) && <Notice message={formError || getErrorMessage(confirm.error)} />}
    <div className="grid min-w-0 content-start gap-5">
      <SectionCard icon={<Wallet className="size-5" />} title={t('secretary.guest.checkoutTitle')}>
        <p className="-mt-1 text-xs leading-6 text-muted-foreground sm:text-sm">{t('secretary.guest.checkoutDescription')}</p>

        {countdown.expired ? <div role="alert" className="grid justify-items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-destructive"><TriangleAlert className="size-4" />{t('secretary.guest.expiredTitle')}</p>
          <p className="text-xs leading-6 text-muted-foreground sm:text-sm">{t('secretary.guest.expiredDescription')}</p>
          <Button type="button" className={primaryButton} onClick={() => onReleased()}><RotateCcw />{t('secretary.guest.startOver')}</Button>
        </div> : <div className={`rounded-2xl border p-4 ${lowTime ? 'border-warm/20 bg-warm/10' : 'border-primary/15 bg-primary/5'}`}>
          <Progress value={countdown.percent} aria-label={t('secretary.guest.expiresIn')} className={lowTime ? '[&_[data-slot=progress-indicator]]:bg-warm [&_[data-slot=progress-track]]:bg-warm/15' : ''}>
            <ProgressLabel className="flex items-center gap-1.5"><Timer className="size-3.5" />{t('secretary.guest.expiresIn')}</ProgressLabel>
            <span dir="ltr" className={`ms-auto font-sans text-2xl font-bold tabular-nums ${lowTime ? 'text-warm' : 'text-primary'}`} aria-live="off">{countdown.label}</span>
          </Progress>
          <p className="mt-2 text-[11px] font-bold text-muted-foreground">{t('secretary.guest.expiresAt', { time: expiresAt })}</p>
        </div>}

        <div className="grid gap-2">
          <Label className="text-xs font-semibold text-foreground/80">{t('secretary.guest.paymentMethod')}</Label>
          <RadioGroup aria-label={t('secretary.guest.paymentMethod')} value={method ? String(method) : ''} disabled={countdown.expired || busy} onValueChange={(value) => { setMethod(Number(value)); setAccountId(''); setFormError('') }} className="grid gap-3 sm:grid-cols-2">
            {methodOptions.map((option) => {
              const key = paymentMethodKey[option.id]
              return <label key={option.id} className={optionTile + ' items-start p-4'}>
                <RadioGroupItem value={String(option.id)} className="mt-0.5" />
                <span className="grid min-w-0 flex-1 gap-1">
                  <strong className="flex items-center gap-2 text-sm font-bold">{option.id === GuestPaymentMethod.ManualTransfer ? <ArrowLeftRight className="size-4 text-primary" /> : <Banknote className="size-4 text-primary" />}{key ? t(`secretary.guest.methods.${key}`) : option.name}</strong>
                  {key && <span className="text-xs leading-5 text-muted-foreground">{t(`secretary.guest.methodHints.${key}`)}</span>}
                </span>
              </label>
            })}
          </RadioGroup>
        </div>

        {method === GuestPaymentMethod.ManualTransfer && <div className="grid gap-2">
          <Label className="text-xs font-semibold text-foreground/80">{t('secretary.guest.account')}</Label>
          {accounts.isLoading && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />{t('secretary.guest.loadingAccounts')}</p>}
          {accounts.isError && <div className="grid justify-items-start gap-2">
            <p className="text-sm font-bold text-destructive">{getErrorMessage(accounts.error)}</p>
            <Button type="button" variant="outline" className={button} disabled={accounts.isFetching} onClick={() => accounts.refetch()}>{accounts.isFetching ? spinner : <RefreshCw />}{t('errors.tryAgain')}</Button>
          </div>}
          {accounts.data && !accounts.data.length && <p className="flex items-start gap-2 rounded-xl border border-warm/20 bg-warm/10 p-3 text-xs leading-6 font-bold text-warm"><TriangleAlert className="mt-1 size-3.5 shrink-0" />{t('secretary.guest.noAccounts')}</p>}
          {accounts.data && accounts.data.length > 0 && <RadioGroup aria-label={t('secretary.guest.account')} value={accountId} disabled={countdown.expired || busy} onValueChange={(value) => { setAccountId(String(value)); setFormError('') }} className="grid gap-3 sm:grid-cols-2">
            {accounts.data.map((account) => <label key={account.id} className={optionTile}>
              <RadioGroupItem value={String(account.id)} />
              {isManualPaymentProvider(account.type)
                ? <ProviderLogo type={account.type} className="shadow-sm" />
                : <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Wallet className="size-4" /></span>}
              <span className="min-w-0 flex-1">
                <small className="block truncate text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{t(`manualPayments.${account.type}`, { defaultValue: account.type })}</small>
                <strong dir="ltr" className="block truncate text-start text-sm font-bold">{account.accountIdentifier}</strong>
              </span>
            </label>)}
          </RadioGroup>}
        </div>}

        {!countdown.expired && <div className="flex flex-wrap gap-2 border-t border-border/40 pt-4">
          <Button type="button" className={primaryButton} disabled={busy} onClick={submit}>{confirm.isPending ? spinner : <CircleCheckBig />}{t('secretary.guest.confirm')}</Button>
          <Button type="button" variant="outline" className={button + ' border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10 hover:text-destructive'} disabled={busy} onClick={() => { cancel.reset(); setConfirmCancel(true) }}>{cancel.isPending ? spinner : <Ban />}{t('secretary.guest.cancel')}</Button>
          {failed && <Button type="button" variant="outline" className={button} disabled={busy} onClick={() => onReleased()}><RotateCcw />{t('secretary.guest.startOver')}</Button>}
        </div>}
      </SectionCard>
    </div>

    <div className="min-w-0">
      <Card className="rounded-2xl border border-border bg-card xl:sticky xl:top-24">
        <CardHeader className="!pb-3 border-b border-border/40">
          <CardTitle className="flex items-center gap-2 font-sans text-xl font-bold normal-case tracking-normal">
            <span className="grid size-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"><ReceiptText className="size-5" /></span>{t('secretary.guest.summaryTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {typeKey && <Badge className="justify-self-start rounded-full border border-warm/20 bg-warm/10 px-2.5 py-1 text-[10px] font-bold text-warm">{t(`secretary.guest.types.${typeKey}`)}</Badge>}
          <SummaryRow icon={<UserRound />} label={t('secretary.guest.guest')} value={checkout.guestPatientName} />
          <SummaryRow icon={<Phone />} label={t('secretary.guest.phone')} value={<span dir="ltr">{checkout.guestPatientPhone}</span>} />
          <SummaryRow icon={<Stethoscope />} label={t('secretary.guest.doctor')} value={reservation.doctorName} />
          <SummaryRow icon={<CalendarDays />} label={t('secretary.guest.date')} value={formatDate(reservation.date)} />
          <SummaryRow icon={<Clock3 />} label={t('secretary.guest.time')} value={<span dir="ltr">{formatTime(reservation.startTime)} – {formatTime(reservation.endTime)}</span>} />
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label={t('secretary.guest.fee')} value={money(checkout.consultationFee)} />
            <MiniStat label={t('secretary.guest.collectNow')} value={money(checkout.paymentAmount)} tone="ring-1 ring-primary/15" />
            <MiniStat label={t('secretary.guest.remainingAmount')} value={money(checkout.remainingAmount)} />
          </div>
        </CardContent>
      </Card>
    </div>

    <ConfirmationDialog
      open={confirmCancel}
      title={t('secretary.guest.cancelTitle')}
      description={t('secretary.guest.cancelDescription')}
      confirmLabel={t('secretary.guest.cancel')}
      cancelLabel={t('secretary.guest.keep')}
      destructive
      pending={cancel.isPending}
      error={cancel.error ? getErrorMessage(cancel.error) : undefined}
      onConfirm={() => cancel.mutate()}
      onOpenChange={(open) => { if (!open && !cancel.isPending) setConfirmCancel(false) }}
    />
  </div>
}

function BookingConfirmed({ reservation, onBookAnother }: { reservation: HeldReservation; onBookAnother: () => void }) {
  const { t } = useTranslation()
  const { money, date: formatDate } = useLocale()
  const { checkout } = reservation
  return <Card className="relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/12 via-card to-primary/5 p-5 sm:p-7">
    <span className="pointer-events-none absolute -end-16 -top-16 size-56 rounded-full bg-primary/10 blur-3xl" />
    <div className="relative grid gap-5">
      <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><CircleCheckBig className="size-7" /></span>
      <div>
        <h2 className="font-sans text-2xl font-bold sm:text-3xl">{t('secretary.guest.successTitle')}</h2>
        <p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground sm:text-sm">{t('secretary.guest.successDescription', { name: checkout.guestPatientName, doctor: reservation.doctorName })}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat label={t('secretary.guest.date')} value={formatDate(reservation.date)} />
        <MiniStat label={t('secretary.guest.time')} value={`${formatTime(reservation.startTime)} – ${formatTime(reservation.endTime)}`} />
        <MiniStat label={t('secretary.guest.collectNow')} value={money(checkout.paymentAmount)} />
        <MiniStat label={t('secretary.guest.remainingAmount')} value={money(checkout.remainingAmount)} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button className={primaryButton} onClick={onBookAnother}><CalendarPlus />{t('secretary.guest.bookAnother')}</Button>
        <Button variant="outline" className={button} render={<Link to="/secretary/appointments" />}><CalendarDays />{t('secretary.guest.viewAppointments')}</Button>
      </div>
    </div>
  </Card>
}
