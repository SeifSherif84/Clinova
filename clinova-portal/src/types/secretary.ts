export const appointmentStatuses = ['PendingPayment', 'PendingVerification', 'Confirmed', 'Cancelled', 'Completed', 'NoShow', 'Expired'] as const
export type AppointmentStatus = typeof appointmentStatuses[number]
export const paymentStatuses = ['Pending', 'PendingVerification', 'Paid', 'Failed', 'Rejected', 'Refunded', 'Cancelled', 'Expired'] as const
export type PaymentStatus = typeof paymentStatuses[number]

// Gender is serialized as its numeric enum value (Male = 1, Female = 2).
export type Gender = 1 | 2

export interface SecretaryProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  nationalIdImageUrl: string
  profilePicture: string | null
  dateOfBirth: string | null
  gender: Gender | null
  // Not returned by the API yet; leaving a clinic needs it.
  clinicId?: number | null
}

export interface UpdateSecretaryProfileRequest {
  firstName?: string
  lastName?: string
  dateOfBirth?: string | null
  gender?: Gender | null
}

export interface SecretaryAppointment {
  appointmentId: number
  slotDate: string
  startTime: string
  endTime: string
  appointmentStatus: AppointmentStatus | string
  doctorName: string
  patientName: string
  paymentStatus: PaymentStatus | string
  paymentType: string
  requiresManualRefundAction: boolean
}

export interface SecretaryAppointmentDetails {
  appointmentId: number
  slotDate: string
  startTime: string
  endTime: string
  appointmentStatus: AppointmentStatus | string
  doctorName: string
  patientName: string
  patientPhoneNumber: string
  paymentStatus: PaymentStatus | string
  paymentType: string
  manualPaymentMethodType: string | null
  paymentRejectionReason: string | null
  paymentAmount: number
  remainingAmount: number
  paymentProofUrl: string | null
  transactionReference: string | null
  refundStatus: string | null
  refundAmount: number | null
  refundReason: string | null
  refundProcessedAt: string | null
}

export interface SecretaryAppointmentFilters {
  doctorName: string
  slotDate: string
  appointmentStatus: AppointmentStatus | ''
  paymentStatus: PaymentStatus | ''
  pageIndex: number
}

export interface PaginatedResult<T> {
  pageIndex: number
  pageSize: number
  totalCount: number
  totalPages: number
  items: T[]
}

export interface ClinicSecretary {
  id: string
  fullName: string
  profilePicture: string | null
}

export type SecretaryAppointmentAction = 'secretary-cancel' | 'mark-completed' | 'mark-no-show' | 'approve' | 'reject'
