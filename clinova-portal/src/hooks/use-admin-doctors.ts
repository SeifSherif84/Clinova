import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApi } from '@/hooks/use-api'
import { toAdminDoctorsQuery, type DoctorModeration } from '@/lib/admin-doctors'
import type { AdminDoctorFilters, AdminDoctorsResult } from '@/types/admin-doctor'

export function useAdminDoctors(filters: AdminDoctorFilters, pageSize: number) {
  const api = useApi()
  return useQuery({
    queryKey: ['admin', 'doctors', 'list', filters, pageSize],
    queryFn: () => api.request<AdminDoctorsResult>('/api/auth/admin/doctors?' + toAdminDoctorsQuery(filters, pageSize), {}, { notifyOnError: false }),
    placeholderData: keepPreviousData,
  })
}

export function useModerateDoctor() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ doctorId, status }: { doctorId: string; status: DoctorModeration }) =>
      api.request<string>(`/api/auth/admin/doctors/${encodeURIComponent(doctorId)}/approval-status`, { method: 'PATCH', body: JSON.stringify({ approvalStatus: status }) }, { notifyOnError: false }),
    // Nothing is shown as changed until the backend confirms. The list is refetched on success and on failure
    // (a failure usually means the doctor is no longer Pending).
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin', 'doctors'] }),
  })
}