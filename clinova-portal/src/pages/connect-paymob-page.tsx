import { Link, useLocation, useParams } from '@tanstack/react-router'
import { ArrowRight, UserPlus, BookOpen, ExternalLink, KeyRound, Link2, Lock} from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ConnectPaymobAccount } from '@/components/paymob/connect-account'
import { PaymobCredentialsGuideDialog } from '@/components/paymob/credentials-guide'
import { PaymobPageFrame } from '@/components/paymob/page-frame'
import { SetupSection, paymobButtonClass } from '@/components/paymob/setup-section'
import { PaymobEnvironmentNote } from '@/components/paymob/environment-note'
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
    <div className="mt-5 overflow-hidden rounded-3xl border border-border/70 bg-muted/40 shadow-sm">
      <div className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">{t('paymob.ux.overview')}</p>
        <Button className={paymobButtonClass + ' h-auto min-h-11 shrink-0 whitespace-normal bg-primary text-primary-foreground hover:bg-primary/90'} onClick={() => goToSection('paymob-connect')}><ArrowRight className="rotate-90" />{t('paymob.ux.ready')}</Button>
      </div>
      <nav aria-label={t('paymob.stepsLabel')} className="border-t border-border/70 bg-muted/30 px-5 py-6 sm:px-8">
        <ol className="flex items-start justify-between gap-2">
          {(['account', 'credentials', 'connect'] as const).map((step, index, arr) => (
            <li key={step} className="flex flex-1 items-start last:flex-none">
              <button
                type="button"
                onClick={() => goToSection(sectionIds[index])}
                className="group flex min-w-0 flex-col items-center gap-2.5 text-center"
              >
                <span className="relative z-10 grid size-10 shrink-0 cursor-pointer place-items-center rounded-full border-2 border-primary/25 bg-card text-sm font-bold text-primary transition-colors duration-200 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                  {index + 1}
                </span>
                <span className="max-w-24 text-xs leading-5 font-bold text-foreground/80 transition-colors duration-200 group-hover:text-primary sm:max-w-none sm:text-sm">{t('paymob.steps.' + step)}</span>
              </button>
              {index < arr.length - 1 && <span aria-hidden="true" className="mx-1 mt-5 h-px flex-1 shrink bg-primary/20 sm:mt-5" />}
            </li>
          ))}
        </ol>
      </nav>
    </div>
    <div>
      <SetupSection id="paymob-account" icon={UserPlus} title={t('paymob.accountTitle')} description={t('paymob.accountDescription')}>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <Button role="link" className={paymobButtonClass} render={<a href="https://paymob.com/" target="_blank" rel="noopener noreferrer" />}><ExternalLink />{t('paymob.openPaymob')}</Button>
          <div className="flex min-w-0 flex-wrap items-center gap-5">
            <span className="truncate text-sm font-semibold text-muted-foreground">{t('paymob.existingAccount')}</span>
            <button
              type="button"
              onClick={() => goToSection('paymob-credentials')}
              className="group inline-flex shrink-0 items-center gap-2 text-xs font-bold text-muted-foreground"
            >
              {t('paymob.skip')}
              <span className="relative grid size-5 shrink-0 place-items-center rounded-full border border-muted-foreground/40 transition-all duration-200 group-hover:border-primary group-hover:bg-primary">
                <ArrowRight className="size-3 shrink-0 rotate-90 text-muted-foreground transition-all duration-200 group-hover:translate-y-0.5 group-hover:text-primary-foreground" />
              </span>
            </button>
          </div>
        </div>
        <p className="mt-4 flex items-center gap-2.5 text-xs leading-6 font-semibold text-muted-foreground">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <Lock className="size-3.5" />
          </span>
          {t('paymob.noPassword')}
        </p>
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
        <ConnectPaymobAccount clinicId={clinicId} />
        <div className="mt-6 border-t pt-5">
  <Button role="link" variant="secondary" className={paymobButtonClass + ' h-auto min-h-11 w-fit whitespace-normal rounded-full bg-muted/80 px-5 text-foreground hover:bg-muted'} render={<Link to="/doctor/clinics/$clinicId/payments/paymob/help" params={{ clinicId }} />}>
    <BookOpen className="size-4 shrink-0" />{t('paymob.helpTitle')}
  </Button>
  <p className="mt-2 text-[13px] font-semibold leading-6 text-foreground/70">{t('paymob.helpDescription')}</p>
</div>
      </SetupSection>
    </div>
  </>
}
