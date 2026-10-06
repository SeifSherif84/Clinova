import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
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
      <div className="mt-3 border-t pt-5"><p className="mb-3 text-sm leading-6 text-muted-foreground">{t('paymob.guideFinish')}</p><Button role="link" className={paymobButtonClass + ' h-auto min-h-11 whitespace-normal'} render={<Link to="/doctor/clinics/$clinicId/payments/paymob/connect" params={{ clinicId }} hash="paymob-connect" />}><ArrowLeft className="rtl:rotate-180" />{t('paymob.backConnect')}</Button></div>
    </>}
  </PaymobPageFrame>
}
