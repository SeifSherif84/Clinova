import { Link } from '@tanstack/react-router'
import { BookOpen, CreditCard, Link2, PencilLine } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { SavedPaymobConfiguration } from '@/lib/paymob-configuration'
import { paymobButtonClass } from './setup-section'

export function PaymobSettingsRow({ clinicId, configuration }: { clinicId: string; configuration: SavedPaymobConfiguration | null }) {
  const { t } = useTranslation()
  const notConfigured = !configuration
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
              <Button role="link" variant="secondary" className={paymobButtonClass + ' h-auto min-h-10 rounded-full px-4 py-2'} render={<Link to="/doctor/clinics/$clinicId/payments/paymob/guide" params={{ clinicId }} />}><BookOpen />{t('paymob.howItWorks')}</Button>
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

  if (!configuration) return null
  const { status, isReady } = configuration
  const attention = ['NeedsAttention', 'Restricted', 'PendingVerification'].includes(status)
  const color = attention ? 'border-warm/20 bg-warm/10 text-warm' : isReady ? 'border-primary/20 bg-primary/10 text-primary' : 'border-border bg-muted/30 text-muted-foreground'
  return <section aria-label="Paymob" className="border-y border-border py-6">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="flex items-center gap-2 font-sans text-xl font-bold"><span className="grid size-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"><CreditCard className="size-7" /></span>Paymob</h2>
          <span className={'rounded-full border px-2.5 py-1 text-xs font-bold ' + color}>{t('paymob.accountStatus.' + status)}</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{t('paymob.accountStatusDescription.' + status)}</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button role="link" variant="outline" className={paymobButtonClass} render={<Link to="/doctor/clinics/$clinicId/payments/paymob/manage" params={{ clinicId }} />}><PencilLine />{t(status === 'NeedsAttention' ? 'paymob.reviewSettings' : 'paymob.manage')}</Button>
        <Button role="link" variant="ghost" className={paymobButtonClass} render={<Link to="/doctor/clinics/$clinicId/payments/paymob/guide" params={{ clinicId }} />}><BookOpen />{t('paymob.setupGuide')}</Button>
      </div>
    </div>
  </section>
}
