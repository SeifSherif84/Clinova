import { Link, useLocation, useParams } from '@tanstack/react-router'
import { ArrowLeft, Link2, LoaderCircle, RefreshCw } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Notice from '@/components/notice'
import { PaymobConnectionForm } from '@/components/paymob/connection-form'
import { credentialNames } from '@/components/paymob/credentials'
import { PaymobPageFrame } from '@/components/paymob/page-frame'
import { paymobButtonClass } from '@/components/paymob/setup-section'
import { Button } from '@/components/ui/button'
import { useSavePaymobCredentials, useSavedPaymobConfiguration } from '@/hooks/use-paymob-configuration'

export default function ManagePaymobPage() {
  const { clinicId } = useParams({ from: '/doctor/clinics/$clinicId/payments/paymob/manage' })
  const { t } = useTranslation()
  return <PaymobPageFrame clinicId={clinicId} back="settings" title={t('paymob.updateTitle')} description={t('paymob.updateDescription')}>{() => <ManageConfiguration key={clinicId} clinicId={clinicId} />}</PaymobPageFrame>
}
function ManageConfiguration({ clinicId }: { clinicId: string }) {
  const { t } = useTranslation()
  const configuration = useSavedPaymobConfiguration(clinicId)
  const saveCredentials = useSavePaymobCredentials(clinicId)
  const hash = useLocation({ select: (location) => location.hash })
  useEffect(() => {
    if (configuration.data && credentialNames.some((name) => hash === 'paymob-' + name + '-section')) {
      const section = document.getElementById(hash)
      section?.scrollIntoView({ block: 'start' })
      section?.focus({ preventScroll: true })
    }
  }, [configuration.data, hash])

  if (configuration.isPending) return <p role="status" className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />{t('paymob.settingsLoading')}</p>
  if (configuration.isError) return <div className="grid justify-items-start gap-4"><Notice message={t('paymob.manageUnavailable')} /><p role="alert" className="text-sm text-muted-foreground">{t('paymob.manageUnavailable')}</p><Button variant="outline" className={paymobButtonClass} disabled={configuration.isFetching} onClick={() => void configuration.refetch()}>{configuration.isFetching ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <RefreshCw />}{t('errors.tryAgain')}</Button></div>
  if (!configuration.data) return <div className="grid justify-items-start gap-4"><p className="text-sm text-muted-foreground">{t('paymob.noSavedConfiguration')}</p><Button role="link" className={paymobButtonClass} render={<Link to="/doctor/clinics/$clinicId/payments/paymob/connect" params={{ clinicId }} />}><Link2 />{t('paymob.navigation')}</Button></div>

  const account = configuration.data
  return <>
    <PaymobConnectionForm key={configuration.data.accountId} mode="update" existing={configuration.data} onUpdate={(changes) => saveCredentials(changes, account.accountId)} />
    <div className="mt-6 flex flex-wrap gap-2 border-t pt-5">
      <Button role="link" variant="outline" className={paymobButtonClass + ' h-auto min-h-11 whitespace-normal'} render={<Link to="/doctor/clinics/$clinicId/payments" params={{ clinicId }} />}><ArrowLeft className="rtl:rotate-180" />{t('paymob.backSettings')}</Button>

    </div>
  </>
}
