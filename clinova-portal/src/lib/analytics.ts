import type { AnalyticsRange } from '@/types/analytics'

export type AnalyticsPreset = 'all' | 'today' | 'last7' | 'last30' | 'month' | 'custom'
export const analyticsPresets: AnalyticsPreset[] = ['all', 'today', 'last7', 'last30', 'month', 'custom']

const pad = (value: number) => String(value).padStart(2, '0')

// Local calendar date as yyyy-MM-dd; toISOString() would shift the day for Egypt's UTC offset.
export function toDateParam(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function presetRange(preset: Exclude<AnalyticsPreset, 'custom'>): AnalyticsRange {
  if (preset === 'all') return {}
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const daysAgo = (days: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - days)
  const from = preset === 'today' ? today
    : preset === 'last7' ? daysAgo(6)
      : preset === 'last30' ? daysAgo(29)
        : new Date(today.getFullYear(), today.getMonth(), 1)
  return { fromDate: toDateParam(from), toDate: toDateParam(today) }
}

// The API rejects FromDate > ToDate, so such a range is never sent. ISO dates compare correctly as strings.
export function isValidRange(range: AnalyticsRange) {
  return !range.fromDate || !range.toDate || range.fromDate <= range.toDate
}

export function toAnalyticsQuery(range: AnalyticsRange) {
  const params = new URLSearchParams()
  if (range.fromDate) params.set('fromDate', range.fromDate)
  if (range.toDate) params.set('toDate', range.toDate)
  const query = params.toString()
  return query ? `?${query}` : ''
}

export function formatEgp(value: number, language?: string) {
  return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 2 }).format(value)
}

// Splits enum names such as "CashAtClinic" when no translation exists yet.
export const humanize = (value: string) => value.replace(/([a-z])([A-Z])/g, '$1 $2')

export const percentOf = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0)