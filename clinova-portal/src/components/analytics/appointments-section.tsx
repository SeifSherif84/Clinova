import type { UseQueryResult } from '@tanstack/react-query'
import { Ban, CalendarCheck2, CalendarDays, CircleCheckBig, Clock3, UserX } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { percentOf } from '@/lib/analytics'
import type { AppointmentOverview } from '@/types/analytics'
import { AnalyticsSection, QueryBoundary } from './analytics-section'

/**
 * Each status owns ONE text colour class. Everything else (ring stroke, dot, tint)
 * derives from `currentColor`, so a status can never drift between the chart and the list.
 * Teal carries its own dark variant; the rest come from the theme tokens.
 */
const segments: { key: keyof AppointmentOverview; label: string; icon: ReactNode; tone: string }[] = [
  { key: 'confirmedAppointments', label: 'confirmed', icon: <CalendarCheck2 />, tone: 'text-primary' },
  { key: 'completedAppointments', label: 'completed', icon: <CircleCheckBig />, tone: 'text-teal-600 dark:text-teal-400' },
  { key: 'pendingVerificationAppointments', label: 'pending', icon: <Clock3 />, tone: 'text-warm' },
  { key: 'cancelledAppointments', label: 'cancelled', icon: <Ban />, tone: 'text-destructive' },
  { key: 'noShowAppointments', label: 'noShow', icon: <UserX />, tone: 'text-muted-foreground' },
]

type Row = (typeof segments)[number] & { value: number; share: number }

// Ring geometry. pathLength=100 on every arc, so all maths below is in percent units.
const R = 80
const STROKE = 16
const CAP = (STROKE / 2 / (2 * Math.PI * R)) * 100 // extra length added by each rounded cap
const GAP = 1.4 // visible space between neighbouring arcs

export function AppointmentsSection({
  query,
  open,
  onToggle,
}: {
  query: UseQueryResult<AppointmentOverview, Error>
  open: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()

  return (
    <AnalyticsSection
  icon={<CalendarDays />}
  title={t('analytics.appointments.title')}
  description={t('analytics.appointments.description')}
  busy={query.isFetching}
  collapsible
  open={open}
  onToggle={onToggle}
  panelId="analytics-panel-appointments"
>
      <QueryBoundary query={query}>{(data) => <Breakdown data={data} />}</QueryBoundary>
    </AnalyticsSection>
  )
}

function Breakdown({ data }: { data: AppointmentOverview }) {
  const { t } = useTranslation()
  const [active, setActive] = useState<keyof AppointmentOverview | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const total = segments.reduce((sum, s) => sum + data[s.key], 0)
  const rows: Row[] = segments.map((s) => ({ ...s, value: data[s.key], share: percentOf(data[s.key], total) }))

  // Ring keeps the canonical status order; the list ranks by real volume.
  const present = rows.filter((r) => r.value > 0).sort((a, b) => b.value - a.value)
  const empty = rows.filter((r) => r.value === 0)
  const focused = rows.find((r) => r.key === active) ?? null

  const bind = (key: keyof AppointmentOverview) => ({
    onMouseEnter: () => setActive(key),
    onMouseLeave: () => setActive(null),
    onFocus: () => setActive(key),
    onBlur: () => setActive(null),
  })

  // Arc placement along the ring, cumulative and exact to the underlying counts.
  let cursor = 0
  const arcs = rows.map((r) => {
    const span = total === 0 ? 0 : (r.value / total) * 100
    const start = cursor
    cursor += span
    return { row: r, len: Math.max(span - GAP - CAP * 2, 0.01), offset: start + GAP / 2 + CAP }
  })

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-14">
      {/* Ring */}
      <div className="relative mx-auto aspect-square w-full max-w-[16rem]">
        <div className="absolute inset-[14%] rounded-full bg-gradient-to-b from-primary/[0.06] to-transparent" aria-hidden="true" />
        <svg viewBox="0 0 200 200" className="relative size-full" role="group" aria-label={`${total} ${t('analytics.appointments.total')}`}>
          <g transform="rotate(-90 100 100)" fill="none" strokeWidth={STROKE} strokeLinecap="round">
            <circle cx="100" cy="100" r={R} className="stroke-muted" strokeLinecap="butt" />
            {arcs.map(({ row, len, offset }, i) => {
              if (row.value === 0) return null
              const dim = active !== null && active !== row.key
              return (
                <circle
                  key={row.key}
                  cx="100"
                  cy="100"
                  r={R}
                  pathLength={100}
                  tabIndex={0}
                  aria-label={`${t(`analytics.appointments.${row.label}`)}: ${row.value} (${row.share}%)`}
                  {...bind(row.key)}
                  className={`${row.tone} cursor-pointer stroke-current outline-none transition-[stroke-dasharray,opacity,stroke-width] duration-700 ease-out motion-reduce:transition-none ${dim ? 'opacity-25' : ''}`}
                  style={{
                    strokeDasharray: `${ready ? len : 0.01} 200`,
                    strokeDashoffset: -offset,
                    strokeWidth: active === row.key ? STROKE + 3 : STROKE,
                    transitionDelay: ready ? '0ms' : `${i * 90}ms`,
                  }}
                />
              )
            })}
          </g>
        </svg>

        {/* Centre doubles as the tooltip: total at rest, status detail on hover or focus. */}
        <div className="pointer-events-none absolute inset-0 grid place-content-center px-10 text-center" aria-live="polite">
          {focused ? (
            <div key={focused.key} className="grid justify-items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
              <span className={`${focused.tone} relative isolate flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold leading-tight`}>
                <span aria-hidden="true" className="absolute inset-0 -z-10 rounded-full bg-current opacity-[0.14]" />
                {t(`analytics.appointments.${focused.label}`)}
              </span>
              <strong className={`${focused.tone} font-sans text-5xl font-bold leading-none tabular-nums tracking-tight`}>{focused.value}</strong>
              <span className="text-sm font-semibold tabular-nums text-muted-foreground">{focused.share}%</span>
            </div>
          ) : (
            <div className="grid justify-items-center gap-1.5">
              <strong className="font-sans text-6xl font-bold leading-none tabular-nums tracking-tight">{total}</strong>
              <span className="max-w-[8rem] text-xs font-semibold leading-snug text-muted-foreground">{t('analytics.appointments.total')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid min-w-0 gap-4">
        {total === 0 ? (
          <div className="relative isolate grid min-h-48 place-items-center overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-muted/70 via-muted/50 to-primary/[0.06] p-6 text-center dark:border-primary/10 dark:from-primary/[0.07] dark:via-card dark:to-primary/[0.03]">
            <span aria-hidden="true" className="pointer-events-none absolute -top-16 start-1/4 -z-10 size-48 rounded-full bg-primary/10 blur-[70px]" />
            <div className="grid max-w-sm justify-items-center gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10">
                <CalendarDays className="size-5" />
              </span>
              <strong className="font-sans text-base font-bold">{t('analytics.appointments.empty')}</strong>
              <p className="text-xs leading-5 font-semibold text-muted-foreground">
                {t('analytics.appointments.emptyHint', { defaultValue: 'Confirmed, completed and cancelled visits will appear here as soon as appointments are booked.' })}
              </p>
            </div>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3">
            {present.map((r, i) => {
              const hero = i === 0
              const spansRow = hero || (i === present.length - 1 && present.length % 2 === 0)
              const isActive = active === r.key
              const dim = active !== null && !isActive
              return (
                <li
                  key={r.key}
                  tabIndex={0}
                  {...bind(r.key)}
                  className={`${r.tone} relative cursor-default overflow-hidden rounded-2xl px-3.5 py-2.5 outline-none transition-opacity duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${spansRow ? 'col-span-2' : ''} ${dim ? 'opacity-70' : ''}`}
                >
                  <span aria-hidden="true" className={`absolute inset-0 bg-current transition-opacity duration-300 ${isActive ? 'opacity-[0.18]' : dim ? 'opacity-[0.03]' : hero ? 'opacity-[0.10]' : 'opacity-[0.06]'}`} />
                  <div className="relative grid gap-1">
                    <span className="flex items-center gap-1.5 text-[13px] font-bold leading-tight text-foreground">
                      <span className="grid size-4 place-items-center [&>svg]:size-4">{r.icon}</span>
                      {t(`analytics.appointments.${r.label}`)}
                    </span>
                    <span className="flex items-baseline gap-1.5">
                      <strong className={`font-sans font-bold leading-none tabular-nums tracking-tight text-foreground ${hero ? 'text-4xl' : 'text-2xl'}`}>{r.value}</strong>
                      <small className="text-xs font-medium tabular-nums text-muted-foreground">{r.share}%</small>
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {/* Statuses with no appointments stay visible, but quietly. */}
        {empty.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {empty.map((r) => (
              <li
                key={r.key}
                tabIndex={0}
                {...bind(r.key)}
                className={`relative isolate flex items-center gap-2 rounded-full bg-muted/60 py-1.5 ps-2.5 pe-3 text-xs font-semibold text-muted-foreground outline-none transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-foreground ${active !== null && active !== r.key ? 'opacity-70' : ''}`}
              >
                <span aria-hidden="true" className={`${r.tone} absolute inset-0 -z-10 rounded-full bg-current transition-opacity duration-300 ${active === r.key ? 'opacity-[0.18]' : 'opacity-0'}`} />
                <span className={`${r.tone} opacity-60 [&>svg]:size-3.5`}>{r.icon}</span>
                {t(`analytics.appointments.${r.label}`)}
                <span className="tabular-nums">0</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}