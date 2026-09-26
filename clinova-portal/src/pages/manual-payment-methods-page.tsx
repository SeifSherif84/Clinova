import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft, ArrowUpRight, Check, CircleCheck, Copy, Eye, Landmark, LoaderCircle, Pause, PencilLine, Plus, Power, RefreshCw, Save, ShieldCheck, Smartphone, Trash2, WalletCards, X } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import ConfirmationDialog from '@/components/confirmation-dialog'
import DoctorWorkspaceShell from '@/components/doctor-workspace-shell'
import Notice from '@/components/notice'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApi } from '@/hooks/use-api'
import { useAuth } from '@/hooks/use-auth'
import { ApiError, getErrorMessage } from '@/lib/api'
import type { ClinicDetails, ClinicMember } from '@/types/clinic'
import { manualPaymentTypeIds, type ManualPaymentMethod, type ManualPaymentMethodType } from '@/types/manual-payment-method'

const buttonClass = 'h-11 rounded-xl text-sm font-bold normal-case'
const spinnerClass = 'size-4 animate-spin motion-reduce:animate-none'
const providerTypes: ManualPaymentMethodType[] = ['VodafoneCash', 'InstaPay']
type Editor = { id?: number; type: ManualPaymentMethodType; accountIdentifier: string; isActive: boolean }
type Action =
  | { kind: 'save'; editor: Editor }
  | { kind: 'delete' | 'toggle'; method: ManualPaymentMethod }
type Confirmation = { method: ManualPaymentMethod; hasHistory: boolean }

function normalizeIdentifier(editor: Editor) {
  // Accept Arabic digits and pasted phone spacing without rewriting InstaPay identifiers.
  return editor.type === 'VodafoneCash'
    ? editor.accountIdentifier.trim().replace(/[\u0660-\u0669\u06f0-\u06f9]/g, (digit) => String(digit.charCodeAt(0) - (digit.charCodeAt(0) >= 0x6f0 ? 0x6f0 : 0x660))).replace(/[\s()-]/g, '')
    : editor.accountIdentifier.trim()
}

function ProviderLogo({ type, className = '' }: { type: ManualPaymentMethodType; className?: string }) {
  // Preserve original brand artwork on a white surface, including in dark mode.
  return <span aria-hidden="true" className={`relative flex h-12 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ${className}`}>
    {type === 'InstaPay'
      ? <img src="/payment-providers/instapay.png" alt="" className="absolute w-32 max-w-none" />
      : <img src="/payment-providers/vodafone.svg" alt="" className="size-9" />}
  </span>
}

export default function ManualPaymentMethodsPage() {
  const { t } = useTranslation()
  const { clinicId } = useParams({ from: '/doctor/clinics/$clinicId/payment-methods' })
  const id = Number(clinicId)
  const validId = Number.isInteger(id) && id > 0
  const api = useApi()
  const auth = useAuth()
  const clinic = useQuery({ queryKey: ['doctor', 'clinics', id], queryFn: () => api.request<ClinicDetails>(`/api/clinics/${id}`, {}, { notifyOnError: false }), enabled: validId })
  const members = useQuery({ queryKey: ['doctor', 'clinics', id, 'members'], queryFn: () => api.request<ClinicMember[]>(`/api/clinics/${id}/members`, {}, { notifyOnError: false }), enabled: validId })
  const isOwner = members.data?.some((member) => member.id === auth.user?.id && member.isOwner)
  const accessError = clinic.error || members.error

  return <DoctorWorkspaceShell active="clinics">
    <div className="mx-auto w-full min-w-0 max-w-6xl p-4 sm:p-6 lg:p-10">
      <div className="mb-5"><Button variant="ghost" className={`${buttonClass} px-0 text-muted-foreground`} render={<Link to="/doctor/clinics/$clinicId" params={{ clinicId }} />}><ArrowLeft className="rtl:rotate-180" />{t('manualPayments.back')}</Button></div>
      {!validId ? <Notice message={t('clinicDetails.invalidId')} /> : accessError ? <div className="grid justify-items-start gap-4"><Notice message={getErrorMessage(accessError)} /><p className="text-sm text-muted-foreground">{getErrorMessage(accessError)}</p><Button variant="outline" className={buttonClass} onClick={() => { void clinic.refetch(); void members.refetch() }}><RefreshCw />{t('manualPayments.retry')}</Button></div> : clinic.isPending || members.isPending ? <LoadingState /> : !isOwner ? <div className="flex items-center gap-3 rounded-2xl border bg-card p-6"><ShieldCheck className="shrink-0 text-primary" /><p className="text-sm font-bold">{t('manualPayments.ownerOnly')}</p></div> : clinic.data ? <PaymentWorkspace key={id} clinic={clinic.data} /> : null}
    </div>
  </DoctorWorkspaceShell>
}

function LoadingState() {
  const { t } = useTranslation()
  return <div role="status" className="flex min-h-64 items-center justify-center gap-3 text-sm text-muted-foreground"><LoaderCircle className={spinnerClass} />{t('manualPayments.loading')}</div>
}

function PaymentWorkspace({ clinic }: { clinic: ClinicDetails }) {
  const { t } = useTranslation()
  const api = useApi()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all')
  const [editor, setEditor] = useState<Editor | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formInvalid, setFormInvalid] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const actionLock = useRef(false)
  const queryKey = ['manual-payment-methods', clinic.id]
  const basePath = `/api/manual-payment-methods`
  const methods = useQuery({ queryKey, queryFn: () => api.request<ManualPaymentMethod[]>(`${basePath}/clinics/${clinic.id}/management`, {}, { notifyOnError: false }) })
  const accounts = methods.data ?? []
  const activeCount = accounts.filter((method) => method.isActive).length
  const visible = accounts.filter((method) => filter === 'all' || method.isActive === (filter === 'active'))

  const mutation = useMutation({
    mutationFn: async (action: Action) => {
      if (action.kind === 'save') {
        const { id, type, accountIdentifier } = action.editor
        return api.request<string>(id === undefined ? `${basePath}/clinics/${clinic.id}` : `${basePath}/${id}/clinics/${clinic.id}`, {
          method: id === undefined ? 'POST' : 'PATCH',
          body: JSON.stringify(id === undefined ? { type: manualPaymentTypeIds[type], accountIdentifier } : { accountIdentifier }),
        }, { notifyOnError: false })
      }
      const { method } = action
      const suffix = action.kind === 'toggle' ? `/${method.isActive ? 'deactivate' : 'activate'}` : ''
      return api.request<string>(`${basePath}/${method.id}/clinics/${clinic.id}${suffix}`, { method: action.kind === 'delete' ? 'DELETE' : 'PATCH' }, { notifyOnError: false })
    },
    onSuccess: async (_, action) => {
      setEditor(null)
      setConfirmation(null)
      setSuccess(t(`manualPayments.${action.kind === 'save' ? action.editor.id === undefined ? 'created' : 'updated' : action.kind === 'delete' ? 'deleted' : action.method.isActive ? 'deactivated' : 'activated'}`))
      if (action.kind === 'save' && action.editor.id === undefined) setFilter('all')
      await queryClient.invalidateQueries({ queryKey })
    },
    onError: async (failure, action) => {
      if (action.kind === 'delete' && failure instanceof ApiError && failure.status === 400 && /existing payments|payment history/i.test(failure.message)) {
        setConfirmation({ method: action.method, hasHistory: true })
        return
      }
      if (action.kind === 'toggle' && failure instanceof ApiError && failure.status === 400 && /already (active|inactive)/i.test(failure.message)) {
        setError(t('manualPayments.stale'))
        setConfirmation(null)
      } else setError(getErrorMessage(failure))
      // Reconcile stale status/deleted records and duplicates without retrying a mutation.
      if (failure instanceof ApiError && [400, 403, 404].includes(failure.status)) await queryClient.invalidateQueries({ queryKey })
    },
    onSettled: () => { actionLock.current = false },
  })
  const busy = mutation.isPending
  const canChange = methods.isSuccess && !methods.isFetching && !busy
  const unchanged = editor?.id !== undefined && normalizeIdentifier(editor) === accounts.find((method) => method.id === editor.id)?.accountIdentifier

  function act(action: Action) {
    if (actionLock.current || !canChange) return
    actionLock.current = true
    setError('')
    setSuccess('')
    mutation.mutate(action)
  }
  function openEditor(method?: ManualPaymentMethod, type: ManualPaymentMethodType = 'VodafoneCash') {
    setError(''); setSuccess(''); setFormInvalid(false)
    setEditor(method ? { ...method } : { type, accountIdentifier: '', isActive: true })
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editor) return
    if (unchanged) return
    const identifier = normalizeIdentifier(editor)
    const message = !identifier || identifier.length > 100 ? t('manualPayments.required')
      : editor.type === 'VodafoneCash' && !/^01[0125]\d{8}$/.test(identifier) ? t('manualPayments.invalidPhone')
      : accounts.some((method) => method.id !== editor.id && method.type === editor.type && method.accountIdentifier === identifier) ? t('manualPayments.duplicate') : ''
    setError(message); setFormInvalid(Boolean(message))
    if (message) { inputRef.current?.focus(); return }
    act({ kind: 'save', editor: { ...editor, accountIdentifier: identifier } })
  }
  async function copyAccount(identifier: string) {
    setError(''); setSuccess('')
    try { await navigator.clipboard.writeText(identifier); setSuccess(t('manualPayments.copied')) }
    catch { setError(t('manualPayments.copyError')) }
  }

  return <>
    <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-primary uppercase"><WalletCards className="size-3" />{t('manualPayments.eyebrow')}</Badge>
    <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="font-sans text-3xl font-bold sm:text-4xl">{t('manualPayments.title')}</h1><p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground sm:text-sm">{t('manualPayments.description')}</p></div>
      <Button className={buttonClass} disabled={!canChange} onClick={() => openEditor()}>{busy || methods.isFetching ? <LoaderCircle className={spinnerClass} /> : <Plus />}{t('manualPayments.add')}</Button>
    </div>
    <section className="relative isolate mt-6 overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/12 via-card to-primary/5 p-6 sm:p-8" aria-label={t('manualPayments.eyebrow')}>
      <div aria-hidden="true" className="pointer-events-none absolute -end-16 -top-24 -z-10 size-80 rounded-full border-[40px] border-primary/5" />
      <div className="grid items-center gap-7 lg:grid-cols-[1.4fr_1fr]">
        <div><p className="flex items-center gap-2 text-sm font-bold text-primary"><Landmark className="size-4 shrink-0" /><span className="break-words">{clinic.name}</span></p><h2 className="mt-3 max-w-lg font-sans text-2xl font-bold sm:text-3xl">{t('manualPayments.hubTitle')}</h2><p className="mt-3 max-w-lg text-xs leading-6 text-muted-foreground sm:text-sm">{t('manualPayments.hubDescription')}</p></div>
        <div className="grid gap-4"><div className="flex flex-wrap items-center gap-3">{providerTypes.map((type) => <div key={type} className="grid justify-items-center gap-2"><ProviderLogo type={type} /><span className="text-xs font-bold">{t(`manualPayments.${type}`)}</span></div>)}<ArrowUpRight aria-hidden="true" className="size-6 text-primary rtl:-rotate-90" /></div><dl className="grid grid-cols-2 gap-4 border-t border-primary/15 pt-4">{[['activeCount', activeCount], ['pausedCount', accounts.length - activeCount]].map(([label, count]) => <div key={label}><dt className="text-xs text-muted-foreground">{t(`manualPayments.${label}`)}</dt><dd className="mt-1 text-3xl font-bold tabular-nums">{methods.isSuccess ? count : '—'}</dd></div>)}</dl></div>
      </div>
    </section>
    {success && <Notice message={success} tone="success" />}
    {error && !editor && !confirmation && <Notice message={error} />}
    {methods.isLoading ? <LoadingState /> : methods.isError ? <div className="mt-6 grid justify-items-start gap-3 rounded-2xl border border-destructive/20 bg-card p-6"><Notice message={getErrorMessage(methods.error)} /><p className="text-sm font-bold">{t(methods.data ? 'manualPayments.refreshError' : 'manualPayments.loadError')}</p><Button variant="outline" className={buttonClass} disabled={methods.isFetching} onClick={() => void methods.refetch()}>{methods.isFetching ? <LoaderCircle className={spinnerClass} /> : <RefreshCw />}{t('manualPayments.retry')}</Button></div> : <section className="mt-8" aria-labelledby="receiving-accounts">
      <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"><WalletCards className="size-7" /></span><div><h2 id="receiving-accounts" className="font-sans text-xl font-bold">{t('manualPayments.accounts')}</h2><p className="mt-1 text-xs leading-6 text-muted-foreground">{t('manualPayments.accountsDescription')}</p></div></div><Button variant="ghost" className={buttonClass} disabled={busy || methods.isFetching} onClick={() => void methods.refetch()}>{methods.isFetching ? <LoaderCircle className={spinnerClass} /> : <RefreshCw />}{t('manualPayments.refresh')}</Button></div>
      {accounts.length > 0 && <div role="group" aria-label={t('manualPayments.accounts')} className="mt-5 flex w-fit max-w-full flex-wrap gap-1 rounded-3xl border bg-card/70 p-1.5">{(['all', 'active', 'paused'] as const).map((value) => <Button key={value} variant={filter === value ? 'default' : 'ghost'} aria-pressed={filter === value} onClick={() => setFilter(value)} className="h-11 rounded-full px-4 text-sm font-bold normal-case">{value === 'all' ? <WalletCards /> : value === 'active' ? <CircleCheck /> : <Pause />}{t(`manualPayments.${value}`)}<span className="rounded-full bg-background/20 px-2 py-0.5 text-xs tabular-nums">{value === 'all' ? accounts.length : value === 'active' ? activeCount : accounts.length - activeCount}</span></Button>)}</div>}
      {visible.length > 0 ? <ul className="mt-5 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">{visible.map((method) => {
        const rowBusy = busy && mutation.variables?.kind !== 'save' && mutation.variables?.method.id === method.id
        return <li key={method.id} className="group flex flex-col gap-4 p-4 transition-colors hover:bg-primary/5 motion-reduce:transition-none sm:p-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-4"><ProviderLogo type={method.type} /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-bold">{t(`manualPayments.${method.type}`)}</h3><Badge className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${method.isActive ? 'border-primary/15 bg-primary/10 text-primary' : 'border-warm/20 bg-warm/10 text-warm'}`}>{method.isActive ? <CircleCheck className="size-3" /> : <Pause className="size-3" />}{t(method.isActive ? 'manualPayments.active' : 'manualPayments.paused')}</Badge></div><p dir="ltr" className="mt-2 break-all text-start font-mono text-sm font-bold sm:text-base">{method.accountIdentifier}</p></div></div>
          <div className="flex shrink-0 flex-wrap gap-1" role="group" aria-label={`${t(`manualPayments.${method.type}`)} ${method.accountIdentifier}`}><Button variant="ghost" className={buttonClass} onClick={() => void copyAccount(method.accountIdentifier)}><Copy />{t('manualPayments.copy')}</Button><Button variant="ghost" className={buttonClass} disabled={!canChange} onClick={() => openEditor(method)}><PencilLine />{t('manualPayments.edit')}</Button><Button variant="outline" className={buttonClass} disabled={!canChange} onClick={() => act({ kind: 'toggle', method })}>{rowBusy ? <LoaderCircle className={spinnerClass} /> : method.isActive ? <Pause /> : <Power />}{t(method.isActive ? 'manualPayments.pause' : 'manualPayments.activate')}</Button><Button variant="ghost" className={`${buttonClass} text-destructive hover:bg-destructive/10 hover:text-destructive`} disabled={!canChange} onClick={() => { setError(''); setSuccess(''); setConfirmation({ method, hasHistory: false }) }}><Trash2 />{t('manualPayments.delete')}</Button></div>
        </li>
      })}</ul> : <div className="mt-5 grid justify-items-center rounded-3xl border border-dashed border-primary/25 bg-gradient-to-br from-primary/5 via-card to-warm/5 px-5 py-12 text-center">
        <span className="relative"><span aria-hidden="true" className="absolute inset-0 rounded-3xl bg-primary/10 motion-safe:animate-ping" /><span className="relative grid size-20 place-items-center rounded-3xl bg-primary/10 text-primary shadow-inner"><WalletCards className="size-9" /></span></span><h3 className="mt-6 max-w-lg font-heading text-2xl font-bold sm:text-3xl">{t(accounts.length ? 'manualPayments.emptyFilter' : 'manualPayments.emptyTitle')}</h3><p className="mt-3 max-w-md text-xs leading-6 text-muted-foreground sm:text-sm">{t(accounts.length ? 'manualPayments.emptyFilterDescription' : 'manualPayments.emptyDescription')}</p>{!accounts.length && <div className="mt-5 flex flex-wrap justify-center gap-3">{providerTypes.map((type) => <Button key={type} variant="outline" className={buttonClass} disabled={!canChange} onClick={() => openEditor(undefined, type)}><Plus />{t(`manualPayments.${type}`)}</Button>)}</div>}
      </div>}
    </section>}
    <section className="mt-8 border-t border-border pt-6" aria-label={t('manualPayments.howTitle')}><ol className="grid gap-5 sm:grid-cols-3">{[1, 2, 3].map((step) => <li key={step} className="flex gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">0{step}</span><div><h3 className="text-sm font-bold">{t(`manualPayments.step${step}`)}</h3><p className="mt-1 text-xs leading-6 text-muted-foreground">{t(`manualPayments.step${step}Description`)}</p></div></li>)}</ol></section>

    <Dialog open={Boolean(editor)} onOpenChange={(open) => { if (!open && !busy) { setEditor(null); setError('') } }}>
      <DialogContent showCloseButton={false} className="max-h-[90dvh] overflow-y-auto rounded-3xl border border-border bg-card p-5 motion-reduce:animate-none sm:max-w-2xl sm:p-7">
        <DialogHeader><DialogTitle className="flex items-center gap-3 font-sans text-xl font-bold tracking-normal normal-case"><span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"><WalletCards className="size-7" /></span>{t(editor?.id === undefined ? 'manualPayments.createTitle' : 'manualPayments.editTitle')}</DialogTitle><DialogDescription>{t(editor?.id === undefined ? 'manualPayments.createDescription' : 'manualPayments.editDescription')}</DialogDescription></DialogHeader>
        {editor && <form onSubmit={submit} noValidate className="grid gap-5">
          {error && <Notice message={error} />}
          <fieldset disabled={busy} className="min-w-0"><legend className="mb-3 text-xs font-bold text-foreground/80">{t(editor.id === undefined ? 'manualPayments.choose' : 'manualPayments.immutable')}</legend><div className="grid gap-3 sm:grid-cols-2">{(editor.id === undefined ? providerTypes : [editor.type]).map((type) => <Button key={type} type="button" variant="outline" aria-pressed={editor.type === type} disabled={editor.id !== undefined} className={`h-auto min-h-24 justify-start gap-3 whitespace-normal rounded-2xl p-3 text-start normal-case ${editor.type === type ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20' : ''}`} onClick={() => { if (editor.type === type) return; setEditor({ ...editor, type, accountIdentifier: '' }); setError(''); setFormInvalid(false) }}><ProviderLogo type={type} className="w-20" /><span className="min-w-0 flex-1"><span className="block text-sm font-bold">{t(`manualPayments.${type}`)}</span><span className="mt-1 block text-xs font-normal text-muted-foreground">{t(type === 'VodafoneCash' ? 'manualPayments.wallet' : 'manualPayments.instant')}</span></span>{editor.type === type && <Check className="size-4 shrink-0 text-primary" />}</Button>)}</div></fieldset>
          <div className="grid gap-2"><Label htmlFor="payment-identifier" className="text-xs font-semibold text-foreground/80">{t(editor.type === 'VodafoneCash' ? 'manualPayments.phoneLabel' : 'manualPayments.addressLabel')}</Label><div className="relative"><span className="pointer-events-none absolute start-4 top-4 text-muted-foreground">{editor.type === 'VodafoneCash' ? <Smartphone className="size-4" /> : <Landmark className="size-4" />}</span><Input ref={inputRef} id="payment-identifier" autoFocus dir="ltr" autoComplete="off" spellCheck={false} inputMode={editor.type === 'VodafoneCash' ? 'tel' : 'text'} value={editor.accountIdentifier} maxLength={100} disabled={busy} aria-invalid={formInvalid} aria-describedby="payment-identifier-hint" className="h-12 rounded-xl bg-background/40 ps-11 focus-visible:border-primary/50" placeholder={t(editor.type === 'VodafoneCash' ? 'manualPayments.phonePlaceholder' : 'manualPayments.addressPlaceholder')} onChange={(event) => { setEditor({ ...editor, accountIdentifier: event.target.value }); setFormInvalid(false); setError('') }} /></div><p id="payment-identifier-hint" className="text-xs leading-6 text-muted-foreground">{t(editor.type === 'VodafoneCash' ? 'manualPayments.phoneHint' : 'manualPayments.addressHint')}</p></div>
          <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-primary/5 p-5"><div className="flex items-center justify-between gap-3"><p className="flex items-center gap-2 text-xs font-bold text-primary"><Eye className="size-4" />{t('manualPayments.preview')}</p><Badge className="rounded-full bg-background text-[10px] font-bold text-muted-foreground">{t(editor.id === undefined ? 'manualPayments.previewStatus' : editor.isActive ? 'manualPayments.active' : 'manualPayments.paused')}</Badge></div><p className="mt-4 text-xs font-bold text-muted-foreground">{t(`manualPayments.${editor.type}`)}</p><p dir={editor.accountIdentifier.trim() ? "ltr" : undefined} className={`mt-2 break-all text-start text-lg font-bold ${editor.accountIdentifier.trim() ? "font-mono" : "font-sans"}`}>{editor.accountIdentifier.trim() || t('manualPayments.previewPlaceholder')}</p><p className="mt-4 flex items-start gap-2 border-t border-primary/10 pt-3 text-xs leading-6 text-muted-foreground"><ShieldCheck className="mt-1 size-4 shrink-0 text-primary" />{t('manualPayments.previewNote')}</p></div>
          <div className="flex flex-wrap justify-end gap-3"><Button type="button" variant="outline" className={buttonClass} disabled={busy} onClick={() => { setEditor(null); setError('') }}><X />{t('manualPayments.cancel')}</Button><Button type="submit" className={buttonClass} disabled={!canChange || unchanged}>{busy ? <LoaderCircle className={spinnerClass} /> : editor.id === undefined ? <Plus /> : <Save />}{t(editor.id === undefined ? 'manualPayments.create' : 'manualPayments.save')}</Button></div>
        </form>}
      </DialogContent>
    </Dialog>
    <ConfirmationDialog open={Boolean(confirmation)} onOpenChange={(open) => { if (!open && !busy) { setConfirmation(null); setError('') } }} title={t(confirmation?.hasHistory ? 'manualPayments.historyTitle' : 'manualPayments.deleteTitle')} description={confirmation?.hasHistory ? t(confirmation.method.isActive ? 'manualPayments.historyDescription' : 'manualPayments.historyPaused') : t('manualPayments.deleteDescription', { account: confirmation?.method.accountIdentifier })} confirmLabel={t(confirmation?.hasHistory ? confirmation.method.isActive ? 'manualPayments.pause' : 'manualPayments.close' : 'manualPayments.delete')} cancelLabel={t('manualPayments.keep')} pending={busy} destructive={!confirmation?.hasHistory} error={error} onConfirm={() => { if (!confirmation) return; if (confirmation.hasHistory && !confirmation.method.isActive) { setConfirmation(null); return }; act({ kind: confirmation.hasHistory ? 'toggle' : 'delete', method: confirmation.method }) }} />
  </>
}
