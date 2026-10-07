import { Link, useParams } from '@tanstack/react-router'
import { ArrowRight, CircleCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PaymobCredentialsGuide } from '@/components/paymob/credentials-guide'
import { PaymobPageFrame } from '@/components/paymob/page-frame'
import { paymobButtonClass } from '@/components/paymob/setup-section'
import { Button } from '@/components/ui/button'

export default function PaymobCredentialsGuidePage() {
  const { clinicId } = useParams({ from: '/doctor/clinics/$clinicId/payments/paymob/guide' })
  const { t } = useTranslation()
  return <PaymobPageFrame clinicId={clinicId} back="settings" title={t('paymob.guideTitle')} description={t('paymob.guideIntro')}>
    {() => <>
      <PaymobCredentialsGuide />
      <div className="relative mt-10 overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/8 via-card to-transparent p-6 sm:p-8">
  <div aria-hidden="true" className="pointer-events-none absolute -end-10 -top-10 size-40 rounded-full bg-primary/10 blur-3xl" />
  <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold tracking-wider text-primary uppercase">
        <CircleCheck className="size-3.5" />
        {t('paymob.guideFinishEyebrow', { defaultValue: 'All set' })}
      </span>
      <p className="mt-3 max-w-md text-sm leading-7 text-foreground/80">{t('paymob.guideFinish')}</p>
    </div>
    <Button role="link" className={paymobButtonClass + ' h-auto min-h-12 shrink-0 whitespace-normal px-6'} render={<Link to="/doctor/clinics/$clinicId/payments/paymob/connect" params={{ clinicId }} hash="paymob-connect" />}>
      {t('paymob.backConnect')}<ArrowRight className="rtl:rotate-180" />
    </Button>
  </div>
</div>
    </>}
  </PaymobPageFrame>
}