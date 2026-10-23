import { useQuery } from '@tanstack/react-query'
import { useApi } from '@/hooks/use-api'
import type { ClinicDetails, SecretaryClinicMember } from '@/types/clinic'

// The clinic is resolved from the signed-in secretary, so no id is sent.
export function useSecretaryClinic() {
  const api = useApi()
  return useQuery({
    queryKey: ['secretary', 'clinic', 'details'],
    queryFn: () => api.request<ClinicDetails>('/api/clinics/my-clinic/details', {}, { notifyOnError: false }),
    retry: false,
  })
}

export function useSecretaryClinicMembers(enabled = true) {
  const api = useApi()
  return useQuery({
    queryKey: ['secretary', 'clinic', 'members'],
    queryFn: () => api.request<SecretaryClinicMember[]>('/api/clinics/members/management', {}, { notifyOnError: false }),
    enabled,
    retry: false,
  })
}
