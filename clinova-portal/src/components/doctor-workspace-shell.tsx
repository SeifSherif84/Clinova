import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { Bell, Building2, CalendarDays, Clock3, LoaderCircle, LogOut, MailOpen, ShieldCheck, Sparkles, Stethoscope } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Brand from '@/components/brand'
import PreferencesControls from '@/components/preferences-controls'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import NotificationBell from '@/components/notification-bell'
import MobileNavigationMenu from '@/components/mobile-navigation-menu'

export default function DoctorWorkspaceShell({ children, active, topBackLink }: { children: ReactNode; active: 'clinics' | 'invitations' | 'notifications' | 'working-hours' | 'profile'; topBackLink?: ReactNode }) {
  const { t } = useTranslation()
  const auth = useAuth()
  const navigate = useNavigate()
  const logout = useMutation({ mutationFn: auth.signOut, onSettled: () => navigate({ to: '/login', search: { redirect: undefined } }) })
  const navItem = 'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-foreground [&>svg]:size-4'
  const activeItem = `${navItem} bg-sidebar-accent text-sidebar-foreground [&>svg]:text-sidebar-primary`

  return (
    <main className="min-h-svh w-full min-w-0 max-w-full overflow-x-clip bg-background text-foreground lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-svh flex-col border-e border-sidebar-border bg-sidebar px-5 py-7 lg:flex">
        <Brand />
        <nav className="mt-12 grid gap-1">
          <Link className={navItem} to="/dashboard"><Sparkles />{t('dashboard.overview')}</Link>
          <a className={navItem} href="/dashboard#appointments"><CalendarDays />{t('dashboard.appointments')}</a>
          <Link className={active === 'clinics' ? activeItem : navItem} to="/doctor/clinics"><Building2 />{t('dashboard.clinics')}</Link>
          <Link className={active === 'invitations' ? activeItem : navItem} to="/doctor/invitations"><MailOpen />{t('dashboard.invitations')}</Link>
          <Link className={active === 'notifications' ? activeItem : navItem} to="/notifications"><Bell />{t('dashboard.notifications')}</Link>
          <Link className={active === 'working-hours' ? activeItem : navItem} to="/doctor/working-hours" search={{ clinicId: undefined }}><Clock3 />{t('dashboard.workingHours')}</Link>
          <Link className={active === 'profile' ? activeItem : navItem} to="/doctor/profile"><Stethoscope />{t('dashboard.profile')}</Link>
        </nav>
        <Card className="mt-auto flex-row items-center gap-3 rounded-xl border border-primary/10 bg-primary/5 px-3 py-3 shadow-sm">
  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary"><ShieldCheck className="size-4" /></span>
  <span className="grid"><strong className="text-xs">{t('dashboard.secureSession')}</strong><small className="text-[10px] text-muted-foreground">{t('dashboard.protected')}</small></span>
</Card>
      </aside>

      <section className="min-w-0 max-w-full overflow-x-clip">
        <header className="sticky top-0 z-30 flex min-h-20 min-w-0 max-w-full items-center gap-1 overflow-hidden border-b border-border bg-background/85 px-3 backdrop-blur-xl sm:gap-2 sm:px-6 lg:px-10">
          <div className="me-auto min-w-0 shrink"><span className="lg:hidden"><Brand compact /></span><Link className="hidden text-sm font-bold text-muted-foreground transition hover:text-foreground lg:inline" to="/dashboard">{t('clinicModule.backToDashboard')}</Link></div>
          <PreferencesControls compact />
          <MobileNavigationMenu />
          <NotificationBell />
          <div className="ms-1 hidden max-w-60 items-center gap-3 sm:ms-2 sm:flex">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary ring-2 ring-primary/15">
              {(auth.user?.name ?? '').split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
            </span>
            <span className="grid min-w-0 gap-0.5 text-start leading-tight">
              <strong className="truncate text-[15px] font-extrabold text-foreground">{auth.user?.name}</strong>
              <small className="truncate text-xs font-semibold text-muted-foreground">{t('clinicModule.doctorWorkspace')}</small>
            </span>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="relative size-10 shrink-0 cursor-pointer rounded-xl border-border bg-card text-muted-foreground shadow-sm transition-colors hover:border-[#c98a82]/50 hover:bg-[#f6e6e3] hover:text-[#b5645a] dark:hover:border-[#c98a82]/30 dark:hover:bg-[#c98a82]/15 dark:hover:text-[#d9968d]"
            aria-label={t('common.signOut')}
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            {logout.isPending ? <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" /> : <LogOut className="size-5 rtl:rotate-180" />}
          </Button>
        </header>
        {topBackLink && (
          <div className="flex min-w-0 max-w-full items-center bg-background/60 px-3 py-3 sm:px-6 lg:px-10">
            {topBackLink}
          </div>
        )}
        {children}
      </section>
    </main>
  )
}
