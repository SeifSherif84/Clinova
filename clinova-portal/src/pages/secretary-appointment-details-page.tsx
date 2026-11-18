import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { ArrowLeft, Ban, Banknote, CalendarClock, CalendarDays, ChevronRight, CircleCheckBig, Clock3, Copy, Ellipsis, ExternalLink, HandCoins, LoaderCircle, PhoneCall, ReceiptText, RefreshCw, ShieldAlert, Sparkles, Stethoscope, TriangleAlert, Undo2, UserRound, UserX, Wallet, type LucideIcon } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import ConfirmationDialog from '@/components/confirmation-dialog'
import DoctorWorkspaceShell from '@/components/doctor-workspace-shell'
import Notice from '@/components/notice'
import { CancelAppointmentDialog, ConfirmRefundDialog, MarkCompletedDialog, type DialogOutcome } from '@/components/secretary-appointment-dialogs'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useApi } from '@/hooks/use-api'
import { ApiError, getErrorMessage } from '@/lib/api'
import { availableActions, formatTime, parseSlotDate, resolveFileUrl, statusTone } from '@/lib/secretary-appointments'
import type { SecretaryAppointmentAction, SecretaryAppointmentDetails } from '@/types/secretary'

type OpenDialog = 'cancel' | 'refund' | 'complete' | 'no-show' | null

const spinner = <LoaderCircle className="animate-spin motion-reduce:animate-none" />
const buttonClass = 'h-10 rounded-xl px-4 text-[13px] font-bold normal-case tracking-normal'
const primaryButton = buttonClass + ' bg-primary text-primary-foreground hover:bg-primary/90'
const grayButton = buttonClass + ' border-transparent bg-foreground/5 text-foreground shadow-none hover:bg-foreground/10 dark:border-transparent dark:bg-foreground/5 dark:hover:bg-foreground/10'
const dangerButton = buttonClass + ' border border-transparent bg-destructive bg-clip-border text-white shadow-md shadow-destructive/25 transition hover:-translate-y-0.5 hover:bg-destructive/90 hover:shadow-lg hover:shadow-destructive/30 focus-visible:ring-2 focus-visible:ring-destructive/30 active:translate-y-0 disabled:translate-y-0 disabled:shadow-none motion-reduce:transition-none'
const statusClass = 'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold leading-5'
// Splits enum names such as "CashAtClinic" when no translation exists yet.
const humanize = (value: string) => value.replace(/([a-z])([A-Z])/g, '$1 $2')

// Open section inside the record: a small heading, optional trailing status, and content separated by a divider.
function Section({ icon: Icon, title, aside, children }: { icon: LucideIcon; title: string; aside?: ReactNode; children: ReactNode }) {
  return <section className="grid gap-3 rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:px-6">
    <div className="flex min-h-6 items-center justify-between gap-3">
      <h2 className="flex items-center gap-2.5 font-sans text-lg font-bold tracking-normal normal-case"><Icon className="size-6 text-primary" />{title}</h2>
      {aside}
    </div>
    {children}
  </section>
}

export default function SecretaryAppointmentDetailsPage() {
  const { t, i18n } = useTranslation()
  const api = useApi()
  const queryClient = useQueryClient()
  const { appointmentId } = useParams({ from: '/secretary/appointments/$appointmentId' })
  const listSearch = useSearch({ from: '/secretary/appointments/$appointmentId' })
  const id = Number(appointmentId)
  const validId = Number.isInteger(id) && id > 0
  const [rejecting, setRejecting] = useState(false)
  const [dialog, setDialog] = useState<OpenDialog>(null)
  const [reason, setReason] = useState('')
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState(() => { try { return sessionStorage.getItem('secretary-flash-message') ?? '' } catch { return '' } })
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  useEffect(() => { try { sessionStorage.removeItem('secretary-flash-message') } catch { /* nothing to clear */ } }, [])
  const locale = i18n.resolvedLanguage === 'ar' ? 'ar-EG' : 'en-EG'

  const details = useQuery({
    queryKey: ['secretary', 'appointments', 'details', id],
    queryFn: () => api.request<SecretaryAppointmentDetails>(`/api/appointments/${id}/management`, {}, { notifyOnError: false }),
    enabled: validId,
    // 403/404 won't change on retry; only transient failures are worth repeating.
    retry: (count, error) => !(error instanceof ApiError && (error.status === 403 || error.status === 404)) && count < 2,
  })
  const action = useMutation({
    mutationFn: (type: SecretaryAppointmentAction) => {
      const path = type === 'approve' || type === 'reject' ? `manual-payment/${type}` : type
      return api.request<unknown>(`/api/appointments/${id}/${path}`, {
        method: type === 'approve' || type === 'reject' ? 'POST' : 'PATCH',
        body: type === 'reject' ? JSON.stringify({ reason: reason.trim() }) : undefined,
      }, { notifyOnError: false })
    },
    onMutate: () => { setSuccess('') },
    onSuccess: (_result, type) => { setRejecting(false); setReason(''); setDialog(null); setSuccess(t('secretary.appointments.done.' + type)) },
    // Refresh the list and details after every attempt; a failure usually means the appointment changed.
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['secretary', 'appointments'] }),
  })

  function submitRejection() {
    const value = reason.trim()
    if (value.length < 5 || value.length > 500) return setFormError(t('secretary.appointments.reasonLength'))
    setFormError('')
    action.mutate('reject')
  }
  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); setSuccess(t('secretary.appointments.copied')) }
    catch { setFormError(t('common.genericError')) }
  }

  const money = (value: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP', maximumFractionDigits: 2 }).format(value)
  const status = (value: string) => t('secretary.status.' + value, { defaultValue: humanize(value) })
  const label = (group: string, value: string) => t(`secretary.${group}.${value}`, { defaultValue: humanize(value) })
  const busy = (type: SecretaryAppointmentAction) => action.isPending && action.variables === type
  const copyButton = (value: string) => <Button variant="ghost" size="icon" className="size-8 shrink-0 rounded-lg text-muted-foreground hover:text-primary" aria-label={t('secretary.appointments.copy')} onClick={() => copy(value)}><Copy className="size-4" /></Button>

  const backLink = (
    <Link className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition hover:text-foreground" to="/secretary/appointments" search={listSearch}>
      <ArrowLeft className="size-4 rtl:rotate-180" />
      {t('secretary.appointments.back')}
    </Link>
  )

  const errorStatus = details.error instanceof ApiError ? details.error.status : undefined
  const unavailable = !validId || errorStatus === 404 || errorStatus === 403
  const data = details.data
  const allowed = data ? availableActions(data) : null
  const date = data ? parseSlotDate(data.slotDate) : null
  const showAside = Boolean(allowed && (allowed.verify || allowed.confirmRefund))
  const canReschedule = data?.appointmentStatus === 'Confirmed'
  const refundedAt = data?.depositRefundProcessedAt ? new Date(data.depositRefundProcessedAt) : null
  const remainingDue = data ? data.remainingPaymentAmount > 0 && data.remainingPaymentStatus !== 'Paid' : false
  const dialogProps = { onOpenChange: (open: boolean) => { if (!open) setDialog(null) }, onDone: (result: DialogOutcome) => { setSuccess(result.message) } }

  return (
    <DoctorWorkspaceShell active="secretary-appointments" topBackLink={backLink}>
      <div className="mx-auto w-full min-w-0 max-w-screen-2xl p-4 sm:p-6 lg:p-10">
        {success && <Notice tone="success" message={success} />}
        {(formError || action.error) && <Notice message={formError || getErrorMessage(action.error)} />}

        {validId && details.isLoading && <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]" role="status" aria-label={t('secretary.appointments.loadingDetails')}>
          <Skeleton className="h-[34rem] rounded-xl motion-reduce:animate-none" />
          <Skeleton className="h-56 rounded-xl motion-reduce:animate-none" />
        </div>}

        {unavailable && <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <span className="grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground">{errorStatus === 403 ? <ShieldAlert className="size-6" /> : <CalendarDays className="size-6" />}</span>
          <h1 className="mt-4 font-heading text-xl font-bold sm:text-2xl">{t(errorStatus === 403 ? 'secretary.appointments.forbiddenTitle' : 'secretary.appointments.notFoundTitle')}</h1>
          <p className="mt-2 max-w-md text-xs leading-6 text-muted-foreground sm:text-sm">{t(errorStatus === 403 ? 'secretary.appointments.forbiddenDescription' : 'secretary.appointments.notFoundDescription')}</p>
          <Button variant="outline" className={grayButton + ' mt-5'} render={<Link to="/secretary/appointments" search={listSearch} />}><ArrowLeft className="rtl:rotate-180" />{t('secretary.appointments.back')}</Button>
        </div>}

        {details.isError && !unavailable && <div className="flex flex-col items-center rounded-xl border border-destructive/20 bg-card p-8 text-center">
          <p className="text-sm font-bold text-destructive">{getErrorMessage(details.error)}</p>
          <Button variant="outline" className={grayButton + ' mt-3'} disabled={details.isFetching} onClick={() => details.refetch()}>{details.isFetching ? spinner : <RefreshCw />}{t('invitations.retry')}</Button>
        </div>}

        {data && allowed && <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <article className="grid min-w-0 gap-4">
            <header className="relative isolate grid gap-5 overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/12 via-card to-primary/5 p-5 shadow-sm sm:p-7">
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
                <span className="absolute -end-12 -top-16 size-56 rounded-full bg-primary/10 blur-3xl" />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center rounded-full border border-primary/15 bg-primary/10 px-3.5 py-1.5 text-xs font-extrabold tracking-wider text-primary uppercase">{t('secretary.appointments.number', { id: data.appointmentId })}</span>
                <div className="flex items-center gap-2">
                  <span className={`${statusClass} ${statusTone(data.appointmentStatus)} !px-3 !py-1 !text-xs !font-extrabold`}>{status(data.appointmentStatus)}</span>
                  {(allowed.cancel || canReschedule) && <Popover open={menuOpen} onOpenChange={setMenuOpen}>
                    <PopoverTrigger render={<Button type="button" variant="ghost" size="icon" className="size-10 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary" disabled={action.isPending} />} aria-label={t('secretary.outcome.manage', { defaultValue: 'Manage appointment' })}><Ellipsis className="size-5" /></PopoverTrigger>
                    <PopoverContent className="w-56 gap-0 rounded-2xl p-1.5">
                      <PopoverTitle className="px-3 pt-2 pb-2.5 text-sm leading-none font-bold normal-case tracking-normal text-muted-foreground">{t('secretary.outcome.manage', { defaultValue: 'Manage appointment' })}</PopoverTitle>
                      <div aria-hidden="true" className="mx-1.5 mb-1.5 h-px bg-border/60" />
                      {canReschedule && <button type="button" className="group flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 text-start text-[13px] font-bold text-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none" onClick={() => { setMenuOpen(false); void navigate({ to: '/secretary/appointments/$appointmentId/reschedule', params: { appointmentId } }) }}>
                        <CalendarClock className="size-4 shrink-0 text-primary transition-transform duration-200 group-hover:scale-110" />{t('secretary.reschedule.action', { defaultValue: 'Reschedule' })}
                      </button>}
                      {canReschedule && allowed.cancel && <div aria-hidden="true" className="mx-1.5 my-1 h-px bg-border/60" />}
                      {allowed.cancel && <button type="button" className="group flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 text-start text-[13px] font-bold text-destructive transition-colors hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-destructive/30 focus-visible:outline-none" onClick={() => { setMenuOpen(false); action.reset(); setDialog('cancel') }}>
                        <Ban className="size-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />{t('secretary.appointments.cancel')}
                      </button>}
                    </PopoverContent>
                  </Popover>}
                </div>
              </div>

              <div className="flex min-w-0 items-center gap-4">
                <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10 sm:size-20 sm:text-2xl">
                  {data.patientName.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
                </span>
                <h1 className="min-w-0 break-words font-sans text-2xl leading-tight font-bold sm:text-4xl">{data.patientName}</h1>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-3">
                <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-border/60 bg-muted/30 px-3.5 py-3">
                  <CalendarDays className="size-5 shrink-0 text-primary" />
                  <span className="grid min-w-0 leading-tight">
                    <small className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{t('secretary.appointments.date')}</small>
                    <strong className="truncate text-sm font-bold">{date ? date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : data.slotDate}</strong>
                  </span>
                </div>
                <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-border/60 bg-muted/30 px-3.5 py-3">
                  <Clock3 className="size-5 shrink-0 text-primary" />
                  <span className="grid min-w-0 leading-tight">
                    <small className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{t('secretary.appointments.time')}</small>
                    <strong dir="ltr" className="truncate text-start text-sm font-bold">{formatTime(data.slotStartTime)} – {formatTime(data.slotEndTime)}</strong>
                  </span>
                </div>
                <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-border/60 bg-muted/30 px-3.5 py-3">
                  <Stethoscope className="size-5 shrink-0 text-primary" />
                  <span className="grid min-w-0 leading-tight">
                    <small className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{t('secretary.appointments.doctor')}</small>
                    <strong className="truncate text-sm font-bold">{data.doctorName}</strong>
                  </span>
                </div>
              </div>

              {allowed.complete && <div className="grid gap-3">
                  <h2 className="font-sans text-base font-bold tracking-normal normal-case">{t('secretary.outcome.title', { defaultValue: 'Record the appointment result' })}</h2>
                  <div role="group" aria-label={t('secretary.outcome.title', { defaultValue: 'Record the outcome' })} className="relative grid gap-3 sm:grid-cols-2">
                    <button type="button" disabled={action.isPending} onClick={() => { action.reset(); setDialog('complete') }} className="group relative flex cursor-pointer items-center gap-4 overflow-hidden rounded-2xl border border-border/60 bg-card p-4 text-start transition duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none active:translate-y-0 disabled:pointer-events-none disabled:opacity-60 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                      <span className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10 transition duration-200 group-hover:scale-105"><CircleCheckBig className="size-4.5" /></span>
                      <span className="relative grid min-w-0 gap-0.5">
                        <strong className="text-[15px] font-bold">{t('secretary.outcome.completed', { defaultValue: 'Completed' })}</strong>
                        <small className="text-xs leading-5 font-semibold text-muted-foreground">{t('secretary.outcome.completedHint', { defaultValue: 'The patient attended and the visit took place.' })}</small>
                      </span>
                      <span className="relative ms-auto grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary transition duration-200 group-hover:bg-primary group-hover:text-primary-foreground"><ChevronRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" /></span>
                    </button>
                    <button type="button" disabled={action.isPending} onClick={() => { action.reset(); setDialog('no-show') }} className="group relative flex cursor-pointer items-center gap-4 overflow-hidden rounded-2xl border border-border/60 bg-card p-4 text-start transition duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-foreground/20 focus-visible:outline-none active:translate-y-0 disabled:pointer-events-none disabled:opacity-60 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                      <span className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-foreground/10 text-foreground/70 ring-4 ring-foreground/5 transition duration-200 group-hover:scale-105 group-hover:bg-foreground/20 group-hover:text-foreground">{busy('mark-no-show') ? spinner : <UserX className="size-4.5" />}</span>
                      <span className="relative grid min-w-0 gap-0.5">
                        <strong className="text-[15px] font-bold">{t('secretary.outcome.noShow', { defaultValue: 'No-show' })}</strong>
                        <small className="text-xs leading-5 font-semibold text-muted-foreground">{t('secretary.outcome.noShowHint', { defaultValue: 'The patient did not attend the appointment.' })}</small>
                      </span>
                      <span className="relative ms-auto grid size-8 shrink-0 place-items-center rounded-full bg-foreground/10 text-foreground/70 transition duration-200 group-hover:bg-foreground/20 group-hover:text-foreground"><ChevronRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" /></span>
                    </button>
                    <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-1/2 z-10 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-border bg-card text-[10px] font-bold text-muted-foreground uppercase shadow-md">{t('secretary.outcome.or', { defaultValue: 'or' })}</span>
                  </div>
              </div>}

              {allowed.verify && <p className="flex items-start gap-2 rounded-xl border border-warm/20 bg-warm/10 px-3 py-2.5 text-xs leading-6 font-semibold text-warm sm:text-sm"><Sparkles className="mt-1 size-4 shrink-0" />{t('secretary.appointments.verifyHint')}</p>}
            </header>
            <Section icon={CalendarDays} title={t('secretary.appointments.appointmentSection')}>
              <dl className="grid gap-2.5 sm:grid-cols-2">
                <div className="min-w-0 rounded-2xl border border-border/60 bg-muted/30 px-4 py-4">
                  <dt className="text-sm font-semibold text-muted-foreground">{t('secretary.appointments.bookingType')}</dt>
                  <dd className="mt-1.5 truncate text-base font-bold">{label('bookingType', data.bookingType)}</dd>
                </div>
                <div className="min-w-0 rounded-2xl border border-border/60 bg-muted/30 px-4 py-4">
                  <dt className="text-sm font-semibold text-muted-foreground">{t('secretary.appointments.bookingSource')}</dt>
                  <dd className="mt-1.5 truncate text-base font-bold">{label('bookingSource', data.bookingSource)}</dd>
                </div>
              </dl>
            </Section>

            <Section icon={UserRound} title={t('secretary.appointments.patient')}>
              {data.patientPhoneNumber && <dl className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/30 px-4 py-4">
                <div className="min-w-0">
                  <dt className="text-xs font-bold tracking-wider text-muted-foreground uppercase">{t('secretary.appointments.phone')}</dt>
                  <dd dir="ltr" className="mt-1.5 truncate text-start text-base font-bold tabular-nums">{data.patientPhoneNumber}</dd>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {copyButton(data.patientPhoneNumber)}
                  <Button className={primaryButton} render={<a href={`tel:${data.patientPhoneNumber}`} />}><PhoneCall />{t('secretary.appointments.call')}</Button>
                </div>
              </dl>}
            </Section>

            <Section icon={Banknote} title={t('secretary.appointments.depositSection', { defaultValue: 'Deposit payment' })} aside={<span className={`${statusClass} ${statusTone(data.depositPaymentStatus)} !px-3 !py-1 !text-xs !font-extrabold`}>{status(data.depositPaymentStatus)}</span>}>
              <dl className="grid gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-sm font-semibold text-muted-foreground">{t('secretary.appointments.amount')}</dt>
                  <dd dir="ltr" className="text-sm font-bold tabular-nums">{money(data.depositPaymentAmount)}</dd>
                </div>
                {data.depositPaymentMethodType && <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-3">
                  <dt className="text-sm font-semibold text-muted-foreground">{t('secretary.appointments.depositMethod')}</dt>
                  <dd className="text-sm font-bold">{label('paymentMethod', data.depositPaymentMethodType)}</dd>
                </div>}
                {data.depositClinicManualPaymentMethodType && <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-3">
                  <dt className="text-sm font-semibold text-muted-foreground">{t('secretary.appointments.transferMethod')}</dt>
                  <dd className="text-sm font-bold">{label('paymentMethod', data.depositClinicManualPaymentMethodType)}</dd>
                </div>}
                {data.depositPaymentTransactionReference && <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-2">
                  <dt className="text-sm font-semibold text-muted-foreground">{t('secretary.appointments.reference')}</dt>
                  <dd className="flex min-w-0 items-center gap-1"><span dir="ltr" className="truncate font-mono text-sm font-bold">{data.depositPaymentTransactionReference}</span>{copyButton(data.depositPaymentTransactionReference)}</dd>
                </div>}
                {data.depositPaymentStatus === 'Rejected' && data.depositPaymentSecretaryRejectionReason && <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-3">
                  <dt className="text-sm font-semibold text-muted-foreground">{t('secretary.appointments.depositRejectionReason')}</dt>
                  <dd className="min-w-0 break-words text-end text-sm font-bold">{data.depositPaymentSecretaryRejectionReason}</dd>
                </div>}
              </dl>
              {data.manualDepositPaymentProofUrl && <Button className={primaryButton + ' justify-self-start'} render={<a href={resolveFileUrl(data.manualDepositPaymentProofUrl)} target="_blank" rel="noreferrer" />}><ReceiptText />{t('secretary.appointments.viewProof')}<ExternalLink className="size-3.5" /></Button>}
            </Section>

            {data.remainingPaymentStatus && <Section icon={Wallet} title={t('secretary.appointments.remainingSection')} aside={<span className={`${statusClass} ${statusTone(data.remainingPaymentStatus)} !px-3 !py-1 !text-xs !font-extrabold`}>{status(data.remainingPaymentStatus)}</span>}>
              <dl className="grid gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-sm font-semibold text-muted-foreground">{t('secretary.appointments.amount')}</dt>
                  <dd dir="ltr" className="min-w-0 text-end text-sm font-bold tabular-nums">{money(data.remainingPaymentAmount)}</dd>
                </div>
                {data.remainingPaymentMethodType && <div className="flex items-start justify-between gap-3 border-t border-border/50 pt-3">
                  <dt className="text-sm font-semibold text-muted-foreground">{t('secretary.appointments.paymentMethod')}</dt>
                  <dd className="min-w-0 text-end text-sm font-bold break-words">{label('paymentMethod', data.remainingPaymentMethodType)}</dd>
                </div>}
                {data.remainingClinicManualPaymentMethodType && <div className="flex items-start justify-between gap-3 border-t border-border/50 pt-3">
                  <dt className="text-sm font-semibold text-muted-foreground">{t('secretary.appointments.transferMethod')}</dt>
                  <dd className="min-w-0 text-end text-sm font-bold break-words">{label('paymentMethod', data.remainingClinicManualPaymentMethodType)}</dd>
                </div>}
              </dl>
            </Section>}

            {data.depositRefundStatus && <Section icon={Undo2} title={t('secretary.appointments.refundSection')} aside={<span className={`${statusClass} ${statusTone(data.depositRefundStatus)} !px-3 !py-1 !text-xs !font-extrabold`}>{status(data.depositRefundStatus)}</span>}>
              <dl className="grid gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
                {data.requestedDepositRefundAmount != null && <div className="flex items-center justify-between gap-3">
                  <dt className="text-sm font-semibold text-muted-foreground">{t('secretary.appointments.refundAmount')}</dt>
                  <dd dir="ltr" className="text-sm font-bold">{money(data.requestedDepositRefundAmount)}</dd>
                </div>}
                {data.depositRefundMethodType && <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-3">
                  <dt className="text-sm font-semibold text-muted-foreground">{t('secretary.appointments.refundMethod')}</dt>
                  <dd className="text-sm font-bold">{label('paymentMethod', data.depositRefundMethodType)}</dd>
                </div>}
                {refundedAt && !Number.isNaN(refundedAt.getTime()) && <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-3">
                  <dt className="text-sm font-semibold text-muted-foreground">{t('secretary.appointments.refundProcessedAt')}</dt>
                  <dd className="text-sm font-bold">{refundedAt.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}</dd>
                </div>}
                {data.manualDepositRefundTransactionReference && <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-2">
                  <dt className="text-sm font-semibold text-muted-foreground">{t('secretary.appointments.reference')}</dt>
                  <dd className="flex min-w-0 items-center gap-1"><span dir="ltr" className="truncate font-mono text-sm font-bold">{data.manualDepositRefundTransactionReference}</span>{copyButton(data.manualDepositRefundTransactionReference)}</dd>
                </div>}
                {data.depositRefundReason && <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-3">
                  <dt className="text-sm font-semibold text-muted-foreground">{t('secretary.appointments.refundReason')}</dt>
                  <dd className="text-sm font-bold">{label('refundReason', data.depositRefundReason)}</dd>
                </div>}
              </dl>
              {data.depositRefundStatus === 'Failed' && <p className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-xs leading-6 font-semibold text-destructive sm:text-sm"><TriangleAlert className="mt-1 size-4 shrink-0" />{t('secretary.cancellation.failedRefundHint')}</p>}
              {data.manualDepositRefundProofUrl && <Button className={primaryButton + ' justify-self-start'} render={<a href={resolveFileUrl(data.manualDepositRefundProofUrl)} target="_blank" rel="noreferrer" />}><ReceiptText />{t('secretary.appointments.viewRefundProof')}<ExternalLink className="size-3.5" /></Button>}
            </Section>}
          </article>

          <div className="grid gap-4 xl:sticky xl:top-24">
          {showAside && <aside className="relative isolate grid gap-4 overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/12 via-card to-primary/5 p-5 shadow-sm dark:border-border dark:bg-card dark:bg-none">
            <span aria-hidden="true" className="pointer-events-none absolute -end-8 -top-8 -z-10 size-28 rounded-full bg-primary/10 blur-2xl dark:hidden" />
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10"><CircleCheckBig className="size-4.5" /></span>
              <h2 className="font-sans text-sm font-bold tracking-normal normal-case">{t('secretary.appointments.actionsSection')}</h2>
            </div>

            {allowed.verify && (rejecting ? <div className="grid gap-3">
              <Label htmlFor="secretaryRejectReason" className="text-sm font-bold normal-case tracking-normal text-foreground">{t('secretary.appointments.reasonLabel')}</Label>
              <div className="grid gap-1.5">
                <Textarea id="secretaryRejectReason" value={reason} maxLength={500} autoFocus onChange={(event) => { setReason(event.target.value); setFormError('') }} placeholder={t('secretary.appointments.reasonPlaceholder')} className="min-h-28 resize-none rounded-xl border border-input bg-background/70 px-3.5 py-3 text-sm leading-6 font-medium transition placeholder:text-sm placeholder:font-medium focus-visible:border-destructive/50 focus-visible:ring-2 focus-visible:ring-destructive/10" />
                <small className="justify-self-end text-xs font-bold tabular-nums text-muted-foreground" dir="ltr">{reason.trim().length}/500</small>
              </div>
              <div className="grid grid-cols-[1fr_1.4fr] gap-2.5">
                <Button variant="outline" className={grayButton + ' w-full'} disabled={action.isPending} onClick={() => { setRejecting(false); setFormError('') }}>{t('paymob.cancelIntegration')}</Button>
                <Button className={dangerButton + ' w-full'} disabled={action.isPending} onClick={submitRejection}>{busy('reject') && spinner}{t('secretary.appointments.reject')}</Button>
              </div>
            </div> : <div className="grid gap-2.5">
              {data.manualDepositPaymentProofUrl && !allowed.verify && <Button variant="outline" className={grayButton + ' justify-start gap-2.5'} disabled={action.isPending} render={<a href={resolveFileUrl(data.manualDepositPaymentProofUrl)} target="_blank" rel="noreferrer" />}><ReceiptText className="size-4 shrink-0 text-primary" />{t('secretary.appointments.viewProof')}<ExternalLink className="ms-auto size-3.5 shrink-0 text-muted-foreground" /></Button>}
              <Button className={primaryButton + ' w-full'} disabled={action.isPending} onClick={() => action.mutate('approve')}>{busy('approve') && spinner}{t('secretary.appointments.approve')}</Button>
              <Button className={dangerButton + ' w-full'} disabled={action.isPending} onClick={() => { action.reset(); setRejecting(true) }}>{t('secretary.appointments.reject')}</Button>
            </div>)}

            {allowed.confirmRefund && <div className="grid gap-3">
              <div className="flex items-start gap-2 rounded-2xl border border-warm/25 bg-warm/10 p-4 dark:bg-transparent">
                <p className="flex items-start gap-2 text-xs leading-5 font-semibold text-warm sm:text-sm"><HandCoins className="mt-0.5 size-4 shrink-0" />{t('secretary.refundConfirm.pendingHint', { amount: money(data.requestedDepositRefundAmount ?? data.depositPaymentAmount) })}</p>
              </div>
              <Button className={primaryButton + ' w-full'} disabled={action.isPending} onClick={() => { action.reset(); setDialog('refund') }}><Undo2 />{t('secretary.refundConfirm.open')}</Button>
            </div>}
          </aside>}
          <div className="relative isolate overflow-hidden rounded-2xl border border-primary/15 bg-card p-5 shadow-sm sm:p-6">
            <h2 className="font-sans text-lg font-bold">{t('secretary.appointments.paymentSummary', { defaultValue: 'Payment summary' })}</h2>
            <p className="mt-4 text-sm font-semibold text-muted-foreground">{t('secretary.appointments.consultationFee', { defaultValue: 'Consultation fee' })}</p>
            <strong dir="ltr" className="mt-1 block text-start font-sans text-3xl font-bold tabular-nums">{money(data.depositPaymentAmount + data.remainingPaymentAmount)}</strong>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-foreground/10" aria-hidden="true">
              <span className="block h-full rounded-full bg-primary transition-all duration-500 motion-reduce:transition-none" style={{ width: `${data.depositPaymentAmount + data.remainingPaymentAmount > 0 ? Math.min(100, (data.totalPaidAmount / (data.depositPaymentAmount + data.remainingPaymentAmount)) * 100) : 0}%` }} />
            </div>
            <dl className="mt-5 divide-y divide-border/60 border-t border-border/60">
              <div className="flex items-center justify-between gap-4 py-3.5">
                <dt className="text-sm font-semibold text-muted-foreground">{t('secretary.appointments.deposit')}</dt>
                <dd dir="ltr" className="text-sm font-bold tabular-nums">{money(data.depositPaymentAmount)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3.5">
                <dt className="text-sm font-semibold text-muted-foreground">{t('secretary.appointments.totalPaid')}</dt>
                <dd dir="ltr" className="text-sm font-bold tabular-nums text-primary">{money(data.totalPaidAmount)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3.5">
                <dt className="text-sm font-semibold text-muted-foreground">{t('secretary.appointments.remaining')}</dt>
                <dd dir="ltr" className={`text-sm font-bold tabular-nums ${remainingDue ? 'text-warm' : ''}`}>{money(data.remainingPaymentAmount)}</dd>
              </div>
            </dl>
          </div>

          </div>
        </div>}
        

        {data && <>
          <CancelAppointmentDialog open={dialog === 'cancel'} details={data} {...dialogProps} />
          <ConfirmRefundDialog open={dialog === 'refund'} details={data} {...dialogProps} />
          <MarkCompletedDialog open={dialog === 'complete'} details={data} {...dialogProps} />
        </>}

        <ConfirmationDialog
          open={dialog === 'no-show'}
          title={t('secretary.noShowDialog.title')}
          description={t('secretary.noShowDialog.description')}
          confirmLabel={t('secretary.appointments.noShow')}
          cancelLabel={t('secretary.noShowDialog.keep')}
          destructive
          pending={busy('mark-no-show')}
          onConfirm={() => action.mutate('mark-no-show')}
          onOpenChange={(open) => { if (!open && !action.isPending) setDialog(null) }}
        />
      </div>
    </DoctorWorkspaceShell>
  )
}