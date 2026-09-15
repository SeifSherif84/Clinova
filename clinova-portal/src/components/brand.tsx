import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import logoUrl from '@/assets/logo.svg'

export default function Brand({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation()

  return (
    <Link to="/" className="relative z-10 inline-flex items-center gap-4" aria-label={t('common.homeLabel')}>
      <img className="size-12 drop-shadow-sm sm:size-14" src={logoUrl} alt="" aria-hidden="true" />
      {!compact && (
        <span className="grid gap-1">
          <strong className="text-xl leading-none font-bold tracking-tight text-foreground sm:text-2xl">Clinova</strong>
          <small className="hidden text-[10px] font-medium tracking-[.16em] text-primary uppercase sm:block">{t('common.brandTagline')}</small>
        </span>
      )}
    </Link>
  )
}