import { Link } from '@tanstack/react-router'
import { BookOpen, CreditCard, Info, Link2, PencilLine, Power, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import type { PaymobStatusMetadata } from '@/lib/paymob-configuration'
import { paymobButtonClass } from './setup-section'

const statusCopy = {
  NotConfigured: ['notConnected', 'notConnectedDescription'],
  Connected: ['connected', 'connectedDescription'],
  NeedsAttention: ['needsAttention', 'needsAttentionDescription'],
  Disabled: ['disabled', 'disabledDescription'],
} as const

export function PaymobSettingsRow({ clinicId, configuration }: { clinicId: string; configuration: PaymobStatusMetadata }) {
  const { t, i18n } = useTranslation()
  const { status, issueCode, lastUpdatedAt } = configuration
  const [label, description] = statusCopy[status]
  const attention = status === 'NeedsAttention'
  const connected = status === 'Connected'
  const notConfigured = status === 'NotConfigured'
  const color = attention ? 'border-warm/20 bg-warm/5 text-warm' : connected ? 'border-primary/20 bg-primary/5 text-primary' : 'border-border bg-muted/30 text-muted-foreground'
  // Even a recognized issue code is ignored unless the backend reports NeedsAttention.
  const issue = attention ? issueCode : undefined
  const issueHash = issue === 'HmacVerificationFailed' ? 'paymob-hmacSecret-section' : issue === 'InvalidIntegration' ? 'paymob-cardIntegrationId-section' : undefined

  if (notConfigured) {
    return <section aria-label="Paymob" className="border-y border-border py-6">
      <div className="relative isolate overflow-hidden rounded-3xl border border-primary/10 bg-card">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
        <div aria-hidden="true" className="pointer-events-none absolute -end-20 -top-20 -z-10 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-[1.2fr_auto]">
          <div>
            <h2 className="font-sans text-3xl leading-tight font-bold sm:text-4xl">{t('paymob.heroTitle')}</h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground">{t('paymob.heroDescription')}</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button role="link" className={paymobButtonClass + ' h-auto min-h-11 whitespace-normal px-5'} render={<Link to="/doctor/clinics/$clinicId/payments/paymob/connect" params={{ clinicId }} />}><Link2 />{t('paymob.navigation')}</Button>
              <Button role="link" variant="ghost" className={paymobButtonClass + ' h-auto min-h-11 whitespace-normal px-3'} render={<Link to="/doctor/clinics/$clinicId/payments/paymob/guide" params={{ clinicId }} />}><BookOpen />{t('paymob.howItWorks')}</Button>
            </div>
            <p className="mt-6 flex items-center gap-2.5 text-xs font-bold text-primary/70">
              <span className="h-px w-9 bg-primary/25" />
              <span className="inline-flex items-center gap-1.5">{t('paymob.heroHint')}<Link2 className="size-3.5 shrink-0 rtl:rotate-180" /></span>
            </p>
          </div>
          <div className="group grid w-56 shrink-0 justify-self-center rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg sm:justify-self-end">
            <span aria-hidden="true" className="flex h-14 w-24 shrink-0 items-center justify-center justify-self-center overflow-hidden rounded-xl border border-border/40 bg-white shadow-sm">
              <img src="/payment-providers/paymob2.png" alt="" className="h-11 w-auto" />
            </span>
            <strong className="mt-4 block text-sm font-bold">Paymob</strong>
            <span className="mt-1 block text-xs leading-5 text-muted-foreground">Online account</span>
          </div>
        </div>
      </div>
    </section>
  }

  return <section aria-label="Paymob" className="border-y border-border py-6">
    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="flex items-center gap-2 font-sans text-xl font-bold"><CreditCard className="size-5 text-primary" />Paymob</h2>
          <span className={'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ' + color}><span aria-hidden="true" className="size-1.5 rounded-full bg-current" />{t('paymob.' + label)}</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{t('paymob.' + description)}</p>
        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-xs">
          {[['paymentMethod', t('paymob.card')]].map(([key, value]) => <div key={key}><dt className="text-muted-foreground">{t('paymob.' + key)}</dt><dd className="mt-1 font-bold">{value}</dd></div>)}
          {lastUpdatedAt && <div><dt className="text-muted-foreground">{t('paymob.lastUpdated')}</dt><dd className="mt-1 font-bold"><time dateTime={lastUpdatedAt}>{new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(lastUpdatedAt))}</time></dd></div>}
        </dl>
      </div>
      <div className="flex shrink-0 flex-wrap items-start gap-2 xl:max-w-sm xl:justify-end">
        {status === 'Disabled' ? <UnavailableAction enable />
          : <Button role="link" variant={attention ? 'default' : 'outline'} className={paymobButtonClass + ' h-auto min-h-11 whitespace-normal px-4'} render={<Link to="/doctor/clinics/$clinicId/payments/paymob/manage" params={{ clinicId }} />}><PencilLine />{t(attention ? 'paymob.reviewSettings' : 'paymob.manage')}</Button>}
        <Button role="link" variant="ghost" className={paymobButtonClass + ' h-auto min-h-11 whitespace-normal px-3'} render={<Link to="/doctor/clinics/$clinicId/payments/paymob/guide" params={{ clinicId }} />}><BookOpen />{t(attention ? 'paymob.viewSetupGuide' : 'paymob.setupGuide')}</Button>
        {connected && <UnavailableAction />}
      </div>
    </div>
    {(connected || status === 'Disabled') && <p className="mt-4 text-xs leading-6 text-muted-foreground">{t('paymob.ux.unavailableControls')}</p>}
    {connected && <p className="mt-4 text-xs leading-6 text-muted-foreground">{t('paymob.savedMeaning')}</p>}
    {issue && <Alert role="note" className="mt-5 rounded-xl border-warm/20 bg-warm/5">
      <Info className="text-warm" /><AlertTitle className="font-bold">{t('paymob.issues.' + issue + '.title')}</AlertTitle>
      <AlertDescription className="leading-6"><p>{t('paymob.issues.' + issue + '.message')}</p>
        <Button role="link" variant="link" className={paymobButtonClass + ' h-auto min-h-11 whitespace-normal px-0 text-start'} render={<Link to={issue === 'ProviderUnavailable' ? '/doctor/clinics/$clinicId/payments/paymob/guide' : '/doctor/clinics/$clinicId/payments/paymob/manage'} params={{ clinicId }} hash={issueHash} />}><PencilLine />{t('paymob.issues.' + issue + '.action')}</Button>
      </AlertDescription>
    </Alert>}
  </section>
}

function UnavailableAction({ enable = false }: { enable?: boolean }) {
  const { t } = useTranslation()
  return <Dialog>
    <DialogTrigger render={<Button variant="ghost" className={paymobButtonClass + (enable ? ' h-auto min-h-11 whitespace-normal px-3 text-primary' : ' h-auto min-h-11 whitespace-normal px-3 text-muted-foreground')} />}><Power />{t(enable ? 'paymob.enable' : 'paymob.disable')}</DialogTrigger>
    <DialogContent showCloseButton={false} className="rounded-2xl motion-reduce:animate-none">
      <DialogHeader><DialogTitle className="flex items-center gap-2 font-sans text-xl font-bold normal-case tracking-normal"><Info className="size-5 shrink-0 text-primary" />{t('paymob.actionUnavailable')}</DialogTitle><DialogDescription>{t(enable ? 'paymob.enableUnavailable' : 'paymob.disableUnavailable')}</DialogDescription></DialogHeader>
      <DialogClose render={<Button variant="outline" className={paymobButtonClass} />}><X />{t('paymob.close')}</DialogClose>
    </DialogContent>
  </Dialog>
}
