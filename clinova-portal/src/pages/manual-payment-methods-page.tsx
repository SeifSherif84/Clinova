import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, Check, CircleCheck, Copy, Landmark, LoaderCircle, Pause, PencilLine, Plus, Power, RefreshCw, Save, ShieldCheck, Smartphone, Trash2, WalletCards, X } from 'lucide-react'
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
    <section className="relative isolate mt-6 overflow-hidden rounded-3xl border border-primary/10 bg-card p-6 sm:p-10" aria-label={t('manualPayments.eyebrow')}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute -end-20 -top-20 -z-10 size-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="grid items-center gap-10 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
            <Landmark className="size-3.5 shrink-0" />
            <span className="break-words">{clinic.name}</span>
          </span>
          <h2 className="mt-4 max-w-lg font-sans text-3xl leading-tight font-bold sm:text-4xl">{t('manualPayments.hubTitle')}</h2>
          <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground">{t('manualPayments.hubDescription')}</p>
          <div className="mt-7">
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
              {accounts.length > 0 ? (
                <>
                  <span className="h-full bg-primary transition-all duration-500" style={{ width: `${(activeCount / accounts.length) * 100}%` }} />
                  <span className="h-full bg-muted-foreground/40 transition-all duration-500" style={{ width: `${((accounts.length - activeCount) / accounts.length) * 100}%` }} />
                </>
              ) : <span className="h-full w-full bg-muted" />}
            </div>
            <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              <div className="flex items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-full bg-primary" />
                <dd className="text-lg font-bold tabular-nums text-primary">{methods.isSuccess ? activeCount : '—'}</dd>
                <dt className="text-xs font-semibold text-muted-foreground">{t('manualPayments.activeCount')}</dt>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-full bg-muted-foreground/40" />
                <dd className="text-lg font-bold tabular-nums text-foreground/70">{methods.isSuccess ? accounts.length - activeCount : '—'}</dd>
                <dt className="text-xs font-semibold text-muted-foreground">{t('manualPayments.pausedCount')}</dt>
              </div>
            </dl>
          </div>
        </div>
        <div className="relative mx-auto grid size-60 place-items-center sm:size-64">
          <svg aria-hidden="true" className="absolute inset-0 size-full" viewBox="0 0 240 240" fill="none">
            <defs>
              <linearGradient id="linkStart" x1="120" y1="120" x2="54" y2="54" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="currentColor" className="text-primary/50" />
                <stop offset="100%" stopColor="currentColor" className="text-primary/0" />
              </linearGradient>
              <linearGradient id="linkEnd" x1="120" y1="120" x2="186" y2="54" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="currentColor" className="text-primary/50" />
                <stop offset="100%" stopColor="currentColor" className="text-primary/0" />
              </linearGradient>
            </defs>
            <path id="curveStart" d="M120 120 Q90 70 54 54" stroke="url(#linkStart)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path id="curveEnd" d="M120 120 Q150 70 186 54" stroke="url(#linkEnd)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <circle r="3.5" className="fill-primary">
              <animateMotion dur="2.8s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear">
                <mpath href="#curveStart" />
              </animateMotion>
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="2.8s" repeatCount="indefinite" />
            </circle>
            <circle r="3.5" className="fill-primary">
              <animateMotion dur="2.8s" begin="1.4s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear">
                <mpath href="#curveEnd" />
              </animateMotion>
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="2.8s" begin="1.4s" repeatCount="indefinite" />
            </circle>
          </svg>
          <span className="relative z-10 grid size-20 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 ring-8 ring-primary/10">
            <Landmark className="size-8" />
          </span>
          <div className="absolute start-0 top-0">
            <ProviderLogo type={providerTypes[0]} className="shadow-md" />
          </div>
          <div className="absolute end-0 top-0">
            <ProviderLogo type={providerTypes[1]} className="shadow-md" />
          </div>
        </div>
      </div>
    </section>
    {success && <Notice message={success} tone="success" />}
    {error && !editor && !confirmation && <Notice message={error} />}
    {methods.isLoading ? <LoadingState /> : methods.isError ? <div className="mt-6 grid justify-items-start gap-3 rounded-2xl border border-destructive/20 bg-card p-6"><Notice message={getErrorMessage(methods.error)} /><p className="text-sm font-bold">{t(methods.data ? 'manualPayments.refreshError' : 'manualPayments.loadError')}</p><Button variant="outline" className={buttonClass} disabled={methods.isFetching} onClick={() => void methods.refetch()}>{methods.isFetching ? <LoaderCircle className={spinnerClass} /> : <RefreshCw />}{t('manualPayments.retry')}</Button></div> : <section className="mt-8" aria-labelledby="receiving-accounts">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/25"><WalletCards className="size-5" /></span>
          <div>
            <h2 id="receiving-accounts" className="font-sans text-xl font-bold">{t('manualPayments.accounts')}</h2>
            <p className="mt-0.5 text-sm leading-6 font-medium text-muted-foreground">{t('manualPayments.accountsDescription')}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="size-10 shrink-0 rounded-xl border-border bg-card text-muted-foreground shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
          disabled={busy || methods.isFetching}
          aria-label={t('manualPayments.refresh')}
          title={t('manualPayments.refresh')}
          onClick={() => void methods.refetch()}
        >
          {methods.isFetching ? <LoaderCircle className={spinnerClass} /> : <RefreshCw className="size-4" />}
        </Button>
      </div>
      {accounts.length > 0 && (
        <div role="group" aria-label={t('manualPayments.accounts')} className="mt-6 flex w-fit max-w-full flex-wrap gap-7 border-b border-border">
          {(['all', 'active', 'paused'] as const).map((value) => {
            const count = value === 'all' ? accounts.length : value === 'active' ? activeCount : accounts.length - activeCount
            const selected = filter === value
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => setFilter(value)}
                className={`relative flex items-center gap-2 pb-3 text-sm font-bold normal-case transition-colors ${selected ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {value === 'all' ? <WalletCards className="size-4" /> : value === 'active' ? <CircleCheck className="size-4" /> : <Pause className="size-4" />}
                {t(`manualPayments.${value}`)}
                <span className={`rounded-full px-2 py-0.5 text-[11px] tabular-nums ${selected ? 'bg-muted text-foreground' : 'bg-muted/60 text-muted-foreground'}`}>{count}</span>
                {selected && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />}
              </button>
            )
          })}
        </div>
      )}
      {visible.length > 0 ? <ul className="mt-5 grid gap-3">{visible.map((method) => {
        const rowBusy = busy && mutation.variables?.kind !== 'save' && mutation.variables?.method.id === method.id
        return <li key={method.id} className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg motion-reduce:transition-none sm:p-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <ProviderLogo type={method.type} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold">{t(`manualPayments.${method.type}`)}</h3>
                <span className="flex items-center gap-2 text-xs font-bold">
                  <span className="relative inline-flex aspect-square size-2 shrink-0 items-center justify-center">
                    {method.isActive && <span className="absolute inset-0 aspect-square animate-ping rounded-full bg-primary/50 motion-reduce:animate-none" />}
                    <span className={`aspect-square size-2 shrink-0 rounded-full ${method.isActive ? 'bg-primary' : 'bg-muted-foreground/50'}`} />
                  </span>
                  <span className={method.isActive ? 'text-primary' : 'text-muted-foreground'}>{t(method.isActive ? 'manualPayments.active' : 'manualPayments.paused')}</span>
                </span>
              </div>
              <span dir="ltr" className="mt-2 inline-flex max-w-full items-center gap-2 rounded-lg bg-muted/50 px-2.5 py-1.5 text-start font-mono text-sm font-bold">
                <span className="truncate">{method.accountIdentifier}</span>
              </span>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1 border-t border-border/60 pt-3 xl:border-t-0 xl:pt-0" role="group" aria-label={`${t(`manualPayments.${method.type}`)} ${method.accountIdentifier}`}>
            <Button variant="ghost" size="icon" className="size-10 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary" aria-label={t('manualPayments.copy')} title={t('manualPayments.copy')} onClick={() => void copyAccount(method.accountIdentifier)}><Copy className="size-4" /></Button>
            <Button variant="ghost" size="icon" className="size-10 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary" aria-label={t('manualPayments.edit')} title={t('manualPayments.edit')} disabled={!canChange} onClick={() => openEditor(method)}><PencilLine className="size-4" /></Button>
            <Button variant="ghost" size="icon" className="size-10 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary" aria-label={t(method.isActive ? 'manualPayments.pause' : 'manualPayments.activate')} title={t(method.isActive ? 'manualPayments.pause' : 'manualPayments.activate')} disabled={!canChange} onClick={() => act({ kind: 'toggle', method })}>{rowBusy ? <LoaderCircle className={spinnerClass} /> : method.isActive ? <Pause className="size-4" /> : <Power className="size-4" />}</Button>
            <Button variant="ghost" size="icon" className="size-10 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={t('manualPayments.delete')} title={t('manualPayments.delete')} disabled={!canChange} onClick={() => { setError(''); setSuccess(''); setConfirmation({ method, hasHistory: false }) }}><Trash2 className="size-4" /></Button>
          </div>
        </li>
      })}</ul> : accounts.length === 0 ? <div className="mt-5 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-muted/40 to-transparent">
        <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <h3 className="max-w-sm font-sans text-3xl leading-[1.15] font-bold sm:text-4xl">{t('manualPayments.emptyTitle')}</h3>
            <p className="mt-4 max-w-sm text-sm leading-7 text-muted-foreground">{t('manualPayments.emptyDescription')}</p>
            <p className="mt-6 hidden items-center gap-2.5 text-xs font-bold text-primary/70 lg:flex">
              <span className="h-px w-9 bg-primary/25" />
              {t('manualPayments.emptyHint', { defaultValue: 'Pick a provider to begin' })}
              <ArrowRight className="size-3.5 rtl:rotate-180" />
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {providerTypes.map((type) => (
              <button key={type} type="button" disabled={!canChange} onClick={() => openEditor(undefined, type)} className="group flex flex-col items-start gap-4 rounded-2xl border border-border bg-card p-5 text-start transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg disabled:pointer-events-none disabled:opacity-60">
                <ProviderLogo type={type} className="shadow-sm" />
                <div>
                  <strong className="block text-sm font-bold">{t(`manualPayments.${type}`)}</strong>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">{t(type === 'VodafoneCash' ? 'manualPayments.wallet' : 'manualPayments.instant')}</span>
                </div>
                <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-bold text-primary transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"><Plus className="size-3.5" />{t('manualPayments.add')}</span>
              </button>
            ))}
          </div>
        </div>
      </div> : <div className="mt-5 flex flex-col gap-4 border-t border-b border-border py-9 sm:flex-row sm:items-center sm:gap-6">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-muted text-muted-foreground">{filter === 'active' ? <CircleCheck className="size-5" /> : filter === 'paused' ? <Pause className="size-5" /> : <WalletCards className="size-5" />}</span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold">{t('manualPayments.emptyFilter')}</h3>
          <p className="mt-1 text-xs leading-6 text-muted-foreground sm:text-sm">{t('manualPayments.emptyFilterDescription')}</p>
        </div>
        <Button variant="outline" className={`${buttonClass} shrink-0`} onClick={() => setFilter('all')}><WalletCards />{t('manualPayments.all')}</Button>
      </div>}
    </section>}
    <section className="mt-10 pt-8" aria-label={t('manualPayments.howTitle')}>
      <ol className="relative grid gap-8 sm:grid-cols-3 sm:gap-6">
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-6 hidden border-t border-dashed border-primary/25 sm:block" />
        {[1, 2, 3].map((step) => (
          <li key={step} className="group relative flex flex-col items-start gap-3 sm:items-center sm:text-center">
            <span className="relative z-10 grid size-12 shrink-0 place-items-center rounded-full border-2 border-primary/20 bg-card text-sm font-bold text-primary shadow-sm transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-lg group-hover:shadow-primary/25">
              <span className="transition-all duration-200 group-hover:scale-0 group-hover:opacity-0">0{step}</span>
              <Check className="absolute size-5 scale-0 opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100" />
            </span>
            <div className="sm:max-w-52">
              <h3 className="text-sm font-bold">{t(`manualPayments.step${step}`)}</h3>
              <p className="mt-1.5 text-xs leading-6 text-muted-foreground">{t(`manualPayments.step${step}Description`)}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>

    <Dialog open={Boolean(editor)} onOpenChange={(open) => { if (!open && !busy) { setEditor(null); setError('') } }}>
      <DialogContent showCloseButton={false} className="max-h-[90dvh] overflow-y-auto rounded-3xl border border-border bg-card p-5 motion-reduce:animate-none sm:max-w-2xl sm:p-7">
        <DialogHeader className="relative -m-5 mb-0 overflow-hidden rounded-t-3xl border-b border-border/60 bg-gradient-to-br from-primary/15 via-primary/[0.05] to-transparent p-5 sm:-m-7 sm:mb-0 sm:p-7">
          <span className="pointer-events-none absolute -end-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" />
          <div className="relative flex items-center gap-3.5">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10"><WalletCards className="size-6" /></span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="font-sans text-xl font-bold normal-case tracking-normal">{t(editor?.id === undefined ? 'manualPayments.createTitle' : 'manualPayments.editTitle')}</DialogTitle>
              <DialogDescription className="mt-0.5 text-xs leading-5 sm:text-sm">{t(editor?.id === undefined ? 'manualPayments.createDescription' : 'manualPayments.editDescription')}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        {editor && <form onSubmit={submit} noValidate className="grid gap-5">
          {error && <Notice message={error} />}
          <div className="grid gap-6 sm:grid-cols-[minmax(0,15rem)_1fr]">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/8 via-card to-transparent p-5">
              <div className="flex items-center justify-between gap-2">
                <ProviderLogo type={editor.type} className="shadow-sm" />
                <span className="flex h-12 items-center px-1 text-[10px] font-bold text-muted-foreground">
                  {t(editor.id === undefined ? 'manualPayments.previewStatus' : editor.isActive ? 'manualPayments.active' : 'manualPayments.paused')}
                </span>
              </div>
              <p className="mt-6 text-xs font-bold text-muted-foreground">{t(`manualPayments.${editor.type}`)}</p>
              <p dir={editor.accountIdentifier.trim() ? 'ltr' : undefined} className={`mt-2 text-lg font-bold ${editor.accountIdentifier.trim() ? 'break-all font-mono' : 'font-sans text-muted-foreground'}`}>
                {editor.accountIdentifier.trim() || t('manualPayments.previewPlaceholder')}
              </p>
              <div className="mt-6 border-t border-border/60 pt-4">
                <p className="flex items-start gap-2.5 text-[11px] leading-5 font-medium text-muted-foreground/90">
                  <span className="relative mt-1 flex size-2 shrink-0">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/40 motion-reduce:animate-none" />
                    <span className="relative inline-flex size-2 rounded-full bg-primary" />
                  </span>
                  {t('manualPayments.previewNote')}
                </p>
              </div>
            </div>

            <div className="grid content-start gap-5">
              <div>
                <p className="mb-2 text-xs font-bold text-foreground/80">{t(editor.id === undefined ? 'manualPayments.choose' : 'manualPayments.immutable')}</p>
                {editor.id === undefined ? (
                  <div role="radiogroup" aria-label={t('manualPayments.choose')} className="inline-flex rounded-xl border border-border bg-muted/40 p-1">
                    {providerTypes.map((type) => {
                      const selected = editor.type === type
                      return (
                        <button key={type} type="button" role="radio" aria-checked={selected} onClick={() => { if (selected) return; setEditor({ ...editor, type, accountIdentifier: '' }); setError(''); setFormInvalid(false) }} className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${selected ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                          {t(`manualPayments.${type}`)}
                        </button>
                      )
                    })}
                  </div>
                ) : <p className="text-sm font-bold">{t(`manualPayments.${editor.type}`)}</p>}
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{t(editor.type === 'VodafoneCash' ? 'manualPayments.wallet' : 'manualPayments.instant')}</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="payment-identifier" className="text-xs font-semibold text-foreground/80">{t(editor.type === 'VodafoneCash' ? 'manualPayments.phoneLabel' : 'manualPayments.addressLabel')}</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-muted-foreground">{editor.type === 'VodafoneCash' ? <Smartphone className="size-4" /> : <Landmark className="size-4" />}</span>
                  <Input ref={inputRef} id="payment-identifier" autoFocus dir="ltr" autoComplete="off" spellCheck={false} inputMode={editor.type === 'VodafoneCash' ? 'tel' : 'text'} value={editor.accountIdentifier} maxLength={100} disabled={busy} aria-invalid={formInvalid} aria-describedby="payment-identifier-hint" className="h-12 rounded-xl bg-background/40 ps-11 focus-visible:border-primary/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:ring-destructive/20" placeholder={t(editor.type === 'VodafoneCash' ? 'manualPayments.phonePlaceholder' : 'manualPayments.addressPlaceholder')} onChange={(event) => { setEditor({ ...editor, accountIdentifier: event.target.value }); setFormInvalid(false); setError('') }} />
                </div>
                <p id="payment-identifier-hint" className="text-xs leading-6 font-semibold text-muted-foreground">{t(editor.type === 'VodafoneCash' ? 'manualPayments.phoneHint' : 'manualPayments.addressHint')}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-3"><Button type="button" variant="outline" className={buttonClass} disabled={busy} onClick={() => { setEditor(null); setError('') }}><X />{t('manualPayments.cancel')}</Button><Button type="submit" className={buttonClass} disabled={!canChange || unchanged}>{busy ? <LoaderCircle className={spinnerClass} /> : editor.id === undefined ? <Plus /> : <Save />}{t(editor.id === undefined ? 'manualPayments.create' : 'manualPayments.save')}</Button></div>
        </form>}
      </DialogContent>
    </Dialog>
    <ConfirmationDialog open={Boolean(confirmation)} onOpenChange={(open) => { if (!open && !busy) { setConfirmation(null); setError('') } }} title={t(confirmation?.hasHistory ? 'manualPayments.historyTitle' : 'manualPayments.deleteTitle')} description={confirmation?.hasHistory ? t(confirmation.method.isActive ? 'manualPayments.historyDescription' : 'manualPayments.historyPaused') : t('manualPayments.deleteDescription', { account: confirmation?.method.accountIdentifier })} confirmLabel={t(confirmation?.hasHistory ? confirmation.method.isActive ? 'manualPayments.pause' : 'manualPayments.close' : 'manualPayments.delete')} cancelLabel={t('manualPayments.keep')} pending={busy} destructive={!confirmation?.hasHistory} error={error} onConfirm={() => { if (!confirmation) return; if (confirmation.hasHistory && !confirmation.method.isActive) { setConfirmation(null); return }; act({ kind: confirmation.hasHistory ? 'toggle' : 'delete', method: confirmation.method }) }} />
  </>
}
