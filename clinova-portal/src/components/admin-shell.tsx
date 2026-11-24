import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { Headset, LayoutDashboard, LoaderCircle, LogOut, Menu, MessageSquareText, ShieldCheck, Stethoscope, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Brand from '@/components/brand'
import PreferencesControls from '@/components/preferences-controls'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/use-auth'

// Shell for the administrator area. Add new modules to the navigation by adding a link in both menus.
export default function AdminShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const auth = useAuth()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const [menuOpen, setMenuOpen] = useState(false)
  const logout = useMutation({ mutationFn: auth.signOut, onSettled: () => navigate({ to: '/login', search: { redirect: undefined } }) })
  const initials = (auth.user?.name ?? '').split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  const navItem = 'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-foreground [&>svg]:size-4'
  const activeItem = `${navItem} bg-sidebar-accent text-sidebar-foreground [&>svg]:text-sidebar-primary`
  const doctorsActive = pathname.startsWith('/admin/doctors')
  const dashboardActive = pathname === '/admin' || pathname === '/admin/'
  const reviewsActive = pathname.startsWith('/admin/reviews')
  const ticketsActive = pathname.startsWith('/admin/support-tickets')
  const menuItem = 'cursor-pointer rounded-xl px-3 py-3 text-sm font-bold normal-case tracking-normal text-muted-foreground focus:bg-sidebar-accent focus:text-sidebar-foreground [&>svg]:size-4'

  return (
    <main className="min-h-svh w-full min-w-0 max-w-full overflow-x-clip bg-background text-foreground lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-svh flex-col border-e border-sidebar-border bg-sidebar px-5 py-7 lg:flex">
        <Brand />
        <nav aria-label={t('admin.navigation')} className="mt-12 grid gap-1">
          <Link className={dashboardActive ? activeItem : navItem} to="/admin"><LayoutDashboard />{t('admin.nav.dashboard')}</Link>
          <Link className={doctorsActive ? activeItem : navItem} to="/admin/doctors" search={{ status: undefined, q: undefined, pageIndex: undefined }}><Stethoscope />{t('admin.nav.doctors')}</Link>
          <Link className={reviewsActive ? activeItem : navItem} to="/admin/reviews"><MessageSquareText />{t('admin.nav.reviews')}</Link>
          <Link className={ticketsActive ? activeItem : navItem} to="/admin/support-tickets" search={{ status: undefined, pageIndex: undefined }}><Headset />{t('admin.nav.supportTickets')}</Link>
        </nav>
        <Card className="mt-auto flex-row items-center gap-2.5 rounded-xl border border-border/60 bg-card/60 px-3 py-2.5 shadow-none ring-0 dark:bg-transparent">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><ShieldCheck className="size-4" /></span>
          <span className="grid min-w-0 gap-0.5 leading-tight"><strong className="truncate text-[13px] font-bold">{t('dashboard.secureSession')}</strong><small className="truncate text-[11px] font-medium text-muted-foreground">{t('dashboard.protected')}</small></span>
        </Card>
      </aside>

      <section className="min-w-0 max-w-full overflow-x-clip">
        <header className="sticky top-0 z-30 flex min-h-20 min-w-0 max-w-full items-center gap-1 overflow-hidden border-b border-border bg-background/85 px-3 backdrop-blur-xl sm:gap-2 sm:px-6 lg:px-10">
          <div className="me-auto min-w-0 shrink">
            <span className="lg:hidden"><Brand compact /></span>
            <span className="hidden text-sm font-bold text-muted-foreground lg:inline">{t('admin.console')}</span>
          </div>
          <PreferencesControls compact />
          <div className="shrink-0 lg:hidden">
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="icon" className="size-10 cursor-pointer rounded-xl bg-foreground/5 text-foreground transition-colors hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-primary/30 data-[popup-open]:bg-foreground/10" aria-label={t(menuOpen ? 'dashboard.closeMenu' : 'dashboard.mobileMenu')} />}>
                {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} className="w-72 max-w-[calc(100dvw-2rem)] rounded-2xl border border-border bg-card p-2 text-foreground shadow-md ring-1 ring-foreground/5" aria-label={t('admin.navigation')}>
                <DropdownMenuItem className={`${menuItem} ${dashboardActive ? 'bg-sidebar-accent text-sidebar-foreground' : ''}`} render={<Link to="/admin" />}><LayoutDashboard />{t('admin.nav.dashboard')}</DropdownMenuItem>
                <DropdownMenuItem className={`${menuItem} ${doctorsActive ? 'bg-sidebar-accent text-sidebar-foreground' : ''}`} render={<Link to="/admin/doctors" search={{ status: undefined, q: undefined, pageIndex: undefined }} />}><Stethoscope />{t('admin.nav.doctors')}</DropdownMenuItem>
                <DropdownMenuItem className={`${menuItem} ${reviewsActive ? 'bg-sidebar-accent text-sidebar-foreground' : ''}`} render={<Link to="/admin/reviews" />}><MessageSquareText />{t('admin.nav.reviews')}</DropdownMenuItem>
                <DropdownMenuItem className={`${menuItem} ${ticketsActive ? 'bg-sidebar-accent text-sidebar-foreground' : ''}`} render={<Link to="/admin/support-tickets" search={{ status: undefined, pageIndex: undefined }} />}><Headset />{t('admin.nav.supportTickets')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="ms-1 hidden max-w-60 items-center gap-3 sm:ms-2 sm:flex">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary ring-2 ring-primary/15">{initials}</span>
            <span className="grid min-w-0 gap-0.5 text-start leading-tight">
              <strong className="truncate text-[15px] font-extrabold text-foreground">{auth.user?.name}</strong>
              <small className="truncate text-xs font-semibold text-muted-foreground">{t('admin.workspace')}</small>
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
        {children}
      </section>
    </main>
  )
}