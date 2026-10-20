import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApi } from '@/hooks/use-api'
import { ApiError } from '@/lib/api'
import { readSavedPaymobConfiguration } from '@/lib/paymob-configuration'
import type { PaymobCredentials } from '@/components/paymob/credentials'

export const paymobQueryKey = (clinicId: string) => ['doctor', 'clinics', Number(clinicId), 'paymob-configuration'] as const
// Mount only inside the clinic-owner boundary.
export function useSavedPaymobConfiguration(clinicId: string) {
  const api = useApi()
  return useQuery({
    queryKey: paymobQueryKey(clinicId),
    queryFn: async ({ signal }) => {
      try {
        return readSavedPaymobConfiguration(await api.request<unknown>('/api/online-payment-accounts/clinics/' + Number(clinicId), { cache: 'no-store', signal }, { notifyOnError: false }))
      } catch { throw new Error('Payment settings unavailable') }
    },
    retry: false,
    refetchInterval: (query) => !query.state.error && query.state.data?.status === 'PendingVerification' ? 15000 : false,
  })
}
export type PaymobAccountAction = 'activate' | 'deactivate' | 'delete'
// Repeating activate/deactivate is a harmless 200; deleting an account with payment history returns 400.
export function usePaymobAccountAction(clinicId: string) {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ accountId, action }: { accountId: number; action: PaymobAccountAction }) => api.request<unknown>('/api/online-payment-accounts/' + accountId + '/clinics/' + Number(clinicId) + (action === 'delete' ? '' : '/' + action), {
      method: action === 'delete' ? 'DELETE' : 'PATCH',
    }, { notifyOnError: false }),
    // Reconcile stale or removed accounts after every attempt; mutations are never retried.
    onSettled: () => queryClient.invalidateQueries({ queryKey: paymobQueryKey(clinicId) }),
  })
}
export type PaymobIntegrationAction = { kind: 'update'; paymobIntegrationId: number } | { kind: 'activate' | 'deactivate' | 'delete' }
// The URL takes Clinova's integration id; only the update body carries Paymob's own Integration ID.
export function usePaymobIntegrationAction(clinicId: string) {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ accountId, integrationId, action }: { accountId: number; integrationId: number; action: PaymobIntegrationAction }) => api.request<unknown>(
      '/api/integrations/' + integrationId + '/online-payment-accounts/' + accountId + '/clinics/' + Number(clinicId) + (action.kind === 'activate' || action.kind === 'deactivate' ? '/' + action.kind : ''), {
        method: action.kind === 'delete' ? 'DELETE' : 'PATCH',
        body: action.kind === 'update' ? JSON.stringify({ integrationId: action.paymobIntegrationId }) : undefined,
      }, { notifyOnError: false }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: paymobQueryKey(clinicId) }),
  })
}
export function useSavePaymobCredentials(clinicId: string) {
  const api = useApi()
  const queryClient = useQueryClient()
  // Direct requests keep write-only credentials out of React Query's mutation cache.
  return async (credentials: Partial<PaymobCredentials>, accountId?: number) => {
    const body = Object.fromEntries(Object.entries(credentials).filter(([, value]) => value.trim()).map(([key, value]) => [key, value.trim()]))
    if (!Object.keys(body).length) throw new Error('Payment settings unavailable')
    try {
      await api.request<unknown>('/api/online-payment-accounts/' + (accountId === undefined ? '' : accountId + '/') + 'clinics/' + Number(clinicId), {
        method: accountId === undefined ? 'POST' : 'PATCH', body: JSON.stringify(body),
      }, { notifyOnError: false })
    } catch (error) {
      if (error instanceof ApiError && [400, 403, 404].includes(error.status)) void queryClient.invalidateQueries({ queryKey: paymobQueryKey(clinicId) })
      // Provider errors may contain credentials; do not retain them as an error cause.
      // eslint-disable-next-line preserve-caught-error
      throw new Error('Payment settings unavailable')
    } finally {
      for (const key of Object.keys(body)) delete body[key]
    }
    await queryClient.invalidateQueries({ queryKey: paymobQueryKey(clinicId) })
  }
}
