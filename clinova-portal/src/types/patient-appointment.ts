// Mirrors PatientAppointmentResponse (GET /api/appointments).
export interface PatientAppointment {
  appointmentId: number
  doctorName: string
  clinicName: string
  slotDate: string // yyyy-MM-dd
  slotStartTime: string // HH:mm:ss
  slotEndTime: string // HH:mm:ss
  appointmentStatus: string
  depositAmount: number
  depositPaymentStatus: string
  requestedDepositRefundAmount: number | null
  depositRefundStatus: string | null
  reservationExpiresAt: string | null
}

// Mirrors PatientAppointmentDetailsResponse (GET /api/appointments/{appointmentId}).
export interface PatientAppointmentDetails {
  appointmentId: number
  doctorName: string
  clinicName: string

  bookingDate: string
  bookingSource: string
  bookingType: string
  slotDate: string
  slotStartTime: string
  slotEndTime: string
  appointmentStatus: string
  reservationExpiresAt: string | null

  consultationFee: number
  totalPaidAmount: number

  depositAmount: number
  depositPaymentStatus: string
  depositPaymentMethodType: string | null
  depositClinicManualPaymentMethodType: string | null
  manualDepositPaymentProofUrl: string | null
  depositPaymentTransactionReference: string | null
  depositPaymentRejectionReason: string | null

  remainingAmount: number
  remainingPaymentStatus: string | null
  remainingPaymentMethodType: string | null
  remainingClinicManualPaymentMethodType: string | null

  requestedDepositRefundAmount: number | null
  depositRefundStatus: string | null
  depositRefundMethodType: string | null
  depositRefundReason: string | null
  depositRefundRequestedAt: string | null
  depositRefundProcessedAt: string | null
  manualDepositRefundProofUrl: string | null
  manualDepositRefundTransactionReference: string | null

  fullRefundCancellationWindowMinutes: number | null
  bookingCancellationGracePeriodMinutes: number | null
}