// Enum values are sent as numbers, matching the ids returned by the lookups.
export const BookingType = { Advance: 1, WalkIn: 2 } as const
export type BookingType = typeof BookingType[keyof typeof BookingType]

export const GuestPaymentMethod = { Cash: 1, ManualTransfer: 2 } as const
export type GuestPaymentMethod = typeof GuestPaymentMethod[keyof typeof GuestPaymentMethod]

export interface AvailableDay {
  dayName: string
  date: string
}

export interface AvailableSlot {
  id: number
  startTime: string
  endTime: string
}

export interface CreateGuestReservationRequest {
  bookingType: BookingType
  guestPatientName: string
  guestPatientPhone: string
}

export interface GuestReservationCheckout {
  appointmentId: number
  guestPatientName: string
  guestPatientPhone: string
  bookingType: 'Advance' | 'WalkIn' | string
  consultationFee: number
  paymentAmount: number
  remainingAmount: number
  reservationExpiresAt: string
}

export interface GuestCheckoutAccount {
  id: number
  type: string
  accountIdentifier: string
}

export interface ConfirmGuestPaymentRequest {
  guestReservationPaymentMethod: GuestPaymentMethod
  clinicManualPaymentMethodId?: number
}

// What the page keeps about a held reservation so a refresh can still confirm or cancel it.
export interface HeldReservation {
  checkout: GuestReservationCheckout
  doctorName: string
  date: string
  startTime: string
  endTime: string
}
