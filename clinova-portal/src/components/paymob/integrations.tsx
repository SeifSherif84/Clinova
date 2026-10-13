import { useQueryClient } from '@tanstack/react-query'
import { CircleCheck, CreditCard, Hash, Info, Link2, LoaderCircle, Plus, Smartphone, TriangleAlert, WalletCards, X, type LucideIcon } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import Notice from '@/components/notice'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApi } from '@/hooks/use-api'
import { paymobQueryKey } from '@/hooks/use-paymob-configuration'
import { ApiError } from '@/lib/api'
import type { PaymobPaymentMethod, SavedPaymobConfiguration } from '@/lib/paymob-configuration'
import { paymobButtonClass } from './setup-section'

const methods: PaymobPaymentMethod[] = ['Card', 'Wallet']
const methodIcons: Record<PaymobPaymentMethod, LucideIcon> = { Card: CreditCard, Wallet: Smartphone }
const spinnerClass = 'size-4 animate-spin motion-reduce:animate-none'

export function PaymobIntegrations({ clinicId, account, refreshing }: { clinicId: string; account: SavedPaymobConfiguration; refreshing: boolean }) {
  const { t } = useTranslation()
  const api = useApi()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<PaymobPaymentMethod>('Card')
  const [integrationId, setIntegrationId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [invalid, setInvalid] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const lock = useRef(false)
  // The backend links each payment method once per account; inactive integrations still reserve their method.
  const available = methods.filter((method) => !account.integrations.some((item) => item.paymentMethod === method))
  const method = available.includes(selected) ? selected : available[0]
  // A refreshed account can remove the selected method; never reuse its ID for another method.
  const enteredId = method === selected ? integrationId : ''
  const disabled = account.status === 'Disabled'
  const canAdd = !disabled && available.length > 0
  const activeCount = account.integrations.filter((item) => item.isActive).length
  const editorOpen = open && canAdd && Boolean(method)

  function openEditor(next?: PaymobPaymentMethod) {
    if (!canAdd) return
    setSelected(next && available.includes(next) ? next : available[0])
    setIntegrationId(''); setError(''); setInvalid(false); setSuccess(''); setOpen(true)
  }
  function closeEditor() {
    if (busy) return
    setOpen(false); setError(''); setInvalid(false)
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (lock.current || refreshing || !canAdd || !method) return
    const value = enteredId.trim()
    const id = Number(value)
    if (!/^[0-9]+$/.test(value) || !Number.isInteger(id) || id < 1 || id > 2147483647) {
      setError('integrationsInvalid'); setInvalid(true); input.current?.focus(); return
    }
    lock.current = true; setBusy(true); setError(''); setInvalid(false)
    try {
      await api.request<unknown>('/api/integrations/online-payment-accounts/' + account.accountId + '/clinics/' + Number(clinicId), {
        method: 'POST', body: JSON.stringify({ paymentMethod: method === 'Card' ? 1 : 2, integrationId: id }),
      }, { notifyOnError: false })
      setIntegrationId(''); setOpen(false); setSuccess(t('paymob.integrationSaved'))
      await queryClient.invalidateQueries({ queryKey: paymobQueryKey(clinicId) })
    } catch (failure) {
      setError(failure instanceof ApiError && failure.status === 403 ? 'integrationsAccessError' : 'integrationsError')
      if (failure instanceof ApiError && [400, 403, 404].includes(failure.status)) await queryClient.invalidateQueries({ queryKey: paymobQueryKey(clinicId) })
    } finally { lock.current = false; setBusy(false) }
  }

  return <section id="paymob-integrations" aria-labelledby="paymob-integrations-title" className="mt-8 scroll-mt-28">
    {success && <Notice tone="success" message={success} />}
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"><WalletCards className="size-5" /></span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="paymob-integrations-title" tabIndex={-1} className="font-sans text-xl font-bold normal-case tracking-normal">{t('paymob.integrationsTitle')}</h2>
            <span className="rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 text-[10px] font-bold tabular-nums text-primary">{t('paymob.integrationsCount', { count: account.integrations.length })}</span>
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-6 text-muted-foreground sm:text-sm">{t('paymob.integrationsDescription')}</p>
        </div>
      </div>
      {canAdd && account.integrations.length > 0 && <Button className={paymobButtonClass} disabled={busy || refreshing} onClick={() => openEditor()}>{refreshing ? <LoaderCircle className={spinnerClass} /> : <Plus />}{t('paymob.addIntegration')}</Button>}
    </div>

    {disabled && <Alert role="note" className="mt-5 rounded-xl border-border bg-muted/40"><Info /><AlertDescription className="leading-6">{t('paymob.integrationsDisabled')}</AlertDescription></Alert>}
    {!disabled && account.integrations.length > 0 && !activeCount && <Alert role="note" className="mt-5 rounded-xl border-warm/20 bg-warm/10"><TriangleAlert className="text-warm" /><AlertTitle className="font-bold">{t('paymob.integrationsInactiveTitle')}</AlertTitle><AlertDescription className="leading-6">{t('paymob.integrationsNeeded')}</AlertDescription></Alert>}
    {error && !editorOpen && <Alert role="alert" variant="destructive" className="mt-5 rounded-xl border-destructive/20 bg-destructive/5"><TriangleAlert /><AlertDescription className="leading-6">{t('paymob.' + error)}</AlertDescription></Alert>}

    {account.integrations.length ? <>
      <ul className="mt-5 grid gap-3 md:grid-cols-2">{account.integrations.map((integration) => {
        const Icon = methodIcons[integration.paymentMethod]
        return <li key={integration.id} className="flex min-w-0 items-center gap-4 rounded-2xl border border-border/60 bg-background/45 p-4 transition-colors hover:border-primary/30 hover:bg-primary/5 motion-reduce:transition-none">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold">{t('paymob.method.' + integration.paymentMethod)}</h3>
              <span className={'rounded-full border px-2.5 py-1 text-[10px] font-bold ' + (integration.isActive ? 'border-primary/20 bg-primary/10 text-primary' : 'border-warm/20 bg-warm/10 text-warm')}>{t(integration.isActive ? 'paymob.integrationActive' : 'paymob.integrationInactive')}</span>
            </div>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('paymob.integrationId')}</p>
            <p dir="ltr" className="truncate text-start font-mono text-sm font-bold">{integration.integrationId}</p>
          </div>
        </li>
      })}</ul>
      {!disabled && !available.length && <p className="mt-4 flex items-start gap-2 text-xs leading-6 font-bold text-muted-foreground"><CircleCheck className="mt-1 size-3.5 shrink-0 text-primary" />{t('paymob.integrationsComplete')}</p>}
    </> : <div className="mt-5 rounded-3xl border border-dashed border-primary/25 bg-gradient-to-br from-primary/5 via-card to-warm/5 p-6 text-center sm:p-10">
      <div className="relative mx-auto grid size-20 place-items-center">
        <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-3xl bg-primary/10 motion-reduce:animate-none" />
        <span className="relative grid size-20 place-items-center rounded-3xl bg-primary/10 text-primary shadow-inner"><Link2 className="size-9" /></span>
      </div>
      <h3 className="mt-6 font-heading text-2xl font-bold sm:text-3xl">{t('paymob.integrationsEmptyTitle')}</h3>
      <p className="mx-auto mt-3 max-w-lg text-xs leading-6 text-muted-foreground sm:text-sm">{t(disabled ? 'paymob.integrationsDisabled' : 'paymob.integrationsNeeded')}</p>
      {!disabled && <div className="mx-auto mt-7 grid max-w-xl gap-3 text-start sm:grid-cols-2">{methods.map((value) => {
        const Icon = methodIcons[value]
        return <button key={value} type="button" disabled={busy || refreshing} onClick={() => openEditor(value)} aria-label={t('paymob.addMethodIntegration', { method: t('paymob.method.' + value) })} className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 text-start transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-60 motion-reduce:transition-none">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15"><Icon className="size-5" /></span>
          <span className="min-w-0 flex-1">
            <strong className="block text-sm font-bold">{t('paymob.method.' + value)}</strong>
            <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{t('paymob.methodHint.' + value)}</span>
          </span>
          <Plus className="size-4 shrink-0 text-primary" />
        </button>
      })}</div>}
    </div>}

    <Dialog open={editorOpen} onOpenChange={(next) => { if (!next) closeEditor() }}>
      <DialogContent showCloseButton={false} className="max-h-[90dvh] overflow-y-auto rounded-3xl border border-border bg-card p-5 motion-reduce:animate-none sm:max-w-lg sm:p-7">
        <DialogHeader className="relative -m-5 mb-0 overflow-hidden rounded-t-3xl border-b border-border/60 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-5 sm:-m-7 sm:mb-0 sm:p-7">
          <span aria-hidden="true" className="pointer-events-none absolute -end-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" />
          <div className="relative flex items-center gap-3.5">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-primary/10"><Link2 className="size-6" /></span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="font-sans text-xl font-bold normal-case tracking-normal">{t(account.integrations.length ? 'paymob.addAnotherIntegrationTitle' : 'paymob.addFirstIntegrationTitle')}</DialogTitle>
              <DialogDescription className="mt-0.5 text-xs leading-5 sm:text-sm">{t('paymob.addIntegrationDescription')}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        {method && <form noValidate onSubmit={submit} className="grid gap-5">
          {error && <Alert role="alert" variant="destructive" className="rounded-xl border-destructive/20 bg-destructive/5"><TriangleAlert /><AlertDescription className="leading-6">{t('paymob.' + error)}</AlertDescription></Alert>}
          <div>
            <p id="paymob-method-label" className="mb-2 text-xs font-semibold text-foreground/80">{t('paymob.paymentMethod')}</p>
            <div role="radiogroup" aria-labelledby="paymob-method-label" className="inline-flex flex-wrap rounded-xl border border-border bg-muted/40 p-1">
              {methods.map((value) => {
                const checked = method === value
                const linked = !available.includes(value)
                const Icon = methodIcons[value]
                return <button key={value} type="button" role="radio" aria-checked={checked} disabled={linked || busy || refreshing} onClick={() => { if (checked) return; setSelected(value); setIntegrationId(''); setError(''); setInvalid(false) }}
                  className={'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed ' + (checked ? 'bg-card text-foreground shadow-sm' : linked ? 'text-muted-foreground/60' : 'text-muted-foreground hover:text-foreground')}>
                  <Icon className="size-4" />{t('paymob.method.' + value)}{linked && <span className="text-[10px] font-bold uppercase tracking-wider">· {t('paymob.methodLinked')}</span>}
                </button>
              })}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="paymob-integration-id" className="text-xs font-semibold normal-case tracking-normal text-foreground/80">{t('paymob.integrationId')}</Label>
            <div className="relative">
              <Hash aria-hidden="true" className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input ref={input} id="paymob-integration-id" autoFocus inputMode="numeric" dir="ltr" autoComplete="off" spellCheck={false} value={enteredId} disabled={busy || refreshing} aria-invalid={invalid || undefined} aria-describedby="paymob-integration-hint"
                placeholder={t('paymob.integrationIdPlaceholder')}
                className="h-12 rounded-xl border border-input bg-background/40 ps-11 focus-visible:border-primary/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20"
                onChange={(event) => { setSelected(method); setIntegrationId(event.target.value); setInvalid(false); setError('') }} />
            </div>
            <p id="paymob-integration-hint" className="text-xs leading-6 text-muted-foreground">{t('paymob.integrationIdHint')}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <Button type="button" variant="outline" className={paymobButtonClass} disabled={busy} onClick={closeEditor}><X />{t('paymob.cancelIntegration')}</Button>
            <Button type="submit" className={paymobButtonClass} disabled={busy || refreshing} aria-busy={busy}>{busy || refreshing ? <LoaderCircle className={spinnerClass} /> : <Link2 />}{t('paymob.linkIntegration')}</Button>
          </div>
        </form>}
      </DialogContent>
    </Dialog>
  </section>
}
