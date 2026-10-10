import { useState } from 'react'
import { LoaderCircle, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Notice from '@/components/notice'
import { Button } from '@/components/ui/button'
import { useSavePaymobCredentials, useSavedPaymobConfiguration } from '@/hooks/use-paymob-configuration'
import { PaymobConnectionForm } from './connection-form'
import { PaymobSettingsRow } from './payment-settings-row'
import { PaymobIntegrations } from './integrations'
import { paymobButtonClass } from './setup-section'

export function ConnectPaymobAccount({ clinicId }: { clinicId: string }) {
  const { t } = useTranslation()
  const configuration = useSavedPaymobConfiguration(clinicId)
  const save = useSavePaymobCredentials(clinicId)
  const [saved, setSaved] = useState(false)
  if (configuration.isPending) return <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />{t('paymob.settingsLoading')}</p>
  if (configuration.isError) return <div className="grid justify-items-start gap-3"><Notice message={t('paymob.statusUnavailable')} /><p role="alert" className="text-sm text-muted-foreground">{t('paymob.statusUnavailable')}</p><Button variant="outline" className={paymobButtonClass} disabled={configuration.isFetching} onClick={() => void configuration.refetch()}>{configuration.isFetching ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <RefreshCw />}{t('errors.tryAgain')}</Button></div>
  return <>
    {saved ? <p role="status" className="mb-4 text-sm font-bold text-primary">{t('paymob.savedDescription')}</p> : !configuration.data && <PaymobConnectionForm onConnect={async (credentials) => { await save(credentials); setSaved(true) }} />}
    {configuration.data && <><PaymobSettingsRow clinicId={clinicId} configuration={configuration.data} /><PaymobIntegrations clinicId={clinicId} account={configuration.data} refreshing={configuration.isFetching} /></>}
  </>
}
