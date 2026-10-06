import { useQuery } from '@tanstack/react-query'
import { useApi } from '@/hooks/use-api'
import { readPaymobStatus, readSavedPaymobConfiguration } from '@/lib/paymob-configuration'

// Mount these hooks only inside the clinic-owner page boundary.
export function usePaymobStatus(clinicId: string) {
  const api = useApi()
  return useQuery({
    queryKey: ['doctor', 'clinics', Number(clinicId), 'paymob-status'],
    queryFn: async () => {
      try {
        return readPaymobStatus(await api.request<unknown>('/api/payments/clinics/' + Number(clinicId) + '/configuration', { cache: 'no-store' }, { notifyOnError: false }))
      } catch { throw new Error('Payment settings unavailable') }
    },
    retry: false,
  })
}
export function useSavedPaymobConfiguration(clinicId: string) {
  const api = useApi()
  return useQuery({
    queryKey: ['doctor', 'clinics', Number(clinicId), 'paymob-configuration'],
    queryFn: async () => {
      try {
        return readSavedPaymobConfiguration(await api.request<unknown>('/api/online-payment-accounts/clinics/' + Number(clinicId), { cache: 'no-store' }, { notifyOnError: false }))
      } catch { throw new Error('Payment settings unavailable') }
    },
    retry: false,
  })
}
