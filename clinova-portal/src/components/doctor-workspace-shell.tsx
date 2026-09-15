import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { Bell, Building2, CalendarDays, Clock3, LogOut, ShieldCheck, Sparkles, Stethoscope } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Brand from '@/components/brand'
import PreferencesControls from '@/components/preferences-controls'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'

export default function DoctorWorkspaceShell({ children, active }: { children: ReactNode; active: 'clinics' | 'profile' }) {
  const { t } = useTranslation()
  const auth = useAuth()
  const navigate = useNavigate()
  const logout = useMutation({ mutationFn: auth.signOut, onSettled: () => navigate({ to: '/login', search: { redirect: undefined } }) })
  const navItem = 'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-foreground [&>svg]:size-4'
  const activeItem = `${navItem} bg-sidebar-accent text-sidebar-foreground [&>svg]:text-sidebar-primary`

  return (
    <main className="min-h-svh bg-background text-foreground lg:grid lg:grid-cols-[16.5rem_1fr]">
      <aside className="sticky top-0 hidden h-svh flex-col border-e border-sidebar-border bg-sidebar px-5 py-7 lg:flex">
        <Brand />
        <nav className="mt-12 grid gap-1">
          <Link className={navItem} to="/dashboard"><Sparkles />{t('dashboard.overview')}</Link>
          <a className={navItem} href="/dashboard#appointments"><CalendarDays />{t('dashboard.appointments')}</a>
          <Link className={active === 'clinics' ? activeItem : navItem} to="/doctor/clinics"><Building2 />{t('dashboard.clinics')}</Link>
          <a className={navItem} href="/dashboard#schedule"><Clock3 />{t('dashboard.workingHours')}</a>
          <Link className={active === 'profile' ? activeItem : navItem} to="/doctor/profile"><Stethoscope />{t('dashboard.profile')}</Link>
        </nav>
        <Card className="mt-auto flex-row items-center gap-3 rounded-xl border border-primary/10 bg-primary/5 px-3 py-3 animate-glow">
  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary"><ShieldCheck className="size-4" /></span>
  <span className="grid"><strong className="text-xs">{t('dashboard.secureSession')}</strong><small className="text-[10px] text-muted-foreground">{t('dashboard.protected')}</small></span>
</Card>
      </aside>

      <section className="min-w-0">
        <header className="sticky top-0 z-30 flex min-h-20 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur-xl sm:px-6 lg:px-10">
          <div className="me-auto"><span className="lg:hidden"><Brand compact /></span><Link className="hidden text-xs font-semibold text-muted-foreground transition hover:text-foreground lg:inline" to="/dashboard">{t('clinicModule.backToDashboard')}</Link></div>
          <PreferencesControls compact />
          <Button variant="outline" size="icon" className="relative rounded-xl border-border bg-card/40 text-muted-foreground" aria-label={t('dashboard.notifications')}><Bell className="size-4" /></Button>
          <div className="hidden max-w-56 text-end sm:grid"><strong className="truncate text-base font-bold text-foreground">{auth.user?.name}</strong><small className="truncate text-xs font-medium text-muted-foreground">{t('clinicModule.doctorWorkspace')}</small></div>
          <Button variant="outline" size="icon" className="rounded-xl border-border bg-card/40 text-muted-foreground" aria-label={t('common.signOut')} onClick={() => logout.mutate()} disabled={logout.isPending}><LogOut className="size-4 rtl:rotate-180" /></Button>
        </header>
        {children}
      </section>
    </main>
  )
}
