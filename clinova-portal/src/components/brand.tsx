import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import logoUrl from '@/assets/logo.svg'

export default function Brand({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation()

  return (
    <Link to="/" className="relative z-10 inline-flex items-center gap-3" aria-label={t('common.homeLabel')}>
      <img className="size-10 drop-shadow-sm sm:size-11" src={logoUrl} alt="" aria-hidden="true" />
      {!compact && (
        <span className="grid gap-0.5">
          <strong className="text-lg leading-none font-bold tracking-tight text-foreground sm:text-xl">Clinova</strong>
          <small className="hidden text-[9px] tracking-[.16em] text-muted-foreground uppercase sm:block">{t('common.brandTagline')}</small>
        </span>
      )}
    </Link>
  )
}
