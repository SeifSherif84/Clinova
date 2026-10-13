import { useQuery, useQueryClient } from '@tanstack/react-query'
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
