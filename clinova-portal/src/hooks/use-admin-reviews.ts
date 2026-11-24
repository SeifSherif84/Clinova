import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApi } from '@/hooks/use-api'
import { toAdminReviewsQuery, type ReviewModeration } from '@/lib/admin-reviews'
import type { AdminReviewFilters, AdminReviewsResult } from '@/types/admin-review'

export function useAdminReviews(filters: AdminReviewFilters, pageSize: number) {
  const api = useApi()
  return useQuery({
    queryKey: ['admin', 'reviews', 'list', filters, pageSize],
    queryFn: () => api.request<AdminReviewsResult>('/api/reviews/admin?' + toAdminReviewsQuery(filters, pageSize), {}, { notifyOnError: false }),
    placeholderData: keepPreviousData,
  })
}

export function useModerateReview() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ reviewId, status }: { reviewId: number; status: ReviewModeration }) =>
      api.request<string>(`/api/reviews/${reviewId}/admin/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, { notifyOnError: false }),
    // The list is refetched from the server; nothing is shown as changed until the backend confirms.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] }),
  })
}