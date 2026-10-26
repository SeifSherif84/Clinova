import { API_BASE_URL } from '@/lib/api'
import { appointmentStatuses, paymentStatuses, type SecretaryAppointment, type SecretaryAppointmentDetails, type SecretaryAppointmentFilters } from '@/types/secretary'

const success = ['Confirmed', 'Completed', 'Paid', 'Succeeded']
const pending = ['PendingPayment', 'PendingVerification', 'Pending', 'Processing', 'PendingManualProcessing']
const danger = ['Rejected', 'Failed', 'NoShow']

export function statusTone(status: string) {
  if (success.includes(status)) return 'border-primary/20 bg-primary/10 text-primary'
  if (pending.includes(status)) return 'border-warm/20 bg-warm/10 text-warm'
  if (danger.includes(status)) return 'border-destructive/20 bg-destructive/10 text-destructive'
  return 'border-border bg-muted text-muted-foreground'
}

// DateOnly arrives as yyyy-MM-dd; build a local date so the day never shifts across time zones.
export function parseSlotDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return year && month && day ? new Date(year, month - 1, day) : null
}

export const formatTime = (value: string) => value.slice(0, 5)

// Proof URLs may come back relative to the API host.
export function resolveFileUrl(value: string) {
  return /^https?:\/\//i.test(value) ? value : `${API_BASE_URL}/${value.replace(/^\//, '')}`
}

const text = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : undefined
const oneOf = <T extends string>(values: readonly T[], value: unknown) => values.includes(value as T) ? value as T : undefined

// Keeps filters in the URL so returning from an appointment restores the same view.
export function parseAppointmentFilters(search: Record<string, unknown>): SecretaryAppointmentFilters {
  const pageIndex = Number(search.pageIndex)
  const slotDate = text(search.slotDate)
  return {
    doctorName: text(search.doctorName),
    patientSearch: text(search.patientSearch),
    slotDate: slotDate && /^\d{4}-\d{2}-\d{2}$/.test(slotDate) ? slotDate : undefined,
    appointmentStatus: oneOf(appointmentStatuses, search.appointmentStatus),
    paymentStatus: oneOf(paymentStatuses, search.paymentStatus),
    pageIndex: Number.isInteger(pageIndex) && pageIndex > 1 ? pageIndex : undefined,
  }
}

export function toAppointmentsQuery(filters: SecretaryAppointmentFilters, pageSize: number) {
  const params = new URLSearchParams({ pageIndex: String(filters.pageIndex ?? 1), pageSize: String(pageSize) })
  for (const key of ['doctorName', 'patientSearch', 'slotDate', 'appointmentStatus', 'paymentStatus'] as const) {
    const value = filters[key]
    if (value) params.set(key, value)
  }
  return params.toString()
}

function hasEnded(appointment: Pick<SecretaryAppointment, 'slotDate' | 'slotEndTime'>) {
  const date = parseSlotDate(appointment.slotDate)
  const [hours, minutes] = appointment.slotEndTime.split(':').map(Number)
  if (!date) return false
  date.setHours(hours || 0, minutes || 0)
  return date.getTime() <= Date.now()
}

// Mirrors the backend rules so only actions that can succeed are offered.
export function availableActions(details: SecretaryAppointmentDetails) {
  const verifying = details.appointmentStatus === 'PendingVerification' && details.paymentStatus === 'PendingVerification' && details.paymentCategory === 'Manual' && Boolean(details.manualPaymentProofUrl)
  const confirmedPaid = details.appointmentStatus === 'Confirmed' && details.paymentStatus === 'Paid'
  const ended = hasEnded(details)
  return { verify: verifying, cancel: confirmedPaid, complete: confirmedPaid && ended, noShow: confirmedPaid && ended }
}
