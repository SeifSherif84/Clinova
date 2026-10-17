import type { SecretaryAppointment, SecretaryAppointmentDetails } from '@/types/secretary'

const success = ['Confirmed', 'Completed', 'Paid']
const pending = ['PendingPayment', 'PendingVerification', 'Pending']
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

function hasEnded(appointment: Pick<SecretaryAppointment, 'slotDate' | 'endTime'>) {
  const date = parseSlotDate(appointment.slotDate)
  const [hours, minutes] = appointment.endTime.split(':').map(Number)
  if (!date) return false
  date.setHours(hours || 0, minutes || 0)
  return date.getTime() <= Date.now()
}

// Mirrors the backend rules so only actions that can succeed are offered.
export function availableActions(details: SecretaryAppointmentDetails) {
  const verifying = details.appointmentStatus === 'PendingVerification' && details.paymentStatus === 'PendingVerification' && details.paymentType === 'Manual' && Boolean(details.paymentProofUrl)
  const confirmedPaid = details.appointmentStatus === 'Confirmed' && details.paymentStatus === 'Paid'
  const ended = hasEnded(details)
  return { verify: verifying, cancel: confirmedPaid, complete: confirmedPaid && ended, noShow: confirmedPaid && ended }
}
