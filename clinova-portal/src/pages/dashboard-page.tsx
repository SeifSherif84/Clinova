import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { Bell, Building2, CalendarDays, ChevronRight, Clock3, LogOut, MailOpen, Search, ShieldCheck, Sparkles, Stethoscope } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Brand from '@/components/brand'
import PreferencesControls from '@/components/preferences-controls'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/use-auth'

export default function DashboardPage() {
  const { t } = useTranslation()
  const auth = useAuth()
  const navigate = useNavigate()
  const logout = useMutation({ mutationFn: auth.signOut, onSettled: () => navigate({ to: '/login', search: { redirect: undefined } }) })
  const firstName = auth.user?.name.split(' ')[0] || t('dashboard.fallbackName')
  const isDoctor = auth.user?.roles.some((role) => role.toLowerCase() === 'doctor')
  const navItem = 'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-foreground [&>svg]:size-4'

  return (
    <main className="min-h-svh bg-background text-foreground lg:grid lg:grid-cols-[16.5rem_1fr] rtl:lg:grid-cols-[16.5rem_1fr]">
      <aside className="sticky top-0 hidden h-svh flex-col border-e border-sidebar-border bg-sidebar px-5 py-7 lg:flex">
        <Brand />
        <nav className="mt-12 grid gap-1">
          <a className={`${navItem} bg-sidebar-accent text-sidebar-foreground [&>svg]:text-sidebar-primary`} href="#overview"><Sparkles /> {t('dashboard.overview')}</a>
          <a className={navItem} href="#appointments"><CalendarDays /> {t('dashboard.appointments')}</a>
          {isDoctor && <Link className={navItem} to="/doctor/clinics"><Building2 /> {t('dashboard.clinics')}</Link>}
          {isDoctor && <Link className={navItem} to="/doctor/invitations"><MailOpen /> {t('dashboard.invitations')}</Link>}
          {isDoctor && <a className={navItem} href="#schedule"><Clock3 /> {t('dashboard.workingHours')}</a>}
          {isDoctor ? <Link className={navItem} to="/doctor/profile"><Stethoscope /> {t('dashboard.profile')}</Link> : <a className={navItem} href="#profile"><Stethoscope /> {t('dashboard.profile')}</a>}
        </nav>
        <Card className="mt-auto flex-row items-center gap-3 rounded-xl border border-primary/10 bg-primary/5 px-3 py-3 animate-glow">
  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary"><ShieldCheck className="size-4" /></span>
  <span className="grid"><strong className="text-xs">{t('dashboard.secureSession')}</strong><small className="text-[10px] text-muted-foreground">{t('dashboard.protected')}</small></span>
</Card>
      </aside>

      <section className="min-w-0">
        <header className="sticky top-0 z-30 flex min-h-20 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur-xl sm:px-6 lg:px-10">
          <div className="me-auto lg:hidden"><Brand compact /></div>
          <div className="relative hidden w-full max-w-md lg:block"><Search className="absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="h-11 rounded-xl border border-input bg-card/40 ps-10 text-xs placeholder:text-muted-foreground/60 focus-visible:border-primary/50" placeholder={t('dashboard.search')} aria-label={t('dashboard.search')} /></div>
          <PreferencesControls compact />
          {isDoctor && <Button variant="outline" size="icon" className="rounded-xl border-border bg-card/40 text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden" aria-label={t('dashboard.invitations')} render={<Link to="/doctor/invitations" />}><MailOpen className="size-4" /></Button>}
          <Button variant="outline" size="icon" className="relative rounded-xl border-border bg-card/40 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={t('dashboard.notifications')}><Bell className="size-4" /><i className="absolute top-2 end-2 size-1.5 rounded-full bg-warm" /></Button>
          <Button variant="ghost" className="ms-0 h-auto rounded-xl px-1.5 py-1.5 normal-case hover:bg-accent sm:px-2" type="button"><span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/65 text-base font-bold text-primary-foreground">{firstName.charAt(0)}</span><div className="hidden max-w-48 text-start sm:grid"><strong className="truncate text-base font-bold text-foreground">{auth.user?.name}</strong><small className="truncate text-xs font-medium tracking-normal text-muted-foreground normal-case">{auth.user?.roles.join(' · ') || t('dashboard.member')}</small></div></Button>
          <Button variant="outline" size="icon" className="rounded-xl border-border bg-card/40 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={t('common.signOut')} onClick={() => logout.mutate()} disabled={logout.isPending}><LogOut className="size-4 rtl:rotate-180" /></Button>
        </header>

        <div className="mx-auto w-full max-w-[100rem] p-4 sm:p-6 lg:p-10" id="overview">
          <Card className="relative min-h-60 justify-center overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/15 via-card to-primary/10 px-6 py-8 sm:px-10 sm:py-10 lg:min-h-64">
            <div className="pointer-events-none absolute -end-28 size-80 rounded-full border border-primary/15 shadow-[inset_0_0_0_3rem_color-mix(in_oklab,var(--primary)_3%,transparent)]" />
            <CardContent className="relative z-10 flex items-center justify-between p-0">
              <div><Badge className="text-primary">{t('dashboard.greetingBadge')}</Badge><h1 className="mt-3 font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl rtl:tracking-normal">{t('dashboard.greeting', { name: firstName })}</h1><p className="mt-4 max-w-xl text-xs leading-6 text-muted-foreground sm:text-sm">{t('dashboard.greetingDescription')}</p></div>
              <svg className="relative z-10 hidden w-56 text-primary/35 md:block rtl:-scale-x-100" viewBox="0 0 260 150" aria-hidden="true"><path d="M18 108c33-59 50-70 77-41 24 27 41 5 60-26 20-33 49-17 85 50" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5 8" className="animate-[dash-flow_2.5s_linear_infinite] motion-reduce:animate-none" /><circle className="fill-warm" cx="18" cy="108" r="8"/><circle className="fill-warm" cx="95" cy="67" r="8"/><circle className="fill-warm" cx="155" cy="41" r="8"/><circle className="fill-warm" cx="240" cy="91" r="8"/></svg>
            </CardContent>
          </Card>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card className="grid min-h-40 grid-cols-[auto_1fr_auto] items-start gap-3 rounded-2xl border border-border bg-card p-5"><span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><CalendarDays className="size-5" /></span><div className="grid gap-1"><small className="text-[11px] tracking-wider text-muted-foreground uppercase">{t('dashboard.nextAppointment')}</small><strong className="font-heading text-lg font-bold">{t('dashboard.nothingScheduled')}</strong><p className="text-xs leading-5 text-muted-foreground">{t('dashboard.appointmentDescription')}</p></div><Button variant="ghost" size="icon-xs" className="rounded-full bg-muted text-muted-foreground" aria-label={t('dashboard.viewAppointments')}><ChevronRight className="size-3.5 rtl:rotate-180" /></Button></Card>
            <Card className="grid min-h-40 grid-cols-[auto_1fr_auto] items-start gap-3 rounded-2xl border border-border bg-card p-5"><span className="grid size-11 place-items-center rounded-xl bg-warm/10 text-warm"><Bell className="size-5" /></span><div className="grid gap-1"><small className="text-[11px] tracking-wider text-muted-foreground uppercase">{t('dashboard.notifications')}</small><strong className="font-heading text-lg font-bold">{t('dashboard.caughtUp')}</strong><p className="text-xs leading-5 text-muted-foreground">{t('dashboard.notificationsDescription')}</p></div><Button variant="ghost" size="icon-xs" className="rounded-full bg-muted text-muted-foreground" aria-label={t('dashboard.viewNotifications')}><ChevronRight className="size-3.5 rtl:rotate-180" /></Button></Card>
            <Card className="grid min-h-40 grid-cols-[auto_1fr] items-start gap-3 rounded-2xl border border-border bg-gradient-to-br from-warm/7 to-card p-5 md:col-span-2 xl:col-span-1"><span className="m-2 size-2.5 animate-pulse rounded-full bg-primary ring-8 ring-primary/8" /><div className="grid gap-1"><small className="text-[11px] tracking-wider text-muted-foreground uppercase">{t('dashboard.apiConnection')}</small><strong className="font-heading text-lg font-bold">{t('dashboard.authReady')}</strong><p className="text-xs leading-5 text-muted-foreground">{t('dashboard.authDescription')}</p></div></Card>
          </div>

          <Card className="mt-4 grid items-center gap-6 rounded-2xl border border-border bg-card/65 p-6 text-center sm:p-8 md:grid-cols-[10rem_1fr] md:text-start">
<div className="relative mx-auto grid size-36 place-items-center">
  <span className="absolute size-28 rounded-full border-2 border-primary/40 animate-[ripple_2s_ease-out_infinite] motion-reduce:animate-none" />
  <span className="absolute size-28 rounded-full border-2 border-primary/40 animate-[ripple_2s_ease-out_infinite_0.66s] motion-reduce:animate-none" />
  <span className="absolute size-28 rounded-full border-2 border-primary/40 animate-[ripple_2s_ease-out_infinite_1.33s] motion-reduce:animate-none" />
  <i className="size-7 rounded-full bg-primary" />
</div>
            <CardContent className="p-0"><Badge className="text-primary">{t('dashboard.freshStart')}</Badge><h2 className="mt-2 font-heading text-2xl font-bold sm:text-3xl">{t('dashboard.growTitle')}</h2><p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground">{t('dashboard.growDescription')}</p></CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
