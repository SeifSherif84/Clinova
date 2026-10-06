import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, BookOpen, Building2, KeyRound, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PaymobPageFrame } from '@/components/paymob/page-frame'
import { paymobButtonClass } from '@/components/paymob/setup-section'
import { Button } from '@/components/ui/button'
import type { PaymobTutorial } from '@/lib/paymob-tutorials'

const groups: { label: string; icon: typeof BookOpen; topics: PaymobTutorial[] }[] = [
  { label: 'startGroup', icon: Building2, topics: ['create-account', 'test-live'] },
  { label: 'credentialsGroup', icon: KeyRound, topics: ['api-keys', 'hmac-secret', 'api-key', 'card-integration'] },
  { label: 'manageGroup', icon: ShieldCheck, topics: ['why-credentials', 'credential-security', 'update-disconnect'] },
]

export default function PaymobHelpPage() {
  const { clinicId } = useParams({ from: '/doctor/clinics/$clinicId/payments/paymob/help' })
  const { t } = useTranslation()
  return <PaymobPageFrame clinicId={clinicId} title={t('paymob.helpTitle')} description={t('paymob.ux.helpStart')}>
    {() => <>
      <nav aria-label={t('paymob.browseHelp')} className="grid gap-5">
        {groups.map(({ label, icon: Icon, topics }) => <section key={label} aria-labelledby={'help-' + label} className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-5">
          <h2 id={'help-' + label} className="flex items-center gap-3 font-sans text-xl font-bold">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"><Icon className="size-7" /></span>
            {t('paymob.ux.' + label)}
          </h2>
          <ul className="mt-3 divide-y divide-border/60">
            {topics.map((topic) => <li key={topic}><Link to="/doctor/clinics/$clinicId/payments/paymob/help/$topic" params={{ clinicId, topic }} className="group flex min-h-14 items-center gap-3 rounded-xl px-3 py-4 text-sm font-bold transition-colors hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-ring">
              <span className="min-w-0 flex-1">{t('paymob.tutorials.' + topic + '.title')}</span><ArrowRight className="size-4 shrink-0 text-muted-foreground rtl:rotate-180" />
            </Link></li>)}
          </ul>
        </section>)}
      </nav>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button role="link" variant="outline" className={paymobButtonClass + ' h-auto min-h-11 whitespace-normal'} render={<Link to="/doctor/clinics/$clinicId/payments/paymob/connect" params={{ clinicId }} hash="paymob-connect" />}><ArrowLeft className="rtl:rotate-180" />{t('paymob.backConnect')}</Button>
        <Button role="link" variant="ghost" className={paymobButtonClass + ' h-auto min-h-11 whitespace-normal'} render={<Link to="/doctor/clinics/$clinicId/payments/paymob/guide" params={{ clinicId }} />}><BookOpen />{t('paymob.openGuide')}</Button>
      </div>
    </>}
  </PaymobPageFrame>
}
