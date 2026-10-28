// The backend has not published the full AppointmentStatus enum; these are the values an appointment visible to a secretary can hold.
export const appointmentStatuses = ['PendingVerification', 'Confirmed', 'Completed', 'NoShow', 'Cancelled'] as const
export type AppointmentStatus = typeof appointmentStatuses[number]
// Reservations still awaiting payment never reach the management endpoints, so these are the only deposit statuses a secretary sees.
export const depositPaymentStatuses = ['PendingVerification', 'Paid', 'Rejected', 'Refunded'] as const
export type DepositPaymentStatus = typeof depositPaymentStatuses[number]
export type PaymentMethodType = 'Paymob' | 'ManualTransfer' | 'CashAtClinic'
export type RemainingPaymentStatus = 'Pending' | 'Paid' | 'Cancelled'

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
  depositPaymentStatus: DepositPaymentStatus | string
  // The DTO marks it required, but the mapping sends null when no method was chosen.
  depositPaymentMethodType: PaymentMethodType | string | null
  depositClinicManualPaymentMethodType: string | null
  remainingPaymentStatus: RemainingPaymentStatus | string | null
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
  depositPaymentAmount: number
  depositPaymentStatus: DepositPaymentStatus | string
  depositPaymentMethodType: PaymentMethodType | string | null
  depositClinicManualPaymentMethodType: string | null
  manualDepositPaymentProofUrl: string | null
  depositPaymentTransactionReference: string | null
  depositPaymentSecretaryRejectionReason: string | null
  remainingPaymentAmount: number
  remainingPaymentStatus: RemainingPaymentStatus | string | null
  remainingPaymentMethodType: PaymentMethodType | string | null
  remainingClinicManualPaymentMethodType: string | null
  totalPaidAmount: number
  requestedDepositRefundAmount: number | null
  depositRefundStatus: string | null
  depositRefundMethodType: PaymentMethodType | string | null
  depositRefundReason: string | null
  // ISO 8601 date-time.
  depositRefundProcessedAt: string | null
  manualDepositRefundProofUrl: string | null
  manualDepositRefundTransactionReference: string | null
}

// Mirrors the list page's URL search params; a missing key means that filter is off.
export interface SecretaryAppointmentFilters {
  doctorName?: string
  patientSearch?: string
  slotDate?: string
  appointmentStatus?: AppointmentStatus
  depositPaymentStatus?: DepositPaymentStatus
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
