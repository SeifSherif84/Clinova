// The backend has not published the full AppointmentStatus enum; these are the values an appointment visible to a secretary can hold.
export const appointmentStatuses = ['PendingVerification', 'Confirmed', 'Completed', 'NoShow', 'Cancelled'] as const
export type AppointmentStatus = typeof appointmentStatuses[number]
// Reservations still awaiting payment never reach the management endpoints, so these are the only payment statuses a secretary sees.
export const paymentStatuses = ['PendingVerification', 'Paid', 'Rejected', 'Refunded'] as const
export type PaymentStatus = typeof paymentStatuses[number]
export type PaymentCategory = 'Online' | 'Manual'

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
  slotStartTime: string
  slotEndTime: string
  appointmentStatus: AppointmentStatus | string
  doctorName: string
  patientName: string
  paymentStatus: PaymentStatus | string
  paymentCategory: PaymentCategory | string
  requiresManualRefundAction: boolean
}

export interface SecretaryAppointmentDetails {
  appointmentId: number
  slotDate: string
  slotStartTime: string
  slotEndTime: string
  appointmentStatus: AppointmentStatus | string
  bookingSource: string
  bookingType: string
  doctorName: string
  patientName: string
  patientPhoneNumber: string
  paymentStatus: PaymentStatus | string
  paymentCategory: PaymentCategory | string
  paymentMethodType: string
  clinicManualPaymentMethodType: string | null
  paymentSecretaryRejectionReason: string | null
  paymentAmount: number
  remainingAmount: number
  manualPaymentProofUrl: string | null
  paymentTransactionReference: string | null
  refundStatus: string | null
  refundAmount: number | null
  refundMethod: string | null
  refundReason: string | null
  refundProcessedAt: string | null
  manualRefundProofUrl: string | null
  manualRefundTransactionReference: string | null
}

// Mirrors the list page's URL search params; a missing key means that filter is off.
export interface SecretaryAppointmentFilters {
  doctorName?: string
  patientSearch?: string
  slotDate?: string
  appointmentStatus?: AppointmentStatus
  paymentStatus?: PaymentStatus
  pageIndex?: number
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
