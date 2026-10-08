import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft, ExternalLink, Settings2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PaymobEnvironmentNote } from '@/components/paymob/environment-note'
import { PaymobPageFrame } from '@/components/paymob/page-frame'
import { SetupScreenshot } from '@/components/paymob/setup-screenshot'
import { paymobButtonClass } from '@/components/paymob/setup-section'
import { Button } from '@/components/ui/button'
import { isPaymobTutorial } from '@/lib/paymob-tutorials'

export default function PaymobTutorialPage() {
  const { clinicId, topic } = useParams({ from: '/doctor/clinics/$clinicId/payments/paymob/help/$topic' })
  const { t } = useTranslation()
  const valid = isPaymobTutorial(topic)
  const clinovaGuide = ['why-credentials', 'credential-security', 'update-disconnect'].includes(topic)
    const screenshots: Partial<Record<string, string[]>> = {
    'create-account': ['/paymob-screenshot/create-account.webp'],
    'test-live': ['/paymob-screenshot/paymobTestMode.png', '/paymob-screenshot/paymobLiveMode.png'],
    'api-keys': ['/paymob-screenshot/paymobApiKeys.png', '/paymob-screenshot/paymobApiKeysInDetails.png'],
    'hmac-secret': ['/paymob-screenshot/paymobApiKeys.png'],
    'api-key': ['/paymob-screenshot/paymobApiKey.png'],
    'card-integration': ['/paymob-screenshot/paymobPaymentIntegrations.png', '/paymob-screenshot/paymobPaymentIntegrationInDetails.png'],
  }

  return <PaymobPageFrame clinicId={clinicId} back="help" title={valid ? t('paymob.tutorials.' + topic + '.title') : t('paymob.tutorialNotFound')} description={valid ? t('paymob.tutorials.' + topic + '.intro') : t('paymob.helpDescription')}>
    {() => <>
      {valid && <article>
        <ol className="mb-6 grid gap-5 border-t border-border pt-6">{(t('paymob.tutorials.' + topic + '.steps', { returnObjects: true }) as string[]).map((step, index) => <li key={index} className="flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full border border-primary/15 bg-primary/5 text-sm font-bold text-primary">{index + 1}</span><p className="pt-1 text-sm leading-6 text-muted-foreground">{step}</p>
        </li>)}</ol>
        <div className={`grid gap-4 ${(screenshots[topic]?.length ?? 1) > 1 ? 'max-w-4xl sm:grid-cols-2' : 'max-w-2xl'}`}>
          {(screenshots[topic] ?? [undefined]).map((src, index) => (
            <SetupScreenshot key={topic + '-' + index} src={src} source={clinovaGuide ? 'Clinova' : 'Paymob'} section={t('paymob.tutorials.' + topic + '.screenshot')} />
          ))}
        </div>
        {topic === 'test-live' && <PaymobEnvironmentNote />}
        {!clinovaGuide && <Button role="link" variant="link" className={paymobButtonClass + ' mt-4 h-auto min-h-11 whitespace-normal px-0 text-start'} render={<a href={topic === 'create-account' ? 'https://paymob.com/' : 'https://developers.paymob.com/paymob-docs/getting-started/new-dashboard'} target="_blank" rel="noopener noreferrer" />}><ExternalLink />{t(topic === 'create-account' ? 'paymob.openPaymob' : 'paymob.officialGuide')}</Button>}
        {topic === 'update-disconnect' && <Button role="link" variant="link" className={paymobButtonClass + ' mt-4 h-auto min-h-11 whitespace-normal px-0'} render={<Link to="/doctor/clinics/$clinicId/payments" params={{ clinicId }} />}><Settings2 />{t('paymob.viewSettings')}</Button>}
      </article>}
      <nav className="mt-6 flex flex-wrap gap-2 border-t border-border pt-5" aria-label={t('paymob.setupGuide')}>
        <Button role="link" variant="outline" className={paymobButtonClass + ' h-auto min-h-11 whitespace-normal'} render={<Link to="/doctor/clinics/$clinicId/payments/paymob/connect" params={{ clinicId }} hash="paymob-connect" />}><ArrowLeft className="rtl:rotate-180" />{t('paymob.backConnect')}</Button>

      </nav>
    </>}
  </PaymobPageFrame>
}
