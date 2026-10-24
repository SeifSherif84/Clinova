import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearch } from '@tanstack/react-router'
import { ArrowLeftRight, Ban, Banknote, CalendarCheck2, CalendarDays, CalendarPlus, CircleCheckBig, Clock3, LoaderCircle, Phone, ReceiptText, RefreshCw, RotateCcw, Stethoscope, TriangleAlert, UserRound, Wallet } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { arEG } from "@daypicker/react/locale/ar-EG";
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
import { Card, CardContent} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
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
  return <Card className="min-w-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0">
    <div className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-primary/15 via-primary/[0.05] to-transparent p-5">
      <span className="pointer-events-none absolute -end-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="relative flex items-center gap-3.5">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10 [&>svg]:size-6">{icon}</span>
        <h3 className="min-w-0 flex-1 truncate font-sans text-xl font-bold">{title}</h3>
        {step && <span className="shrink-0 rounded-full bg-background/70 px-2.5 py-1 text-xs font-bold text-muted-foreground">{t('secretary.guest.step', { number: step })}</span>}
      </div>
    </div>
    <CardContent className="grid gap-5 p-5">{children}</CardContent>
  </Card>
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
          {clinic.data && (held
            ? <GuestCheckout key={held.checkout.appointmentId} reservation={held} onConfirmed={() => hold(null, t('secretary.guest.successDescription', { name: held.checkout.guestPatientName, doctor: held.doctorName }))} onReleased={(message) => hold(null, message)} />
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
          {members.data.map((member) => <label key={member.id} className="group relative flex min-w-0 cursor-pointer items-center gap-4 rounded-2xl border border-border/60 bg-background/45 p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/20 has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5 has-[[data-checked]]:shadow-md has-[[data-checked]]:shadow-primary/10 has-[[data-disabled]]:cursor-not-allowed has-[[data-disabled]]:opacity-60">
            <RadioGroupItem value={member.id} className="pointer-events-none absolute size-px opacity-0" />
            <DoctorAvatar className="size-14" name={member.fullName} picture={member.profilePicture} />
            <span className="grid min-w-0 flex-1 gap-1">
              <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <strong className="truncate text-base font-bold">{member.fullName}</strong>
                {member.isOwner && <Badge className="shrink-0 rounded-full border border-primary/20 bg-primary px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-primary-foreground uppercase">{t('secretary.myClinic.owner')}</Badge>}
              </span>
              <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-muted-foreground"><Stethoscope className="size-3.5 shrink-0 text-primary" /><span className="truncate">{member.medicalSpecialty}</span></span>
            </span>
            <span aria-hidden="true" className="relative grid size-6 shrink-0 place-items-center">
              <span className="absolute inset-0 rounded-full border-2 border-border transition group-has-[[data-checked]]:opacity-0" />
              <CircleCheckBig className="size-6 text-primary opacity-0 transition group-has-[[data-checked]]:opacity-100" />
            </span>
          </label>)}
        </RadioGroup>}
      </SectionCard>

      <SectionCard icon={<CalendarDays className="size-5" />} title={t('secretary.guest.scheduleStep')} step={2}>
        {!doctor ? <Hint icon={<Stethoscope className="text-primary" />}>{t('secretary.guest.pickDoctorFirst')}</Hint> : <div className="grid gap-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-0">
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
                locale={i18n.resolvedLanguage === 'ar' ? arEG : undefined}
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
              {slots.data.map((item) => <label key={item.id} className="group relative flex min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-background/45 px-2.5 py-3 text-sm font-bold whitespace-nowrap tabular-nums transition not-has-[[data-checked]]:hover:border-primary not-has-[[data-checked]]:hover:bg-primary/10 not-has-[[data-checked]]:hover:text-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/20 has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary has-[[data-checked]]:text-primary-foreground has-[[data-checked]]:shadow-md has-[[data-checked]]:shadow-primary/25">
                <RadioGroupItem value={String(item.id)} className="pointer-events-none absolute size-px opacity-0" />
                <Clock3 aria-hidden="true" className="size-3.5 shrink-0 opacity-60" />
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
        <div className="grid gap-3">
          <Label className="text-sm font-bold text-foreground">{t('secretary.guest.bookingType')}</Label>
          <RadioGroup aria-label={t('secretary.guest.bookingType')} value={String(bookingType)} onValueChange={(value) => setBookingType(Number(value))} className="grid gap-3 sm:grid-cols-2">
            {typeOptions.map((option) => {
              const key = bookingTypeKey[option.id]
              const split = amounts(option.id)
              return <label key={option.id} className="group relative flex min-w-0 cursor-pointer items-start gap-4 rounded-2xl border border-border/60 bg-background/45 p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/20 has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5 has-[[data-checked]]:shadow-md has-[[data-checked]]:shadow-primary/10 has-[[data-disabled]]:cursor-not-allowed has-[[data-disabled]]:opacity-60">
                <RadioGroupItem value={String(option.id)} className="pointer-events-none absolute size-px opacity-0" />
                <span className="grid min-w-0 flex-1 gap-1.5">
                  <strong className="text-base font-bold">{key ? t(`secretary.guest.types.${key}`) : option.name}</strong>
                  {key && <span className="text-xs leading-5 font-medium text-muted-foreground">{t(`secretary.guest.typeHints.${key}`)}</span>}
                  <span className="mt-2 inline-flex w-fit items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{t('secretary.guest.collectNow')}: {money(split.now)}</span>
                </span>
                <span aria-hidden="true" className="relative mt-0.5 grid size-6 shrink-0 place-items-center">
                  <span className="absolute inset-0 rounded-full border-2 border-border transition group-has-[[data-checked]]:opacity-0" />
                  <CircleCheckBig className="size-6 text-primary opacity-0 transition group-has-[[data-checked]]:opacity-100" />
                </span>
              </label>
            })}
          </RadioGroup>
        </div>
      </SectionCard>
    </div>

    <div className="min-w-0">
      <Card className="min-w-0 gap-0 overflow-hidden rounded-2xl border-2 border-dashed border-primary/25 bg-gradient-to-b from-primary/[0.07] via-primary/[0.03] to-card p-0 shadow-lg shadow-primary/10 xl:sticky xl:top-24">
        <div className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-primary/15 via-primary/[0.05] to-transparent p-5">
          <span className="pointer-events-none absolute -end-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" />
          <div className="relative flex items-center gap-3.5">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10"><ReceiptText className="size-6" /></span>
            <h3 className="min-w-0 flex-1 truncate font-sans text-xl font-bold">{t('secretary.guest.summaryTitle')}</h3>
          </div>
        </div>
        <CardContent className="grid gap-3 p-5">
          <div className="grid">
            <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-border/70 py-3">
              <span className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase"><Stethoscope className="size-4 text-primary/70" />{t('secretary.guest.doctor')}</span>
              <span className="text-end text-sm font-bold">{doctor?.fullName ?? <span className="font-medium text-muted-foreground">{t('secretary.guest.notSelected')}</span>}</span>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-border/70 py-3">
              <span className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase"><CalendarDays className="size-4 text-primary/70" />{t('secretary.guest.date')}</span>
              <span className="text-end text-sm font-bold">{date ? formatDate(date) : <span className="font-medium text-muted-foreground">{t('secretary.guest.notSelected')}</span>}</span>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-border/70 py-3">
              <span className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase"><Clock3 className="size-4 text-primary/70" />{t('secretary.guest.time')}</span>
              <span className="text-end text-sm font-bold">{slot ? <span dir="ltr">{formatTime(slot.startTime)} – {formatTime(slot.endTime)}</span> : <span className="font-medium text-muted-foreground">{t('secretary.guest.notSelected')}</span>}</span>
            </div>
            <div className="flex items-baseline justify-between gap-3 py-3">
              <span className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase"><Banknote className="size-4 text-primary/70" />{t('secretary.guest.fee')}</span>
              <span dir="ltr" className="text-end text-sm font-bold">{money(clinic.consultationFee)}</span>
            </div>
          </div>

          <div aria-hidden="true" className="-mt-3 border-t border-dashed border-border" />

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-primary/5 px-3 py-2.5 ring-1 ring-primary/15">
              <span className="text-xs font-bold tracking-wide text-primary uppercase">{t('secretary.guest.collectNow')}</span>
              <span dir="ltr" className="font-mono text-lg font-bold tabular-nums text-primary">{money(selectedAmounts.now)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 px-3">
              <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t('secretary.guest.later')}</span>
              <span dir="ltr" className="font-mono text-sm font-bold tabular-nums text-muted-foreground">{money(selectedAmounts.later)}</span>
            </div>
          </div>

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
        </div> : <div className={`overflow-hidden rounded-2xl border p-4 sm:p-5 ${lowTime ? 'border-warm/20 bg-warm/10' : 'border-primary/15 bg-primary/5'}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <strong className="block text-sm font-bold tracking-wide text-foreground uppercase">{t('secretary.guest.expiresIn')}</strong>
              <span className="text-[11px] font-bold text-muted-foreground">{t('secretary.guest.expiresAt', { time: expiresAt })}</span>
            </div>
            <span dir="ltr" className={`font-sans text-3xl font-bold tabular-nums ${lowTime ? 'text-warm' : 'text-primary'}`} aria-live="off">{countdown.label}</span>
          </div>
          <Progress value={countdown.percent} aria-label={t('secretary.guest.expiresIn')} className={`mt-4 ${lowTime ? '[&_[data-slot=progress-indicator]]:bg-warm [&_[data-slot=progress-track]]:bg-warm/15' : ''}`} />
        </div>}

        <div className="grid gap-2">
          <Label className="text-sm font-bold text-foreground">{t('secretary.guest.paymentMethod')}</Label>
          <RadioGroup aria-label={t('secretary.guest.paymentMethod')} value={method ? String(method) : ''} disabled={countdown.expired || busy} onValueChange={(value) => { setMethod(Number(value)); setAccountId(''); setFormError('') }} className="grid gap-3 sm:grid-cols-2">
            {methodOptions.map((option) => {
              const key = paymentMethodKey[option.id]
              return <label key={option.id} className="group relative flex min-w-0 cursor-pointer items-start gap-3.5 rounded-2xl border border-border/60 bg-background/45 p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/20 has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5 has-[[data-checked]]:shadow-md has-[[data-checked]]:shadow-primary/10 has-[[data-disabled]]:cursor-not-allowed has-[[data-disabled]]:opacity-60">
                <RadioGroupItem value={String(option.id)} className="pointer-events-none absolute size-px opacity-0" />
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">{option.id === GuestPaymentMethod.ManualTransfer ? <ArrowLeftRight className="size-4.5" /> : <Banknote className="size-4.5" />}</span>
                <span className="grid min-w-0 flex-1 gap-0.5 pt-0.5">
                  <strong className="text-sm font-bold">{key ? t(`secretary.guest.methods.${key}`) : option.name}</strong>
                  {key && <span className="text-xs leading-5 font-medium text-muted-foreground">{t(`secretary.guest.methodHints.${key}`)}</span>}
                </span>
                <span aria-hidden="true" className="relative mt-0.5 grid size-6 shrink-0 place-items-center">
                  <span className="absolute inset-0 rounded-full border-2 border-border transition group-has-[[data-checked]]:opacity-0" />
                  <CircleCheckBig className="size-6 text-primary opacity-0 transition group-has-[[data-checked]]:opacity-100" />
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
            {accounts.data.map((account) => <label key={account.id} className="group relative flex min-w-0 cursor-pointer items-center gap-3.5 rounded-2xl border border-border/60 bg-background/45 p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/20 has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5 has-[[data-checked]]:shadow-md has-[[data-checked]]:shadow-primary/10 has-[[data-disabled]]:cursor-not-allowed has-[[data-disabled]]:opacity-60">
              <RadioGroupItem value={String(account.id)} className="pointer-events-none absolute size-px opacity-0" />
              {isManualPaymentProvider(account.type)
                ? <ProviderLogo type={account.type} size="sm" className="shadow-sm" />
                : <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Wallet className="size-4" /></span>}
              <span className="min-w-0 flex-1">
                <small className="block truncate text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{t(`manualPayments.${account.type}`, { defaultValue: account.type })}</small>
                <strong dir="ltr" className="block truncate text-start text-sm font-bold">{account.accountIdentifier}</strong>
              </span>
              <span aria-hidden="true" className="relative grid size-6 shrink-0 place-items-center">
                <span className="absolute inset-0 rounded-full border-2 border-border transition group-has-[[data-checked]]:opacity-0" />
                <CircleCheckBig className="size-6 text-primary opacity-0 transition group-has-[[data-checked]]:opacity-100" />
              </span>
            </label>)}
          </RadioGroup>}
        </div>}

        {!countdown.expired && <div className="flex flex-wrap gap-2.5 border-t border-border/50 pt-5">
          <Button type="button" className={primaryButton + ' flex-1 sm:flex-none'} disabled={busy} onClick={submit}>{confirm.isPending ? spinner : <CircleCheckBig />}{t('secretary.guest.confirm')}</Button>
          <Button type="button" variant="outline" className={button + ' rounded-xl border-destructive/20 bg-destructive/5 text-destructive hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive'} disabled={busy} onClick={() => { cancel.reset(); setConfirmCancel(true) }}>{cancel.isPending ? spinner : <Ban />}{t('secretary.guest.cancel')}</Button>
          {failed && <Button type="button" variant="outline" className={button} disabled={busy} onClick={() => onReleased()}><RotateCcw />{t('secretary.guest.startOver')}</Button>}
        </div>}
      </SectionCard>
    </div>

    <div className="min-w-0">
      <Card className="min-w-0 gap-0 overflow-hidden rounded-2xl border-2 border-dashed border-primary/25 bg-gradient-to-b from-primary/[0.07] via-primary/[0.03] to-card p-0 shadow-lg shadow-primary/10 xl:sticky xl:top-24">
        <div className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-primary/15 via-primary/[0.05] to-transparent p-5">
          <span className="pointer-events-none absolute -end-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" />
          <div className="relative flex items-center gap-3.5">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10"><ReceiptText className="size-6" /></span>
            <h3 className="min-w-0 flex-1 truncate font-sans text-xl font-bold">{t('secretary.guest.summaryTitle')}</h3>
          </div>
        </div>
        <CardContent className="grid gap-3 p-5">
          {typeKey && <Badge className="justify-self-start rounded-full border border-warm/20 bg-warm/10 px-2.5 py-1 text-[10px] font-bold text-warm">{t(`secretary.guest.types.${typeKey}`)}</Badge>}
          <div className="grid">
            <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-border/70 py-3">
              <span className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase"><UserRound className="size-4 text-primary/70" />{t('secretary.guest.guest')}</span>
              <span className="text-end text-sm font-bold">{checkout.guestPatientName}</span>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-border/70 py-3">
              <span className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase"><Phone className="size-4 text-primary/70" />{t('secretary.guest.phone')}</span>
              <span dir="ltr" className="text-end text-sm font-bold">{checkout.guestPatientPhone}</span>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-border/70 py-3">
              <span className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase"><Stethoscope className="size-4 text-primary/70" />{t('secretary.guest.doctor')}</span>
              <span className="text-end text-sm font-bold">{reservation.doctorName}</span>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-border/70 py-3">
              <span className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase"><CalendarDays className="size-4 text-primary/70" />{t('secretary.guest.date')}</span>
              <span className="text-end text-sm font-bold">{formatDate(reservation.date)}</span>
            </div>
            <div className="flex items-baseline justify-between gap-3 py-3">
              <span className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase"><Clock3 className="size-4 text-primary/70" />{t('secretary.guest.time')}</span>
              <span dir="ltr" className="text-end text-sm font-bold">{formatTime(reservation.startTime)} – {formatTime(reservation.endTime)}</span>
            </div>
          </div>

          <div aria-hidden="true" className="-mt-3 border-t border-dashed border-border" />

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-primary/5 px-3 py-2.5 ring-1 ring-primary/15">
              <span className="text-xs font-bold tracking-wide text-primary uppercase">{t('secretary.guest.collectNow')}</span>
              <span dir="ltr" className="font-mono text-lg font-bold tabular-nums text-primary">{money(checkout.paymentAmount)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 px-3">
              <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t('secretary.guest.remainingAmount')}</span>
              <span dir="ltr" className="font-mono text-sm font-bold tabular-nums text-muted-foreground">{money(checkout.remainingAmount)}</span>
            </div>
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


