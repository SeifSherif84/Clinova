import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { Bell, CalendarDays, CalendarPlus, ChevronDown, Info, LifeBuoy, LoaderCircle, LogOut, Menu, MessageSquareText, Sparkles, Stethoscope, UserRound, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Brand from '@/components/brand'
import NotificationBell from '@/components/notification-bell'
import PreferencesControls from '@/components/preferences-controls'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/use-auth'

type PatientPath = '/dashboard' | '/patient/doctors' | '/patient/appointments' | '/patient/reviews' | '/patient/support-requests' | '/patient/faqs'

const navLink = 'shrink-0 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none'
const menuItem = 'cursor-pointer rounded-xl px-3 py-3 text-sm font-bold normal-case tracking-normal text-muted-foreground focus:bg-primary/10 focus:text-primary data-[highlighted]:bg-primary/10 data-[highlighted]:text-primary [&>svg]:size-4'

function PatientHeader() {
  const { t } = useTranslation()
  const auth = useAuth()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const [menuOpen, setMenuOpen] = useState(false)
  const logout = useMutation({ mutationFn: auth.signOut, onSettled: () => navigate({ to: '/login', search: { redirect: undefined } }) })
  const name = auth.user?.name ?? ''
  const firstName = name.split(' ')[0]
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  const items: { to: PatientPath; label: string; icon: ReactNode; active: boolean }[] = [
    { to: '/dashboard', label: t('patientPortal.nav.home', { defaultValue: 'Home' }), icon: <Sparkles />, active: pathname === '/dashboard' },
    { to: '/patient/doctors', label: t('patientPortal.nav.doctors', { defaultValue: 'Find a Doctor' }), icon: <Stethoscope />, active: pathname.startsWith('/patient/doctors') },
    { to: '/patient/appointments', label: t('patientPortal.nav.appointments', { defaultValue: 'My Appointments' }), icon: <CalendarDays />, active: pathname.startsWith('/patient/appointments') },
    { to: '/patient/reviews', label: t('patientPortal.nav.reviews', { defaultValue: 'My Reviews' }), icon: <MessageSquareText />, active: pathname.startsWith('/patient/reviews') },
    { to: '/patient/support-requests', label: t('patientPortal.nav.supportRequests', { defaultValue: 'My Support Requests' }), icon: <LifeBuoy />, active: pathname.startsWith('/patient/support-requests') },
    { to: '/patient/faqs', label: t('patientPortal.nav.faqs', { defaultValue: 'FAQs' }), icon: <Info />, active: pathname.startsWith('/patient/faqs') },
  ]

  return <header className="sticky top-3 z-40 px-3 sm:px-6 lg:px-8">
    <div className="mx-auto flex min-h-16 w-full max-w-[110rem] items-center gap-3 rounded-full border border-border/70 bg-background/80 px-4 shadow-lg shadow-primary/5 backdrop-blur-xl sm:px-5 lg:px-6">
      <span className="lg:hidden"><Brand compact /></span>
      <span className="hidden lg:block"><Brand /></span>

      <nav aria-label={t('dashboard.navigation')} className="mx-auto hidden min-w-0 items-center gap-1 lg:flex">
        {items.map((item) => <Link key={item.to} to={item.to} aria-current={item.active ? 'page' : undefined} className={`${navLink} ${item.active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'}`}>{item.label}</Link>)}
      </nav>

      <div className="ms-auto flex items-center gap-1.5 sm:gap-2 lg:ms-0">
        <Button className="hidden h-10 cursor-pointer rounded-xl px-4 text-[13px] font-bold normal-case tracking-normal sm:inline-flex" render={<Link to="/patient/doctors" />}>
          <CalendarPlus className="size-4" />
          {t('patientPortal.nav.book', { defaultValue: 'Book an appointment' })}
        </Button>
        <PreferencesControls compact />
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger render={<button type="button" aria-label={t('patientPortal.nav.account', { defaultValue: 'Account menu' })} className="flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card py-1 ps-1 pe-2 outline-none transition hover:border-primary/30 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary/30 data-[popup-open]:border-primary/30 sm:pe-3" />}>
            <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{initials}</span>
            <span className="hidden max-w-28 truncate text-sm font-bold xl:block">{firstName}</span>
            <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={10} className="w-64 overflow-hidden rounded-2xl border border-border bg-popover p-0 shadow-2xl ring-1 ring-black/5">
            <div className="flex items-center gap-3 border-b border-border/60 bg-gradient-to-br from-primary/10 via-primary/[0.03] to-transparent px-4 py-3.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/65 text-xs font-bold text-primary-foreground">{initials}</span>
              <span className="grid min-w-0 gap-0.5 text-start">
                <strong className="truncate text-sm font-bold">{name}</strong>
                <small className="truncate text-[11px] font-semibold text-muted-foreground">{t('patient.workspace', { defaultValue: 'Patient workspace' })}</small>
              </span>
            </div>
            <div className="grid gap-0.5 px-1.5 py-1.5">
              <DropdownMenuItem className={menuItem} render={<Link to="/patient/profile" />}><UserRound />{t('patientPortal.nav.profile', { defaultValue: 'My profile' })}</DropdownMenuItem>
              <DropdownMenuItem className={menuItem} render={<Link to="/notifications" />}><Bell />{t('patientPortal.nav.notifications', { defaultValue: 'Notifications' })}</DropdownMenuItem>
            </div>
            <div role="separator" className="mx-3 h-px bg-border/70" />
            <div className="grid gap-0.5 px-1.5 py-1.5">
              <DropdownMenuItem className="cursor-pointer rounded-xl px-3 py-3 text-sm font-bold normal-case tracking-normal text-destructive focus:bg-destructive/10 data-[highlighted]:bg-destructive/10 [&>svg]:size-4" disabled={logout.isPending} onClick={() => logout.mutate()}>
                {logout.isPending ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <LogOut className="rtl:rotate-180" />}
                {t('common.signOut')}
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="lg:hidden">
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="icon" className="size-10 cursor-pointer rounded-xl bg-foreground/5 text-foreground transition-colors hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-primary/30 data-[popup-open]:bg-foreground/10" aria-label={t(menuOpen ? 'dashboard.closeMenu' : 'dashboard.mobileMenu')} />}>
              {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-72 max-w-[calc(100dvw-2rem)] rounded-2xl border border-border bg-card p-2 text-foreground shadow-md ring-1 ring-foreground/5" aria-label={t('dashboard.navigation')}>
              {items.map((item) => <DropdownMenuItem key={item.to} className={`${menuItem} ${item.active ? 'bg-primary/10 text-primary' : ''}`} render={<Link to={item.to} />}>{item.icon}{item.label}</DropdownMenuItem>)}
              <div role="separator" className="mx-2 my-1 h-px bg-border/70" />
              <DropdownMenuItem className="cursor-pointer rounded-xl bg-primary px-3 py-3 text-sm font-bold normal-case tracking-normal text-primary-foreground focus:bg-primary/90 focus:text-primary-foreground data-[highlighted]:bg-primary/90 data-[highlighted]:text-primary-foreground [&>svg]:size-4" render={<Link to="/patient/doctors" />}><CalendarPlus />{t('patientPortal.nav.book', { defaultValue: 'Book an appointment' })}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  </header>
}

function PatientFooter() {
  const { t } = useTranslation()
  const link = 'text-sm font-semibold text-muted-foreground transition-colors hover:text-primary'
  const title = 'text-xs font-bold tracking-wider text-foreground uppercase'

  return <footer className="border-t border-border bg-card/40">
    <div className="mx-auto grid w-full max-w-screen-2xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-[auto_auto_auto_auto] md:justify-between md:gap-12 lg:px-8">
      <div className="flex items-center justify-start">
        <Brand />
      </div>
      <nav className="grid content-start gap-3" aria-label={t('patientPortal.footer.explore', { defaultValue: 'Explore' })}>
        <h3 className={title}>{t('patientPortal.footer.explore', { defaultValue: 'Explore' })}</h3>
        <Link className={link} to="/patient/doctors">{t('patientPortal.nav.doctors', { defaultValue: 'Find a Doctor' })}</Link>
        <Link className={link} to="/patient/appointments">{t('patientPortal.nav.appointments', { defaultValue: 'My Appointments' })}</Link>
        <Link className={link} to="/patient/reviews">{t('patientPortal.nav.reviews', { defaultValue: 'My Reviews' })}</Link>
      </nav>
      <nav className="grid content-start gap-3" aria-label={t('patientPortal.footer.account', { defaultValue: 'Account' })}>
        <h3 className={title}>{t('patientPortal.footer.account', { defaultValue: 'Account' })}</h3>
        <Link className={link} to="/patient/profile">{t('patientPortal.nav.profile', { defaultValue: 'My profile' })}</Link>
        <Link className={link} to="/notifications">{t('patientPortal.nav.notifications', { defaultValue: 'Notifications' })}</Link>
      </nav>
      <nav className="grid content-start gap-3" aria-label={t('patientPortal.footer.help', { defaultValue: 'Help' })}>
        <h3 className={title}>{t('patientPortal.footer.help', { defaultValue: 'Help' })}</h3>
        <Link className={link} to="/patient/faqs">{t('patientPortal.nav.faqs', { defaultValue: 'FAQs' })}</Link>
        <Link className={link} to="/patient/about">{t('patientPortal.nav.about', { defaultValue: 'About Us' })}</Link>
        <Link className={link} to="/patient/help">{t('patientPortal.nav.help', { defaultValue: 'Help Center' })}</Link>
        <Link className={link} to="/patient/support-requests">{t('patientPortal.nav.supportRequests', { defaultValue: 'My Support Requests' })}</Link>
      </nav>
    </div>
    <div className="border-t border-border/70">
      <p className="mx-auto w-full max-w-screen-2xl px-4 py-4 text-xs font-semibold text-muted-foreground sm:px-6 lg:px-8">© {new Date().getFullYear()} Clinova. {t('patientPortal.footer.rights', { defaultValue: 'All rights reserved.' })}</p>
    </div>
  </footer>
}

// Website-style shell for patients: top navigation, page content, footer.
export default function PatientShell({ children, hideFooter = false }: { children: ReactNode; hideFooter?: boolean }) {
  return <div className="flex min-h-svh min-w-0 flex-col bg-background text-foreground selection:bg-primary/25">
    <PatientHeader />
    <main className="min-w-0 flex-1">{children}</main>
    {!hideFooter && <PatientFooter />}
  </div>
}