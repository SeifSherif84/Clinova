import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useApi } from '@/hooks/use-api'
import { isValidRange, toAnalyticsQuery } from '@/lib/analytics'
import { ApiError } from '@/lib/api'
import type { AnalyticsRange, AppointmentOverview, DoctorPerformance, FinancialOverview } from '@/types/analytics'

// 400, 403 and 404 won't change on retry; only transient failures are worth repeating.
const shouldRetry = (count: number, error: Error) => !(error instanceof ApiError && [400, 403, 404].includes(error.status)) && count < 2

// The three analytics endpoints share the clinic and date range, so each section loads and fails on its own.
export function useClinicAnalytics(clinicId: number, range: AnalyticsRange) {
  const api = useApi()
  const enabled = Number.isInteger(clinicId) && clinicId > 0 && isValidRange(range)
  const suffix = toAnalyticsQuery(range)
  const path = `/api/doctor-analytics/clinics/${clinicId}`
  const keyOf = (name: string) => ['doctor', 'clinics', clinicId, 'analytics', name, range.fromDate ?? null, range.toDate ?? null]

  const financial = useQuery({
    queryKey: keyOf('financial'),
    queryFn: () => api.request<FinancialOverview>(`${path}/financial-overview${suffix}`, {}, { notifyOnError: false }),
    enabled,
    retry: shouldRetry,
    placeholderData: keepPreviousData,
  })
  const appointments = useQuery({
    queryKey: keyOf('appointments'),
    queryFn: () => api.request<AppointmentOverview>(`${path}/appointment-overview${suffix}`, {}, { notifyOnError: false }),
    enabled,
    retry: shouldRetry,
    placeholderData: keepPreviousData,
  })
  const doctors = useQuery({
    queryKey: keyOf('doctors'),
    queryFn: () => api.request<DoctorPerformance>(`${path}/doctor-performance-overview${suffix}`, {}, { notifyOnError: false }),
    enabled,
    retry: shouldRetry,
    placeholderData: keepPreviousData,
  })

  return { financial, appointments, doctors }
}