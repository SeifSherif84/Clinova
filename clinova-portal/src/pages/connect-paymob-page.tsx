import { Link, useLocation, useParams } from '@tanstack/react-router'
import { ArrowRight, Building2, BookOpen, ExternalLink, Info, KeyRound, Link2, ShieldCheck } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { PaymobConnectionForm } from '@/components/paymob/connection-form'
import { PaymobCredentialsGuideDialog } from '@/components/paymob/credentials-guide'
import { PaymobPageFrame } from '@/components/paymob/page-frame'
import { SetupSection, paymobButtonClass } from '@/components/paymob/setup-section'
import { PaymobEnvironmentNote } from '@/components/paymob/environment-note'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

const sectionIds = ['paymob-account', 'paymob-credentials', 'paymob-connect']

function goToSection(id: string) {
  const section = document.getElementById(id)
  section?.scrollIntoView({ block: 'start' })
  section?.querySelector('h2')?.focus({ preventScroll: true })
}

export default function ConnectPaymobPage() {
  const { t } = useTranslation()
  const { clinicId } = useParams({ from: '/doctor/clinics/$clinicId/payments/paymob/connect' })
  return <PaymobPageFrame clinicId={clinicId} back="settings" title={t('paymob.title')} description={t('paymob.description')}>
    {() => <ConnectPaymobSetup key={clinicId} clinicId={clinicId} />}
  </PaymobPageFrame>
}

function ConnectPaymobSetup({ clinicId }: { clinicId: string }) {
  const { t } = useTranslation()
  const hash = useLocation({ select: (location) => location.hash })
  useEffect(() => {
    if (sectionIds.includes(hash)) goToSection(hash)
  }, [hash])

  return <>
    <Alert role="note" className="rounded-xl border-primary/15 bg-primary/5">
      <Info /><AlertTitle className="font-bold">{t('paymob.ux.beforeStart')}</AlertTitle>
      <AlertDescription id="paymob-unavailable" className="leading-6">{t('paymob.unavailable')}</AlertDescription>
    </Alert>
    <div className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="max-w-xl text-sm leading-6 text-muted-foreground">{t('paymob.ux.overview')}</p>
      <Button variant="outline" className={paymobButtonClass + ' h-auto min-h-11 shrink-0 whitespace-normal'} onClick={() => goToSection('paymob-connect')}><ArrowRight className="rtl:rotate-180" />{t('paymob.ux.ready')}</Button>
    </div>
    <nav aria-label={t('paymob.stepsLabel')} className="mt-5 border-y border-border py-3">
      <ol className="grid gap-2 sm:grid-cols-3">
        {(['account', 'credentials', 'connect'] as const).map((step, index) => <li key={step}>
          <Button variant="ghost" onClick={() => goToSection(sectionIds[index])} className={paymobButtonClass + ' h-auto min-h-12 w-full justify-start whitespace-normal px-2 py-2 text-start'}>
            <span className="grid size-7 shrink-0 place-items-center rounded-full border border-primary/20 bg-primary/5 text-xs text-primary">{index + 1}</span>{t('paymob.steps.' + step)}
          </Button>
        </li>)}
      </ol>
    </nav>
    <div>
      <SetupSection id="paymob-account" icon={Building2} title={t('paymob.accountTitle')} description={t('paymob.accountDescription')}>
        <div className="flex flex-wrap items-center gap-3">
          <Button role="link" variant="outline" className={paymobButtonClass} render={<a href="https://paymob.com/" target="_blank" rel="noopener noreferrer" />}><ExternalLink />{t('paymob.openPaymob')}</Button>
          <span className="text-xs text-muted-foreground">{t('paymob.existingAccount')}</span>
          <Button variant="ghost" onClick={() => goToSection('paymob-credentials')} className={paymobButtonClass + ' text-primary'}><ArrowRight className="rtl:rotate-180" />{t('paymob.skip')}</Button>
        </div>
        <p className="mt-3 flex items-start gap-2 text-xs leading-6 text-muted-foreground"><ShieldCheck className="mt-1 size-4 shrink-0 text-primary" />{t('paymob.noPassword')}</p>
      </SetupSection>
      <SetupSection id="paymob-credentials" icon={KeyRound} title={t('paymob.credentialsTitle')} description={t('paymob.ux.sameEnvironment')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="min-w-0 rounded-2xl border border-border/60 bg-card p-4">
            <h3 className="text-sm font-bold">{t('paymob.apiKeys')}</h3>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">{t('paymob.ux.keysSummary')}</p>
            <ul className="mt-3 flex flex-wrap gap-2">{['Public Key', 'Secret Key', 'HMAC Secret', 'ApiKey'].map((name) => <li key={name} className="rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs font-bold">{name}</li>)}</ul>
          </div>
          <div className="min-w-0 rounded-2xl border border-border/60 bg-card p-4">
            <h3 className="text-sm font-bold">{t('paymob.integrationTitle')}</h3>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">{t('paymob.ux.integrationSummary')}</p>
            <p className="mt-3 text-xs leading-6 text-muted-foreground">{t('paymob.integrationNote')}</p>
          </div>
        </div>
        <div className="mt-4"><PaymobCredentialsGuideDialog /></div>
        <PaymobEnvironmentNote />
      </SetupSection>
      <SetupSection id="paymob-connect" icon={Link2} title={t('paymob.connectTitle')} description={t('paymob.connectDescription')}>
        <PaymobConnectionForm unavailableNoticeId="paymob-unavailable" />
        <div className="mt-6 border-t pt-5"><Button role="link" variant="link" className={paymobButtonClass + ' h-auto min-h-11 whitespace-normal px-0'} render={<Link to="/doctor/clinics/$clinicId/payments/paymob/help" params={{ clinicId }} />}><BookOpen />{t('paymob.helpTitle')}</Button><p className="text-xs leading-6 text-muted-foreground">{t('paymob.helpDescription')}</p></div>
      </SetupSection>
    </div>
  </>
}
