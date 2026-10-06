import { Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function PaymobEnvironmentNote() {
  const { t } = useTranslation()
  return <Alert role="note" className="mt-4 rounded-2xl border-warm/20 bg-warm/5 p-4 sm:p-5">
    <Info className="text-warm" /><AlertTitle className="font-bold">{t('paymob.environmentTitle')}</AlertTitle>
    <AlertDescription className="leading-6">
      <p>{t('paymob.environmentDescription')}</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div><p className="!mb-1 text-xs font-bold text-foreground">{t('paymob.testLabel')}</p><p className="!mb-0 text-xs">{t('paymob.testDescription')} {t('paymob.testNote')}</p></div>
        <div><p className="!mb-1 text-xs font-bold text-foreground">{t('paymob.liveLabel')}</p><p className="!mb-0 text-xs">{t('paymob.liveDescription')}</p></div>
      </div>
    </AlertDescription>
  </Alert>
}
