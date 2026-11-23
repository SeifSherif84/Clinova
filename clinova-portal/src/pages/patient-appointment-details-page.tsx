import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft, Banknote, CalendarCheck2, CalendarClock, CalendarDays, CalendarX, ChevronDown, CircleCheckBig, Clock3, Ellipsis, ExternalLink, House, Info, MapPin, ReceiptText, RefreshCw, ScrollText, SearchX, ShieldAlert, Timer, TriangleAlert, Undo2, Wallet } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import ConfirmationDialog from '@/components/confirmation-dialog'
import Notice from '@/components/notice'
import PatientDepositPayment from '@/components/patient-deposit-payment'
import AppointmentReviewSection from '@/components/appointment-review-section'
import PatientShell from '@/components/patient-shell'
import RescheduleAppointmentDialog from '@/components/reschedule-appointment-dialog'
import StatusPill from '@/components/patient-status-pill'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { useApi } from '@/hooks/use-api'
import { ApiError, getErrorMessage } from '@/lib/api'
import { formatClock, formatDuration, humanize, parseDay, parseUtc, statusTone, toneText } from '@/lib/patient-appointments'
import { resolveFileUrl } from '@/lib/secretary-appointments'
import type { PatientAppointmentDetails } from '@/types/patient-appointment'

type Tr = (key: string, defaultValue: string, options?: Record<string, string | number>) => string
type StoryTone = 'good' | 'warn' | 'bad'

const grayButton = 'h-10 cursor-pointer rounded-xl bg-foreground/5 px-4 text-[13px] font-bold normal-case tracking-normal text-foreground hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-primary/30'
const primaryButton = 'h-10 cursor-pointer rounded-xl bg-primary px-4 text-[13px] font-bold normal-case tracking-normal text-primary-foreground hover:bg-primary/90'
// A block inside the collapsible details: flat, separated from its neighbours by a divider instead of its own card.
const blockClass = 'grid gap-3 border-t border-border/60 pt-6 first:border-t-0 first:pt-0'

function SectionTitle({ icon, aside, children }: { icon: ReactNode; aside?: ReactNode; children: ReactNode }) {
  return <div className="flex min-h-6 items-center justify-between gap-3">
    <h2 className="flex items-center gap-2.5 font-sans text-lg font-bold tracking-normal normal-case">
      <span className="text-primary [&>svg]:size-6">{icon}</span>
      {children}
    </h2>
    {aside}
  </div>
}

function Rows({ children }: { children: ReactNode }) {
  return <dl className="grid gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4">{children}</dl>
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return <div className="flex items-start justify-between gap-3 border-t border-border/50 pt-3 first:border-t-0 first:pt-0">
    <dt className="text-sm font-semibold text-muted-foreground">{label}</dt>
    <dd className="min-w-0 text-end text-sm font-bold break-words">{children}</dd>
  </div>
}

function Fact({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return <div className="flex min-w-0 items-center gap-3">
    <span className="shrink-0 text-primary [&>svg]:size-6">{icon}</span>
    <div className="min-w-0">
      <dt className="text-sm font-semibold text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-bold sm:max-lg:text-sm lg:text-base max-sm:text-base">{children}</dd>
    </div>
  </div>
}

function ProofButton({ url, children }: { url: string; children: ReactNode }) {
  return <Button className={primaryButton + ' w-full sm:w-fit'} render={<a href={resolveFileUrl(url)} target="_blank" rel="noreferrer" />}>
    <ReceiptText className="size-4" />{children}<ExternalLink className="size-3.5" />
  </Button>
}

function AppointmentContent({ d }: { d: PatientAppointmentDetails }) {
  const { t, i18n } = useTranslation()
  const api = useApi()
  const queryClient = useQueryClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [success, setSuccess] = useState('')
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  // Only a visibility hint; the backend decides whether the cancellation is actually allowed.
  const canCancel = ['PendingPayment', 'Confirmed'].includes(String(d.appointmentStatus))
  const cancel = useMutation({
    mutationFn: () => api.request<string>(`/api/appointments/${d.appointmentId}/cancel`, { method: 'PATCH' }, { notifyOnError: false }),
    onSuccess: async (message) => {
      setConfirmOpen(false)
      setMenuOpen(false)
      setSuccess(message)
      // Refreshes the details, the list and the review for this patient.
      await queryClient.invalidateQueries({ queryKey: ['patient', 'appointments'] })
    },
  })
  const locale = i18n.resolvedLanguage === 'ar' ? 'ar-EG' : 'en-EG'
  const tr: Tr = (key, defaultValue, options) => t('patientPortal.appointments.' + key, { defaultValue, ...options })
  const money = (value: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP', maximumFractionDigits: 2 }).format(value)
  const status = (value: string) => t('secretary.status.' + value, { defaultValue: humanize(value) })
  const label = (group: string, value: string) => t(`secretary.${group}.${value}`, { defaultValue: humanize(value) })
  const manualLabel = (value: string) => t('manualPayments.' + value, { defaultValue: humanize(value) })
  const stamp = (value: string) => parseUtc(value).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })

  const state = String(d.appointmentStatus)
  const dayLong = parseDay(d.slotDate).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const timeRange = `${formatClock(d.slotDate, d.slotStartTime, locale)} – ${formatClock(d.slotDate, d.slotEndTime, locale)}`
  const held = d.reservationExpiresAt && state === 'PendingPayment'
  // The balance only counts as "due" while the booking is still alive.
  const alive = ['PendingPayment', 'PendingVerification', 'Confirmed'].includes(state)
  const remainingDue = alive && d.remainingAmount > 0 && d.remainingPaymentStatus !== 'Paid'
  const settled = d.remainingAmount <= 0 || d.remainingPaymentStatus === 'Paid'
  const showRemaining = Boolean(d.remainingPaymentStatus || d.remainingPaymentMethodType || d.remainingClinicManualPaymentMethodType || d.remainingAmount > 0)
  const hasRefund = d.requestedDepositRefundAmount != null || Boolean(d.depositRefundStatus)
  const refundTone = statusTone(d.depositRefundStatus)
  const hasPolicy = d.fullRefundCancellationWindowMinutes != null || d.bookingCancellationGracePeriodMinutes != null
  const paidPercent = d.consultationFee > 0 ? Math.min(100, Math.round((d.totalPaidAmount / d.consultationFee) * 100)) : 0
  const rejected = d.depositPaymentStatus === 'Rejected' || Boolean(d.depositPaymentRejectionReason)

  const methodHint = d.depositPaymentMethodType === 'Paymob'
    ? tr('hintPaymob', 'Handled online through Paymob.')
    : d.depositPaymentMethodType === 'ManualTransfer'
      ? null
      : d.depositPaymentMethodType === 'CashAtClinic'
        ? tr('hintCash', 'Handled in cash at the clinic.')
        : null

  // One sentence that tells the patient where things stand, built only from fields the API already returns.
  const refundAmount = money(d.requestedDepositRefundAmount ?? d.depositAmount)
  const nothingDue = tr('story.nothingDue', 'Nothing is due from you.')
  let story: { tone: StoryTone; title: string; note?: string } | null = null
  if (state === 'PendingPayment') {
    // The payment form below already explains what to do; only a rejected proof deserves its own message.
    if (rejected) story = { tone: 'warn', title: tr('story.rejected', 'Your last payment proof wasn’t accepted.'), note: d.depositPaymentRejectionReason || undefined }
  } else if (state === 'PendingVerification') {
    story = { tone: 'warn', title: tr('story.verifying', 'We received your payment proof. The clinic is verifying it, and your appointment will be confirmed once it’s approved.') }
  } else if (state === 'Confirmed') {
    story = settled
      ? { tone: 'good', title: tr('story.confirmedPaid', 'Your appointment is confirmed and fully paid.') }
      : { tone: 'good', title: tr('story.confirmedDue', 'Your appointment is confirmed. You paid the {{deposit}} deposit, and the remaining {{remaining}} is paid at the clinic.', { deposit: money(d.depositAmount), remaining: money(d.remainingAmount) }) }
  } else if (state === 'Completed') {
    story = { tone: 'good', title: settled ? tr('story.completedPaid', 'Your visit is complete and everything is paid.') : tr('story.completed', 'Your visit is complete.') }
  } else if (state === 'NoShow') {
    story = { tone: 'bad', title: tr('story.noShow', 'You didn’t attend this appointment, so it was marked as a no-show.'), note: tr('story.noShowNote', 'The deposit was kept by the clinic, and nothing else is due from you.') }
  } else if (state === 'Cancelled') {
    if (rejected && !hasRefund) story = { tone: 'bad', title: tr('story.cancelledRejected', 'Your payment proof was rejected, so this appointment was cancelled.'), note: d.depositPaymentRejectionReason ? tr('story.rejectedReason', 'Reason: {{reason}}', { reason: d.depositPaymentRejectionReason }) : nothingDue }
    else if (hasRefund && refundTone === 'good') story = { tone: 'good', title: tr('story.cancelledRefunded', 'Your appointment was cancelled and your {{amount}} deposit has been refunded.', { amount: refundAmount }), note: nothingDue }
    else if (hasRefund && refundTone === 'warn') story = { tone: 'warn', title: tr('story.cancelledRefunding', 'Your appointment was cancelled. Your {{amount}} deposit refund is being processed.', { amount: refundAmount }), note: nothingDue }
    else if (hasRefund && refundTone === 'bad') story = { tone: 'bad', title: tr('story.cancelledRefundFailed', 'Your appointment was cancelled, but the {{amount}} refund couldn’t be completed. Please contact the clinic.', { amount: refundAmount }) }
    else story = d.totalPaidAmount > 0
      ? {
          tone: 'bad',
          title: tr('story.cancelledNoRefund', 'Your appointment was cancelled. The deposit was not refunded.'),
          note: d.fullRefundCancellationWindowMinutes != null
            ? tr('story.noRefundWindow', 'A full refund applies only when you cancel at least {{duration}} before the appointment. See the cancellation and refund policy in the details below.', { duration: formatDuration(d.fullRefundCancellationWindowMinutes, locale) })
            : tr('story.noRefundPolicy', 'The deposit wasn’t refunded under the cancellation and refund policy. See the details below.'),
        }
      : { tone: 'bad', title: tr('story.cancelledUnpaid', 'Your appointment was cancelled. No payment was made.'), note: nothingDue }
  } else if (state === 'Expired') {
    story = { tone: 'bad', title: tr('story.expired', 'This reservation expired before the deposit was paid, so the time slot was released.'), note: nothingDue }
  }
  const StoryIcon = story?.tone === 'good' ? CircleCheckBig : story?.tone === 'bad' ? TriangleAlert : Info

  return <div className="mt-6 grid gap-8">
    {success && <Notice tone="success" message={success} />}
    {rescheduleOpen && <RescheduleAppointmentDialog d={d} onClose={() => setRescheduleOpen(false)} onDone={setSuccess} />}
    <ConfirmationDialog
      open={confirmOpen}
      title={tr('cancelTitle', 'Cancel appointment?')}
      description={tr('cancelDescription', 'Are you sure you want to cancel this appointment? This action cannot be undone.')}
      confirmLabel={tr('cancelConfirm', 'Yes, cancel appointment')}
      cancelLabel={tr('cancelKeep', 'Keep appointment')}
      destructive
      pending={cancel.isPending}
      error={cancel.error ? getErrorMessage(cancel.error) : undefined}
      onConfirm={() => cancel.mutate()}
      onOpenChange={(open) => { if (!open && !cancel.isPending) { setConfirmOpen(false); cancel.reset() } }}
    />
    <header className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm min-[400px]:p-5 sm:p-9">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center rounded-full border border-primary/15 bg-primary/10 px-3.5 py-1.5 text-xs font-extrabold tracking-wider text-primary uppercase">{tr('number', 'Appointment #{{id}}', { id: d.appointmentId })}</span>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill large status={d.appointmentStatus} label={status(d.appointmentStatus)} />
          {canCancel && <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger render={<Button type="button" variant="ghost" size="icon" className="size-10 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary" disabled={cancel.isPending} />} aria-label={tr('manage', 'Manage appointment')}><Ellipsis className="size-5" /></PopoverTrigger>
            <PopoverContent className="w-64 gap-0 rounded-2xl p-1.5">
              <PopoverTitle className="px-3 pt-2 pb-2.5 text-sm leading-none font-bold normal-case tracking-normal text-muted-foreground">{tr('manage', 'Manage appointment')}</PopoverTitle>
              <div aria-hidden="true" className="mx-1.5 mb-1.5 h-px bg-border/60" />
              <button type="button" className="group flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 text-start text-[13px] font-bold text-destructive transition-colors hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-destructive/30 focus-visible:outline-none" onClick={() => { setMenuOpen(false); cancel.reset(); setSuccess(''); setConfirmOpen(true) }}>
                <CalendarX className="size-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />{tr('cancelAction', 'Cancel appointment')}
              </button>
              <div aria-hidden="true" className="mx-1.5 my-1 h-px bg-border/60" />
              <button type="button" className="group flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 text-start text-[13px] font-bold whitespace-nowrap text-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none" onClick={() => { setMenuOpen(false); setSuccess(''); setRescheduleOpen(true) }}>
                <CalendarClock className="size-4 shrink-0 text-primary transition-transform duration-200 group-hover:scale-110" />{tr('rescheduleAction', 'Reschedule appointment')}
              </button>
            </PopoverContent>
          </Popover>}
        </div>
      </div>
      <h1 className="mt-4 font-sans text-2xl leading-tight font-bold break-words min-[400px]:text-3xl sm:text-5xl">{d.doctorName}</h1>
      <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground sm:text-base"><MapPin className="size-4 shrink-0 text-primary" />{d.clinicName}</p>
      <dl className="mt-6 grid divide-y divide-border/50 rounded-2xl border border-border/60 bg-muted/30 sm:mt-7 sm:grid-cols-3 sm:divide-x sm:divide-y-0 rtl:sm:divide-x-reverse">
        <div className="px-4 py-3.5 sm:px-5 sm:py-4"><Fact icon={<CalendarDays />} label={tr('date', 'Date')}>{dayLong}</Fact></div>
        <div className="px-4 py-3.5 sm:px-5 sm:py-4"><Fact icon={<Clock3 />} label={tr('time', 'Time')}><span dir="ltr">{timeRange}</span></Fact></div>
        <div className="px-4 py-3.5 sm:px-5 sm:py-4"><Fact icon={<CalendarCheck2 />} label={tr('bookedOn', 'Booked on')}>{stamp(d.bookingDate)}</Fact></div>
      </dl>
      {held && <p className="mt-6 flex items-start gap-3 rounded-2xl border border-warm/25 bg-warm/10 px-4 py-3 text-sm leading-6 font-semibold text-warm"><Timer className="mt-0.5 size-5 shrink-0" />{tr('heldBanner', "Your slot is held until {{time}}. It may be released if the booking isn't completed by then.", { time: stamp(d.reservationExpiresAt as string) })}</p>}
    </header>

    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] xl:gap-14">
      <div className="grid min-w-0 gap-4">
        {story && <section className="flex items-center gap-4 px-1 py-2" aria-label={tr('story.label', 'Appointment summary')}>
          <span className="relative grid size-12 shrink-0 place-items-center">
            <span aria-hidden="true" className={`absolute inset-0 rounded-full opacity-60 motion-safe:animate-pulse ${story.tone === 'good' ? 'bg-primary/15' : story.tone === 'warn' ? 'bg-warm/20' : 'bg-destructive/15'}`} />
            <span className={`relative grid size-9 place-items-center rounded-full ${story.tone === 'good' ? 'bg-primary text-primary-foreground' : story.tone === 'warn' ? 'bg-warm text-white' : 'bg-destructive text-white'}`}>
              <StoryIcon className="size-5" />
            </span>
          </span>
          <div className="min-w-0">
            <p className="text-base leading-7 font-bold text-foreground sm:text-lg">
              {story.title.split(/(EGP\s?[\d,]+(?:\.\d+)?|[\d,]+(?:\.\d+)?\s?ج\.م\.?|ج\.م\.?\s?[\d,٠-٩]+(?:[.٫][\d٠-٩]+)?)/).map((part, index) => index % 2 === 1
                ? <span key={index} dir="ltr" className={`inline-block tabular-nums ${story.tone === 'good' ? 'text-primary' : story.tone === 'warn' ? 'text-warm' : 'text-destructive'}`}>{part}</span>
                : part)}
            </p>
            {story.note && <p className="mt-0.5 text-sm leading-6 font-semibold break-words text-muted-foreground">{story.note}</p>}
          </div>
        </section>}

        <PatientDepositPayment d={d} money={money} />

        <details className="group rounded-2xl border border-border/60 bg-card shadow-sm">
          <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-2xl px-4 py-3.5 marker:hidden sm:px-5 sm:py-4 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none sm:px-6 [&::-webkit-details-marker]:hidden">
            <span className="min-w-0 flex-1 font-sans text-lg font-bold">{tr('detailsToggle', 'Booking and payment details')}</span>
            <span className="text-xs font-bold text-primary group-open:hidden">{tr('detailsShow', 'Show')}</span>
            <span className="hidden text-xs font-bold text-primary group-open:inline">{tr('detailsHide', 'Hide')}</span>
            <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" />
          </summary>

          <div className="grid gap-5 border-t border-border/60 p-4 sm:gap-6 sm:p-6">
            <section className={blockClass} aria-label={tr('infoSection', 'Appointment')}>
              <SectionTitle icon={<CalendarDays />}>{tr('infoSection', 'Appointment')}</SectionTitle>
              <dl className="grid gap-2.5 sm:grid-cols-2">
                <div className="min-w-0 rounded-2xl border border-border/60 bg-muted/30 px-4 py-4">
                  <dt className="text-sm font-semibold text-muted-foreground">{tr('bookingType', 'Booking type')}</dt>
                  <dd className="mt-1.5 truncate text-base font-bold">{label('bookingType', d.bookingType)}</dd>
                </div>
                <div className="min-w-0 rounded-2xl border border-border/60 bg-muted/30 px-4 py-4">
                  <dt className="text-sm font-semibold text-muted-foreground">{t('secretary.appointments.bookingSource', { defaultValue: 'Booked by' })}</dt>
                  <dd className="mt-1.5 truncate text-base font-bold">{label('bookingSource', d.bookingSource)}</dd>
                </div>
                {held && <div className="min-w-0 rounded-2xl border border-border/60 bg-muted/30 px-4 py-4 sm:col-span-2">
                  <dt className="text-sm font-semibold text-muted-foreground">{tr('heldUntilLabel', 'Slot held until')}</dt>
                  <dd className="mt-1.5 text-base font-bold">{stamp(d.reservationExpiresAt as string)}</dd>
                </div>}
              </dl>
            </section>

            <section className={blockClass} aria-label={tr('depositSection', 'Deposit payment')}>
              <SectionTitle icon={<Banknote />} aside={<StatusPill status={d.depositPaymentStatus} label={status(d.depositPaymentStatus)} />}>{tr('depositSection', 'Deposit payment')}</SectionTitle>
              {rejected && <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm leading-6 text-destructive">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                <div className="min-w-0">
                  <strong className="block font-bold">{tr('rejectionTitle', 'This payment was rejected')}</strong>
                  {d.depositPaymentRejectionReason && <p className="mt-0.5 font-semibold break-words">{d.depositPaymentRejectionReason}</p>}
                </div>
              </div>}
              <Rows>
                <Row label={tr('amount', 'Amount')}><span dir="ltr" className="tabular-nums">{money(d.depositAmount)}</span></Row>
                {d.depositPaymentMethodType && <Row label={tr('paymentMethod', 'Payment method')}>{label('paymentMethod', d.depositPaymentMethodType)}</Row>}
                {d.depositClinicManualPaymentMethodType && <Row label={tr('transferMethod', 'Transfer method')}>{manualLabel(d.depositClinicManualPaymentMethodType)}</Row>}
                {d.depositPaymentTransactionReference && <Row label={tr('reference', 'Transaction reference')}><span dir="ltr" className="font-mono">{d.depositPaymentTransactionReference}</span></Row>}
              </Rows>
              {methodHint && <p className="text-sm leading-6 font-medium text-muted-foreground">{methodHint}</p>}
              {d.manualDepositPaymentProofUrl && <ProofButton url={d.manualDepositPaymentProofUrl}>{tr('viewProof', 'View payment proof')}</ProofButton>}
            </section>

            {showRemaining && <section className={blockClass} aria-label={tr('remainingSection', 'Remaining payment')}>
              <SectionTitle icon={<Wallet />} aside={d.remainingPaymentStatus ? <StatusPill status={d.remainingPaymentStatus} label={status(d.remainingPaymentStatus)} /> : undefined}>{tr('remainingSection', 'Remaining payment')}</SectionTitle>
              <Rows>
                <Row label={tr('amount', 'Amount')}><span dir="ltr" className="tabular-nums">{money(d.remainingAmount)}</span></Row>
                {d.remainingPaymentMethodType && <Row label={tr('paymentMethod', 'Payment method')}>{label('paymentMethod', d.remainingPaymentMethodType)}</Row>}
                {d.remainingClinicManualPaymentMethodType && <Row label={tr('transferMethod', 'Transfer method')}>{manualLabel(d.remainingClinicManualPaymentMethodType)}</Row>}
              </Rows>
              {!d.remainingPaymentStatus && d.remainingAmount > 0 && <p className="text-sm leading-6 font-medium text-muted-foreground">{tr('remainingAtClinic', 'The remaining balance is collected at the clinic during your visit.')}</p>}
            </section>}

            {hasRefund && <section className={blockClass} aria-label={tr('refundSection', 'Deposit refund')}>
              <SectionTitle icon={<Undo2 />} aside={d.depositRefundStatus ? <StatusPill status={d.depositRefundStatus} label={status(d.depositRefundStatus)} /> : undefined}>{tr('refundSection', 'Deposit refund')}</SectionTitle>
              <Rows>
                {d.requestedDepositRefundAmount != null && <Row label={tr('refundAmount', 'Refund amount')}><span dir="ltr" className="tabular-nums">{money(d.requestedDepositRefundAmount)}</span></Row>}
                {d.depositRefundMethodType && <Row label={tr('refundMethod', 'Refund method')}>{label('paymentMethod', d.depositRefundMethodType)}</Row>}
                {d.depositRefundReason && <Row label={tr('refundReason', 'Reason')}>{label('refundReason', d.depositRefundReason)}</Row>}
                {d.depositRefundRequestedAt && <Row label={tr('requestedAt', 'Requested on')}>{stamp(d.depositRefundRequestedAt)}</Row>}
                {d.depositRefundProcessedAt && <Row label={tr('processedAt', 'Processed on')}>{stamp(d.depositRefundProcessedAt)}</Row>}
                {d.manualDepositRefundTransactionReference && <Row label={tr('reference', 'Transaction reference')}><span dir="ltr" className="font-mono">{d.manualDepositRefundTransactionReference}</span></Row>}
              </Rows>
              {d.manualDepositRefundProofUrl && <ProofButton url={d.manualDepositRefundProofUrl}>{tr('refundProof', 'View refund proof')}</ProofButton>}
            </section>}

            {hasPolicy && <section className={blockClass} aria-label={tr('policySection', 'Cancellation and refund policy')}>
              <SectionTitle icon={<ScrollText />}>{tr('policySection', 'Cancellation and refund policy')}</SectionTitle>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {d.fullRefundCancellationWindowMinutes != null && <div className="min-w-0 rounded-2xl border border-border/60 bg-muted/30 px-4 py-4">
                  <p className="text-sm font-semibold text-muted-foreground">{tr('fullRefundTitle', 'Full refund window')}</p>
                  <strong className="mt-1 block font-sans text-2xl font-bold">{formatDuration(d.fullRefundCancellationWindowMinutes, locale)}</strong>
                  <p className="mt-2 text-sm leading-6 font-medium text-muted-foreground">{tr('fullRefundText', 'Cancel at least {{duration}} before your appointment to get a full refund of your deposit.', { duration: formatDuration(d.fullRefundCancellationWindowMinutes, locale) })}</p>
                </div>}
                {d.bookingCancellationGracePeriodMinutes != null && <div className="min-w-0 rounded-2xl border border-border/60 bg-muted/30 px-4 py-4">
                  <p className="text-sm font-semibold text-muted-foreground">{tr('graceTitle', 'Booking grace period')}</p>
                  <strong className="mt-1 block font-sans text-2xl font-bold">{formatDuration(d.bookingCancellationGracePeriodMinutes, locale)}</strong>
                  <p className="mt-2 text-sm leading-6 font-medium text-muted-foreground">{tr('graceText', 'Cancellations made within {{duration}} of booking fall under the booking grace period.', { duration: formatDuration(d.bookingCancellationGracePeriodMinutes, locale) })}</p>
                </div>}
              </div>
            </section>}
          </div>
        </details>
      </div>

      <aside className="grid gap-4 md:max-lg:grid-cols-2 md:max-lg:items-start lg:sticky lg:top-28" aria-label={tr('paymentSummary', 'Payment summary')}>
        <div className="relative isolate overflow-hidden rounded-3xl border border-primary/15 bg-card p-5 shadow-xl shadow-primary/10 sm:p-6">
          <span aria-hidden="true" className="pointer-events-none absolute -end-12 -top-12 -z-10 size-40 rounded-full bg-primary/10 blur-3xl" />
          <h2 className="font-sans text-lg font-bold">{tr('paymentSummary', 'Payment summary')}</h2>
          <p className="mt-5 text-sm font-semibold text-muted-foreground">{tr('consultationFee', 'Consultation fee')}</p>
          <strong dir="ltr" className="mt-1 block text-start font-sans text-3xl font-bold tabular-nums sm:text-4xl">{money(d.consultationFee)}</strong>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-foreground/10" role="img" aria-label={`${paidPercent}%`}>
            <span className="block h-full rounded-full bg-primary transition-all duration-500 motion-reduce:transition-none" style={{ width: `${paidPercent}%` }} />
          </div>
          <dl className="mt-5 divide-y divide-border/60 border-t border-border/60">
            <div className="flex items-center justify-between gap-4 py-3.5">
              <dt className="text-sm font-semibold text-muted-foreground">{tr('depositLabel', 'Deposit')}</dt>
              <dd dir="ltr" className="text-sm font-bold tabular-nums">{money(d.depositAmount)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3.5">
              <dt className="text-sm font-semibold text-muted-foreground">{tr('totalPaid', 'Total paid')}</dt>
              <dd dir="ltr" className="text-sm font-bold tabular-nums text-primary">{money(d.totalPaidAmount)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3.5">
              <dt className="text-sm font-semibold text-muted-foreground">{tr('remaining', 'Remaining')}</dt>
              <dd dir="ltr" className={`text-sm font-bold tabular-nums ${remainingDue ? toneText.warn : ''}`}>{money(d.remainingAmount)}</dd>
            </div>
          </dl>
        </div>
        <AppointmentReviewSection appointmentId={d.appointmentId} status={d.appointmentStatus} />
      </aside>
    </div>
  </div>
}

function DetailsSkeleton({ label }: { label: string }) {
  return <div role="status" aria-label={label} className="mt-6 grid gap-8">
    <Skeleton className="h-64 rounded-3xl motion-reduce:animate-none" />
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="grid gap-8"><Skeleton className="h-56 rounded-2xl motion-reduce:animate-none" /><Skeleton className="h-48 rounded-2xl motion-reduce:animate-none" /><Skeleton className="h-40 rounded-2xl motion-reduce:animate-none" /></div>
      <Skeleton className="h-72 rounded-3xl motion-reduce:animate-none" />
    </div>
  </div>
}

export default function PatientAppointmentDetailsPage() {
  const { t } = useTranslation()
  const api = useApi()
  const { appointmentId } = useParams({ from: '/patient/appointments/$appointmentId' })
  const tr: Tr = (key, defaultValue, options) => t('patientPortal.appointments.' + key, { defaultValue, ...options })
  const id = Number(appointmentId)
  const valid = Number.isInteger(id) && id > 0

  const details = useQuery({
    queryKey: ['patient', 'appointments', 'details', id],
    queryFn: () => api.request<PatientAppointmentDetails>(`/api/appointments/${id}`, {}, { notifyOnError: false }),
    enabled: valid,
    // 403/404 won't change on retry; only transient failures are worth repeating.
    retry: (count, error) => !(error instanceof ApiError && (error.status === 403 || error.status === 404)) && count < 2,
  })
  const errorStatus = details.error instanceof ApiError ? details.error.status : undefined
  const forbidden = errorStatus === 403
  const unavailable = !valid || errorStatus === 404 || forbidden

  return <PatientShell>
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
      <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-2 text-xs font-bold text-muted-foreground">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"><House className="size-3.5" />{t('patientPortal.nav.home', { defaultValue: 'Home' })}</Link>
        <span aria-hidden="true">/</span>
        <Link to="/patient/appointments" className="transition-colors hover:text-primary">{t('patientPortal.nav.appointments', { defaultValue: 'My Appointments' })}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="text-foreground">{valid ? `#${id}` : '…'}</span>
      </nav>
      <Link to="/patient/appointments" className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="size-4 rtl:rotate-180" />{tr('back', 'Back to my appointments')}
      </Link>

      {valid && details.isLoading && <DetailsSkeleton label={tr('loadingDetails', 'Loading appointment details')} />}

      {unavailable && <section className="relative isolate mt-6 grid place-items-center overflow-hidden px-4 py-14 text-center sm:py-28">
        <div className="relative">
          <span className="relative grid size-16 place-items-center rounded-full bg-primary text-primary-foreground ring-8 ring-primary/10">{forbidden ? <ShieldAlert className="size-7" /> : <SearchX className="size-7" />}</span>
          <span className="absolute -end-6 -top-3 size-3 rounded-full bg-primary/40 motion-safe:animate-bounce" />
          <span className="absolute -start-8 top-8 size-2 rounded-full bg-primary/30 motion-safe:animate-pulse" />
          <span className="absolute -end-10 bottom-4 size-2.5 rounded-full bg-primary/25 motion-safe:animate-pulse" />
        </div>
        <h1 className="mt-8 font-sans text-2xl font-bold sm:mt-10 sm:text-4xl">{forbidden ? tr('forbiddenTitle', 'This appointment is not available to you') : tr('notFoundTitle', 'We could not find this appointment')}</h1>
        <p className="mt-5 max-w-md text-sm leading-7 font-medium text-muted-foreground sm:text-base">{forbidden ? tr('forbiddenDescription', 'You can only open appointments that belong to your account. Check your appointments list instead.') : tr('notFoundDescription', 'It may have been removed, or the link may be incorrect. Open your appointments list to find it.')}</p>
        <Button className={primaryButton + ' mt-6'} render={<Link to="/patient/appointments" />}><ArrowLeft className="size-4 rtl:rotate-180" />{tr('back', 'Back to my appointments')}</Button>
      </section>}

      {details.isError && !unavailable && <div className="mt-6 flex flex-wrap items-center gap-3 rounded-3xl border border-destructive/20 bg-destructive/5 p-4 sm:p-6">
        <p className="min-w-0 flex-1 text-sm font-bold text-destructive">{getErrorMessage(details.error)}</p>
        <Button type="button" variant="ghost" className={grayButton} disabled={details.isFetching} onClick={() => details.refetch()}><RefreshCw className="size-4" />{t('errors.tryAgain')}</Button>
      </div>}

      {details.data && <AppointmentContent d={details.data} />}
    </div>
  </PatientShell>
}