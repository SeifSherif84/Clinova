import { Home, RefreshCw, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Brand from '@/components/brand'
import PreferencesControls from '@/components/preferences-controls'
import { Button } from '@/components/ui/button'

export default function RouteErrorPage({ reset }: { error: unknown; reset: () => void }) {
  const { t } = useTranslation()
  return (
    <main className="relative grid min-h-svh place-content-center justify-items-center gap-5 bg-[radial-gradient(circle_at_center,var(--color-card),var(--color-background)_68%)] p-8 text-center text-foreground">
      <div className="absolute top-5 end-5"><PreferencesControls /></div>
      <Brand />
      <span className="mt-6 grid size-16 place-items-center rounded-2xl bg-destructive/10 text-destructive"><TriangleAlert className="size-7" /></span>
      <h1 className="font-heading text-2xl font-medium sm:text-3xl">{t('errors.routeTitle')}</h1>
      <p className="max-w-lg text-sm leading-6 text-muted-foreground">{t('errors.routeMessage')}</p>
      <div className="flex flex-wrap justify-center gap-2"><Button className="rounded-xl normal-case" onClick={reset}><RefreshCw />{t('errors.tryAgain')}</Button><Button variant="outline" className="rounded-xl normal-case" render={<a href="/" />}><Home />{t('common.returnHome')}</Button></div>
    </main>
  )
}
