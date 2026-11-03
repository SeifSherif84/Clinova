import { CalendarDays, LoaderCircle, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { analyticsPresets, type AnalyticsPreset } from '@/lib/analytics'
import type { AnalyticsRange } from '@/types/analytics'

interface DateRangeFilterProps {
  preset: AnalyticsPreset
  custom: AnalyticsRange
  invalid: boolean
  refreshing: boolean
  onPreset: (preset: AnalyticsPreset) => void
  onCustom: (patch: Partial<AnalyticsRange>) => void
  onRefresh: () => void
}

const inputClass =
  'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/20 aria-invalid:border-destructive aria-invalid:ring-destructive/20 sm:w-auto'

export function DateRangeFilter({ preset, custom, invalid, refreshing, onPreset, onCustom, onRefresh }: DateRangeFilterProps) {
  const { t } = useTranslation()
  return (
    <div className="min-w-0 space-y-3">
      <div className="flex items-center gap-2">
        <div
          role="radiogroup"
          aria-label={t('analytics.filterLabel')}
          className="flex min-w-0 flex-1 gap-1 overflow-x-auto rounded-xl border border-border/60 bg-muted/60 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {analyticsPresets.map((value) => {
            const selected = preset === value
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onPreset(value)}
                className={`h-9 shrink-0 cursor-pointer rounded-lg px-4 text-sm font-semibold whitespace-nowrap transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none motion-reduce:transition-none ${
                  selected
                    ? 'bg-background text-primary shadow-sm ring-1 ring-border/70'
                    : 'text-muted-foreground hover:bg-background/60 hover:text-foreground'
                }`}
              >
                {t('analytics.presets.' + value)}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl border border-border/60 bg-background text-muted-foreground shadow-sm outline-none transition-all duration-200 hover:border-primary/40 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
          aria-label={t('analytics.refresh')}
          title={t('analytics.refresh')}
          disabled={refreshing || invalid}
          onClick={onRefresh}
        >
          {refreshing ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <RefreshCw className="size-4" />}
        </button>
      </div>

      {preset === 'custom' && (
        <div className="flex w-fit max-w-full flex-col gap-3 rounded-xl border border-border/60 bg-muted/40 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
          <CalendarDays className="hidden size-6 shrink-0 text-primary sm:block" />
          <label className="flex flex-col gap-1.5 text-sm font-bold text-foreground sm:flex-row sm:items-center sm:gap-2.5">
            {t('analytics.from')}
            <input type="date" value={custom.fromDate ?? ''} aria-invalid={invalid || undefined} onChange={(event) => onCustom({ fromDate: event.target.value || undefined })} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-bold text-foreground sm:flex-row sm:items-center sm:gap-2.5">
            {t('analytics.to')}
            <input type="date" value={custom.toDate ?? ''} aria-invalid={invalid || undefined} onChange={(event) => onCustom({ toDate: event.target.value || undefined })} className={inputClass} />
          </label>
        </div>
      )}
    </div>
  )
}