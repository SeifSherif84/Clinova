import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftRight, Ban, Banknote, CircleCheckBig, FileCheck2, Info, LoaderCircle, RefreshCw, Stethoscope, TriangleAlert, Undo2, Upload, UserRound, Wallet, X, type LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useState, type ChangeEvent, type DragEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Notice from '@/components/notice'
import ProviderLogo from '@/components/payment-provider-logo'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useApi } from '@/hooks/use-api'
import { getErrorMessage } from '@/lib/api'
import { hasRemainingDue, isGuestReservation } from '@/lib/secretary-appointments'
import type { GuestCheckoutAccount } from '@/types/guest-reservation'
import { isManualPaymentProvider } from '@/types/manual-payment-method'
import { ClinicPaymentMethod, type CancellationRequester, type MarkCompletedRequest, type SecretaryAppointmentDetails } from '@/types/secretary'

const button = 'h-11 rounded-xl text-sm font-bold normal-case tracking-normal'
const spinner = <LoaderCircle className="animate-spin motion-reduce:animate-none" />
const maxProofSize = 5 * 1024 * 1024
const proofTypes = ['image/jpeg', 'image/png', 'image/webp']

export interface DialogOutcome {
  message: string
  tone: 'success' | 'warning'
  // Set when the result deserves a persistent banner (cancellations); otherwise a toast is enough.
  title?: string
}

interface AppointmentDialogProps {
  open: boolean
  details: SecretaryAppointmentDetails
  onOpenChange: (open: boolean) => void
  onDone: (outcome: DialogOutcome) => void
}

function useMoney() {
  const { i18n } = useTranslation()
  const locale = i18n.resolvedLanguage === 'ar' ? 'ar-EG' : 'en-EG'
  return (value: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP', maximumFractionDigits: 2 }).format(value)
}

// Refreshes the list and the open record after every attempt: a failure usually means the appointment changed.
function useRefreshAppointments() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['secretary', 'appointments'] })
}

// One key per appointment so the dialog can refuse to close while its request is in flight.
const actionKey = (appointmentId: number) => ['secretary', 'appointment-action', appointmentId]

// The popup unmounts when closed, so each form below starts from a clean state every time it opens.
function DialogFrame({ open, onOpenChange, appointmentId, wide = false, children }: { open: boolean; onOpenChange: (open: boolean) => void; appointmentId: number; wide?: boolean; children: ReactNode }) {
  const pending = useIsMutating({ mutationKey: actionKey(appointmentId) }) > 0
  return <Dialog open={open} onOpenChange={(next) => { if (!pending) onOpenChange(next) }}>
    <DialogContent showCloseButton={false} className={`max-h-[calc(100dvh-2rem)] grid-cols-[minmax(0,1fr)] gap-0 overflow-x-hidden overflow-y-auto rounded-3xl border border-border bg-card p-0 text-card-foreground shadow-2xl ${wide ? 'sm:max-w-xl' : 'sm:max-w-lg'}`}>
      {children}
    </DialogContent>
  </Dialog>
}

function DialogLayout({ icon: Icon, destructive = false, title, description, children, footer, footerNote }: {
  icon: LucideIcon
  destructive?: boolean
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
  // Short recap of what the primary action will do, shown beside the buttons on wider screens.
  footerNote?: string
}) {
  return <>
    <DialogHeader className={`relative overflow-hidden border-b border-border/40 bg-linear-to-br p-5 text-start sm:px-6 ${destructive ? 'from-destructive/10 via-destructive/3' : 'from-primary/15 via-primary/5'} to-transparent`}>
      <div className="relative flex items-start gap-3">
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${destructive ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}><Icon className="size-5" /></span>
        <div className="min-w-0 flex-1">
          <DialogTitle className="font-sans text-lg font-bold normal-case tracking-normal">{title}</DialogTitle>
          <DialogDescription className="mt-1 text-start text-xs leading-5 sm:text-sm">{description}</DialogDescription>
        </div>
      </div>
    </DialogHeader>
    {/* minmax(0,1fr) stops long names or previews from widening the track past the dialog. */}
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5 p-5 sm:p-6">{children}</div>
    <div className="flex min-w-0 flex-col-reverse gap-2 border-t border-border/40 bg-muted/20 p-5 sm:flex-row sm:items-center sm:justify-end sm:px-6">
      {footerNote && <p className="hidden min-w-0 flex-1 truncate text-xs font-bold text-muted-foreground sm:block">{footerNote}</p>}
      {footer}
    </div>
  </>
}

// Numbered form step so longer dialogs read top to bottom.
function Step({ number, title, note, badge, badgeTone = 'muted', children }: { number: number; title: string; note?: string; badge?: string; badgeTone?: 'warm' | 'muted'; children: ReactNode }) {
  return <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">{number}</span>
      <h3 className="min-w-0 flex-1 text-sm font-bold">{title}</h3>
      {badge && <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badgeTone === 'warm' ? 'border-warm/20 bg-warm/10 text-warm' : 'border-border bg-muted text-muted-foreground'}`}>{badge}</span>}
    </div>
    {note && <p className="-mt-1 ps-8.5 text-xs leading-5 text-muted-foreground">{note}</p>}
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3 sm:ps-8.5">{children}</div>
  </section>
}

type FormProps = Omit<AppointmentDialogProps, 'open'>

// Radio card matching the guest checkout picker: the whole card is the hit area, with a check mark when selected.
function ChoiceCard({ value, icon, title, hint, tone = 'primary' }: { value: string; icon: ReactNode; title: string; hint?: string; tone?: 'primary' | 'destructive' }) {
  const selected = tone === 'destructive'
    ? 'has-data-checked:border-destructive/60 has-data-checked:bg-destructive/5'
    : 'has-data-checked:border-primary has-data-checked:bg-primary/5 has-data-checked:shadow-md has-data-checked:shadow-primary/10'
  return <label className={`group relative flex min-w-0 cursor-pointer items-start gap-3 rounded-2xl border border-border/60 bg-background/45 p-4 transition hover:border-primary/30 hover:bg-primary/5 has-focus-visible:ring-2 has-focus-visible:ring-primary/20 has-data-disabled:cursor-not-allowed has-data-disabled:opacity-60 motion-reduce:transition-none ${selected}`}>
    <RadioGroupItem value={value} className="pointer-events-none absolute size-px opacity-0 after:hidden" />
    <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tone === 'destructive' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>{icon}</span>
    <span className="grid min-w-0 flex-1 gap-0.5 pt-0.5">
      <strong className="text-sm font-bold">{title}</strong>
      {hint && <span className="text-xs leading-5 text-muted-foreground">{hint}</span>}
    </span>
    <span aria-hidden="true" className="relative mt-0.5 grid size-6 shrink-0 place-items-center">
      <span className="absolute inset-0 rounded-full border-2 border-border transition group-has-data-checked:opacity-0" />
      <CircleCheckBig className={`size-6 opacity-0 transition group-has-data-checked:opacity-100 ${tone === 'destructive' ? 'text-destructive' : 'text-primary'}`} />
    </span>
  </label>
}

function Question({ label, children }: { label: string; children: ReactNode }) {
  return <div className="grid gap-2.5">
    <Label className="text-sm font-bold normal-case tracking-normal text-foreground">{label}</Label>
    {children}
  </div>
}

function Callout({ tone, icon: Icon, children }: { tone: 'info' | 'warning'; icon: LucideIcon; children: ReactNode }) {
  const style = tone === 'warning' ? 'border-warm/20 bg-warm/10 text-warm' : 'border-border/60 bg-muted/40 text-foreground/80'
  return <div className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-xs leading-6 font-semibold sm:text-sm ${style}`}><Icon className="mt-1 size-4 shrink-0" /><div className="min-w-0">{children}</div></div>
}

// A gateway refund that fails is still a 200; the message is the only signal, so surface it as a warning.
const refundWarning = (message: string) => /could not be processed/i.test(message)

export function CancelAppointmentDialog({ open, ...props }: AppointmentDialogProps) {
  return <DialogFrame open={open} onOpenChange={props.onOpenChange} appointmentId={props.details.appointmentId}><CancelForm {...props} /></DialogFrame>
}

export function ConfirmRefundDialog({ open, ...props }: AppointmentDialogProps) {
  return <DialogFrame open={open} onOpenChange={props.onOpenChange} appointmentId={props.details.appointmentId} wide><RefundForm {...props} /></DialogFrame>
}

export function MarkCompletedDialog({ open, ...props }: AppointmentDialogProps) {
  return <DialogFrame open={open} onOpenChange={props.onOpenChange} appointmentId={props.details.appointmentId}><CompleteForm {...props} /></DialogFrame>
}

function CancelForm({ details, onOpenChange, onDone }: FormProps) {
  const { t } = useTranslation()
  const api = useApi()
  const money = useMoney()
  const refresh = useRefreshAppointments()
  const [requester, setRequester] = useState<CancellationRequester | null>(null)
  const [refundDue, setRefundDue] = useState<boolean | null>(null)
  const guest = isGuestReservation(details)
  const online = details.depositPaymentMethodType === 'Paymob'
  const deposit = money(details.depositPaymentAmount)

  const cancel = useMutation({
    mutationKey: actionKey(details.appointmentId),
    mutationFn: () => requester === 'clinic'
      ? api.request<string>(`/api/appointments/${details.appointmentId}/cancellation/clinic-request`, { method: 'PATCH' }, { notifyOnError: false })
      // Registered patients must send an empty object: the backend decides the refund from Clinova's policy.
      : api.request<string>(`/api/appointments/${details.appointmentId}/cancellation/patient-request`, { method: 'PATCH', body: JSON.stringify(guest ? { isRefundDue: refundDue } : {}) }, { notifyOnError: false }),
    onSuccess: (message) => {
      const text = typeof message === 'string' && message.trim() ? message : t('secretary.cancellation.done')
      const warning = refundWarning(text)
      onDone({ message: text, tone: warning ? 'warning' : 'success', title: t(warning ? 'secretary.cancellation.resultWarning' : 'secretary.cancellation.resultTitle') })
      onOpenChange(false)
    },
    onSettled: () => refresh(),
  })

  const ready = requester === 'clinic' || (requester === 'patient' && (!guest || refundDue !== null))
  const refundOutcome = (() => {
    if (requester === 'clinic') return t(online ? 'secretary.cancellation.outcome.clinicOnline' : 'secretary.cancellation.outcome.clinicManual', { amount: deposit })
    if (requester === 'patient' && !guest) return t('secretary.cancellation.outcome.policy')
    if (requester === 'patient' && refundDue === true) return t('secretary.cancellation.outcome.guestRefund', { amount: deposit })
    if (requester === 'patient' && refundDue === false) return t('secretary.cancellation.outcome.guestNoRefund')
    return null
  })()

  return <DialogLayout
    icon={Ban}
    destructive
    title={t('secretary.cancellation.title')}
    description={t('secretary.cancellation.description', { patient: details.patientName })}
    footer={<>
      <Button type="button" variant="outline" className={button} disabled={cancel.isPending} onClick={() => onOpenChange(false)}><X />{t('secretary.cancellation.keep')}</Button>
      <Button type="button" variant="destructive" className={button} disabled={!ready || cancel.isPending} onClick={() => cancel.mutate()}>{cancel.isPending ? spinner : <Ban />}{t('secretary.cancellation.confirm')}</Button>
    </>}
  >
    {cancel.error && <Notice message={getErrorMessage(cancel.error)} />}

    <Question label={t('secretary.cancellation.whoAsked')}>
      <RadioGroup name="cancellationRequester" aria-label={t('secretary.cancellation.whoAsked')} value={requester ?? ''} disabled={cancel.isPending} onValueChange={(value) => { setRequester(value === 'clinic' ? 'clinic' : 'patient'); setRefundDue(null); cancel.reset() }} className="grid gap-2.5">
        <ChoiceCard value="patient" icon={<UserRound className="size-4.5" />} title={t('secretary.cancellation.patient')} hint={t(guest ? 'secretary.cancellation.patientGuestHint' : 'secretary.cancellation.patientHint')} />
        <ChoiceCard value="clinic" icon={<Stethoscope className="size-4.5" />} title={t('secretary.cancellation.clinic')} hint={t('secretary.cancellation.clinicHint', { amount: deposit })} />
      </RadioGroup>
    </Question>

    {requester === 'patient' && guest && <Question label={t('secretary.cancellation.refundQuestion')}>
      <RadioGroup name="cancellationRefundDue" aria-label={t('secretary.cancellation.refundQuestion')} value={refundDue === null ? '' : String(refundDue)} disabled={cancel.isPending} onValueChange={(value) => { setRefundDue(value === 'true'); cancel.reset() }} className="grid gap-2.5 sm:grid-cols-2">
        <ChoiceCard value="true" icon={<Undo2 className="size-4.5" />} title={t('secretary.cancellation.refundYes')} hint={t('secretary.cancellation.refundYesHint', { amount: deposit })} />
        <ChoiceCard value="false" tone="destructive" icon={<Wallet className="size-4.5" />} title={t('secretary.cancellation.refundNo')} hint={t('secretary.cancellation.refundNoHint')} />
      </RadioGroup>
    </Question>}

    {/* A registered patient's cash deposit can't be refunded through the patient flow; the backend rejects it if the policy grants a refund. */}
    {requester === 'patient' && !guest && details.depositPaymentMethodType === 'CashAtClinic' && <Callout tone="warning" icon={TriangleAlert}>{t('secretary.cancellation.cashWarning')}</Callout>}

    {refundOutcome && <Callout tone="info" icon={Info}>
      <strong className="block font-bold text-foreground">{t('secretary.cancellation.whatHappens')}</strong>
      <ul className="mt-1 grid list-disc gap-0.5 ps-4 font-medium text-muted-foreground">
        <li>{refundOutcome}</li>
        <li>{t('secretary.cancellation.outcome.slot')}</li>
        {hasRemainingDue(details) && <li>{t('secretary.cancellation.outcome.balance', { amount: money(details.remainingPaymentAmount) })}</li>}
      </ul>
    </Callout>}
  </DialogLayout>
}

// Start from how the patient paid; the secretary can still refund another way.
const defaultRefundMethod = (methodType: string | null) =>
  methodType === 'CashAtClinic' ? ClinicPaymentMethod.CashAtClinic : methodType === 'ManualTransfer' ? ClinicPaymentMethod.ManualTransfer : null

function RefundForm({ details, onOpenChange, onDone }: FormProps) {
  const { t } = useTranslation()
  const api = useApi()
  const money = useMoney()
  const refresh = useRefreshAppointments()
  const [method, setMethod] = useState<ClinicPaymentMethod | null>(() => defaultRefundMethod(details.depositPaymentMethodType))
  const [proof, setProof] = useState<File | null>(null)
  const [reference, setReference] = useState('')
  const [formError, setFormError] = useState('')
  const [attempted, setAttempted] = useState(false)
  const [dragging, setDragging] = useState(false)
  const preview = useMemo(() => proof ? URL.createObjectURL(proof) : '', [proof])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  const confirm = useMutation({
    mutationKey: actionKey(details.appointmentId),
    mutationFn: (body: FormData) => api.request<string>(`/api/appointments/${details.appointmentId}/confirm-manual-refund`, { method: 'PATCH', body }, { notifyOnError: false }),
    onSuccess: () => { onDone({ message: t('secretary.refundConfirm.done'), tone: 'success' }); onOpenChange(false) },
    onSettled: () => refresh(),
  })

  function acceptProof(file: File | undefined) {
    if (!file) return
    if (!proofTypes.includes(file.type)) return setFormError(t('secretary.refundConfirm.proofType'))
    if (file.size > maxProofSize) return setFormError(t('secretary.refundConfirm.proofSize'))
    setFormError('')
    setProof(file)
  }
  function chooseProof(event: ChangeEvent<HTMLInputElement>) {
    acceptProof(event.target.files?.[0])
    event.target.value = ''
  }
  function dropProof(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setDragging(false)
    if (!confirm.isPending) acceptProof(event.dataTransfer.files?.[0])
  }

  function submit() {
    setAttempted(true)
    if (!method) return setFormError(t('secretary.refundConfirm.methodRequired'))
    if (method === ClinicPaymentMethod.ManualTransfer && !proof) return setFormError(t('secretary.refundConfirm.proofRequired'))
    const body = new FormData()
    body.append('ManualDepositRefundMethodType', String(method))
    if (proof) body.append('ManualRefundProof', proof)
    if (reference.trim()) body.append('ManualRefundTransactionReference', reference.trim())
    setFormError('')
    confirm.mutate(body)
  }

  const transfer = method === ClinicPaymentMethod.ManualTransfer
  const amount = details.requestedDepositRefundAmount ?? details.depositPaymentAmount
  const missingProof = attempted && transfer && !proof
  const paidWith = [
    details.depositPaymentMethodType && t('secretary.paymentMethod.' + details.depositPaymentMethodType, { defaultValue: details.depositPaymentMethodType }),
    details.depositClinicManualPaymentMethodType && t('manualPayments.' + details.depositClinicManualPaymentMethodType, { defaultValue: details.depositClinicManualPaymentMethodType }),
  ].filter(Boolean).join(' · ')
  const methods = [
    { value: ClinicPaymentMethod.CashAtClinic, icon: Banknote, title: t('secretary.paymentMethod.CashAtClinic'), hint: t('secretary.refundConfirm.cashHint') },
    { value: ClinicPaymentMethod.ManualTransfer, icon: ArrowLeftRight, title: t('secretary.paymentMethod.ManualTransfer'), hint: t('secretary.refundConfirm.transferHint') },
  ]

  return <DialogLayout
    icon={Undo2}
    title={t('secretary.refundConfirm.title')}
    description={t('secretary.refundConfirm.description', { patient: details.patientName })}
    footerNote={method ? t('secretary.refundConfirm.footerSummary', { amount: money(amount), method: methods.find((item) => item.value === method)?.title }) : undefined}
    footer={<>
      <Button type="button" variant="outline" className={button} disabled={confirm.isPending} onClick={() => onOpenChange(false)}><X />{t('secretary.refundConfirm.close')}</Button>
      <Button type="button" className={button + ' bg-primary px-5 text-primary-foreground hover:bg-primary/90'} disabled={confirm.isPending} onClick={submit}>{confirm.isPending ? spinner : <CircleCheckBig />}{t('secretary.refundConfirm.confirm')}</Button>
    </>}
  >
    {(formError || confirm.error) && <Notice message={formError || getErrorMessage(confirm.error)} />}

    {/* Summary: how much goes back to whom, and how it was originally paid. */}
    <div className="relative isolate overflow-hidden rounded-2xl border border-primary/15 bg-linear-to-br from-primary/10 via-card to-primary/5 p-4 sm:p-5">
      <span aria-hidden="true" className="pointer-events-none absolute -end-10 -top-10 -z-10 size-32 rounded-full bg-primary/10 blur-2xl" />
      <small className="block text-[10px] font-bold tracking-wider text-primary uppercase">{t('secretary.refundConfirm.amount')}</small>
      <strong dir="ltr" className="mt-1 block text-start font-sans text-3xl font-bold tabular-nums text-primary">{money(amount)}</strong>
      <dl className="mt-4 grid gap-3 border-t border-primary/10 pt-4 sm:grid-cols-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><UserRound className="size-4" /></span>
          <span className="grid min-w-0 leading-tight">
            <dt className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{t('secretary.appointments.patient')}</dt>
            <dd className="truncate text-sm font-bold">{details.patientName}</dd>
          </span>
        </div>
        {paidWith && <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Wallet className="size-4" /></span>
          <span className="grid min-w-0 leading-tight">
            <dt className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{t('secretary.refundConfirm.paidWith')}</dt>
            <dd className="truncate text-sm font-bold">{paidWith}</dd>
          </span>
        </div>}
      </dl>
    </div>

    <Step number={1} title={t('secretary.refundConfirm.method')} note={t('secretary.refundConfirm.methodNote')}>
      <RadioGroup name="refundMethod" aria-label={t('secretary.refundConfirm.method')} value={method ? String(method) : ''} disabled={confirm.isPending} onValueChange={(value) => { setMethod(Number(value) === ClinicPaymentMethod.ManualTransfer ? ClinicPaymentMethod.ManualTransfer : ClinicPaymentMethod.CashAtClinic); setFormError('') }} className="grid auto-rows-fr grid-cols-2 items-stretch gap-2.5">
        {/* auto-rows-fr + h-full keep both tiles the same size whatever the hint length. */}
        {methods.map(({ value, icon: Icon, title, hint }) => <label key={value} className="group relative flex h-full min-w-0 cursor-pointer flex-col items-center justify-start gap-2 rounded-2xl border border-border/60 bg-background/45 px-3 py-4 text-center transition hover:border-primary/30 hover:bg-primary/5 has-focus-visible:ring-2 has-focus-visible:ring-primary/20 has-data-checked:border-primary has-data-checked:bg-primary/5 has-data-checked:shadow-md has-data-checked:shadow-primary/10 has-data-disabled:cursor-not-allowed has-data-disabled:opacity-60 motion-reduce:transition-none">
          <RadioGroupItem value={String(value)} className="pointer-events-none absolute size-px opacity-0 after:hidden" />
          <CircleCheckBig aria-hidden="true" className="absolute end-2.5 top-2.5 size-5 text-primary opacity-0 transition group-has-data-checked:opacity-100" />
          <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary transition group-has-data-checked:bg-primary group-has-data-checked:text-primary-foreground"><Icon className="size-5" /></span>
          <strong className="text-sm font-bold">{title}</strong>
          <span className="min-h-8 text-[11px] leading-4 text-muted-foreground">{hint}</span>
        </label>)}
      </RadioGroup>
    </Step>

    {method && <Step number={2} title={t('secretary.refundConfirm.proofStep')} badge={t(transfer ? 'secretary.refundConfirm.required' : 'secretary.refundConfirm.optional')} badgeTone={transfer ? 'warm' : 'muted'}>
      <Input className="sr-only" id="refundProof" type="file" accept=".jpg,.jpeg,.png,.webp" disabled={confirm.isPending} onChange={chooseProof} />
      {proof && preview
        ? <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/45">
          <img src={preview} alt={t('secretary.refundConfirm.previewAlt')} className="h-44 w-full bg-muted object-contain" />
          <div className="flex items-center gap-2.5 border-t border-border/60 px-3.5 py-2.5">
            <FileCheck2 className="size-4 shrink-0 text-primary" />
            <span className="min-w-0 flex-1 truncate text-sm font-bold">{proof.name}</span>
            <label htmlFor="refundProof" className={`inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-bold transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary ${confirm.isPending ? 'pointer-events-none opacity-50' : ''}`}><Upload className="size-3.5" />{t('secretary.refundConfirm.replaceProof')}</label>
            <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0 rounded-lg text-muted-foreground hover:text-destructive" aria-label={t('secretary.refundConfirm.removeProof')} disabled={confirm.isPending} onClick={() => setProof(null)}><X className="size-4" /></Button>
          </div>
        </div>
        : <label
          htmlFor="refundProof"
          onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={dropProof}
          className={`flex min-h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-7 text-center transition motion-reduce:transition-none ${missingProof ? 'border-destructive/50 bg-destructive/5' : dragging ? 'border-primary bg-primary/10' : 'border-primary/30 bg-primary/4 hover:bg-primary/8'}`}
        >
          <span className={`grid size-12 shrink-0 place-items-center rounded-xl ${missingProof ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}><Upload className="size-5" /></span>
          <span className="grid gap-0.5">
            <strong className="text-sm font-bold">{t('secretary.refundConfirm.dropProof')}</strong>
            <small className="text-xs text-muted-foreground">{t('secretary.refundConfirm.proofHint')}</small>
          </span>
        </label>}
      {missingProof && <p className="text-xs font-bold text-destructive">{t('secretary.refundConfirm.proofRequired')}</p>}

      <div className="grid gap-1.5">
        <Label htmlFor="refundReference" className="text-xs font-semibold normal-case tracking-normal text-foreground/80">{t('secretary.refundConfirm.reference')}</Label>
        <input id="refundReference" dir="ltr" value={reference} maxLength={100} disabled={confirm.isPending} placeholder={t('secretary.refundConfirm.referencePlaceholder')} onChange={(event) => setReference(event.target.value)} className="h-12 w-full rounded-xl border border-input bg-background/40 px-3 text-start text-sm outline-none transition focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/10" />
      </div>
    </Step>}
  </DialogLayout>
}

function CompleteForm({ details, onOpenChange, onDone }: FormProps) {
  const { t } = useTranslation()
  const api = useApi()
  const money = useMoney()
  const refresh = useRefreshAppointments()
  const due = hasRemainingDue(details)
  const [method, setMethod] = useState<ClinicPaymentMethod | null>(null)
  const [accountId, setAccountId] = useState('')
  const [formError, setFormError] = useState('')

  // Same clinic accounts the guest checkout uses; the secretary is allowed to read them.
  const accounts = useQuery({
    queryKey: ['secretary', 'guest', 'accounts'],
    queryFn: () => api.request<GuestCheckoutAccount[]>('/api/manual-payment-methods/guest-checkout', {}, { notifyOnError: false }),
    enabled: due && method === ClinicPaymentMethod.ManualTransfer,
  })
  const complete = useMutation({
    mutationKey: actionKey(details.appointmentId),
    mutationFn: (body: MarkCompletedRequest) => api.request<string>(`/api/appointments/${details.appointmentId}/mark-completed`, { method: 'PATCH', body: JSON.stringify(body) }, { notifyOnError: false }),
    onSuccess: () => { onDone({ message: t('secretary.appointments.done.mark-completed'), tone: 'success' }); onOpenChange(false) },
    onSettled: () => refresh(),
  })

  function submit() {
    // No balance due: the backend rejects any payment fields, so send an empty object.
    if (!due) return complete.mutate({})
    if (!method) return setFormError(t('secretary.complete.methodRequired'))
    if (method === ClinicPaymentMethod.ManualTransfer && !accountId) return setFormError(t('secretary.complete.accountRequired'))
    setFormError('')
    complete.mutate(method === ClinicPaymentMethod.ManualTransfer
      ? { remainingPaymentMethodType: method, clinicManualPaymentMethodId: Number(accountId) }
      : { remainingPaymentMethodType: method })
  }

  return <DialogLayout
    icon={CircleCheckBig}
    title={t('secretary.complete.title')}
    description={t(due ? 'secretary.complete.descriptionDue' : 'secretary.complete.descriptionPaid', { patient: details.patientName })}
    footer={<>
      <Button type="button" variant="outline" className={button} disabled={complete.isPending} onClick={() => onOpenChange(false)}><X />{t('secretary.complete.close')}</Button>
      <Button type="button" className={button + ' bg-primary text-primary-foreground hover:bg-primary/90'} disabled={complete.isPending} onClick={submit}>{complete.isPending ? spinner : <CircleCheckBig />}{t(due ? 'secretary.complete.confirmDue' : 'secretary.complete.confirm')}</Button>
    </>}
  >
    {(formError || complete.error) && <Notice message={formError || getErrorMessage(complete.error)} />}

    <div className={`rounded-2xl border px-4 py-4 ${due ? 'border-warm/25 bg-warm/10' : 'border-primary/20 bg-primary/5'}`}>
      <small className={`block text-[10px] font-bold tracking-wider uppercase ${due ? 'text-warm' : 'text-primary'}`}>{t(due ? 'secretary.complete.collect' : 'secretary.complete.nothingDue')}</small>
      <strong dir="ltr" className={`mt-1 block text-start text-2xl font-bold tabular-nums ${due ? 'text-warm' : 'text-primary'}`}>{money(due ? details.remainingPaymentAmount : 0)}</strong>
    </div>

    {due && <Question label={t('secretary.complete.method')}>
      <RadioGroup name="remainingPaymentMethod" aria-label={t('secretary.complete.method')} value={method ? String(method) : ''} disabled={complete.isPending} onValueChange={(value) => { setMethod(Number(value) === ClinicPaymentMethod.ManualTransfer ? ClinicPaymentMethod.ManualTransfer : ClinicPaymentMethod.CashAtClinic); setAccountId(''); setFormError('') }} className="grid gap-2.5 sm:grid-cols-2">
        <ChoiceCard value={String(ClinicPaymentMethod.CashAtClinic)} icon={<Banknote className="size-4.5" />} title={t('secretary.paymentMethod.CashAtClinic')} hint={t('secretary.complete.cashHint')} />
        <ChoiceCard value={String(ClinicPaymentMethod.ManualTransfer)} icon={<ArrowLeftRight className="size-4.5" />} title={t('secretary.paymentMethod.ManualTransfer')} hint={t('secretary.complete.transferHint')} />
      </RadioGroup>
    </Question>}

    {due && method === ClinicPaymentMethod.ManualTransfer && <div className="grid gap-2">
      <Label className="text-xs font-semibold normal-case tracking-normal text-foreground/80">{t('secretary.complete.account')}</Label>
      {accounts.isLoading && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />{t('secretary.guest.loadingAccounts')}</p>}
      {accounts.isError && <div className="grid justify-items-start gap-2">
        <p className="text-sm font-bold text-destructive">{getErrorMessage(accounts.error)}</p>
        <Button type="button" variant="outline" className={button} disabled={accounts.isFetching} onClick={() => accounts.refetch()}>{accounts.isFetching ? spinner : <RefreshCw />}{t('errors.tryAgain')}</Button>
      </div>}
      {accounts.data && !accounts.data.length && <Callout tone="warning" icon={TriangleAlert}>{t('secretary.guest.noAccounts')}</Callout>}
      {accounts.data && accounts.data.length > 0 && <RadioGroup name="remainingPaymentAccount" aria-label={t('secretary.complete.account')} value={accountId} disabled={complete.isPending} onValueChange={(value) => { setAccountId(String(value)); setFormError('') }} className="grid gap-2.5">
        {accounts.data.map((account) => <ChoiceCard
          key={account.id}
          value={String(account.id)}
          icon={isManualPaymentProvider(account.type) ? <ProviderLogo type={account.type} size="sm" /> : <Wallet className="size-4.5" />}
          title={t(`manualPayments.${account.type}`, { defaultValue: account.type })}
          hint={account.accountIdentifier}
        />)}
      </RadioGroup>}
    </div>}
  </DialogLayout>
}
