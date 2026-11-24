import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApi } from '@/hooks/use-api'
import { ticketStatusValue, toAdminTicketsQuery } from '@/lib/admin-support-tickets'
import type { AdminSupportTicketDetails, AdminSupportTicketsResult, AdminTicketFilters, TicketStatus } from '@/types/admin-support-ticket'

export function useAdminTickets(filters: AdminTicketFilters, pageSize: number) {
  const api = useApi()
  return useQuery({
    queryKey: ['admin', 'support-tickets', 'list', filters, pageSize],
    queryFn: () => api.request<AdminSupportTicketsResult>('/api/support-tickets/admin?' + toAdminTicketsQuery(filters, pageSize), {}, { notifyOnError: false }),
    placeholderData: keepPreviousData,
  })
}

export function useAdminTicket(ticketId: number) {
  const api = useApi()
  return useQuery({
    queryKey: ['admin', 'support-tickets', 'details', ticketId],
    queryFn: () => api.request<AdminSupportTicketDetails>(`/api/support-tickets/${ticketId}/admin`, {}, { notifyOnError: false }),
    enabled: Number.isInteger(ticketId) && ticketId > 0,
  })
}

// Both mutations refetch from the server; nothing is shown as changed until the backend confirms.
export function useSendAdminReply(ticketId: number) {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (message: string) =>
      api.request<string>(`/api/support-tickets/${ticketId}/messages`, { method: 'POST', body: JSON.stringify({ message }) }, { notifyOnError: false }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'support-tickets'] }),
  })
}

export function useUpdateTicketStatus(ticketId: number) {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (status: TicketStatus) =>
      api.request<string>(`/api/support-tickets/${ticketId}/admin`, { method: 'PATCH', body: JSON.stringify({ status: ticketStatusValue[status] }) }, { notifyOnError: false }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'support-tickets'] }),
  })
}