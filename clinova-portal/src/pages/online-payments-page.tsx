import { Link, useParams } from '@tanstack/react-router'
import { BookOpen, LoaderCircle, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Notice from '@/components/notice'
import { PaymobPageFrame } from '@/components/paymob/page-frame'
import { PaymobSettingsRow } from '@/components/paymob/payment-settings-row'
import { paymobButtonClass } from '@/components/paymob/setup-section'
import { Button } from '@/components/ui/button'
import { usePaymobStatus } from '@/hooks/use-paymob-configuration'

export default function OnlinePaymentsPage() {
  const { clinicId } = useParams({ from: '/doctor/clinics/$clinicId/payments' })
  const { t } = useTranslation()
  return <PaymobPageFrame clinicId={clinicId} back="clinic" title={t('paymob.settingsTitle')} description={t('paymob.settingsDescription')}>{() => <PaymentSettings key={clinicId} clinicId={clinicId} />}</PaymobPageFrame>
}
function PaymentSettings({ clinicId }: { clinicId: string }) {
  const { t } = useTranslation()
  const configuration = usePaymobStatus(clinicId)
  if (configuration.isPending) return <p role="status" className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />{t('paymob.settingsLoading')}</p>
  return <>
    {configuration.isError ? <div className="grid gap-4 border-y py-6">
      <Notice message={t('paymob.statusUnavailable')} /><p role="alert" className="text-sm leading-6 text-muted-foreground">{t('paymob.statusUnavailable')}</p>
      <div className="flex flex-wrap gap-2"><Button variant="outline" className={paymobButtonClass} disabled={configuration.isFetching} onClick={() => void configuration.refetch()}>{configuration.isFetching ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <RefreshCw />}{t('errors.tryAgain')}</Button></div>
    </div> : <PaymobSettingsRow clinicId={clinicId} configuration={configuration.data} />}
    <div className="mt-5 flex flex-wrap gap-2">
      <Button role="link" variant="ghost" className={paymobButtonClass + ' px-0 text-muted-foreground'} render={<Link to="/doctor/clinics/$clinicId/payments/paymob/help" params={{ clinicId }} />}><BookOpen />{t('paymob.helpTitle')}</Button>
      {!configuration.isError && <Button variant="ghost" className={paymobButtonClass + ' text-muted-foreground'} disabled={configuration.isFetching} onClick={() => void configuration.refetch()}>{configuration.isFetching ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <RefreshCw />}{t('paymob.refreshSettings')}</Button>}
    </div>
  </>
}
