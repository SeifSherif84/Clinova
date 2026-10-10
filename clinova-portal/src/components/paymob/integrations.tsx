import { useQueryClient } from '@tanstack/react-query'
import { CreditCard, LoaderCircle, Plus, WalletCards } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import Notice from '@/components/notice'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useApi } from '@/hooks/use-api'
import { paymobQueryKey } from '@/hooks/use-paymob-configuration'
import { ApiError } from '@/lib/api'
import type { PaymobPaymentMethod, SavedPaymobConfiguration } from '@/lib/paymob-configuration'
import { SetupSection, paymobButtonClass } from './setup-section'

const methods: PaymobPaymentMethod[] = ['Card', 'Wallet']
export function PaymobIntegrations({ clinicId, account, refreshing }: { clinicId: string; account: SavedPaymobConfiguration; refreshing: boolean }) {
  const { t } = useTranslation()
  const api = useApi()
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<PaymobPaymentMethod>('Card')
  const [integrationId, setIntegrationId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const lock = useRef(false)
  // Inactive integrations also reserve their method; adding them again is rejected.
  const available = methods.filter((method) => !account.integrations.some((item) => item.paymentMethod === method))
  const method = available.includes(selected) ? selected : available[0]
  // A refreshed account can remove the selected method; never reuse its ID for another method.
  const enteredId = method === selected ? integrationId : ''
  const disabled = account.status === 'Disabled'
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (lock.current || refreshing || disabled || !method) return
    setSuccess(false)
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
      setIntegrationId(''); setSuccess(true)
      await queryClient.invalidateQueries({ queryKey: paymobQueryKey(clinicId) })
    } catch (failure) {
      setError(failure instanceof ApiError && failure.status === 403 ? 'integrationsAccessError' : 'integrationsError')
      if (failure instanceof ApiError && [400, 403, 404].includes(failure.status)) await queryClient.invalidateQueries({ queryKey: paymobQueryKey(clinicId) })
    } finally { lock.current = false; setBusy(false) }
  }
  return <SetupSection id="paymob-integrations" icon={WalletCards} title={t('paymob.integrationsTitle')} description={t('paymob.integrationsDescription')}>
    {account.integrations.length ? <ul className="mb-5 grid gap-3 sm:grid-cols-2">{account.integrations.map((integration) => <li key={integration.id} className="flex min-w-0 flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
      {integration.paymentMethod === 'Card' ? <CreditCard className="size-5 text-primary" /> : <WalletCards className="size-5 text-primary" />}
      <div className="min-w-0 flex-1"><p className="text-sm font-bold">{t('paymob.method.' + integration.paymentMethod)}</p><p className="mt-1 text-xs text-muted-foreground">{t('paymob.integrationId')}: <span dir="ltr" className="font-bold">{integration.integrationId}</span></p></div>
      <Badge className={'rounded-full border px-2.5 py-1 text-[10px] font-bold ' + (integration.isActive ? 'border-primary/20 bg-primary/10 text-primary' : 'border-warm/20 bg-warm/10 text-warm')}>{t(integration.isActive ? 'paymob.integrationActive' : 'paymob.integrationInactive')}</Badge>
    </li>)}</ul> : <p className="mb-5 text-sm text-muted-foreground">{t('paymob.integrationsEmpty')}</p>}
    {success && <><Notice tone="success" message={t('paymob.integrationSaved')} /><p role="status" className="mb-4 text-sm font-bold text-primary">{t('paymob.integrationSaved')}</p></>}
    {error && <><Notice message={t('paymob.' + error)} /><p role="alert" className="mb-4 text-sm text-muted-foreground">{t('paymob.' + error)}</p></>}
    {disabled ? <p className="text-sm text-muted-foreground">{t('paymob.integrationsDisabled')}</p> : method ? <form noValidate onSubmit={submit} className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid content-start gap-2"><Label htmlFor="paymob-method" className="text-xs font-semibold text-foreground/80">{t('paymob.paymentMethod')}</Label>
          <Select value={method} disabled={busy || refreshing} onValueChange={(value) => { if (value) { setSelected(value as PaymobPaymentMethod); setIntegrationId(''); setError(''); setSuccess(false) } }}>
            <SelectTrigger id="paymob-method" className="h-12 w-full rounded-xl border border-input bg-background/40 px-3"><SelectValue>{t('paymob.method.' + method)}</SelectValue></SelectTrigger>
            <SelectContent>{available.map((value) => <SelectItem key={value} value={value}>{t('paymob.method.' + value)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid gap-2"><Label htmlFor="paymob-integration-id" className="text-xs font-semibold text-foreground/80">{t('paymob.integrationId')}</Label>
          <Input ref={input} id="paymob-integration-id" inputMode="numeric" dir="ltr" autoComplete="off" value={enteredId} disabled={busy || refreshing} aria-invalid={invalid} aria-describedby="paymob-integration-hint" className="h-12 rounded-xl border border-input bg-background/40 px-3" onChange={(event) => { if (method) setSelected(method); setIntegrationId(event.target.value); setInvalid(false); setError(''); setSuccess(false) }} />
          <p id="paymob-integration-hint" className="text-xs leading-6 text-muted-foreground">{t('paymob.integrationIdHint')}</p>
        </div>
      </div>
      <Button type="submit" disabled={busy || refreshing} className={paymobButtonClass + ' w-fit'}>{busy || refreshing ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <Plus />}{t('paymob.addIntegration')}</Button>
    </form> : <p className="text-sm text-muted-foreground">{t('paymob.integrationsComplete')}</p>}
  </SetupSection>
}
