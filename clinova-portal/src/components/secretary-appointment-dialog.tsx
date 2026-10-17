import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ban, BadgeCheck, CalendarDays, Check, CircleCheckBig, Clock3, ExternalLink, LoaderCircle, Phone, ReceiptText, Stethoscope, UserRound, UserX, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import ConfirmationDialog from '@/components/confirmation-dialog'
import Notice from '@/components/notice'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useApi } from '@/hooks/use-api'
import { getErrorMessage } from '@/lib/api'
import { availableActions, formatTime, parseSlotDate, statusTone } from '@/lib/secretary-appointments'
import type { SecretaryAppointmentAction, SecretaryAppointmentDetails } from '@/types/secretary'

const spinner = <LoaderCircle className="animate-spin motion-reduce:animate-none" />
const actionButton = 'h-11 rounded-xl text-sm font-bold normal-case tracking-normal'

function Tile({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-border/60 bg-background/45 p-4 transition hover:border-primary/30 hover:bg-primary/5">
    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary [&>svg]:size-4">{icon}</span>
    <div className="min-w-0"><small className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{label}</small><strong className="block truncate text-sm font-bold">{value}</strong></div>
  </div>
}

export default function SecretaryAppointmentDialog({ appointmentId, onClose }: { appointmentId: number | null; onClose: () => void }) {
  const { t, i18n } = useTranslation()
  const api = useApi()
  const queryClient = useQueryClient()
  const [rejecting, setRejecting] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [reason, setReason] = useState('')
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')

  const details = useQuery({
    queryKey: ['secretary', 'appointments', 'details', appointmentId],
    queryFn: () => api.request<SecretaryAppointmentDetails>(`/api/appointments/${appointmentId}/management`, {}, { notifyOnError: false }),
    enabled: appointmentId !== null,
  })
  const action = useMutation({
    mutationFn: (type: SecretaryAppointmentAction) => {
      const path = type === 'approve' || type === 'reject' ? `manual-payment/${type}` : type
      return api.request<unknown>(`/api/appointments/${appointmentId}/${path}`, {
        method: type === 'approve' || type === 'reject' ? 'POST' : 'PATCH',
        body: type === 'reject' ? JSON.stringify({ reason: reason.trim() }) : undefined,
      }, { notifyOnError: false })
    },
    onSuccess: (_result, type) => { setRejecting(false); setReason(''); setSuccess(t('secretary.appointments.done.' + type)) },
    // Refresh the list and details after every attempt; a failure usually means the appointment changed.
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['secretary', 'appointments'] }),
  })

  function close() {
    if (action.isPending) return
    setRejecting(false); setReason(''); setFormError(''); action.reset(); onClose()
  }
  function submitRejection() {
    const value = reason.trim()
    if (value.length < 5 || value.length > 500) return setFormError(t('secretary.appointments.reasonLength'))
    setFormError(''); action.mutate('reject')
  }

  const data = details.data
  const allowed = data ? availableActions(data) : null
  const date = data ? parseSlotDate(data.slotDate) : null
  const money = (value: number) => new Intl.NumberFormat(i18n.resolvedLanguage === 'ar' ? 'ar-EG' : 'en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 2 }).format(value)
  const status = (value: string) => t('secretary.status.' + value, { defaultValue: value })
  const busy = (type: SecretaryAppointmentAction) => action.isPending && action.variables === type

  return (
    <Dialog open={appointmentId !== null} onOpenChange={(open) => { if (!open) close() }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-3xl border border-border bg-card p-5 motion-reduce:animate-none sm:max-w-2xl sm:p-7">
        {success && <Notice tone="success" message={success} />}
        {(formError || action.error) && <Notice message={formError || getErrorMessage(action.error)} />}
        <DialogHeader className="text-start">
          <DialogTitle className="font-sans text-xl font-bold normal-case tracking-normal">{t('secretary.appointments.detailsTitle')}</DialogTitle>
          <DialogDescription className="text-xs leading-6 sm:text-sm">{t('secretary.appointments.detailsDescription')}</DialogDescription>
        </DialogHeader>
        {details.isLoading && <p role="status" className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />{t('secretary.appointments.loadingDetails')}</p>}
        {details.isError && <p role="alert" className="py-6 text-sm font-bold text-destructive">{getErrorMessage(details.error)}</p>}
        {data && allowed && <div className="grid gap-5">
          <div className="flex flex-wrap gap-2">
            <Badge className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusTone(data.appointmentStatus)}`}>{status(data.appointmentStatus)}</Badge>
            <Badge className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusTone(data.paymentStatus)}`}>{t('secretary.appointments.payment')}: {status(data.paymentStatus)}</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Tile icon={<CalendarDays />} label={t('secretary.appointments.date')} value={date ? date.toLocaleDateString(i18n.resolvedLanguage === 'ar' ? 'ar-EG' : 'en-EG', { dateStyle: 'medium' }) : data.slotDate} />
            <Tile icon={<Clock3 />} label={t('secretary.appointments.time')} value={<span dir="ltr">{formatTime(data.startTime)} – {formatTime(data.endTime)}</span>} />
            <Tile icon={<UserRound />} label={t('secretary.appointments.patient')} value={data.patientName} />
            <Tile icon={<Phone />} label={t('fields.phone')} value={<span dir="ltr">{data.patientPhoneNumber}</span>} />
            <Tile icon={<Stethoscope />} label={t('secretary.appointments.doctor')} value={data.doctorName} />
            <Tile icon={<ReceiptText />} label={t('secretary.appointments.paymentType')} value={`${t('secretary.paymentType.' + data.paymentType, { defaultValue: data.paymentType })}${data.manualPaymentMethodType ? ' · ' + data.manualPaymentMethodType : ''}`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-background p-3"><small className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{t('secretary.appointments.amount')}</small><strong className="text-sm font-bold">{money(data.paymentAmount)}</strong></div>
            <div className="rounded-xl bg-background p-3"><small className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{t('secretary.appointments.remaining')}</small><strong className="text-sm font-bold">{money(data.remainingAmount)}</strong></div>
          </div>
          {data.transactionReference && <p className="text-xs text-muted-foreground">{t('secretary.appointments.reference')}: <span dir="ltr" className="font-mono font-bold text-foreground">{data.transactionReference}</span></p>}
          {data.paymentRejectionReason && <p className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs leading-6 text-destructive">{t('secretary.appointments.rejectionReason')}: {data.paymentRejectionReason}</p>}
          {data.refundStatus && <p className="rounded-xl border border-warm/20 bg-warm/10 p-3 text-xs leading-6 font-bold text-warm">{t('secretary.appointments.refund')}: {status(data.refundStatus)}{data.refundAmount != null ? ' · ' + money(data.refundAmount) : ''}{data.refundReason ? ' · ' + data.refundReason : ''}</p>}
          {data.paymentProofUrl && <Button variant="outline" className={actionButton + ' justify-self-start'} render={<a href={data.paymentProofUrl} target="_blank" rel="noreferrer" />}><ReceiptText />{t('secretary.appointments.viewProof')}<ExternalLink className="size-3.5" /></Button>}

          {allowed.verify && (rejecting ? <div className="grid gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
            <Label htmlFor="secretaryRejectReason" className="text-xs font-semibold text-foreground/80">{t('secretary.appointments.reasonLabel')}</Label>
            <Textarea id="secretaryRejectReason" value={reason} maxLength={500} autoFocus onChange={(event) => { setReason(event.target.value); setFormError('') }} placeholder={t('secretary.appointments.reasonPlaceholder')} className="min-h-28 resize-y rounded-xl border border-input bg-background/40 px-3 focus-visible:border-primary/50" />
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" className={actionButton} disabled={action.isPending} onClick={() => { setRejecting(false); setFormError('') }}><X />{t('paymob.cancelIntegration')}</Button>
              <Button variant="destructive" className={actionButton} disabled={action.isPending} onClick={submitRejection}>{busy('reject') ? spinner : <X />}{t('secretary.appointments.reject')}</Button>
            </div>
          </div> : <div className="flex flex-wrap gap-2 border-t border-border/40 pt-4">
            <Button className={actionButton + ' bg-primary text-primary-foreground hover:bg-primary/90'} disabled={action.isPending} onClick={() => action.mutate('approve')}>{busy('approve') ? spinner : <BadgeCheck />}{t('secretary.appointments.approve')}</Button>
            <Button variant="outline" className={actionButton + ' border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10 hover:text-destructive'} disabled={action.isPending} onClick={() => { action.reset(); setRejecting(true) }}><X />{t('secretary.appointments.reject')}</Button>
          </div>)}

          {(allowed.cancel || allowed.complete) && <div className="flex flex-wrap gap-2 border-t border-border/40 pt-4">
            {allowed.complete && <Button className={actionButton + ' bg-primary text-primary-foreground hover:bg-primary/90'} disabled={action.isPending} onClick={() => action.mutate('mark-completed')}>{busy('mark-completed') ? spinner : <CircleCheckBig />}{t('secretary.appointments.complete')}</Button>}
            {allowed.noShow && <Button variant="outline" className={actionButton} disabled={action.isPending} onClick={() => action.mutate('mark-no-show')}>{busy('mark-no-show') ? spinner : <UserX />}{t('secretary.appointments.noShow')}</Button>}
            {allowed.cancel && <Button variant="destructive" className={actionButton} disabled={action.isPending} onClick={() => { action.reset(); setConfirmCancel(true) }}>{busy('secretary-cancel') ? spinner : <Ban />}{t('secretary.appointments.cancel')}</Button>}
          </div>}
          {allowed.cancel && !allowed.complete && <p className="flex items-center gap-2 text-xs font-bold text-muted-foreground"><Check className="size-3.5 text-primary" />{t('secretary.appointments.completeLater')}</p>}
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
      </DialogContent>
    </Dialog>
  )
}
