import { useIsFetching, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftRight, Check, CircleCheckBig, Clock3, Copy, CreditCard, ExternalLink, FileCheck2, Hash, LoaderCircle, RefreshCw, Upload, Wallet, X } from 'lucide-react'
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Notice from '@/components/notice'
import ProviderLogo from '@/components/payment-provider-logo'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useApi } from '@/hooks/use-api'
import { getErrorMessage } from '@/lib/api'
import { humanize, parseUtc } from '@/lib/patient-appointments'
import { isManualPaymentProvider } from '@/types/manual-payment-method'
import type { PatientAppointmentDetails } from '@/types/patient-appointment'

export interface ManualPaymentMethodOption {
  id: number
  type: string
  accountIdentifier: string
}

export interface OnlinePaymentMethodOption {
  id: number
  onlinePaymentMethodType: string
}

// POST /api/payments/appointments/{appointmentId}/paymob-intention
export interface PaymobIntentionResponse {
  clientSecret: string
  publicKey: string | null
  message: string
}

type Tr = (key: string, defaultValue: string, options?: Record<string, string | number>) => string
type Selection = { kind: 'manual' | 'online'; id: number }
// Set once a Paymob session was handed to the patient; the backend callback decides the outcome, not the checkout page.
type Waiting = { startedAt: number; url: string; opened: boolean; sawPending: boolean; timedOut: boolean }

interface Props {
  d: Pick<PatientAppointmentDetails, 'appointmentId' | 'appointmentStatus' | 'depositAmount' | 'depositPaymentStatus' | 'reservationExpiresAt'>
  money: (value: number) => string
}

const maxProofSize = 5 * 1024 * 1024
const proofTypes = ['image/jpeg', 'image/png', 'image/webp']
// Paymob Unified Checkout: opened with the public key and client secret the backend returns.
const paymobCheckoutUrl = 'https://accept.paymob.com/unifiedcheckout/'
const pollMs = 4000
const maxWaitMs = 3 * 60 * 1000
const grayButton = 'h-10 cursor-pointer rounded-xl bg-foreground/5 px-4 text-[13px] font-bold normal-case tracking-normal text-foreground hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-primary/30'
const primaryButton = 'h-10 cursor-pointer rounded-xl bg-primary px-4 text-[13px] font-bold normal-case tracking-normal text-primary-foreground hover:bg-primary/90'
const cardClass = 'grid gap-4 rounded-2xl border border-primary/20 bg-card p-5 shadow-sm sm:px-6'
const groupLabel = 'text-[11px] font-bold tracking-wider text-muted-foreground uppercase'

const fileSize = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`)

function usePayTr(): Tr {
  const { t } = useTranslation()
  return (key, defaultValue, options) => t('patientPortal.appointments.pay.' + key, { defaultValue, ...options })
}

function Title({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return <h2 className="flex items-center gap-2.5 font-sans text-lg font-bold tracking-normal normal-case">
    <span className="text-primary [&>svg]:size-6">{icon}</span>
    {children}
  </h2>
}

const iconTile = (icon: ReactNode) => <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10 [&>svg]:size-4.5">{icon}</span>

function Option({ selected, onSelect, leading, title }: { selected: boolean; onSelect: () => void; leading: ReactNode; title: string }) {
  return <button type="button" role="radio" aria-checked={selected} onClick={onSelect} className={`group flex min-w-0 cursor-pointer items-center gap-3.5 rounded-2xl border px-3.5 py-3 text-start transition duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${selected ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-border/60 bg-background/45 hover:bg-primary/5 dark:hover:border-primary/30'}`}>
    <span className="grid h-11 min-w-11 shrink-0 place-items-center">{leading}</span>
    <strong className="min-w-0 flex-1 truncate text-sm font-bold">{title}</strong>
    <span aria-hidden="true" className="relative grid size-6 shrink-0 place-items-center">
      <span className={`absolute inset-0 rounded-full border-2 border-border transition-opacity ${selected ? 'opacity-0' : ''}`} />
      <CircleCheckBig className={`size-6 text-primary transition-opacity ${selected ? 'opacity-100' : 'opacity-0'}`} />
    </span>
  </button>
}

function MethodError({ error, onRetry, label }: { error: unknown; onRetry: () => void; label: string }) {
  return <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-3.5">
    <p className="min-w-0 flex-1 text-sm font-bold text-destructive">{getErrorMessage(error)}</p>
    <Button type="button" variant="ghost" className={grayButton} onClick={onRetry}><RefreshCw className="size-4" />{label}</Button>
  </div>
}

function CopyButton({ value, tr }: { value: string; tr: Tr }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }
  return <Button type="button" variant="ghost" className={grayButton + ' shrink-0'} onClick={copy}>
    {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
    {copied ? tr('copied', 'Copied') : tr('copy', 'Copy')}
  </Button>
}

function PayForm({ d, money, onSubmitted, onLaunched }: Props & { onSubmitted: (message: string) => void; onLaunched: (url: string, opened: boolean) => void }) {
  const { t } = useTranslation()
  const tr = usePayTr()
  const api = useApi()
  const queryClient = useQueryClient()
  const id = d.appointmentId
  const [selected, setSelected] = useState<Selection | null>(null)
  const [manualType, setManualType] = useState<string | null>(null)
  const [showOnline, setShowOnline] = useState(false)
  const [proof, setProof] = useState<File | null>(null)
  const [reference, setReference] = useState('')
  const [fileError, setFileError] = useState('')
  const [launchError, setLaunchError] = useState('')
  const preview = useMemo(() => (proof ? URL.createObjectURL(proof) : ''), [proof])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  const manualQuery = useQuery({
    queryKey: ['patient', 'payment-methods', 'manual', id],
    queryFn: () => api.request<ManualPaymentMethodOption[]>(`/api/manual-payment-methods/appointments/${id}`, {}, { notifyOnError: false }),
    retry: 1,
  })
  const onlineQuery = useQuery({
    queryKey: ['patient', 'payment-methods', 'online', id],
    queryFn: () => api.request<OnlinePaymentMethodOption[]>(`/api/online-payment-accounts/appointments/${id}`, {}, { notifyOnError: false }),
    retry: 1,
  })

  const submit = useMutation({
    mutationFn: (body: FormData) => api.request<string>(`/api/appointments/${id}/payment-proof-submit`, { method: 'POST', body }, { notifyOnError: false }),
    onSuccess: (message) => onSubmitted(typeof message === 'string' && message.trim() ? message : tr('verifyText', 'Your payment proof has been submitted and is waiting for clinic verification.')),
    // Refresh the record after every attempt: a failure usually means the appointment changed (expired, already paid...).
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['patient', 'appointments'] }),
  })

  // Creates (or, if one is already pending, returns) the Paymob session for the chosen integration.
  const intention = useMutation({
    mutationFn: (clinicPaymentIntegrationId: number) => api.request<PaymobIntentionResponse>(`/api/payments/appointments/${id}/paymob-intention`, { method: 'POST', body: JSON.stringify({ clinicPaymentIntegrationId }) }, { notifyOnError: false }),
  })

  const manual = manualQuery.data ?? []
  const online = onlineQuery.data ?? []
  const loaded = !manualQuery.isLoading && !onlineQuery.isLoading
  const healthy = loaded && !manualQuery.isError && !onlineQuery.isError
  const bothEmpty = healthy && manual.length === 0 && online.length === 0
  // Manual accounts are grouped by provider: one card per provider, then pick the account number.
  const manualTypes = Array.from(new Set(manual.map((item) => item.type)))
  const onlyType = manualTypes.length === 1 && online.length === 0 ? manualTypes[0] : null
  const activeType = manualType ?? onlyType
  const typeAccounts = activeType ? manual.filter((item) => item.type === activeType) : []
  // A single available method is pre-selected so the patient has one less tap to make.
  const only: Selection | null = healthy && manual.length + online.length === 1
    ? (manual[0] ? { kind: 'manual', id: manual[0].id } : { kind: 'online', id: online[0].id })
    : null
  const autoAccount: Selection | null = !showOnline && typeAccounts.length > 0 && selected?.kind !== 'online' ? { kind: 'manual', id: typeAccounts[0].id } : null
  const active = selected ?? autoAccount ?? (showOnline ? null : only)
  const activeManual = active?.kind === 'manual' ? manual.find((item) => item.id === active.id && item.type === activeType) : undefined
  const activeOnline = active?.kind === 'online' ? online.find((item) => item.id === active.id) : undefined
  const manualTitle = (type: string) => t('manualPayments.' + type, { defaultValue: humanize(type) })
  const onlineTitle = (type: string) => tr('onlineTypes.' + type, humanize(type))
  const onlineIcon = (type: string) => /wallet/i.test(type) ? <Wallet /> : <CreditCard />
  const errorMessage = fileError || (submit.error ? getErrorMessage(submit.error) : '') || (intention.error ? getErrorMessage(intention.error) : '') || launchError

  function chooseProof(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!proofTypes.includes(file.type)) return setFileError(t('validation.imageType'))
    if (file.size > maxProofSize) return setFileError(t('validation.imageSize'))
    setFileError('')
    setProof(file)
    submit.reset()
  }

  function sendProof(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!activeManual || !proof || submit.isPending) return
    const body = new FormData()
    body.append('ClinicManualPaymentMethodId', String(activeManual.id))
    body.append('PaymentProof', proof)
    const value = reference.trim()
    if (value) body.append('TransactionReference', value)
    submit.mutate(body)
  }

  function payOnline(clinicPaymentIntegrationId: number) {
    if (intention.isPending) return
    setLaunchError('')
    // Browsers only allow a new tab that is opened straight from the click, so open it now and send it to Paymob once the session exists.
    const tab = window.open('', '_blank')
    if (tab) {
      tab.opener = null
      try {
        tab.document.write(`<!doctype html><title>Paymob</title><body style="margin:0;display:grid;place-items:center;min-height:100vh;font-family:system-ui,sans-serif;color:#666"><p>${tr('preparing', 'Preparing secure payment…')}</p></body>`)
      } catch {
        // The placeholder text is only cosmetic.
      }
    }
    intention.mutate(clinicPaymentIntegrationId, {
      onSuccess: (session) => {
        if (!session?.clientSecret || !session.publicKey) {
          tab?.close()
          setLaunchError(tr('sessionIncomplete', 'The payment session couldn’t be started. Please try again.'))
          return
        }
        const url = `${paymobCheckoutUrl}?publicKey=${encodeURIComponent(session.publicKey)}&clientSecret=${encodeURIComponent(session.clientSecret)}`
        const opened = Boolean(tab && !tab.closed)
        if (tab && opened) tab.location.href = url
        // Pick up the reset deposit status right away; the callback later reports the real result.
        void queryClient.invalidateQueries({ queryKey: ['patient', 'appointments', 'details', id] })
        onLaunched(url, opened)
      },
      onError: () => tab?.close(),
    })
  }

  return <section className={cardClass} aria-label={tr('title', 'Complete your deposit payment')}>
    {errorMessage && <Notice message={errorMessage} />}
    <Title icon={<Wallet />}>{tr('title', 'Complete your deposit payment')}</Title>

    <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-4">
      <small className="block text-xs font-bold tracking-wider text-primary uppercase">{tr('due', 'Deposit due')}</small>
      <strong dir="ltr" className="mt-1 block text-start font-sans text-3xl font-bold tabular-nums text-primary">{money(d.depositAmount)}</strong>
    </div>

    {String(d.depositPaymentStatus) === 'Failed' && <p className="rounded-xl border border-warm/20 bg-warm/10 px-3.5 py-3 text-sm leading-6 font-semibold text-warm">{tr('failedNote', 'Your last payment couldn’t be verified. You can submit it again.')}</p>}

    {bothEmpty
      ? <p className="rounded-2xl border border-dashed border-border p-4 text-center text-sm font-semibold text-muted-foreground">{tr('noMethods', 'No payment methods are available right now. Please contact the clinic.')}</p>
      : <div className="grid gap-3">
        <p className={groupLabel + ' flex items-center gap-3'}>{tr('methodGroup', 'Choose how you’ll pay')}<span aria-hidden="true" className="h-px flex-1 bg-border/60" /></p>
        {(manualQuery.isLoading || onlineQuery.isLoading) && <div className="grid gap-2 sm:grid-cols-2"><Skeleton className="h-14 rounded-2xl" /><Skeleton className="h-14 rounded-2xl" /></div>}
        {manualQuery.isError && <MethodError error={manualQuery.error} onRetry={() => manualQuery.refetch()} label={t('errors.tryAgain')} />}
        {onlineQuery.isError && <MethodError error={onlineQuery.error} onRetry={() => onlineQuery.refetch()} label={t('errors.tryAgain')} />}
        {!showOnline && manual.length > 0 && <div role="radiogroup" aria-label={tr('methodGroup', 'Choose how you’ll pay')} className="grid gap-2 sm:grid-cols-2">
          {manualTypes.map((type) => <Option
            key={type}
            selected={activeType === type && selected?.kind !== 'online'}
            onSelect={() => { setManualType(type); setSelected(null) }}
            leading={isManualPaymentProvider(type) ? <ProviderLogo type={type} size="sm" /> : iconTile(<Wallet />)}
            title={manualTitle(type)}
          />)}
        </div>}
        {showOnline && <div role="radiogroup" aria-label={tr('payOnline', 'Pay Online')} className="grid gap-2 sm:grid-cols-2">
          {online.map((item) => <Option
            key={'online-' + item.id}
            selected={active?.kind === 'online' && active.id === item.id}
            onSelect={() => { setSelected({ kind: 'online', id: item.id }); setManualType(null); intention.reset(); setLaunchError('') }}
            leading={iconTile(onlineIcon(item.onlinePaymentMethodType))}
            title={onlineTitle(item.onlinePaymentMethodType)}
          />)}
        </div>}
        {online.length > 0 && (showOnline
          ? manual.length > 0 && <div className="flex items-center gap-3">
            <span className={groupLabel}>{tr('or', 'Or')}</span>
            <span aria-hidden="true" className="h-px w-8 shrink-0 bg-border" />
            <Button type="button" variant="ghost" className={grayButton} disabled={intention.isPending} onClick={() => { setShowOnline(false); setSelected(null); setManualType(null); intention.reset(); setLaunchError('') }}><ArrowLeftRight className="size-4" />{tr('payTransfer', 'Pay by transfer')}</Button>
          </div>
          : <div className="flex items-center gap-3">
            {manual.length > 0 && <>
              <span className={groupLabel}>{tr('or', 'Or')}</span>
              <span aria-hidden="true" className="h-px w-8 shrink-0 bg-border" />
            </>}
            <Button type="button" className={primaryButton} onClick={() => { setShowOnline(true); setSelected(online.length === 1 ? { kind: 'online', id: online[0].id } : null); setManualType(null); setProof(null); setFileError(''); intention.reset(); setLaunchError('') }}><CreditCard className="size-4" />{tr('payOnline', 'Pay Online')}</Button>
          </div>)}
      </div>}

    {showOnline && activeOnline && <div className="grid gap-4 rounded-2xl border border-border/60 bg-muted/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0">
            <small className="block text-[13px] font-semibold text-muted-foreground">{tr('payWith', 'Pay with')}</small>
            <strong className="block truncate text-base font-bold">{onlineTitle(activeOnline.onlinePaymentMethodType)}</strong>
          </div>
        </div>
        <strong dir="ltr" className="font-sans text-xl font-bold tabular-nums text-primary">{money(d.depositAmount)}</strong>
      </div>
      <Button type="button" className={primaryButton + ' w-full'} disabled={intention.isPending} onClick={() => payOnline(activeOnline.id)}>
        {intention.isPending ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <ExternalLink className="size-4" />}
        {intention.isPending ? tr('preparing', 'Preparing secure payment…') : tr('payNow', 'Pay {{amount}}', { amount: money(d.depositAmount) })}
      </Button>
      <p className="text-xs leading-5 font-semibold text-muted-foreground">{tr('onlineHint', 'You’ll complete the payment on Paymob’s secure page, which opens in a new tab.')}</p>
    </div>}

    {!showOnline && activeManual && <form className="grid gap-4 rounded-2xl border border-border/60 bg-muted/30 p-4" onSubmit={sendProof}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <small className="text-[13px] font-bold tracking-wider text-muted-foreground uppercase">{manualTitle(activeManual.type)}</small>
          <strong dir="ltr" className="mt-1 block text-start font-mono text-xl font-bold break-all">{activeManual.accountIdentifier}</strong>
        </div>
        <CopyButton value={activeManual.accountIdentifier} tr={tr} />
      </div>

      {typeAccounts.length > 1 && <div className="grid gap-2">
        <small className="text-[13px] font-semibold text-foreground/80">{tr('accountsGroup', 'Choose the account you transferred to')}</small>
        <div role="radiogroup" aria-label={tr('accountsGroup', 'Choose the account you transferred to')} className="grid w-full gap-1 rounded-xl bg-foreground/5 p-1" style={{ gridTemplateColumns: `repeat(${Math.min(typeAccounts.length, 3)}, minmax(0, 1fr))` }}>
          {typeAccounts.map((item) => {
            const picked = activeManual.id === item.id
            return <button key={item.id} type="button" role="radio" aria-checked={picked} onClick={() => setSelected({ kind: 'manual', id: item.id })} dir="ltr" className={`flex h-11 min-w-0 cursor-pointer items-center justify-center rounded-lg px-3 font-mono text-[15px] font-bold tabular-nums transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none motion-reduce:transition-none ${picked ? 'bg-card text-primary shadow-sm ring-1 ring-primary/25' : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'}`}>
              <span className="truncate">{item.accountIdentifier}</span>
            </button>
          })}
        </div>
      </div>}

      <div className="grid gap-2">
        <input id="depositProof" type="file" accept=".jpg,.jpeg,.png,.webp" className="sr-only" disabled={submit.isPending} onChange={chooseProof} />
        {proof && preview
          ? <div className="overflow-hidden rounded-2xl border border-primary/20 bg-card">
            <div className="relative bg-muted/40">
              <img src={preview} alt={tr('previewAlt', 'Receipt preview')} className="h-40 w-full object-contain" />
              <Button type="button" variant="ghost" size="icon" className="absolute end-2.5 top-2.5 size-8 cursor-pointer rounded-full bg-background/80 text-muted-foreground shadow-sm backdrop-blur-sm hover:bg-destructive/10 hover:text-destructive" aria-label={tr('remove', 'Remove')} disabled={submit.isPending} onClick={() => setProof(null)}><X className="size-4" /></Button>
            </div>
            <div className="flex items-center gap-3 border-t border-border/60 px-3.5 py-2.5">
              <FileCheck2 className="size-5 shrink-0 text-primary" />
              <span className="grid min-w-0 flex-1 gap-0.5">
                <strong className="truncate text-sm font-bold">{proof.name}</strong>
                <small dir="ltr" className="text-start text-xs font-semibold text-muted-foreground tabular-nums">{fileSize(proof.size)}</small>
              </span>
              <label htmlFor="depositProof" className={`inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-foreground/5 px-4 text-[13px] font-bold transition-colors hover:bg-foreground/10 ${submit.isPending ? 'pointer-events-none opacity-50' : ''}`}><Upload className="size-3.5" />{tr('replace', 'Replace')}</label>
            </div>
          </div>
          : <label htmlFor="depositProof" className="group flex min-w-0 cursor-pointer items-center gap-3.5 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/[0.03] px-4 py-4 normal-case tracking-normal transition hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/[0.06] hover:shadow-md motion-reduce:transition-none">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:scale-105 group-hover:bg-primary/15 motion-reduce:transition-none"><Upload className="size-4.5" /></span>
            <span className="grid min-w-0 flex-1 gap-0.5">
              <strong className="truncate text-sm font-bold normal-case tracking-normal">{tr('proofDrop', 'Upload your transfer receipt')}</strong>
              <small className="truncate text-xs font-semibold normal-case tracking-normal text-muted-foreground">{tr('proofHint', 'JPG, PNG or WebP, up to 5 MB')}</small>
            </span>
          </label>}
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="depositReference" className="text-[13px] font-semibold text-foreground/80">{tr('reference', 'Transaction reference (optional)')}</label>
        <div dir="ltr" className="relative">
          <Hash aria-hidden="true" className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-primary/70" />
          <input id="depositReference" value={reference} maxLength={200} disabled={submit.isPending} placeholder={tr('referencePlaceholder', 'e.g. TRX-123456')} onChange={(event) => setReference(event.target.value)} className="h-12 w-full rounded-xl border border-input bg-background/40 ps-10 pe-3 text-start text-sm outline-none transition focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/10 disabled:opacity-60" />
        </div>
      </div>

      <Button type="submit" className={primaryButton + ' w-full'} disabled={!proof || submit.isPending}>
        {submit.isPending && <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />}
        {submit.isPending ? tr('submitting', 'Submitting…') : tr('submit', 'Submit payment proof')}
      </Button>
    </form>}
  </section>
}

// Shown while the backend callback is still being processed. It never reports a result itself.
function WaitingPanel({ waiting, checking, onCheck, onBack }: { waiting: Waiting; checking: boolean; onCheck: () => void; onBack: () => void }) {
  const tr = usePayTr()
  return <section className={cardClass} aria-live="polite" aria-label={tr('waitingTitle', 'Waiting for payment confirmation')}>
    <Title icon={waiting.timedOut ? <Clock3 /> : <LoaderCircle className="animate-spin motion-reduce:animate-none" />}>
      {waiting.timedOut ? tr('stillWaitingTitle', 'Still waiting for confirmation') : tr('waitingTitle', 'Waiting for payment confirmation')}
    </Title>
    <p className="text-sm leading-6 font-medium text-muted-foreground">
      {waiting.timedOut
        ? tr('stillWaitingText', 'We haven’t received the result yet. If you already paid, it can take a few minutes to show up. Check again shortly, and avoid paying twice.')
        : tr('waitingText', 'Finish the payment in the secure window. This page updates by itself as soon as the payment is confirmed, so there’s no need to refresh.')}
    </p>
    <div className="flex flex-wrap gap-2">
      <Button className={waiting.opened && !waiting.timedOut ? grayButton : primaryButton} variant={waiting.opened && !waiting.timedOut ? 'ghost' : 'default'} render={<a href={waiting.url} target="_blank" rel="noreferrer" />}><ExternalLink className="size-4" />{tr('openCheckout', 'Open payment page')}</Button>
      <Button type="button" variant="ghost" className={grayButton} disabled={checking} onClick={onCheck}>{checking ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <RefreshCw className="size-4" />}{tr('checkStatus', 'Check status')}</Button>
      <Button type="button" variant="ghost" className={grayButton} onClick={onBack}>{tr('backToMethods', 'Choose another method')}</Button>
    </div>
  </section>
}

export default function PatientDepositPayment({ d, money }: Props) {
  const tr = usePayTr()
  const queryClient = useQueryClient()
  const [success, setSuccess] = useState('')
  const [result, setResult] = useState<'paid' | 'failed' | null>(null)
  const [waiting, setWaiting] = useState<Waiting | null>(null)
  const appointmentId = d.appointmentId
  const status = String(d.appointmentStatus)
  const depositStatus = String(d.depositPaymentStatus)
  const expired = Boolean(d.reservationExpiresAt) && parseUtc(d.reservationExpiresAt as string).getTime() <= Date.now()
  const checking = useIsFetching({ queryKey: ['patient', 'appointments', 'details', appointmentId] }) > 0
  const polling = waiting !== null && !waiting.timedOut
  const startedAt = waiting?.startedAt

  // The backend callback is the source of truth: keep re-reading the appointment, and stop after a while.
  useEffect(() => {
    if (!polling) return
    const timer = window.setInterval(() => { void queryClient.invalidateQueries({ queryKey: ['patient', 'appointments', 'details', appointmentId] }) }, pollMs)
    const stop = window.setTimeout(() => setWaiting((current) => current ? { ...current, timedOut: true } : current), maxWaitMs)
    return () => { window.clearInterval(timer); window.clearTimeout(stop) }
  }, [polling, startedAt, appointmentId, queryClient])

  // Translate what the backend now reports into what the patient sees.
  useEffect(() => {
    if (!waiting) return
    if (depositStatus === 'Paid' || status === 'Confirmed') {
      setWaiting(null)
      setResult('paid')
      void queryClient.invalidateQueries({ queryKey: ['patient', 'appointments'] })
      return
    }
    // Expired, cancelled... the page already reflects the real status.
    if (status !== 'PendingPayment') { setWaiting(null); return }
    if (depositStatus === 'Pending' && !waiting.sawPending) {
      setWaiting((current) => current ? { ...current, sawPending: true } : current)
      return
    }
    // A Failed status only counts once the new session has been seen as Pending, so an older failure isn't mistaken for this one.
    if (depositStatus === 'Failed' && waiting.sawPending) { setWaiting(null); setResult('failed') }
  }, [waiting, status, depositStatus, queryClient])

  function checkAgain() {
    setWaiting((current) => current ? { ...current, timedOut: false, startedAt: Date.now() } : current)
    void queryClient.invalidateQueries({ queryKey: ['patient', 'appointments', 'details', appointmentId] })
  }

  let content: ReactNode = null
  if (status === 'PendingPayment' && !expired && (depositStatus === 'Pending' || depositStatus === 'Failed')) {
    content = waiting
      ? <WaitingPanel waiting={waiting} checking={checking} onCheck={checkAgain} onBack={() => setWaiting(null)} />
      : <PayForm d={d} money={money} onSubmitted={setSuccess} onLaunched={(url, opened) => { setResult(null); setWaiting({ startedAt: Date.now(), url, opened, sawPending: depositStatus === 'Pending', timedOut: false }) }} />
  }

  return <>
    {success && <Notice tone="success" message={success} />}
    {result === 'paid' && <Notice tone="success" message={tr('onlinePaid', 'Payment received. Your appointment is confirmed.')} />}
    {result === 'failed' && <Notice message={tr('onlineFailed', 'The payment didn’t go through. You can try again.')} />}
    {content}
  </>
}