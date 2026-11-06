import { CalendarCheck2, CircleCheckBig, CircleDollarSign, Clock3, Percent, Stethoscope } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { percentOf } from '@/lib/analytics'

export interface DoctorBar {
  key: string
  name: string
  confirmed: number
  completed: number
  collected: number
  expected: number
}

interface Props {
  doctors: DoctorBar[]
  money: (value: number) => string
  language?: string
}

type Metric = 'amount' | 'visits'

// Titles such as "Dr." are skipped so initials come from the actual name.
const TITLE_PREFIX = /^(dr\.?|د\.?|دكتور|دكتورة)$/i
const PLOT_HEIGHT = 260 // px
const GRID_STEPS = 4
const HATCH = 'repeating-linear-gradient(135deg, rgb(255 255 255 / 0.4) 0 2px, transparent 2px 6px)'
const GREEN = 'bg-gradient-to-t from-primary to-emerald-400'
const TEAL = 'bg-gradient-to-t from-teal-600 to-teal-400'

// Rounds the maximum up to a "nice" axis value so gridlines land on clean numbers.
function niceMax(value: number) {
  if (value <= 0) return 1
  const exp = 10 ** Math.floor(Math.log10(value))
  const f = value / exp
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 4 ? 4 : f <= 5 ? 5 : f <= 8 ? 8 : 10
  return nice * exp
}

function initialsOf(name: string) {
  return name.split(' ').filter((part) => part && !TITLE_PREFIX.test(part)).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function Kpi({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10 [&>svg]:size-4.5">{icon}</span>
      <span className="grid min-w-0 gap-0.5">
        <small className="truncate text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{label}</small>
        <strong dir="ltr" className="truncate text-start text-base font-bold tabular-nums">{value}</strong>
      </span>
    </div>
  )
}

export function DoctorPerformanceChart({ doctors, money, language }: Props) {
  const { t } = useTranslation()
  const [metric, setMetric] = useState<Metric>('amount')
  const [hovered, setHovered] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const number = new Intl.NumberFormat(language)
  const compact = new Intl.NumberFormat(language, { notation: 'compact', maximumFractionDigits: 2 })
  const isAmount = metric === 'amount'
  const formatValue = (value: number) => (isAmount ? money(value) : number.format(value))
  const formatShort = (value: number) => (isAmount ? compact.format(value) : number.format(value))

  // Each doctor is a pair of bars; which pair depends on the active metric.
  const groups = doctors
    .map((doctor) => {
      const series = isAmount
        ? [
            { key: 'collected', label: t('analytics.doctors.collected'), value: Math.max(doctor.collected, 0), fill: GREEN, dot: 'bg-primary', hatch: false },
            { key: 'expected', label: t('analytics.doctors.expected'), value: Math.max(doctor.expected, 0), fill: 'bg-warm/80', dot: 'bg-warm', hatch: true },
          ]
        : [
            { key: 'confirmed', label: t('analytics.doctors.confirmed'), value: Math.max(doctor.confirmed, 0), fill: GREEN, dot: 'bg-primary', hatch: false },
            { key: 'completed', label: t('analytics.doctors.completed'), value: Math.max(doctor.completed, 0), fill: TEAL, dot: 'bg-teal-500', hatch: false },
          ]
      const total = series[0].value + series[1].value
      // Share of the "done" part: collected money, or completed visits.
      const lead = isAmount ? series[0] : series[1]
      return { doctor, series, total, share: percentOf(lead.value, total) }
    })
    .sort((a, b) => b.total - a.total)

  const sum = (pick: (doctor: DoctorBar) => number) => doctors.reduce((acc, doctor) => acc + Math.max(pick(doctor), 0), 0)
  const totals = isAmount
    ? { first: sum((d) => d.collected), second: sum((d) => d.expected) }
    : { first: sum((d) => d.confirmed), second: sum((d) => d.completed) }
  const overall = totals.first + totals.second
  const doneShare = percentOf(isAmount ? totals.first : totals.second, overall)

  const peak = Math.max(0, ...groups.flatMap((group) => group.series.map((part) => part.value)))
  // Visits use whole-number ticks; amounts use a "nice" rounded maximum.
  const max = isAmount ? (peak > 0 ? niceMax(peak) : 100) : Math.max(4, Math.ceil(peak / 4) * 4)
  const ticks = Array.from({ length: GRID_STEPS + 1 }, (_, index) => (max / GRID_STEPS) * (GRID_STEPS - index))
  const columns = { gridTemplateColumns: `repeat(${groups.length}, minmax(0, 1fr))` }
  const legend = groups[0]?.series ?? []

  return (
    <div className="grid gap-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          icon={isAmount ? <CircleDollarSign /> : <CalendarCheck2 />}
          label={isAmount ? t('analytics.doctors.collected') : t('analytics.doctors.confirmed')}
          value={formatValue(totals.first)}
        />
        <Kpi
          icon={isAmount ? <Clock3 /> : <CircleCheckBig />}
          label={isAmount ? t('analytics.doctors.expected') : t('analytics.doctors.completed')}
          value={formatValue(totals.second)}
        />
        <Kpi
          icon={<Percent />}
          label={isAmount ? t('analytics.doctors.collectedShareLabel', { defaultValue: 'Collected share' }) : t('analytics.doctors.completedShareLabel', { defaultValue: 'Completed share' })}
          value={`${doneShare}%`}
        />
        <Kpi icon={<Stethoscope />} label={t('analytics.doctors.title')} value={number.format(doctors.length)} />
      </div>

      {/* Chart panel */}
      <div
        className="relative isolate min-w-0 overflow-hidden rounded-[1.75rem] border border-primary/15 bg-gradient-to-br from-muted/70 via-muted/50 to-primary/[0.06] p-5 text-foreground dark:border-primary/10 dark:from-primary/[0.07] dark:via-card dark:to-primary/[0.03] sm:p-7"
        onMouseLeave={() => setHovered(null)}
      >
        <span aria-hidden="true" className="pointer-events-none absolute -top-24 start-1/4 -z-10 size-72 rounded-full bg-primary/10 blur-[90px]" />

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
            {legend.map((part) => (
              <span key={part.key} className="flex items-center gap-1.5">
                <span className={`size-2.5 rounded-full ${part.dot}`} />
                {part.label}
              </span>
            ))}
          </div>
          <div role="radiogroup" className="inline-flex rounded-full border border-border/60 bg-muted/60 p-0.5">
            {(['amount', 'visits'] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={metric === value}
                onClick={() => setMetric(value)}
                className={`h-7 cursor-pointer rounded-full px-3.5 text-xs font-bold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none motion-reduce:transition-none ${metric === value ? 'bg-background text-primary shadow-sm ring-1 ring-border/70' : 'text-muted-foreground hover:bg-background/60 hover:text-foreground'}`}
              >
                {value === 'amount' ? t('analytics.doctors.byAmount', { defaultValue: 'Revenue' }) : t('analytics.doctors.byVisits', { defaultValue: 'Visits' })}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          {/* y-axis labels */}
          <div className="relative w-10 shrink-0 pt-8" aria-hidden="true">
            <div className="relative" style={{ height: PLOT_HEIGHT }}>
              {ticks.map((tick, index) => (
                <span key={index} dir="ltr" className="absolute end-0 -translate-y-1/2 text-[10px] font-semibold text-muted-foreground/70 tabular-nums" style={{ top: `${(index / GRID_STEPS) * 100}%` }}>
                  {formatShort(tick)}
                </span>
              ))}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="relative pt-8">
              <div className="relative" style={{ height: PLOT_HEIGHT }}>
                {/* grid */}
                {ticks.map((_, index) => (
                  <span key={index} aria-hidden="true" className={`absolute inset-x-0 border-t ${index === GRID_STEPS ? 'border-border' : 'border-dashed border-border/60'}`} style={{ top: `${(index / GRID_STEPS) * 100}%` }} />
                ))}

                <div className="absolute inset-0 grid" style={columns}>
                  {groups.map(({ doctor, series, total, share }, index) => {
                    const active = hovered === doctor.key
                    const dimmed = hovered !== null && !active
                    const side = groups.length === 1 ? 'center' : index < (groups.length - 1) / 2 ? 'after' : 'before'

                    return (
                      <button
                        key={doctor.key}
                        type="button"
                        onMouseEnter={() => setHovered(doctor.key)}
                        onFocus={() => setHovered(doctor.key)}
                        onBlur={() => setHovered(null)}
                        aria-label={`${doctor.name}: ${series.map((part) => `${part.label} ${formatValue(part.value)}`).join(', ')}`}
                        className={`relative flex h-full cursor-pointer items-stretch justify-center gap-1.5 px-1 outline-none transition-opacity duration-300 ${dimmed ? 'opacity-40' : ''}`}
                      >
                        {/* hover band */}
                        <span aria-hidden="true" className={`absolute inset-x-1 inset-y-0 rounded-2xl bg-primary/[0.06] transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0'}`} />

                        {series.map((part, partIndex) => {
                          const pct = ready ? (part.value / max) * 100 : 0
                          const delay = `${index * 90 + partIndex * 60}ms`
                          return (
                            <span key={part.key} className="relative h-full w-full max-w-[2.5rem]">
                              {/* track: the full axis range, so each bar reads as a share of the maximum */}
                              <span aria-hidden="true" className="absolute inset-0 rounded-xl bg-foreground/[0.04] ring-1 ring-foreground/[0.05]" />
                              <span
                                aria-hidden="true"
                                className={`absolute inset-x-0 bottom-0 overflow-hidden rounded-t-xl rounded-b-md transition-[height] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${part.value > 0 ? part.fill : 'bg-foreground/15'} ${active ? 'brightness-110' : ''}`}
                                style={{ height: `${pct}%`, minHeight: ready ? 4 : 0, transitionDelay: delay, backgroundImage: part.hatch && part.value > 0 ? HATCH : undefined }}
                              />
                              <span
                                dir="ltr"
                                className="pointer-events-none absolute start-1/2 -translate-x-1/2 text-[11px] font-bold whitespace-nowrap text-foreground/80 tabular-nums transition-[bottom] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none rtl:translate-x-1/2"
                                style={{ bottom: `calc(${pct}% + 6px)`, transitionDelay: delay }}
                              >
                                {formatShort(part.value)}
                              </span>
                            </span>
                          )
                        })}

                        {active && (
                          <span
                            role="tooltip"
                            className={`pointer-events-none absolute top-0 z-30 w-56 rounded-2xl border border-border/70 bg-popover/95 p-4 text-start shadow-xl ring-1 ring-black/5 backdrop-blur-xl ${
                              side === 'after' ? 'start-full ms-1' : side === 'before' ? 'end-full me-1' : 'start-1/2 -translate-x-1/2 rtl:translate-x-1/2'
                            }`}
                          >
                            <span className="flex items-start justify-between gap-3">
                              <strong className="min-w-0 truncate text-sm font-bold text-foreground">{doctor.name}</strong>
                              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground tabular-nums">{share}%</span>
                            </span>
                            <strong dir="ltr" className="mt-2 block text-start text-xl font-bold tracking-tight tabular-nums text-foreground">{formatValue(total)}</strong>
                            <span className="mt-3 grid gap-1.5 border-t border-border/60 pt-3 text-xs font-semibold">
                              {series.map((part) => (
                                <span key={part.key} className="flex items-center justify-between gap-3">
                                  <span className="flex items-center gap-2 text-muted-foreground">
                                    <span className={`size-1.5 rounded-full ${part.dot}`} />
                                    {part.label}
                                  </span>
                                  <span dir="ltr" className="text-foreground tabular-nums">{formatValue(part.value)}</span>
                                </span>
                              ))}
                            </span>
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* doctor labels */}
            <div className="mt-4 grid" style={columns}>
              {groups.map(({ doctor }) => (
                <div key={doctor.key} className={`flex min-w-0 flex-col items-center gap-1.5 px-1 text-center transition-opacity duration-300 ${hovered !== null && hovered !== doctor.key ? 'opacity-40' : ''}`}>
                  <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary ring-2 ring-primary/15">{initialsOf(doctor.name)}</span>
                  <strong className="block w-full truncate text-xs font-bold sm:text-sm" title={doctor.name}>{doctor.name}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {peak === 0 && (
          <p className="mt-5 text-center text-xs font-semibold text-muted-foreground">
            {t('analytics.doctors.chartEmpty', { defaultValue: 'No activity recorded yet. The bars will fill in as appointments and payments come in.' })}
          </p>
        )}
      </div>
    </div>
  )
}