import type { AdminReviewFilters, ReviewStatusFilter } from '@/types/admin-review'

export const reviewStatusFilters = ['pending', 'approved', 'rejected'] as const

// Backend enum: Pending = 1, Approved = 2, Rejected = 3.
export const reviewStatusValue: Record<ReviewStatusFilter, number> = { pending: 1, approved: 2, rejected: 3 }

// Only these two values can be sent when moderating.
export const ReviewModeration = { Approved: 2, Rejected: 3 } as const
export type ReviewModeration = typeof ReviewModeration[keyof typeof ReviewModeration]

const text = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : undefined

export function parseAdminReviewFilters(search: Record<string, unknown>): AdminReviewFilters {
  const pageIndex = Number(search.pageIndex)
  return {
    status: reviewStatusFilters.find((item) => item === search.status),
    q: text(search.q),
    pageIndex: Number.isInteger(pageIndex) && pageIndex > 1 ? pageIndex : undefined,
  }
}

export function toAdminReviewsQuery(filters: AdminReviewFilters, pageSize: number) {
  const params = new URLSearchParams({ PageIndex: String(filters.pageIndex ?? 1), PageSize: String(pageSize) })
  if (filters.status) params.set('Status', String(reviewStatusValue[filters.status]))
  if (filters.q) params.set('SearchTerm', filters.q)
  return params.toString()
}

export function reviewStatusTone(status: string) {
  switch (status) {
    case 'Approved': return 'border-primary/20 bg-primary/10 text-primary'
    case 'Rejected': return 'border-destructive/20 bg-destructive/10 text-destructive'
    default: return 'border-warm/25 bg-warm/10 text-warm'
  }
}