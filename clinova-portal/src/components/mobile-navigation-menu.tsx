import { Link, useRouterState } from '@tanstack/react-router'
import { Bell, Building2, CalendarDays, Clock3, MailOpen, Menu, Sparkles, Stethoscope, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/use-auth'
import { useNotifications } from '@/hooks/use-notifications'

export default function MobileNavigationMenu() {
  const { t } = useTranslation()
  const auth = useAuth()
  const notifications = useNotifications()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const [open, setOpen] = useState(false)
  const isDoctor = auth.user?.roles.some((role) => role.toLowerCase() === 'doctor')
  const itemClass = 'rounded-xl px-3 py-3 text-sm font-bold normal-case tracking-normal text-muted-foreground focus:bg-sidebar-accent focus:text-sidebar-foreground [&>svg]:size-4'
  const activeClass = `${itemClass} bg-sidebar-accent text-sidebar-foreground [&>svg]:text-sidebar-primary`

  return <div className="lg:hidden">
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger render={<Button type="button" variant="outline" size="icon" className="rounded-xl border-border bg-card/40 text-muted-foreground" aria-label={t(open ? 'dashboard.closeMenu' : 'dashboard.mobileMenu')} />}>
        {open ? <X className="size-4" /> : <Menu className="size-4" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-72 rounded-2xl border border-border bg-card p-2 text-foreground shadow-md ring-1 ring-foreground/5" aria-label={t('dashboard.navigation')}>
        <DropdownMenuItem className={pathname === '/dashboard' ? activeClass : itemClass} render={<Link to="/dashboard" />}><Sparkles />{t('dashboard.overview')}</DropdownMenuItem>
        <DropdownMenuItem className={itemClass} render={<a href="/dashboard#appointments" />}><CalendarDays />{t('dashboard.appointments')}</DropdownMenuItem>
        {isDoctor && <DropdownMenuItem className={pathname.startsWith('/doctor/clinics') ? activeClass : itemClass} render={<Link to="/doctor/clinics" />}><Building2 />{t('dashboard.clinics')}</DropdownMenuItem>}
        {isDoctor && <DropdownMenuItem className={pathname === '/doctor/invitations' ? activeClass : itemClass} render={<Link to="/doctor/invitations" />}><MailOpen />{t('dashboard.invitations')}</DropdownMenuItem>}
        <DropdownMenuItem className={pathname === '/notifications' ? activeClass : itemClass} render={<Link to="/notifications" />}>
          <Bell />{t('dashboard.notifications')}
          {notifications.unreadCount > 0 && <span className="ms-auto rounded-full border border-warm/20 bg-warm/10 px-2 py-0.5 text-[10px] font-bold text-warm">{notifications.unreadCount > 99 ? '99+' : notifications.unreadCount}</span>}
        </DropdownMenuItem>
        {isDoctor && <DropdownMenuItem className={itemClass} render={<a href="/dashboard#schedule" />}><Clock3 />{t('dashboard.workingHours')}</DropdownMenuItem>}
        {isDoctor
          ? <DropdownMenuItem className={pathname === '/doctor/profile' ? activeClass : itemClass} render={<Link to="/doctor/profile" />}><Stethoscope />{t('dashboard.profile')}</DropdownMenuItem>
          : <DropdownMenuItem className={itemClass} render={<a href="/dashboard#profile" />}><Stethoscope />{t('dashboard.profile')}</DropdownMenuItem>}
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
}
