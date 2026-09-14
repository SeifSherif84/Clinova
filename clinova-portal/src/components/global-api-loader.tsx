import { LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useApi } from '@/hooks/use-api'

export default function GlobalApiLoader() {
  const { t } = useTranslation()
  const { isRequesting } = useApi()

  return (
    <div className={`pointer-events-none fixed top-3 left-1/2 z-[220] flex -translate-x-1/2 items-center gap-2 rounded-full border border-primary/20 bg-card/90 px-3 py-2 text-[10px] font-semibold text-foreground shadow-lg backdrop-blur-xl transition duration-200 ${isRequesting ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`} role="status" aria-live="polite" aria-hidden={!isRequesting}>
      <LoaderCircle className="size-3.5 animate-spin text-primary" />{t('common.apiLoading')}
    </div>
  )
}
