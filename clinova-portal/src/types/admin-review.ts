export type ReviewStatusFilter = 'pending' | 'approved' | 'rejected'

export interface AdminReview {
  reviewId: number
  patientName: string
  rating: number
  comment: string | null
  // Serialized enum name: Pending | Approved | Rejected.
  status: string
  isAnonymous: boolean
  createdAt: string
}

export interface AdminReviewsResult {
  pageIndex: number
  pageSize: number
  totalCount: number
  totalPages: number
  items: AdminReview[]
}

// Mirrors the page's URL search params; a missing key means that filter is off.
export interface AdminReviewFilters {
  status?: ReviewStatusFilter
  q?: string
  pageIndex?: number
}