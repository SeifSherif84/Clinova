import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams, useSearch } from '@tanstack/react-router'
import { ArrowLeft, Ban, BadgeCheck, CalendarDays, CircleCheckBig, CircleDollarSign, ClipboardCheck, Clock3, Copy, ExternalLink, Hash, Landmark, LoaderCircle, Phone, PhoneCall, ReceiptText, RefreshCw, ShieldAlert, Sparkles, Stethoscope, TicketCheck, Undo2, UserRound, UserX, WalletCards, X, type LucideIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import ConfirmationDialog from '@/components/confirmation-dialog'
import DoctorWorkspaceShell from '@/components/doctor-workspace-shell'
import Notice from '@/components/notice'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useApi } from '@/hooks/use-api'
import { ApiError, getErrorMessage } from '@/lib/api'
import { availableActions, formatTime, parseSlotDate, resolveFileUrl, statusTone } from '@/lib/secretary-appointments'
import type { SecretaryAppointmentAction, SecretaryAppointmentDetails } from '@/types/secretary'

const spinner = <LoaderCircle className="animate-spin motion-reduce:animate-none" />
const buttonClass = 'h-11 rounded-xl text-sm font-bold normal-case tracking-normal'
const primaryButton = buttonClass + ' bg-primary text-primary-foreground hover:bg-primary/90'
const badgeClass = 'rounded-full border px-2.5 py-1 text-[10px] font-bold'
// Splits enum names such as "CashAtClinic" when no translation exists yet.
const humanize = (value: string) => value.replace(/([a-z])([A-Z])/g, '$1 $2')

function SectionCard({ icon: Icon, title, children, className = '' }: { icon: LucideIcon; title: string; children: ReactNode; className?: string }) {
  return <Card className={`rounded-2xl border border-border bg-card ${className}`}>
    <CardHeader className="!pb-3 border-b border-border/40">
      <CardTitle className="flex items-center gap-2 font-sans text-xl font-bold normal-case tracking-normal">
        <span className="grid size-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"><Icon className="size-5" /></span>{title}
      </CardTitle>
    </CardHeader>
    <CardContent className="grid gap-4">{children}</CardContent>
  </Card>
}

function Tile({ icon, label, value, action }: { icon: ReactNode; label: string; value: ReactNode; action?: ReactNode }) {
  return <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-border/60 bg-background/45 p-4 transition hover:border-primary/30 hover:bg-primary/5 motion-reduce:transition-none">
    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary [&>svg]:size-4">{icon}</span>
    <div className="min-w-0 flex-1"><small className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{label}</small><strong className="block truncate text-sm font-bold">{value}</strong></div>
    {action}
  </div>
}

function StatTile({ label, value, tone = '' }: { label: string; value: ReactNode; tone?: string }) {
  return <div className="rounded-xl bg-background p-3"><small className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{label}</small><strong className={`text-sm font-bold ${tone}`}>{value}</strong></div>
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
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [reason, setReason] = useState('')
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
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
    onMutate: () => setSuccess(''),
    onSuccess: (_result, type) => { setRejecting(false); setReason(''); setSuccess(t('secretary.appointments.done.' + type)) },
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
  const copyButton = (value: string) => <Button variant="ghost" size="icon" className="shrink-0 rounded-xl text-muted-foreground hover:text-primary" aria-label={t('secretary.appointments.copy')} onClick={() => copy(value)}><Copy className="size-4" /></Button>

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
  const refundedAt = data?.refundProcessedAt ? new Date(data.refundProcessedAt) : null

  return (
    <DoctorWorkspaceShell active="secretary-appointments" topBackLink={backLink}>
      <div className="mx-auto w-full min-w-0 max-w-6xl p-4 sm:p-6 lg:p-10">
        {success && <Notice tone="success" message={success} />}
        {(formError || action.error) && <Notice message={formError || getErrorMessage(action.error)} />}

        {validId && details.isLoading && <div className="grid gap-5" role="status" aria-label={t('secretary.appointments.loadingDetails')}>
          <Skeleton className="h-52 rounded-3xl motion-reduce:animate-none" />
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,1fr)]">
            <Skeleton className="h-80 rounded-2xl motion-reduce:animate-none" />
            <Skeleton className="h-64 rounded-2xl motion-reduce:animate-none" />
          </div>
        </div>}

        {unavailable && <Card className="items-center rounded-3xl border border-dashed border-primary/25 bg-gradient-to-br from-primary/5 via-card to-warm/5 px-6 py-14 text-center">
          <span className="relative grid place-items-center">
            <span className="absolute inset-0 animate-ping rounded-3xl bg-primary/10 motion-reduce:animate-none" />
            <span className="relative grid size-20 place-items-center rounded-3xl bg-primary/10 text-primary shadow-inner">{errorStatus === 403 ? <ShieldAlert className="size-9" /> : <CalendarDays className="size-9" />}</span>
          </span>
          <h1 className="mt-6 font-heading text-2xl font-bold sm:text-3xl">{t(errorStatus === 403 ? 'secretary.appointments.forbiddenTitle' : 'secretary.appointments.notFoundTitle')}</h1>
          <p className="mt-2 max-w-md text-xs leading-6 text-muted-foreground sm:text-sm">{t(errorStatus === 403 ? 'secretary.appointments.forbiddenDescription' : 'secretary.appointments.notFoundDescription')}</p>
          <Button variant="outline" className={buttonClass + ' mt-5'} render={<Link to="/secretary/appointments" search={listSearch} />}><ArrowLeft className="rtl:rotate-180" />{t('secretary.appointments.back')}</Button>
        </Card>}

        {details.isError && !unavailable && <Card className="items-center rounded-3xl border border-destructive/20 bg-card p-8 text-center">
          <p className="text-sm font-bold text-destructive">{getErrorMessage(details.error)}</p>
          <Button variant="outline" className={buttonClass + ' mt-3'} disabled={details.isFetching} onClick={() => details.refetch()}>{details.isFetching ? spinner : <RefreshCw />}{t('invitations.retry')}</Button>
        </Card>}

        {data && allowed && <div className="grid gap-5">
          <Card className="relative min-w-0 gap-0 overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/12 via-card to-primary/5 p-5 sm:p-7">
            <span className="pointer-events-none absolute -top-16 -end-10 size-64 rounded-full bg-primary/10 blur-2xl" />
            <CardContent className="relative z-10 grid gap-4 p-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-primary uppercase"><Hash className="size-3" />{t('secretary.appointments.number', { id: data.appointmentId })}</Badge>
                <Badge className={`${badgeClass} ${statusTone(data.appointmentStatus)}`}>{status(data.appointmentStatus)}</Badge>
                <Badge className={`${badgeClass} ${statusTone(data.paymentStatus)}`}>{t('secretary.appointments.payment')}: {status(data.paymentStatus)}</Badge>
              </div>
              <div className="min-w-0">
                <h1 className="break-words font-sans text-3xl font-bold sm:text-5xl">{data.patientName}</h1>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-muted-foreground sm:text-sm">
                  <span className="flex items-center gap-2"><Stethoscope className="size-4 text-primary" />{data.doctorName}</span>
                  <span className="flex items-center gap-2"><CalendarDays className="size-4 text-primary" />{date ? date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : data.slotDate}</span>
                  <span className="flex items-center gap-2"><Clock3 className="size-4 text-primary" /><span dir="ltr">{formatTime(data.slotStartTime)} – {formatTime(data.slotEndTime)}</span></span>
                </div>
              </div>
              {allowed.verify && <p className="flex items-start gap-2 rounded-xl border border-warm/20 bg-warm/10 p-3 text-xs leading-6 font-bold text-warm sm:text-sm"><Sparkles className="mt-1 size-4 shrink-0" />{t('secretary.appointments.verifyHint')}</p>}
            </CardContent>
          </Card>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,1fr)]">
            <div className="grid min-w-0 content-start gap-5">
              <SectionCard icon={CalendarDays} title={t('secretary.appointments.appointmentSection')}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Tile icon={<CalendarDays />} label={t('secretary.appointments.date')} value={date ? date.toLocaleDateString(locale, { dateStyle: 'medium' }) : data.slotDate} />
                  <Tile icon={<Clock3 />} label={t('secretary.appointments.time')} value={<span dir="ltr">{formatTime(data.slotStartTime)} – {formatTime(data.slotEndTime)}</span>} />
                  <Tile icon={<Stethoscope />} label={t('secretary.appointments.doctor')} value={data.doctorName} />
                  <Tile icon={<TicketCheck />} label={t('secretary.appointments.bookingType')} value={label('bookingType', data.bookingType)} />
                  <Tile icon={<ClipboardCheck />} label={t('secretary.appointments.bookingSource')} value={label('bookingSource', data.bookingSource)} />
                </div>
              </SectionCard>

              <SectionCard icon={WalletCards} title={t('secretary.appointments.paymentSection')}>
                <div className="grid grid-cols-2 gap-3">
                  <StatTile label={t('secretary.appointments.amount')} value={money(data.paymentAmount)} />
                  <StatTile label={t('secretary.appointments.remaining')} value={money(data.remainingAmount)} tone={data.remainingAmount > 0 ? 'text-warm' : ''} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Tile icon={<CircleDollarSign />} label={t('secretary.appointments.paymentStatus')} value={status(data.paymentStatus)} />
                  <Tile icon={<ReceiptText />} label={t('secretary.appointments.paymentType')} value={t('secretary.paymentType.' + data.paymentCategory, { defaultValue: data.paymentCategory })} />
                  <Tile icon={<WalletCards />} label={t('secretary.appointments.paymentMethod')} value={label('paymentMethod', data.paymentMethodType)} />
                  {data.clinicManualPaymentMethodType && <Tile icon={<Landmark />} label={t('secretary.appointments.transferMethod')} value={label('paymentMethod', data.clinicManualPaymentMethodType)} />}
                  {data.paymentTransactionReference && <Tile icon={<Hash />} label={t('secretary.appointments.reference')} value={<span dir="ltr" className="font-mono">{data.paymentTransactionReference}</span>} action={copyButton(data.paymentTransactionReference)} />}
                </div>
                {data.paymentStatus === 'Rejected' && data.paymentSecretaryRejectionReason && <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs leading-6 text-destructive sm:text-sm">
                  <strong className="block font-bold">{t('secretary.appointments.rejectionReason')}</strong>{data.paymentSecretaryRejectionReason}
                </div>}
                {data.manualPaymentProofUrl && <Button variant="outline" className={buttonClass + ' justify-self-start'} render={<a href={resolveFileUrl(data.manualPaymentProofUrl)} target="_blank" rel="noreferrer" />}><ReceiptText />{t('secretary.appointments.viewProof')}<ExternalLink className="size-3.5" /></Button>}
              </SectionCard>

              {data.refundStatus && <SectionCard icon={Undo2} title={t('secretary.appointments.refundSection')}>
                <div className="flex flex-wrap items-center gap-2"><Badge className={`${badgeClass} ${statusTone(data.refundStatus)}`}>{status(data.refundStatus)}</Badge></div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.refundAmount != null && <Tile icon={<CircleDollarSign />} label={t('secretary.appointments.refundAmount')} value={money(data.refundAmount)} />}
                  {data.refundMethod && <Tile icon={<WalletCards />} label={t('secretary.appointments.refundMethod')} value={label('paymentMethod', data.refundMethod)} />}
                  {data.refundProcessedAt && <Tile icon={<CalendarDays />} label={t('secretary.appointments.refundProcessedAt')} value={refundedAt && !Number.isNaN(refundedAt.getTime()) ? refundedAt.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) : data.refundProcessedAt} />}
                  {data.manualRefundTransactionReference && <Tile icon={<Hash />} label={t('secretary.appointments.reference')} value={<span dir="ltr" className="font-mono">{data.manualRefundTransactionReference}</span>} action={copyButton(data.manualRefundTransactionReference)} />}
                </div>
                {data.refundReason && <p className="rounded-xl border border-border/60 bg-background/45 p-3 text-xs leading-6 text-muted-foreground sm:text-sm"><strong className="block font-bold text-foreground">{t('secretary.appointments.refundReason')}</strong>{data.refundReason}</p>}
                {data.manualRefundProofUrl && <Button variant="outline" className={buttonClass + ' justify-self-start'} render={<a href={resolveFileUrl(data.manualRefundProofUrl)} target="_blank" rel="noreferrer" />}><ReceiptText />{t('secretary.appointments.viewRefundProof')}<ExternalLink className="size-3.5" /></Button>}
              </SectionCard>}
            </div>

            <div className="grid min-w-0 content-start gap-5">
              <SectionCard icon={UserRound} title={t('secretary.appointments.patient')}>
                <Tile icon={<UserRound />} label={t('secretary.appointments.fullName')} value={data.patientName} />
                {data.patientPhoneNumber && <Tile icon={<Phone />} label={t('secretary.appointments.phone')} value={<span dir="ltr">{data.patientPhoneNumber}</span>} action={copyButton(data.patientPhoneNumber)} />}
                {data.patientPhoneNumber && <Button variant="outline" className={buttonClass} render={<a href={`tel:${data.patientPhoneNumber}`} />}><PhoneCall />{t('secretary.appointments.call')}</Button>}
              </SectionCard>

              <SectionCard icon={BadgeCheck} title={t('secretary.appointments.actionsSection')}>
                {allowed.verify && (rejecting ? <div className="grid gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
                  <Label htmlFor="secretaryRejectReason" className="text-xs font-semibold text-foreground/80">{t('secretary.appointments.reasonLabel')}</Label>
                  <Textarea id="secretaryRejectReason" value={reason} maxLength={500} autoFocus onChange={(event) => { setReason(event.target.value); setFormError('') }} placeholder={t('secretary.appointments.reasonPlaceholder')} className="min-h-28 resize-y rounded-xl border border-input bg-background/40 px-3 focus-visible:border-primary/50" />
                  <small className="justify-self-end text-xs font-bold text-muted-foreground" dir="ltr">{reason.trim().length}/500</small>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button variant="outline" className={buttonClass} disabled={action.isPending} onClick={() => { setRejecting(false); setFormError('') }}><X />{t('paymob.cancelIntegration')}</Button>
                    <Button variant="destructive" className={buttonClass} disabled={action.isPending} onClick={submitRejection}>{busy('reject') ? spinner : <X />}{t('secretary.appointments.reject')}</Button>
                  </div>
                </div> : <div className="grid gap-2">
                  {data.manualPaymentProofUrl && <Button variant="outline" className={buttonClass} render={<a href={resolveFileUrl(data.manualPaymentProofUrl)} target="_blank" rel="noreferrer" />}><ReceiptText />{t('secretary.appointments.viewProof')}<ExternalLink className="size-3.5" /></Button>}
                  <Button className={primaryButton} disabled={action.isPending} onClick={() => action.mutate('approve')}>{busy('approve') ? spinner : <BadgeCheck />}{t('secretary.appointments.approve')}</Button>
                  <Button variant="outline" className={buttonClass + ' border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10 hover:text-destructive'} disabled={action.isPending} onClick={() => { action.reset(); setRejecting(true) }}><X />{t('secretary.appointments.reject')}</Button>
                </div>)}

                {allowed.complete && <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                  <Button className={primaryButton} disabled={action.isPending} onClick={() => action.mutate('mark-completed')}>{busy('mark-completed') ? spinner : <CircleCheckBig />}{t('secretary.appointments.complete')}</Button>
                  <Button variant="outline" className={buttonClass} disabled={action.isPending} onClick={() => action.mutate('mark-no-show')}>{busy('mark-no-show') ? spinner : <UserX />}{t('secretary.appointments.noShow')}</Button>
                </div>}
                {allowed.cancel && !allowed.complete && <p className="flex items-start gap-2 text-xs leading-5 font-bold text-muted-foreground"><Clock3 className="mt-0.5 size-3.5 shrink-0 text-primary" />{t('secretary.appointments.completeLater')}</p>}
                {allowed.cancel && <div className="border-t border-border/40 pt-4">
                  <Button variant="destructive" className={buttonClass + ' w-full'} disabled={action.isPending} onClick={() => { action.reset(); setConfirmCancel(true) }}>{busy('secretary-cancel') ? spinner : <Ban />}{t('secretary.appointments.cancel')}</Button>
                </div>}

                {!allowed.verify && !allowed.cancel && <p className="text-xs leading-6 text-muted-foreground sm:text-sm">{t('secretary.appointments.noActions')}</p>}
              </SectionCard>
            </div>
          </div>
        </div>}

        <ConfirmationDialog
          open={confirmCancel}
          title={t('secretary.appointments.cancelTitle')}
          description={t('secretary.appointments.cancelDescription')}
          confirmLabel={t('secretary.appointments.cancel')}
          cancelLabel={t('invitations.keepPending')}
          destructive
          pending={busy('secretary-cancel')}
          onConfirm={() => action.mutate('secretary-cancel', { onSettled: () => setConfirmCancel(false) })}
          onOpenChange={(open) => { if (!open && !action.isPending) setConfirmCancel(false) }}
        />
      </div>
    </DoctorWorkspaceShell>
  )
}
