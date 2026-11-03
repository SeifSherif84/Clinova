import type { UseQueryResult } from '@tanstack/react-query'
import { ChevronDown, LoaderCircle, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getErrorMessage } from '@/lib/api'

export function AnalyticsSection({
  icon,
  title,
  description,
  busy,
  children,
  collapsible = false,
  open = true,
  onToggle,
  panelId,
}: {
  icon: ReactNode
  title: string
  description?: string
  busy?: boolean
  children: ReactNode
  collapsible?: boolean
  open?: boolean
  onToggle?: () => void
  panelId?: string
}) {
  const headerContent = (
    <>
      <span className="mt-1 grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10 [&>svg]:size-5">
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block font-sans text-2xl font-bold tracking-tight">{title}</span>
        {description && (
          <span className="mt-1 block text-xs leading-5 text-muted-foreground sm:text-sm">
            {description}
          </span>
        )}
      </span>

      {busy && (
        <LoaderCircle
          aria-hidden="true"
          className="mt-2 size-4 shrink-0 animate-spin text-primary motion-reduce:animate-none"
        />
      )}

      {collapsible && (
        <span
          className={`mt-2 grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        >
          <ChevronDown className="size-4" />
        </span>
      )}
    </>
  )

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      {collapsible ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-start gap-3.5 p-4 text-start transition-colors hover:bg-muted/30 sm:p-5"
        >
          {headerContent}
        </button>
      ) : (
        <header className="flex items-start gap-3.5 border-b border-border/60 p-4 pb-4 sm:p-5">
          {headerContent}
        </header>
      )}

      {(!collapsible || open) && (
        <div
          id={panelId}
          className={`grid gap-8 ${collapsible ? 'border-t border-border/60 p-4 sm:p-6' : 'pt-6'}`}
        >
          {children}
        </div>
      )}
    </section>
  )
}

// Shows the data when there is any (including the previous range while a new one loads), otherwise loading or error.
export function QueryBoundary<T>({ query, children }: { query: UseQueryResult<T, Error>; children: (data: T) => ReactNode }) {
  const { t } = useTranslation()
  if (query.data !== undefined) return <>{children(query.data)}</>
  if (query.isError) {
    return (
      <div className="grid justify-items-start gap-3">
        <p className="text-sm font-bold text-destructive">{getErrorMessage(query.error)}</p>
        <Button variant="outline" className="h-10 cursor-pointer rounded-xl text-sm font-bold normal-case" disabled={query.isFetching} onClick={() => query.refetch()}>
          {query.isFetching ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <RefreshCw />}
          {t('analytics.retry')}
        </Button>
      </div>
    )
  }
  if (query.isLoading) {
    return (
      <div className="grid gap-6" role="status" aria-label={t('common.routeLoading')}>
        <Skeleton className="h-16 w-72 rounded-xl motion-reduce:animate-none" />
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-12 rounded-xl motion-reduce:animate-none" />)}
        </div>
      </div>
    )
  }
  return null
}

export interface DonutSegment {
  value: number
  stroke: string
}

// SVG donut. Segments are drawn clockwise from the top; `children` is rendered in the center.
export function Donut({ segments, size = 176, thickness = 11, children }: { segments: DonutSegment[]; size?: number; thickness?: number; children?: ReactNode }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)
  const radius = 50 - thickness / 2
  const circumference = 2 * Math.PI * radius
  const visible = segments.filter((segment) => segment.value > 0)
  const gap = visible.length > 1 ? 1.5 : 0
  let offset = 0

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={radius} fill="none" strokeWidth={thickness} className="stroke-muted" />
        {total > 0 && visible.map((segment, index) => {
          const length = (segment.value / total) * circumference
          const circle = (
            <circle
              key={index}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              strokeWidth={thickness}
              strokeDasharray={`${Math.max(length - gap, 0)} ${circumference}`}
              strokeDashoffset={-offset}
              className={`${segment.stroke} transition-all duration-500`}
            />
          )
          offset += length
          return circle
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}

// Open (card-less) label + value pair, optionally with a colored dot.
export function Metric({ label, value, dot, tone = '', size = 'lg', className = '' }: { label: string; value: string | number; dot?: string; tone?: string; size?: 'md' | 'lg'; className?: string }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <small className="flex items-center gap-1.5 truncate text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
        {dot && <span className={`size-2 shrink-0 rounded-full ${dot}`} />}
        <span className="truncate">{label}</span>
      </small>
      <strong dir="ltr" className={`mt-1 block truncate text-start font-bold tabular-nums ${size === 'lg' ? 'text-xl sm:text-2xl' : 'text-sm'} ${tone}`}>{value}</strong>
    </div>
  )
}

type Tone = 'primary' | 'warm' | 'danger' | 'neutral'

const tones: Record<Tone, { box: string; label: string; value: string; icon: string }> = {
  primary: { box: 'border-primary/20 bg-primary/5', label: 'text-primary', value: 'text-primary', icon: 'bg-primary/10 text-primary' },
  warm: { box: 'border-warm/25 bg-warm/10', label: 'text-warm', value: 'text-warm', icon: 'bg-warm/10 text-warm' },
  danger: { box: 'border-destructive/20 bg-destructive/5', label: 'text-destructive', value: 'text-destructive', icon: 'bg-destructive/10 text-destructive' },
  neutral: { box: 'border-border/60 bg-muted/30', label: 'text-muted-foreground', value: 'text-foreground', icon: 'bg-primary/10 text-primary' },
}

// Kept for any other page that still imports it; the analytics sections no longer use it.
export function StatTile({ icon, label, value, hint, tone = 'neutral' }: { icon: ReactNode; label: string; value: string | number; hint?: string; tone?: Tone }) {
  const style = tones[tone]
  return (
    <div className={`flex min-w-0 items-center gap-3 rounded-2xl border px-4 py-3.5 ${style.box}`}>
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl [&>svg]:size-5 ${style.icon}`}>{icon}</span>
      <span className="grid min-w-0 gap-0.5 leading-tight">
        <small className={`truncate text-[10px] font-bold tracking-wider uppercase ${style.label}`}>{label}</small>
        <strong dir="ltr" className={`truncate text-start text-lg font-bold tabular-nums ${style.value}`}>{value}</strong>
        {hint && <small className="truncate text-[11px] font-semibold text-muted-foreground">{hint}</small>}
      </span>
    </div>
  )
}