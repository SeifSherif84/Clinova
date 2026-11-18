export type Tone = 'good' | 'warn' | 'bad' | 'muted'
export type AppointmentGroup = 'upcoming' | 'past' | 'cancelled'

// Splits enum names such as "PendingPayment" when no translation exists yet.
export const humanize = (value: string) => value.replace(/([a-z])([A-Z])/g, '$1 $2')

// Presentation-only grouping. The backend's status strings are never altered; unknown values fall back to "muted".
const goodStatuses = new Set(['Confirmed', 'Completed', 'Paid', 'Succeeded', 'Refunded', 'Processed'])
const badStatuses = new Set(['Cancelled', 'NoShow', 'Failed', 'Rejected'])
const terminalStatuses = new Set(['Completed', 'Cancelled', 'NoShow', 'Expired'])

export function statusTone(value: string | null | undefined): Tone {
  if (!value) return 'muted'
  if (goodStatuses.has(value)) return 'good'
  if (badStatuses.has(value)) return 'bad'
  if (/pending|requested|processing|awaiting|verification/i.test(value)) return 'warn'
  return 'muted'
}

export const toneClass: Record<Tone, string> = {
  good: 'border-primary/20 bg-primary/10 text-primary',
  warn: 'border-warm/25 bg-warm/10 text-warm',
  bad: 'border-destructive/20 bg-destructive/10 text-destructive',
  muted: 'border-border bg-muted/60 text-muted-foreground',
}

export const toneText: Record<Tone, string> = {
  good: 'text-primary',
  warn: 'text-warm',
  bad: 'text-destructive',
  muted: 'text-muted-foreground',
}

export const isTerminalStatus = (value: string) => terminalStatuses.has(value)

// "yyyy-MM-dd" as a local date (new Date(string) would shift it by the time zone).
export function parseDay(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function atTime(day: string, time: string) {
  const date = parseDay(day)
  const [hours, minutes] = time.split(':').map(Number)
  date.setHours(hours, minutes, 0, 0)
  return date
}

export const formatClock = (day: string, time: string, locale: string) =>
  atTime(day, time).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })

// Status decides first; the slot date only matters for statuses that can still be in progress.
export function classify(item: { appointmentStatus: string; slotDate: string; slotEndTime: string }, now = new Date()): AppointmentGroup {
  if (item.appointmentStatus === 'Cancelled' || item.appointmentStatus === 'Expired') return 'cancelled'
  if (item.appointmentStatus === 'Completed' || item.appointmentStatus === 'NoShow') return 'past'
  return atTime(item.slotDate, item.slotEndTime) >= now ? 'upcoming' : 'past'
}

export function daysUntil(day: string, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((parseDay(day).getTime() - today.getTime()) / 86_400_000)
}

// 1440 -> "1 day", 120 -> "2 hours", 45 -> "45 minutes", in the active language.
export function formatDuration(minutes: number, locale: string) {
  const unit = minutes > 0 && minutes % 1440 === 0 ? 'day' : minutes > 0 && minutes % 60 === 0 ? 'hour' : 'minute'
  const value = unit === 'day' ? minutes / 1440 : unit === 'hour' ? minutes / 60 : minutes
  return new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: 'long' }).format(value)
}

// Server DateTime values are UTC. If the JSON has no zone marker, add "Z" so the browser converts it to local time.
export function parseUtc(value: string) {
  return new Date(/[zZ]$|[+-]\d\d:?\d\d$/.test(value) ? value : value + 'Z')
}