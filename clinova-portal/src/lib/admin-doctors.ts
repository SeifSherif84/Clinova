import type { AdminDoctorFilters, DoctorStatusFilter } from '@/types/admin-doctor'

export const doctorStatusFilters = ['pending', 'approved', 'rejected', 'all'] as const

// Backend enum: Pending = 1, Rejected = 2, Approved = 3.
export const doctorStatusValue = { pending: 1, rejected: 2, approved: 3 } as const

// Only these two values can be sent when moderating.
export const DoctorModeration = { Rejected: 2, Approved: 3 } as const
export type DoctorModeration = typeof DoctorModeration[keyof typeof DoctorModeration]

const text = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : undefined

export const effectiveStatus = (filters: AdminDoctorFilters): DoctorStatusFilter => filters.status ?? 'pending'

export function parseAdminDoctorFilters(search: Record<string, unknown>): AdminDoctorFilters {
  const pageIndex = Number(search.pageIndex)
  const status = doctorStatusFilters.find((item) => item === search.status)
  return {
    // Pending is the default, so it is never written to the URL.
    status: status === 'pending' ? undefined : status,
    q: text(search.q),
    pageIndex: Number.isInteger(pageIndex) && pageIndex > 1 ? pageIndex : undefined,
  }
}

export function toAdminDoctorsQuery(filters: AdminDoctorFilters, pageSize: number) {
  const params = new URLSearchParams({ PageIndex: String(filters.pageIndex ?? 1), PageSize: String(pageSize) })
  const status = effectiveStatus(filters)
  // The backend defaults a missing ApprovalStatus to Pending, so "All" must send it explicitly empty (null).
  params.set('ApprovalStatus', status === 'all' ? '' : String(doctorStatusValue[status]))
  if (filters.q) params.set('SearchTerm', filters.q)
  return params.toString()
}

export function doctorStatusTone(status: string) {
  switch (status) {
    case 'Approved': return 'border-primary/20 bg-primary/10 text-primary'
    case 'Rejected': return 'border-destructive/20 bg-destructive/10 text-destructive'
    default: return 'border-warm/25 bg-warm/10 text-warm'
  }
}