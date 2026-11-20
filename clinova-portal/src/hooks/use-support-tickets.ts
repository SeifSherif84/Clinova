import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApi } from '@/hooks/use-api'
import type { LookupOption } from '@/types/auth'
import type { CreateSupportTicketRequest, PatientSupportTicket } from '@/types/support-ticket'

export const ticketsKey = ['patient', 'support', 'tickets'] as const

export function useSupportCategories() {
  const api = useApi()
  return useQuery({
    queryKey: ['lookups', 'support-ticket-categories'],
    queryFn: () => api.request<LookupOption[]>('/api/lookups/support-ticket-categories', {}, { notifyOnError: false }),
    staleTime: Infinity,
  })
}

export function useMyTickets() {
  const api = useApi()
  return useQuery({
    queryKey: ticketsKey,
    queryFn: () => api.request<PatientSupportTicket[]>('/api/support-tickets/my-tickets', {}, { notifyOnError: false }),
    // Replies come from the support team, so the list refreshes quietly while the page is open.
    refetchInterval: 30000,
  })
}

export function useCreateTicket() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateSupportTicketRequest) => api.request<string>('/api/support-tickets', { method: 'POST', body: JSON.stringify(body) }, { notifyOnError: false }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ticketsKey }),
  })
}

export function useSendTicketMessage(ticketId: number) {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (message: string) => api.request<string>(`/api/support-tickets/${ticketId}/messages`, { method: 'POST', body: JSON.stringify({ message }) }, { notifyOnError: false }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ticketsKey }),
  })
}