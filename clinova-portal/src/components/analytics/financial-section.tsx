import type { UseQueryResult } from '@tanstack/react-query'
import { Banknote, ChevronDown, CircleDollarSign, CreditCard, Landmark, Trophy, WalletCards, type LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatEgp, humanize, percentOf } from '@/lib/analytics'
import type { FinancialOverview } from '@/types/analytics'
import { AnalyticsSection, QueryBoundary } from './analytics-section'
import { RevenueBarChart, type RevenueBar, type RevenueMetric } from './revenue-bar-chart'

type Focus = 'net' | 'refunds' | 'awaiting' | 'collected'

const EASE = 'ease-[cubic-bezier(0.22,1,0.36,1)]'
const HATCH = 'repeating-linear-gradient(135deg, rgb(255 255 255 / 0.4) 0 2px, transparent 2px 6px)'

const methodIcons: Record<string, LucideIcon> = { CashAtClinic: Banknote, ManualTransfer: Landmark, Paymob: CreditCard }

// Flips to true one frame after mount so width / dash transitions play on first paint.
function useReady() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return ready
}

/* ───────────── Section 1: net collected summary ───────────── */


function NetSummary({ overview, money }: { overview: FinancialOverview; money: (value: number) => string }) {
  const { t } = useTranslation()
  const ready = useReady()
  const [focus, setFocus] = useState<Focus | null>(null)

  const total = Math.max(overview.totalCollected, 0)
  const awaiting = Math.max(overview.awaitingVerificationPayments, 0)
  const base = total + awaiting
  const kept = Math.min(Math.max(overview.netCollected, 0), total)
  const refunded = Math.min(Math.max(overview.totalRefunds, 0), total)
  const pct = (value: number) => (base > 0 ? (value / base) * 100 : 0)

  const R = 80
  const STROKE = 16
  const CAP = (STROKE / 2 / (2 * Math.PI * R)) * 100
  const RING_GAP = 1.4

  const info: Record<Focus, { label: string; value: number; tone: string }> = {
    net: {
      label: t('analytics.financial.net'),
      value: overview.netCollected,
      tone: 'text-primary',
    },
    refunds: {
      label: t('analytics.financial.refunds'),
      value: overview.totalRefunds,
      tone: 'text-destructive',
    },
    awaiting: {
      label: t('analytics.financial.awaiting'),
      value: overview.awaitingVerificationPayments,
      tone: 'text-warm',
    },
    collected: {
      label: t('analytics.financial.totalCollected'),
      value: overview.totalCollected,
      tone: 'text-primary',
    },
  }

  const shown = info[focus ?? 'collected']

  const isActive = (key: Focus) =>
    focus === null ||
    focus === key ||
    (focus === 'collected' && (key === 'net' || key === 'refunds'))

  const legend: { key: Focus; dot: string; tone: string }[] = [
    { key: 'collected', dot: 'bg-primary', tone: '' },
    {
      key: 'awaiting',
      dot: 'bg-warm',
      tone: overview.awaitingVerificationPayments > 0 ? 'text-warm' : '',
    },
    {
      key: 'refunds',
      dot: 'bg-destructive',
      tone: overview.totalRefunds > 0 ? 'text-destructive' : '',
    },
  ]

  const arcDefinitions = [
    { key: 'net' as const, value: kept, start: 0, color: 'text-primary' },
    { key: 'refunds' as const, value: refunded, start: pct(kept), color: 'text-destructive' },
    {
      key: 'awaiting' as const,
      value: awaiting,
      start: pct(kept) + pct(refunded),
      color: 'text-warm',
    },
  ]

  const arcs = arcDefinitions.map((arc) => {
    const span = pct(arc.value)

    return {
      ...arc,
      len: Math.max(span - RING_GAP - CAP * 2, 0.01),
      offset: arc.start + RING_GAP / 2 + CAP,
    }
  })

  return (
    <div className="min-w-0 content-start" onMouseLeave={() => setFocus(null)}>
      <div className="relative isolate overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/15 via-primary/[0.05] to-transparent p-5 sm:p-6">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -end-10 -top-10 -z-10 size-40 rounded-full bg-primary/10 blur-3xl"
        />
        <small className="block text-[13px] font-bold tracking-wider text-muted-foreground uppercase">
          {t('analytics.financial.net')}
        </small>
        <strong
          dir="ltr"
          className={`-ms-1 mt-5 block text-start font-sans text-4xl leading-none font-bold tracking-tight tabular-nums sm:text-5xl ${
            overview.netCollected < 0
              ? 'text-destructive'
              : 'bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent'
          }`}
        >
          {money(overview.netCollected)}
        </strong>
      </div>

      {/* Donut chart */}
      <div className="relative mx-auto mt-8 aspect-square w-full max-w-[16rem]">
        <div
          className="absolute inset-[14%] rounded-full bg-gradient-to-b from-primary/[0.06] to-transparent"
          aria-hidden="true"
        />

<svg
  viewBox="0 0 200 200"
  className="relative size-full"
  role="group"
  aria-label={t('analytics.financial.totalCollected')}
>
          <g
            transform="rotate(-90 100 100)"
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="round"
          >
            <circle
              cx={100}
              cy={100}
              r={R}
              className="stroke-muted"
              strokeLinecap="butt"
            />

            {arcs.map((arc, index) => {
              if (arc.value <= 0) return null

              const dim = focus !== null && !isActive(arc.key)

              return (
                <circle
                  key={arc.key}
                  cx={100}
                  cy={100}
                  r={R}
                  pathLength={100}
                  tabIndex={0}
                  aria-label={`${arc.key}: ${money(arc.value)}`}
                  className={`${arc.color} cursor-pointer stroke-current outline-none transition-[stroke-dasharray,opacity,stroke-width] duration-700 ease-out motion-reduce:transition-none ${
                    dim ? 'opacity-25' : ''
                  }`}
                  style={{
                    strokeDasharray: `${ready ? arc.len : 0.01} 200`,
                    strokeDashoffset: -arc.offset,
                    strokeWidth: focus === arc.key ? STROKE + 3 : STROKE,
                    transitionDelay: ready ? '0ms' : `${index * 90}ms`,
                  }}
                  onMouseEnter={() => setFocus(arc.key)}
                  onFocus={() => setFocus(arc.key)}
                  onBlur={() => setFocus(null)}
                />
              )
            })}
          </g>
        </svg>

        {/* Centre: total at rest, selected financial detail on hover/focus */}
        <div className="pointer-events-none absolute inset-0 grid place-content-center px-10 text-center">
          {focus !== null ? (
            <div
              key={focus}
              className="grid justify-items-center gap-2 animate-in fade-in zoom-in-95 duration-200"
            >
              <span
                className={`${shown.tone} relative isolate flex max-w-full items-center rounded-full px-2.5 py-1 text-xs font-bold leading-tight`}
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 rounded-full bg-current opacity-[0.14]"
                />
                {shown.label}
              </span>

<strong
  dir="ltr"
  className="block w-full max-w-full truncate px-2 text-center text-lg font-bold leading-tight tabular-nums sm:text-xl"
>
  {money(shown.value)}
</strong>
            </div>
          ) : (
            <div className="grid justify-items-center gap-1.5">
              <strong
                dir="ltr"
                className="font-sans text-2xl font-bold leading-none tabular-nums tracking-tight"
              >
                {money(shown.value)}
              </strong>
              <span className="max-w-[8rem] text-xs font-semibold leading-snug text-muted-foreground">
                {t('analytics.financial.totalCollected')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <dl className="mt-8 grid grid-cols-[1fr_auto_1fr] justify-items-center gap-x-6 gap-y-4">
        {legend.map((item) => (
          <div
            key={item.key}
            className={`pointer-events-none grid justify-items-center text-center transition-opacity duration-300 motion-reduce:transition-none ${
              focus === null || focus === item.key ? '' : 'opacity-40'
            }`}
          >
            <dt
              onMouseEnter={() => setFocus(item.key)}
              onMouseLeave={() => setFocus(null)}
              className="pointer-events-auto flex w-fit cursor-default items-center justify-center gap-1.5 pb-1.5 text-[10px] leading-tight font-bold tracking-wider whitespace-nowrap text-muted-foreground uppercase"
            >
              <span className={`size-2 shrink-0 rounded-full ${item.dot}`} />
              {info[item.key].label}
            </dt>

            <dd
              dir="ltr"
              onMouseEnter={() => setFocus(item.key)}
              onMouseLeave={() => setFocus(null)}
              className={`pointer-events-auto w-fit cursor-default text-center text-sm font-bold tabular-nums whitespace-nowrap sm:text-base ${item.tone}`}
              title={money(info[item.key].value)}
            >
              {money(info[item.key].value)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}


/* ───────────── Section 2: payment methods ledger ───────────── */

function MethodLedger({ bars, money, hovered, onHover, topKey }: {
  bars: RevenueBar[]
  money: (value: number) => string
  hovered: string | null
  onHover: (key: string | null) => void
  topKey: string | null
}) {
  const { t } = useTranslation()
  const ready = useReady()
  const [openKey, setOpenKey] = useState<string | null>(null)

  // One shared scale for every lane, so bar lengths are directly comparable between methods.
  const largest = Math.max(0, ...bars.map((bar) => Math.max(bar.collected, 0) + Math.max(bar.awaiting, 0)))
  const scale = largest > 0 ? largest : 1
  const width = (value: number) => `${ready ? (Math.max(value, 0) / scale) * 100 : 0}%`

  return (
    <div className="grid gap-4 pt-2" onMouseLeave={() => onHover(null)}>
      <div className="grid gap-1">
        {bars.map((bar, index) => {
          const Icon = methodIcons[bar.methodType] ?? WalletCards
          const isLeader = bar.key === topKey
          const active = hovered === bar.key
          const dimmed = hovered !== null && !active
          const collected = Math.max(bar.collected, 0)
          const keptPart = Math.min(Math.max(bar.net, 0), collected)
          const refundPart = Math.min(Math.max(bar.refunds, 0), collected)
          const awaitingPart = Math.max(bar.awaiting, 0)
          const delay = `${index * 90}ms`
          const bandBase = `h-full transition-[width] duration-[900ms] ${EASE} motion-reduce:transition-none`
          const figures: { label: string; value: number; tone: string }[] = [
            { label: t('analytics.financial.collected'), value: bar.collected, tone: '' },
            { label: t('analytics.financial.awaiting'), value: bar.awaiting, tone: bar.awaiting > 0 ? 'text-warm' : '' },
            { label: t('analytics.financial.refunds'), value: bar.refunds, tone: bar.refunds > 0 ? 'text-destructive' : '' },
          ]

          const open = openKey === bar.key

          return (
            <div
              key={bar.key}
              onMouseEnter={() => onHover(bar.key)}
              className={`rounded-2xl transition-[background-color,opacity] duration-300 motion-reduce:transition-none ${active || open ? 'bg-primary/[0.05]' : ''} ${dimmed ? 'opacity-55' : ''}`}
            >
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenKey(open ? null : bar.key)}
                className="grid w-full cursor-pointer gap-x-6 gap-y-3 rounded-2xl px-4 py-3 text-start outline-none focus-visible:ring-2 focus-visible:ring-primary/30 md:grid-cols-[13rem_minmax(0,1fr)_auto_auto] md:items-center"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10"><Icon className="size-4.5" /></span>
                  <div className="min-w-0">
                    <strong className="flex items-center gap-1.5 text-sm font-bold">
                      <span className="truncate">{t(`analytics.method.${bar.methodType}`, { defaultValue: humanize(bar.methodType) })}</span>
                      {isLeader && <Trophy aria-hidden="true" className="size-3.5 shrink-0 text-primary" />}
                    </strong>
                    <small className="block truncate text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{t(`analytics.category.${bar.category}`, { defaultValue: humanize(bar.category) })}</small>
                  </div>
                </div>

                <div className="min-w-0">
                  <div className={`flex overflow-hidden rounded-full bg-muted/70 transition-[height] duration-300 motion-reduce:transition-none ${isLeader || active ? 'h-3.5' : 'h-2.5'}`} aria-hidden="true">
                    <span className={`${bandBase} ${isLeader ? 'bg-gradient-to-r from-primary to-emerald-400' : 'bg-primary/55'}`} style={{ width: width(keptPart), transitionDelay: delay }} />
                    <span className={`${bandBase} bg-destructive/70`} style={{ width: width(refundPart), transitionDelay: delay }} />
                    <span className={`${bandBase} bg-warm/80`} style={{ width: width(awaitingPart), backgroundImage: HATCH, transitionDelay: delay }} />
                  </div>
                </div>

                <div className="flex min-w-0 items-baseline justify-between gap-3 md:block md:min-w-28 md:text-end">
                  <small className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{t('analytics.financial.net')}</small>
                  <strong dir="ltr" className={`block truncate text-lg font-bold tabular-nums ${bar.net < 0 ? 'text-destructive' : isLeader ? 'text-primary' : ''}`}>{money(bar.net)}</strong>
                </div>

                <ChevronDown aria-hidden="true" className={`hidden size-4 shrink-0 text-muted-foreground transition-transform duration-300 motion-reduce:transition-none md:block ${open ? 'rotate-180' : ''}`} />
              </button>

              <div className={`grid transition-[grid-template-rows] duration-300 ${EASE} motion-reduce:transition-none ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                  <dl className="flex flex-wrap gap-x-8 gap-y-3 px-4 pt-1 pb-4 md:ps-[calc(1rem+13rem+1.5rem)]">
                    {figures.map((figure) => (
                      <div key={figure.label} className="grid gap-0.5">
                        <dt className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{figure.label}</dt>
                        <dd dir="ltr" className={`text-sm font-bold tabular-nums ${figure.tone}`}>{money(figure.value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ───────────── Section wrapper (data + business logic unchanged) ───────────── */

export function FinancialSection({
  query,
  language,
  open,
  onToggle,
}: {
  query: UseQueryResult<FinancialOverview, Error>
  language?: string
  open: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()
  const money = (value: number) => formatEgp(value, language)
  const [metric, setMetric] = useState<RevenueMetric>('net')
  const [hovered, setHovered] = useState<string | null>(null)

  const data = query.data
  const bars = useMemo<RevenueBar[]>(() => {
    if (!data) return []
    const rows = data.paymentMethods.map((method) => ({
      key: `${method.category}-${method.methodType}`,
      methodType: method.methodType,
      category: method.category,
      collected: method.totalCollected,
      awaiting: method.awaitingVerificationPayments,
      refunds: method.totalRefunds,
      net: method.netCollected,
      value: metric === 'net' ? method.netCollected : method.totalCollected,
      share: 0,
    }))
    const total = rows.reduce((sum, row) => sum + Math.max(row.value, 0), 0)
    return rows
      .map((row) => ({ ...row, share: percentOf(Math.max(row.value, 0), total) }))
      .sort((a, b) => b.value - a.value)
  }, [data, metric])

  return (
    <AnalyticsSection
  icon={<CircleDollarSign />}
  title={t('analytics.financial.title')}
  description={t('analytics.financial.description')}
  busy={query.isFetching}
  collapsible
  open={open}
  onToggle={onToggle}
  panelId="analytics-panel-financial"
>
      <QueryBoundary query={query}>
        {(overview) => {
          const topKey = bars[0] && bars[0].value > 0 && (bars.length === 1 || bars[0].value > bars[1].value) ? bars[0].key : null

          return (
            <>
              <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
                <NetSummary overview={overview} money={money} />

                {bars.length === 0 ? (
                  <p className="self-center text-sm font-semibold text-muted-foreground">{t('analytics.financial.empty')}</p>
                ) : (
                  <RevenueBarChart bars={bars} metric={metric} onMetric={setMetric} hovered={hovered} onHover={setHovered} money={money} language={language} />
                )}
              </div>

              {bars.length > 0 && <MethodLedger bars={bars} money={money} hovered={hovered} onHover={setHovered} topKey={topKey} />}
            </>
          )
        }}
      </QueryBoundary>
    </AnalyticsSection>
  )
}