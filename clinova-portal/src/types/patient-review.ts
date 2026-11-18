export type PatientReviewStatus = 'Pending' | 'Approved' | 'Rejected'

export interface PatientGetHisOwnReviewResponse {
  reviewId: number
  appointmentId: number
  rating: number
  comment: string | null
  isAnonymous: boolean
  status: string
  createdAt: string
  doctorId: string
  doctorName: string
  clinicName: string
}