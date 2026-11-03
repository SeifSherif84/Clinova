import { Trophy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { humanize } from '@/lib/analytics'

export type RevenueMetric = 'collected' | 'net'

export interface RevenueBar {
  key: string
  methodType: string
  category: string
  collected: number
  awaiting: number
  refunds: number
  net: number
  value: number
  share: number
}

interface Props {
  bars: RevenueBar[]
  metric: RevenueMetric
  onMetric: (metric: RevenueMetric) => void
  hovered: string | null
  onHover: (key: string | null) => void
  money: (value: number) => string
  language?: string
}

const PLOT_HEIGHT = 288 // px
const LABEL_OFFSET = 12 // px between pillar top and its value label
const GRID_STEPS = 4

// Rounds the maximum up to a "nice" axis value so gridlines land on clean numbers.
function niceMax(value: number) {
  if (value <= 0) return 1
  const exp = 10 ** Math.floor(Math.log10(value))
  const f = value / exp
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 4 ? 4 : f <= 5 ? 5 : f <= 8 ? 8 : 10
  return nice * exp
}

export function RevenueBarChart({ bars, metric, onMetric, hovered, onHover, money, language }: Props) {
  const { t } = useTranslation()
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const compact = new Intl.NumberFormat(language, { notation: 'compact', maximumFractionDigits: 2 })
  const max = niceMax(Math.max(0, ...bars.map((bar) => bar.value)))
  const leader = bars[0] && bars[0].value > 0 ? bars[0] : null
  // The trophy is only awarded when one method is strictly ahead of all the others (no ties).
  const champion = leader && (bars.length === 1 || leader.value > bars[1].value) ? leader : null
  const leaderPct = leader ? (leader.value / max) * 100 : 0
  const label = (bar: RevenueBar) => t(`analytics.method.${bar.methodType}`, { defaultValue: humanize(bar.methodType) })
  const category = (bar: RevenueBar) => t(`analytics.category.${bar.category}`, { defaultValue: humanize(bar.category) })
  const ticks = Array.from({ length: GRID_STEPS + 1 }, (_, index) => (max / GRID_STEPS) * (GRID_STEPS - index))
  const columns = { gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))` }

  return (
    <div className="relative isolate min-w-0 overflow-hidden rounded-[1.75rem] border border-primary/15 bg-gradient-to-br from-muted/70 via-muted/50 to-primary/[0.06] p-5 text-foreground dark:border-primary/10 dark:from-primary/[0.07] dark:via-card dark:to-primary/[0.03] sm:p-7">
      {/* ambient light */}
      <span aria-hidden="true" className="pointer-events-none absolute -top-24 start-1/4 -z-10 size-72 rounded-full bg-primary/10 blur-[90px]" />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-32 end-0 -z-10 size-72 rounded-full bg-primary/5 blur-[100px]" />

      <div className="mb-8 flex flex-wrap items-center justify-end gap-3">
        <div role="radiogroup" className="inline-flex rounded-full border border-border/60 bg-muted/60 p-0.5">
          {(['collected', 'net'] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={metric === value}
              onClick={() => onMetric(value)}
              className={`h-7 cursor-pointer rounded-full px-3.5 text-xs font-bold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none motion-reduce:transition-none ${metric === value ? 'bg-background text-primary shadow-sm ring-1 ring-border/70' : 'text-muted-foreground hover:bg-background/60 hover:text-foreground'}`}
            >
              {t(`analytics.financial.${value}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        {/* y-axis labels, kept whisper-quiet */}
        <div className="relative w-9 shrink-0 pt-12" aria-hidden="true">
          <div className="relative" style={{ height: PLOT_HEIGHT }}>
            {ticks.map((tick, index) => (
              <span key={index} dir="ltr" className="absolute end-0 -translate-y-1/2 text-[10px] font-semibold text-muted-foreground/70 tabular-nums" style={{ top: `${(index / GRID_STEPS) * 100}%` }}>
                {compact.format(tick)}
              </span>
            ))}
          </div>
        </div>

        <div className="min-w-0 flex-1 pb-1">
          <div>
            {/* extra top padding gives value labels and the tooltip room above the tallest pillar */}
            <div className="relative pt-12">
              <div className="relative" style={{ height: PLOT_HEIGHT }}>
                {/* grid */}
                {ticks.map((_, index) => (
                  <span key={index} aria-hidden="true" className={`absolute inset-x-0 border-t ${index === GRID_STEPS ? 'border-border' : 'border-dashed border-border/60'}`} style={{ top: `${(index / GRID_STEPS) * 100}%` }} />
                ))}

                {/* leader line */}
                {leader && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 border-t border-dashed border-primary/40 transition-[bottom] duration-700 ease-out motion-reduce:transition-none"
                    style={{ bottom: ready ? `${leaderPct}%` : 0 }}
                  />
                )}

                <div className="absolute inset-0 grid" style={columns}>
                  {bars.map((bar, index) => {
                    const pct = ready ? (Math.max(bar.value, 0) / max) * 100 : 0
                    const isLeader = leader?.key === bar.key
                    const active = hovered === bar.key
                    const dimmed = hovered !== null && !active
                    const delay = ready ? `${index * 80}ms` : '0ms'
                    const side = bars.length === 1 || index < (bars.length - 1) / 2 ? 'after' : index > (bars.length - 1) / 2 ? 'before' : 'after'
                    const bracketHeight = `max(0px, calc(${leaderPct - pct}% - ${LABEL_OFFSET + 30}px))`

                    return (
                      <button
                        key={bar.key}
                        type="button"
                        onMouseEnter={() => onHover(bar.key)}
                        onMouseLeave={() => onHover(null)}
                        onFocus={() => onHover(bar.key)}
                        onBlur={() => onHover(null)}
                        aria-label={`${label(bar)}: ${money(bar.value)} (${bar.share}%)`}
                        className="group relative mx-auto h-full w-full max-w-[3.75rem] cursor-pointer rounded-full outline-none"
                      >
                        {/* ghost capsule: the full axis range, so each pillar reads as a share of the maximum */}
                        <span aria-hidden="true" className={`absolute inset-y-0 start-1/2 w-full max-w-[3.75rem] -translate-x-1/2 rounded-full bg-primary/[0.05] ring-1 ring-primary/10 transition-opacity duration-300 rtl:translate-x-1/2 ${dimmed ? 'opacity-40' : ''}`} />

                        {/* pillar */}
                        <span
                          className={`absolute bottom-0 start-1/2 w-full max-w-[3.75rem] -translate-x-1/2 overflow-hidden rounded-full transition-[height,opacity,filter,transform] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none rtl:translate-x-1/2 ${
                            bar.value < 0
                              ? 'bg-destructive/70'
                              : isLeader
                                ? 'bg-gradient-to-t from-primary via-primary/90 to-emerald-400 shadow-[0_12px_32px_-8px] shadow-primary/40'
                                : 'bg-gradient-to-t from-primary/15 via-primary/25 to-primary/40 ring-1 ring-inset ring-primary/15'
                          } ${dimmed ? 'opacity-35' : ''} ${active ? 'brightness-110' : ''}`}
                          style={{ height: `${pct}%`, minHeight: ready ? 6 : 0, transitionDelay: delay }}
                        >
                          {/* floor glow */}
                          <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/10 to-transparent" />
                        </span>

                        {/* gap bracket to the leader, only on hover */}
                        {active && leader && !isLeader && bar.value >= 0 && leaderPct - pct > 8 && (
                          <span
                            aria-hidden="true"
                            className="absolute start-1/2 w-px -translate-x-1/2 border-s border-dashed border-primary/50 rtl:translate-x-1/2"
                            style={{ bottom: `calc(${pct}% + ${LABEL_OFFSET + 30}px)`, height: bracketHeight }}
                          />
                        )}

                        {/* value label riding on top of the pillar */}
                        <span
                          dir="ltr"
                          className={`pointer-events-none absolute start-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap tabular-nums transition-[bottom,opacity,background-color] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none rtl:translate-x-1/2 ${
                            bar.value < 0 ? 'bg-destructive/10 text-destructive' : isLeader ? 'bg-primary/10 text-primary ring-1 ring-primary/25' : 'text-foreground'
                          } ${dimmed ? 'opacity-35' : ''}`}
                          style={{ bottom: `calc(${pct}% + ${LABEL_OFFSET}px)`, transitionDelay: delay }}
                        >
                          {champion?.key === bar.key && <Trophy aria-hidden="true" className="size-3.5" />}
                          {money(bar.value)}
                        </span>

                        {/* glass tooltip, opens beside the pillar so it never hides it */}
                        {active && (
                          <span
                            role="tooltip"
                            className={`pointer-events-none absolute top-0 z-30 w-60 rounded-2xl border border-border/70 bg-popover/95 p-4 text-start shadow-xl ring-1 ring-black/5 backdrop-blur-xl ${
                              side === 'after' ? 'start-full ms-1' : side === 'before' ? 'end-full me-1' : 'start-1/2 -translate-x-1/2 rtl:translate-x-1/2'
                            }`}
                          >
                            <span className="flex items-start justify-between gap-3">
                              <span className="grid min-w-0 gap-0.5">
                                <strong className="truncate text-sm font-bold text-foreground">{label(bar)}</strong>
                                <small className="text-[10px] font-bold tracking-wider text-primary uppercase">{category(bar)}</small>
                              </span>
                              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground tabular-nums">{bar.share}%</span>
                            </span>
                            <strong dir="ltr" className={`mt-3 block text-start text-2xl font-bold tracking-tight tabular-nums ${bar.value < 0 ? 'text-destructive' : 'text-foreground'}`}>{money(bar.value)}</strong>

                            <span className="mt-3 grid gap-1.5 border-t border-border/60 pt-3 text-xs font-semibold">
                              {[
                                [t('analytics.financial.collected'), bar.collected, 'bg-primary', 'text-foreground'],
                                [t('analytics.financial.awaiting'), bar.awaiting, 'bg-warm', 'text-foreground'],
                                [t('analytics.financial.refunds'), bar.refunds, 'bg-destructive', 'text-foreground'],
                              ].map(([name, value, dot, tone]) => (
                                <span key={name as string} className="flex items-center justify-between gap-3">
                                  <span className="flex items-center gap-2 text-muted-foreground">
                                    <span className={`size-1.5 rounded-full ${dot}`} />
                                    {name}
                                  </span>
                                  <span dir="ltr" className={`tabular-nums ${tone}`}>{money(value as number)}</span>
                                </span>
                              ))}
                              <span className="flex items-center justify-between gap-3 border-t border-border/60 pt-1.5 font-bold">
                                <span className="text-muted-foreground">{t('analytics.financial.net')}</span>
                                <span dir="ltr" className={`tabular-nums ${bar.net < 0 ? 'text-destructive' : 'text-primary'}`}>{money(bar.net)}</span>
                              </span>
                            </span>
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* category labels */}
            <div className="mt-4 grid" style={columns}>
              {bars.map((bar) => {
                const isLeader = leader?.key === bar.key
                return (
                  <div key={bar.key} className={`min-w-0 px-1 text-center transition-opacity duration-300 ${hovered !== null && hovered !== bar.key ? 'opacity-40' : ''}`}>
                    <strong className={`block truncate text-xs font-bold sm:text-sm ${isLeader ? 'text-foreground' : 'text-foreground/70'}`}>{label(bar)}</strong>
                    <small className="block truncate text-[10px] font-bold tracking-wider text-primary/70 uppercase">{category(bar)}</small>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}