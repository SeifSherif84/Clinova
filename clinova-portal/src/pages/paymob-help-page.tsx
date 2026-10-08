import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft, BookOpen, Building2, ChevronDown, ExternalLink, KeyRound, Settings2, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PaymobEnvironmentNote } from '@/components/paymob/environment-note'
import { PaymobPageFrame } from '@/components/paymob/page-frame'
import { SetupScreenshot } from '@/components/paymob/setup-screenshot'
import { paymobButtonClass } from '@/components/paymob/setup-section'
import { Button } from '@/components/ui/button'
import type { PaymobTutorial } from '@/lib/paymob-tutorials'

const groups: { label: string; icon: typeof BookOpen; topics: PaymobTutorial[] }[] = [
  { label: 'startGroup', icon: Building2, topics: ['create-account', 'test-live'] },
  { label: 'credentialsGroup', icon: KeyRound, topics: ['api-keys', 'hmac-secret', 'api-key', 'card-integration'] },
  { label: 'manageGroup', icon: ShieldCheck, topics: ['why-credentials', 'credential-security', 'update-disconnect'] },
]

const clinovaTopics: PaymobTutorial[] = ['why-credentials', 'credential-security', 'update-disconnect']

const screenshots: Partial<Record<PaymobTutorial, string[]>> = {
  'create-account': ['/paymob-screenshot/create-account.webp'],
  'test-live': ['/paymob-screenshot/paymobTestMode.png', '/paymob-screenshot/paymobLiveMode.png'],
  'api-keys': ['/paymob-screenshot/paymobApiKeys.png', '/paymob-screenshot/paymobApiKeysInDetails.png'],
  'hmac-secret': ['/paymob-screenshot/paymobApiKeys.png'],
  'api-key': ['/paymob-screenshot/paymobApiKey.png'],
  'card-integration': ['/paymob-screenshot/paymobPaymentIntegrations.png', '/paymob-screenshot/paymobPaymentIntegrationInDetails.png'],
}

function FaqAnswer({ topic, clinicId }: { topic: PaymobTutorial; clinicId: string }) {
  const { t } = useTranslation()
  const clinovaGuide = clinovaTopics.includes(topic)
  const steps = t('paymob.tutorials.' + topic + '.steps', { returnObjects: true }) as string[]
  return <div className="pb-10 ps-4 sm:ps-6">
    <p className="max-w-2xl text-sm font-semibold leading-7 text-muted-foreground">{t('paymob.tutorials.' + topic + '.intro')}</p>
    <ol className="mt-6 max-w-2xl">{steps.map((step, index) => <li key={index} className="relative flex items-start gap-4 pb-6 last:pb-0">
      {index < steps.length - 1 && <span aria-hidden="true" className="absolute start-[13px] top-8 bottom-1 w-px bg-primary/15" />}
      <span className="relative grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{index + 1}</span>
      <p className="pt-0.5 text-sm font-semibold leading-6 text-muted-foreground">{step}</p>
    </li>)}</ol>
    <div className={`mt-8 grid gap-4 ${(screenshots[topic]?.length ?? 1) > 1 ? 'max-w-4xl sm:grid-cols-2' : 'max-w-2xl'}`}>
      {(screenshots[topic] ?? [undefined]).map((src, index) => (
        <SetupScreenshot key={topic + '-' + index} src={src} source={clinovaGuide ? 'Clinova' : 'Paymob'} section={t('paymob.tutorials.' + topic + '.screenshot')} />
      ))}
    </div>
    {topic === 'test-live' && <PaymobEnvironmentNote />}
    {!clinovaGuide && <Button role="link" variant="link" className={paymobButtonClass + ' mt-3 h-auto min-h-9 whitespace-normal px-0 text-start'} render={<a href={topic === 'create-account' ? 'https://paymob.com/' : 'https://developers.paymob.com/paymob-docs/getting-started/new-dashboard'} target="_blank" rel="noopener noreferrer" />}><ExternalLink />{t(topic === 'create-account' ? 'paymob.openPaymob' : 'paymob.officialGuide')}</Button>}
    {topic === 'update-disconnect' && <Button role="link" variant="link" className={paymobButtonClass + ' mt-3 h-auto min-h-9 whitespace-normal px-0'} render={<Link to="/doctor/clinics/$clinicId/payments" params={{ clinicId }} />}><Settings2 />{t('paymob.viewSettings')}</Button>}
  </div>
}

export default function PaymobHelpPage() {
  const { clinicId } = useParams({ from: '/doctor/clinics/$clinicId/payments/paymob/help' })
  const { t } = useTranslation()
  const [open, setOpen] = useState<PaymobTutorial | null>(null)
  return <PaymobPageFrame clinicId={clinicId} hideIntro title={t('paymob.helpTitle')} description={t('paymob.ux.helpStart')}>
    {() => <>
      <div className="mt-2 grid gap-14 sm:gap-16">
        {groups.map(({ label, topics }) => <section key={label} aria-labelledby={'help-' + label} className="min-w-0">
          <h2 id={'help-' + label} className="font-sans text-xl font-bold">
            {t('paymob.ux.' + label)}
          </h2>
          <ul className="mt-4 divide-y divide-border/50 border-s border-border/60 ps-4 sm:ps-6">
            {topics.map((topic) => {
              const expanded = open === topic
              return <li key={topic} className={'overflow-hidden rounded-2xl transition-colors duration-200 motion-reduce:transition-none ' + (expanded ? 'bg-primary/5' : '')}>
                <h3>
                  <button type="button" id={'faq-' + topic} aria-expanded={expanded} aria-controls={'faq-panel-' + topic}
                    onClick={() => setOpen(expanded ? null : topic)}
                    className={'group flex min-h-14 w-full cursor-pointer items-center gap-4 rounded-2xl px-4 py-4 text-start text-base font-bold transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring ' + (expanded ? 'text-primary' : 'text-foreground hover:bg-muted/50')}>
                    <span className={'h-5 w-1 shrink-0 rounded-full transition-colors duration-200 motion-reduce:transition-none ' + (expanded ? 'bg-primary' : 'bg-transparent')} />
                    <span className="min-w-0 flex-1">{t('paymob.tutorials.' + topic + '.title')}</span>
                    <ChevronDown className={'size-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none ' + (expanded ? 'rotate-180 text-primary' : '')} />
                  </button>
                </h3>
                <div id={'faq-panel-' + topic} role="region" aria-labelledby={'faq-' + topic} hidden={!expanded}>
                  {expanded && <FaqAnswer topic={topic} clinicId={clinicId} />}
                </div>
              </li>
            })}
          </ul>
        </section>)}
      </div>
      <div className="mt-12 flex flex-wrap gap-2 border-t border-border/60 pt-6">
        <Button role="link" className={paymobButtonClass + ' h-auto min-h-11 whitespace-normal bg-primary text-primary-foreground hover:bg-primary/90'} render={<Link to="/doctor/clinics/$clinicId/payments/paymob/connect" params={{ clinicId }} hash="paymob-connect" />}><ArrowLeft className="rtl:rotate-180" />{t('paymob.backConnect')}</Button>
        <Button role="link" variant="ghost" className={paymobButtonClass + ' h-auto min-h-11 whitespace-normal'} render={<Link to="/doctor/clinics/$clinicId/payments/paymob/guide" params={{ clinicId }} />}><BookOpen />{t('paymob.openGuide')}</Button>
      </div>
    </>}
  </PaymobPageFrame>
}