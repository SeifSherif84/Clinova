import { Link } from '@tanstack/react-router'
import { ArrowRight, BadgeCheck, Check, FileText, Headset, MessageSquareText, ShieldCheck, Star, Stethoscope, UserRound, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import AdminShell from '@/components/admin-shell'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'

// Every module link resets its filters so the target page opens in its default view.
const doctorsSearch = { status: undefined, q: undefined, pageIndex: undefined }
const reviewsSearch = { status: undefined, q: undefined, pageIndex: undefined }
const ticketsSearch = { status: undefined, pageIndex: undefined }

const tones = {
  primary: { chip: 'bg-primary/10 text-primary', glow: 'from-primary/15' },
  support: { chip: 'bg-chart-3/10 text-chart-3', glow: 'from-chart-3/15' },
  warm: { chip: 'bg-warm/10 text-warm', glow: 'from-warm/15' },
} as const

const ctaClass = 'inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-bold text-primary-foreground transition hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none after:absolute after:inset-0 after:content-[\'\'] motion-reduce:transition-none'
const pillClass = 'inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card/70 px-3.5 text-[13px] font-bold text-muted-foreground backdrop-blur transition hover:border-primary/30 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none motion-reduce:transition-none [&>svg]:size-4 [&>svg]:text-primary'
const nodeClass = 'group absolute grid w-28 -translate-x-1/2 -translate-y-1/2 justify-items-center gap-2 text-center outline-none sm:w-32'
const nodeIconClass = 'grid size-14 place-items-center rounded-2xl border border-border bg-card shadow-lg transition group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:shadow-xl group-focus-visible:ring-2 group-focus-visible:ring-primary/40 motion-reduce:transition-none sm:size-16 [&>svg]:size-6 sm:[&>svg]:size-7'
const nodeLabelClass = 'text-[11px] leading-4 font-bold text-foreground sm:text-xs'

function enter(index: number) {
  return { className: 'animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-700 motion-reduce:animate-none', style: { animationDelay: `${index * 120}ms` } }
}

function Bar({ className = '' }: { className?: string }) {
  return <div className={`h-2 rounded-full bg-foreground/12 ${className}`} />
}

function DoctorArt() {
  return (
    <div aria-hidden="true" className="relative mx-auto h-56 w-full max-w-xs">
      <div className="absolute inset-x-6 top-3 h-44 rotate-6 rounded-2xl border border-border bg-muted/40" />
      <div className="absolute inset-x-2 top-8 rounded-2xl border border-border bg-card p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><UserRound className="size-7" /></span>
          <div className="grid flex-1 gap-2"><Bar className="h-2.5 w-3/4" /><Bar className="w-1/2" /></div>
        </div>
        <div className="mt-5 grid gap-2.5">
          {[0, 1].map((row) => (
            <div key={row} className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
              <FileText className="size-4 shrink-0 text-primary" /><Bar className="w-2/3" />
            </div>
          ))}
        </div>
      </div>
      <span className="absolute -end-1 top-0 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg ring-8 ring-primary/10"><BadgeCheck className="size-7" /></span>
    </div>
  )
}

function SupportArt() {
  const { t } = useTranslation()
  return (
    <div aria-hidden="true" className="relative mx-auto grid w-full max-w-xs gap-3 py-2">
      <div className="w-4/5 rounded-2xl rounded-ss-md border border-border bg-card p-4 shadow-lg">
        <div className="grid gap-2"><Bar className="w-full" /><Bar className="w-2/3" /></div>
      </div>
      <div className="ms-auto w-4/5 rounded-2xl rounded-se-md bg-chart-3 p-4 shadow-lg">
        <div className="grid gap-2"><div className="h-2 w-full rounded-full bg-white/60" /><div className="h-2 w-1/2 rounded-full bg-white/60" /></div>
      </div>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {(['Open', 'InProgress', 'Resolved'] as const).map((status, index) => (
          <span key={status} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
            <i className={`size-1.5 rounded-full ${index === 0 ? 'bg-warm' : index === 1 ? 'bg-chart-3' : 'bg-primary'}`} />
            {t('admin.supportTickets.status.' + status)}
          </span>
        ))}
      </div>
      <span className="absolute -end-2 -top-1 grid size-12 place-items-center rounded-full bg-chart-3/15 text-chart-3 ring-8 ring-chart-3/5"><Headset className="size-6" /></span>
    </div>
  )
}

function ReviewsArt() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-xs py-2">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xl">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, index) => <Star key={index} className="size-6 fill-current text-warm" />)}
        </div>
        <div className="mt-4 grid gap-2"><Bar className="w-full" /><Bar className="w-11/12" /><Bar className="w-1/2" /></div>
        <div className="mt-5 flex items-center justify-end gap-2.5">
          <span className="grid size-10 place-items-center rounded-full bg-destructive/10 text-destructive"><X className="size-5" /></span>
          <span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-md ring-4 ring-primary/10"><Check className="size-5" /></span>
        </div>
      </div>
    </div>
  )
}

function ModulePanel({ index, tone, icon, name, title, description, points, art, action, reversed = false }: {
  index: number
  tone: keyof typeof tones
  icon: ReactNode
  name: string
  title: string
  description: string
  points: string[]
  art: ReactNode
  action: ReactNode
  reversed?: boolean
}) {
  const style = tones[tone]
  const motion = enter(index + 2)
  return (
    <article {...motion} className={`group relative isolate grid items-center gap-8 overflow-hidden rounded-3xl border border-border bg-card p-6 transition hover:border-primary/30 hover:shadow-xl motion-reduce:transition-none sm:p-8 lg:grid-cols-2 lg:gap-12 lg:p-10 ${motion.className}`}>
      <span className={`pointer-events-none absolute -top-24 size-72 rounded-full bg-gradient-to-br ${style.glow} to-transparent blur-3xl ${reversed ? '-start-24' : '-end-24'}`} />
      <div className="relative grid content-center gap-5">
        <div className="flex items-center gap-3">
          <span className={`grid size-11 place-items-center rounded-xl ${style.chip} [&>svg]:size-5`}>{icon}</span>
          <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase rtl:tracking-normal">{String(index + 1).padStart(2, '0')} · {name}</span>
        </div>
        <h3 className="font-sans text-2xl leading-snug font-bold sm:text-3xl">{title}</h3>
        <p className="max-w-xl text-sm leading-7 font-medium text-muted-foreground sm:text-base">{description}</p>
        <ul className="grid gap-2.5">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-3 text-sm font-semibold text-foreground/85">
              <i className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />{point}
            </li>
          ))}
        </ul>
        <div className="pt-1">{action}</div>
      </div>
      <div className={`relative ${reversed ? 'lg:order-first' : ''}`}>{art}</div>
    </article>
  )
}

export default function AdminDashboardPage() {
  const { t } = useTranslation()
  const auth = useAuth()
  const firstName = auth.user?.name.split(' ')[0] || t('dashboard.fallbackName')
  const hero = enter(0)
  const hub = enter(1)

  return (
    <AdminShell>
      <div className="mx-auto grid w-full min-w-0 max-w-screen-2xl gap-10 p-4 sm:p-6 lg:gap-14 lg:p-10">
        <section {...hero} className={`relative isolate grid items-center gap-10 overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/12 via-card to-primary/5 p-6 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:p-14 ${hero.className}`}>
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,var(--color-primary)_1px,transparent_0)] [background-size:26px_26px]" />
          <span aria-hidden="true" className="pointer-events-none absolute -end-24 -top-24 -z-10 size-96 rounded-full bg-primary/10 blur-3xl dark:bg-primary/5" />
          <div className="grid content-center gap-5">
            <Badge className="h-auto w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] font-bold tracking-wider text-primary uppercase rtl:tracking-normal"><ShieldCheck className="size-3.5" />{t('admin.dashboard.eyebrow')}</Badge>
            <p className="text-base font-bold text-muted-foreground sm:text-lg">{t('admin.dashboard.greeting', { name: firstName })}</p>
            <h1 className="font-sans text-4xl leading-[1.1] font-bold break-words sm:text-5xl xl:text-6xl">{t('admin.dashboard.title')}</h1>
            <p className="max-w-xl text-sm leading-7 font-medium text-muted-foreground sm:text-base">{t('admin.dashboard.description')}</p>
            <nav aria-label={t('admin.dashboard.quickAccess')} className="mt-2 flex flex-wrap gap-2">
              <Link to="/admin/doctors" search={doctorsSearch} className={pillClass}><Stethoscope />{t('admin.nav.doctors')}</Link>
              <Link to="/admin/support-tickets" search={ticketsSearch} className={pillClass}><Headset />{t('admin.nav.supportTickets')}</Link>
              <Link to="/admin/reviews" search={reviewsSearch} className={pillClass}><MessageSquareText />{t('admin.nav.reviews')}</Link>
            </nav>
          </div>

          <div {...hub} className={`relative mx-auto aspect-square w-full max-w-md ${hub.className}`} role="group" aria-label={t('admin.dashboard.mapLabel')}>
            <span aria-hidden="true" className="absolute inset-[10%] rounded-full border border-dashed border-primary/25" />
            <span aria-hidden="true" className="absolute inset-[30%] rounded-full border border-primary/15" />
            <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
              {[[20, 25], [80, 25], [50, 82]].map(([x, y]) => (
                <line key={`${x}-${y}`} x1="50" y1="50" x2={x} y2={y} vectorEffect="non-scaling-stroke" strokeWidth="1.5" strokeDasharray="4 6" className="animate-[dash-flow_2.5s_linear_infinite] stroke-primary/45 motion-reduce:animate-none" />
              ))}
            </svg>
            <div aria-hidden="true" className="absolute start-1/2 top-1/2 grid size-24 -translate-x-1/2 -translate-y-1/2 place-items-center rtl:translate-x-1/2">
              <span className="absolute size-24 animate-[ripple_2.4s_ease-out_infinite] rounded-full border-2 border-primary/40 motion-reduce:animate-none" />
              <span className="absolute size-24 animate-[ripple_2.4s_ease-out_infinite_1.2s] rounded-full border-2 border-primary/40 motion-reduce:animate-none" />
              <span className="relative grid size-20 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl ring-8 ring-primary/10"><ShieldCheck className="size-9" /></span>
            </div>

            <Link to="/admin/doctors" search={doctorsSearch} className={nodeClass} style={{ left: '20%', top: '25%' }}>
              <span className={`${nodeIconClass} text-primary`}><Stethoscope /></span>
              <span className={nodeLabelClass}>{t('admin.nav.doctors')}</span>
            </Link>
            <Link to="/admin/support-tickets" search={ticketsSearch} className={nodeClass} style={{ left: '80%', top: '25%' }}>
              <span className={`${nodeIconClass} text-chart-3`}><Headset /></span>
              <span className={nodeLabelClass}>{t('admin.nav.supportTickets')}</span>
            </Link>
            <Link to="/admin/reviews" search={reviewsSearch} className={nodeClass} style={{ left: '50%', top: '82%' }}>
              <span className={`${nodeIconClass} text-warm`}><MessageSquareText /></span>
              <span className={nodeLabelClass}>{t('admin.nav.reviews')}</span>
            </Link>
          </div>
        </section>

        <div className="grid gap-2">
          <h2 className="font-sans text-2xl font-bold sm:text-3xl">{t('admin.dashboard.modulesTitle')}</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{t('admin.dashboard.modulesDescription')}</p>
        </div>

        <div className="-mt-4 grid gap-6 lg:-mt-8 lg:gap-8">
          <ModulePanel
            index={0}
            tone="primary"
            icon={<Stethoscope />}
            name={t('admin.dashboard.doctors.name')}
            title={t('admin.dashboard.doctors.title')}
            description={t('admin.dashboard.doctors.description')}
            points={[t('admin.dashboard.doctors.point1'), t('admin.dashboard.doctors.point2'), t('admin.dashboard.doctors.point3')]}
            art={<DoctorArt />}
            action={<Link to="/admin/doctors" search={doctorsSearch} className={ctaClass}>{t('admin.dashboard.open')}<ArrowRight className="size-4 rtl:rotate-180" /></Link>}
          />
          <ModulePanel
            index={1}
            tone="support"
            icon={<Headset />}
            name={t('admin.dashboard.support.name')}
            title={t('admin.dashboard.support.title')}
            description={t('admin.dashboard.support.description')}
            points={[t('admin.dashboard.support.point1'), t('admin.dashboard.support.point2'), t('admin.dashboard.support.point3')]}
            art={<SupportArt />}
            reversed
            action={<Link to="/admin/support-tickets" search={ticketsSearch} className={ctaClass}>{t('admin.dashboard.open')}<ArrowRight className="size-4 rtl:rotate-180" /></Link>}
          />
          <ModulePanel
            index={2}
            tone="warm"
            icon={<MessageSquareText />}
            name={t('admin.dashboard.reviews.name')}
            title={t('admin.dashboard.reviews.title')}
            description={t('admin.dashboard.reviews.description')}
            points={[t('admin.dashboard.reviews.point1'), t('admin.dashboard.reviews.point2'), t('admin.dashboard.reviews.point3')]}
            art={<ReviewsArt />}
            action={<Link to="/admin/reviews" search={reviewsSearch} className={ctaClass}>{t('admin.dashboard.open')}<ArrowRight className="size-4 rtl:rotate-180" /></Link>}
          />
        </div>
      </div>
    </AdminShell>
  )
}