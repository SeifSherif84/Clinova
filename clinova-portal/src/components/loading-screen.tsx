import Brand from '@/components/brand'
import { useTranslation } from 'react-i18next'

export default function LoadingScreen({ label }: { label?: string }) {
  const { t } = useTranslation()

  return (
    <main className="grid min-h-svh w-full min-w-0 max-w-full overflow-x-clip place-content-center justify-items-center gap-5 bg-[radial-gradient(circle_at_center,var(--color-card),var(--color-background)_68%)] p-8 text-center text-foreground">
      <Brand />
      <span className="relative mt-4 size-16 animate-spin motion-reduce:animate-none rounded-full border border-primary/20"><i className="absolute top-1 end-1 size-2.5 rounded-full bg-primary" /></span>
      <p className="text-xs text-muted-foreground">{label ?? t('common.loading')}</p>
    </main>
  )
}
