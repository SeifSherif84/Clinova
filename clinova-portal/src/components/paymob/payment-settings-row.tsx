import { Link } from '@tanstack/react-router'
import { BookOpen, CreditCard, Link2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { SavedPaymobConfiguration } from '@/lib/paymob-configuration'
import { PaymobAccountMenu } from './account-menu'
import { paymobButtonClass } from './setup-section'

export function PaymobSettingsRow({ clinicId, configuration }: { clinicId: string; configuration: SavedPaymobConfiguration | null }) {
  const { t } = useTranslation()
  const notConfigured = !configuration
  if (notConfigured) {
    return <section aria-label="Paymob" className="border-y border-border py-6">
      <div className="relative isolate overflow-hidden rounded-3xl border border-primary/10 bg-card">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
        <div aria-hidden="true" className="pointer-events-none absolute -end-20 -top-20 -z-10 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="p-6 sm:p-10">
          <div>
            <h2 className="font-sans text-3xl leading-tight font-bold sm:text-4xl">{t('paymob.heroTitle')}</h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground">{t('paymob.heroDescription')}</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button role="link" className={paymobButtonClass + ' h-auto min-h-11 whitespace-normal px-5'} render={<Link to="/doctor/clinics/$clinicId/payments/paymob/connect" params={{ clinicId }} />}><Link2 />{t('paymob.navigation')}</Button>
              <Button role="link" variant="secondary" className={paymobButtonClass + ' h-auto min-h-10 rounded-full px-4 py-2'} render={<Link to="/doctor/clinics/$clinicId/payments/paymob/guide" params={{ clinicId }} />}><BookOpen />{t('paymob.howItWorks')}</Button>
            </div>
            <p className="mt-6 flex items-center gap-2.5 text-xs font-bold text-primary/70">
              <span className="h-px w-9 bg-primary/25" />
              <span className="inline-flex items-center gap-1.5">{t('paymob.heroHint')}<Link2 className="size-3.5 shrink-0 rtl:rotate-180" /></span>
            </p>
          </div>
        </div>
      </div>
    </section>
  }

  if (!configuration) return null
  const { status, isReady } = configuration
  const attention = ['NeedsAttention', 'Restricted', 'PendingVerification'].includes(status)
  const color = attention ? 'border-warm/20 bg-warm/10 text-warm' : isReady ? 'border-primary/20 bg-primary/10 text-primary' : 'border-border bg-muted/30 text-muted-foreground'
  return <section aria-label="Paymob" className="border-y border-border py-6">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="flex items-center gap-3.5 font-sans text-xl font-bold"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10"><CreditCard className="size-4.5" /></span>Paymob</h2>
          <span className={'rounded-full border px-2.5 py-1 text-xs font-bold ' + color}>{t('paymob.accountStatus.' + status)}</span>
          {!configuration.isActive && <span className="rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs font-bold text-muted-foreground">{t('paymob.account.inactive')}</span>}
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{t(configuration.isActive ? 'paymob.accountStatusDescription.' + status : 'paymob.account.inactiveDescription')}</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <PaymobAccountMenu clinicId={clinicId} account={configuration} />
        <Button role="link" variant="outline" className="h-10 rounded-xl border-transparent bg-muted px-4 text-[13px] font-bold normal-case tracking-normal text-foreground hover:bg-foreground/10" render={<Link to="/doctor/clinics/$clinicId/payments/paymob/guide" params={{ clinicId }} />}><BookOpen className="size-4" />{t('paymob.setupGuide')}</Button>
      </div>
    </div>
  </section>
}
