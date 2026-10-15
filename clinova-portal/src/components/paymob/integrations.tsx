import { useQueryClient } from '@tanstack/react-query'
import { ArrowRight, CircleCheck, Hash, Info, Link2, LoaderCircle, Plus, TriangleAlert, WalletCards, X } from 'lucide-react'
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
const spinnerClass = 'size-4 animate-spin motion-reduce:animate-none'

function MethodLogo({ method, className = '' }: { method: PaymobPaymentMethod; className?: string }) {
  return <span aria-hidden="true" className={`relative flex h-12 w-24 shrink-0 items-center justify-start ${className}`}>
    <img src={`/payment-integration-method/${method === 'Card' ? 'Visa' : 'Wallet7'}.png`} alt="" className={`${method === 'Card' ? 'h-8' : 'h-16'} max-w-full object-contain mix-blend-multiply dark:rounded-lg dark:mix-blend-normal`} />
  </span>
}

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
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/25"><WalletCards className="size-5" /></span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="paymob-integrations-title" tabIndex={-1} className="font-sans text-xl font-bold normal-case tracking-normal">{t('paymob.integrationsTitle')}</h2>
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-6 text-muted-foreground sm:text-sm">{t('paymob.integrationsDescription')}</p>
        </div>
      </div>
      {canAdd && account.integrations.length > 0 && <Button className={paymobButtonClass} disabled={busy || refreshing} onClick={() => openEditor()}>{refreshing ? <LoaderCircle className={spinnerClass} /> : <Plus />}{t('paymob.addIntegration')}</Button>}
    </div>

    {disabled && <Alert role="note" className="mt-5 rounded-xl border-border bg-muted/40"><Info /><AlertDescription className="leading-6">{t('paymob.integrationsDisabled')}</AlertDescription></Alert>}
    {!disabled && account.integrations.length > 0 && !activeCount && <Alert role="note" className="mt-5 rounded-xl border-warm/20 bg-warm/10"><TriangleAlert className="text-warm" /><AlertTitle className="font-bold">{t('paymob.integrationsInactiveTitle')}</AlertTitle><AlertDescription className="leading-6">{t('paymob.integrationsNeeded')}</AlertDescription></Alert>}
    {error && !editorOpen && <Notice message={t('paymob.' + error)} />}

    {account.integrations.length ? <>
      <ul className="mt-5 grid gap-3">{account.integrations.map((integration) => (
        <li key={integration.id} className="group relative flex min-w-0 items-center gap-4 overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg motion-reduce:transition-none sm:p-5">
          <span aria-hidden="true" className="flex h-12 w-24 shrink-0 items-center justify-center">
            <img src={`/payment-integration-method/${integration.paymentMethod === 'Card' ? 'Visa' : 'Wallet7'}.png`} alt="" className={`${integration.paymentMethod === 'Card' ? 'h-8' : 'h-16'} max-w-full object-contain mix-blend-multiply dark:rounded-lg dark:mix-blend-normal`} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold">{t('paymob.method.' + integration.paymentMethod)}</h3>
              <span className="flex items-center gap-2 text-xs font-bold">
                <span className="relative inline-flex aspect-square size-2 shrink-0 items-center justify-center">
                  {integration.isActive && <span className="absolute inset-0 aspect-square animate-ping rounded-full bg-primary/50 motion-reduce:animate-none" />}
                  <span className={`aspect-square size-2 shrink-0 rounded-full ${integration.isActive ? 'bg-primary' : 'bg-muted-foreground/50'}`} />
                </span>
                <span className={integration.isActive ? 'text-primary' : 'text-muted-foreground'}>{t(integration.isActive ? 'paymob.integrationActive' : 'paymob.integrationInactive')}</span>
              </span>
            </div>
            <span dir="ltr" title={t('paymob.integrationId')} className="mt-2 inline-flex max-w-full items-center gap-2 rounded-lg bg-muted/50 px-2.5 py-1.5 text-start font-mono text-sm font-bold">
              <span className="truncate">{integration.integrationId}</span>
            </span>
          </div>
        </li>
      ))}</ul>
      {!disabled && !available.length && <p className="mt-4 flex items-start gap-2 text-xs leading-6 font-bold text-muted-foreground"><CircleCheck className="mt-1 size-3.5 shrink-0 text-primary" />{t('paymob.integrationsComplete')}</p>}
    </> : <div className="mt-5 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-muted/40 to-transparent">
      <div className={`grid gap-8 p-6 sm:p-10 ${disabled ? '' : 'lg:grid-cols-[1.1fr_1fr] lg:items-center'}`}>
        <div>
          <h3 className="max-w-sm font-sans text-3xl leading-[1.15] font-bold sm:text-4xl">{t('paymob.integrationsEmptyTitle')}</h3>
          <p className="mt-4 max-w-sm text-sm leading-7 text-muted-foreground">{t(disabled ? 'paymob.integrationsDisabled' : 'paymob.integrationsNeeded')}</p>
          {!disabled && <p className="mt-6 hidden items-center gap-2.5 text-xs font-bold text-primary/70 lg:flex">
            <span className="h-px w-9 bg-primary/25" />
            {t('paymob.integrationsHint', { defaultValue: 'Pick a method to begin' })}
            <ArrowRight className="size-3.5 rtl:rotate-180" />
          </p>}
        </div>
        {!disabled && <div className="grid gap-3 sm:grid-cols-2">{methods.map((value) => (
          <button key={value} type="button" disabled={busy || refreshing} onClick={() => openEditor(value)} aria-label={t('paymob.addMethodIntegration', { method: t('paymob.method.' + value) })} className="group flex flex-col items-start gap-4 rounded-2xl border border-border bg-card p-5 text-start transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg disabled:pointer-events-none disabled:opacity-60">
              <img src={`/payment-integration-method/${value === 'Card' ? 'Visa' : 'Wallet7'}.png`} alt="" className="size-14 object-contain mix-blend-multiply dark:rounded-xl dark:mix-blend-normal" />
            <div>
              <strong className="block text-sm font-bold">{t('paymob.method.' + value)}</strong>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">{t('paymob.methodHint.' + value)}</span>
            </div>
            <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-bold text-primary transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"><Plus className="size-3.5" />{t('paymob.addIntegration')}</span>
          </button>
        ))}</div>}
      </div>
    </div>}

    <Dialog open={editorOpen} onOpenChange={(next) => { if (!next) closeEditor() }}>
      <DialogContent showCloseButton={false} className="max-h-[90dvh] overflow-y-auto rounded-3xl border border-border bg-card p-5 motion-reduce:animate-none sm:max-w-2xl sm:p-7">
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
          {error && <Notice message={t('paymob.' + error)} />}
          <div className="grid gap-6 sm:grid-cols-[minmax(0,15rem)_1fr]">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/8 via-card to-transparent p-5">
              <div className="flex items-center">
                <MethodLogo method={method} />
              </div>
              <p className="mt-6 text-xs font-bold text-muted-foreground">{t('paymob.method.' + method)}</p>
              <p dir={enteredId.trim() ? 'ltr' : undefined} className={`mt-2 text-lg font-bold ${enteredId.trim() ? 'break-all font-mono' : 'font-sans text-muted-foreground'}`}>
                {enteredId.trim() || t('paymob.previewPlaceholder', { defaultValue: 'Your Integration ID' })}
              </p>
              <div className="mt-6 border-t border-border/60 pt-4">
                <p className="flex items-start gap-2.5 text-[11px] leading-5 font-medium text-muted-foreground/90">
                  <span className="relative mt-1 flex size-2 shrink-0">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/40 motion-reduce:animate-none" />
                    <span className="relative inline-flex size-2 rounded-full bg-primary" />
                  </span>
                  {t('paymob.previewNote', { defaultValue: 'Use the Integration ID for this method from your Paymob dashboard, not the Merchant ID.' })}
                </p>
              </div>
            </div>

            <div className="grid content-start gap-5">
              <div>
                <p id="paymob-method-label" className="mb-2 text-xs font-bold text-foreground/80">{t('paymob.paymentMethod')}</p>
                <div role="radiogroup" aria-labelledby="paymob-method-label" className="inline-flex flex-wrap rounded-xl border border-border bg-muted/40 p-1">
                  {methods.map((value) => {
                    const checked = method === value
                    const linked = !available.includes(value)
                    return <button key={value} type="button" role="radio" aria-checked={checked} disabled={linked || busy || refreshing} onClick={() => { if (checked) return; setSelected(value); setIntegrationId(''); setError(''); setInvalid(false) }}
                      className={'rounded-lg px-4 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed ' + (checked ? 'bg-card text-foreground shadow-sm' : linked ? 'text-muted-foreground/60' : 'text-muted-foreground hover:text-foreground')}>
                      {t('paymob.method.' + value)}{linked && <span className="text-[10px] font-bold uppercase tracking-wider"> · {t('paymob.methodLinked')}</span>}
                    </button>
                  })}
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{t('paymob.methodHint.' + method)}</p>
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
                <p id="paymob-integration-hint" className="text-xs leading-6 font-semibold text-muted-foreground">{t('paymob.integrationIdHint')}</p>
              </div>
            </div>
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
