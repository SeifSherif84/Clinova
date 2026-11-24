import type { AdminTicketFilters, TicketStatus } from '@/types/admin-support-ticket'

export const ticketStatuses = ['Open', 'InProgress', 'Resolved'] as const

// Backend enum: Open = 1, InProgress = 2, Resolved = 3.
export const ticketStatusValue: Record<TicketStatus, number> = { Open: 1, InProgress: 2, Resolved: 3 }

export const maxReplyLength = 3000

export function parseAdminTicketFilters(search: Record<string, unknown>): AdminTicketFilters {
  const pageIndex = Number(search.pageIndex)
  return {
    status: ticketStatuses.find((item) => item === search.status),
    pageIndex: Number.isInteger(pageIndex) && pageIndex > 1 ? pageIndex : undefined,
  }
}

export function toAdminTicketsQuery(filters: AdminTicketFilters, pageSize: number) {
  const params = new URLSearchParams({ PageIndex: String(filters.pageIndex ?? 1), PageSize: String(pageSize) })
  if (filters.status) params.set('Status', String(ticketStatusValue[filters.status]))
  return params.toString()
}

export function ticketStatusTone(status: string) {
  switch (status) {
    case 'Resolved': return 'border-border bg-muted text-muted-foreground'
    case 'InProgress': return 'border-primary/20 bg-primary/10 text-primary'
    default: return 'border-warm/25 bg-warm/10 text-warm'
  }
}