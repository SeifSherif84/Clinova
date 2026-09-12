import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Brand from '@/components/brand'
import PreferencesControls from '@/components/preferences-controls'

export default function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <main className="relative grid min-h-svh place-content-center justify-items-center gap-5 bg-[radial-gradient(circle_at_center,var(--color-card),var(--color-background)_68%)] p-8 text-center text-foreground">
      <div className="absolute top-5 end-5"><PreferencesControls /></div>
      <Brand />
      <div className="mt-8 flex items-center font-heading text-7xl font-semibold tracking-[-.08em] sm:text-9xl"><span>4</span><i className="grid size-[1.15em] animate-[spin_15s_linear_infinite] place-items-center rounded-full border border-dashed border-primary text-transparent motion-reduce:animate-none after:size-[.28em] after:rounded-full after:bg-warm">0</i><span>4</span></div>
      <h1 className="font-heading text-2xl font-medium sm:text-3xl">{t('notFound.title')}</h1>
      <p className="text-sm text-muted-foreground">{t('notFound.description')}</p>
      <Link to="/" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90"><ArrowLeft className="size-4 rtl:rotate-180" /> {t('common.returnHome')}</Link>
    </main>
  )
}
