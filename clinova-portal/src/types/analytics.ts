// Date range sent to the analytics endpoints as yyyy-MM-dd; both ends are optional.
export interface AnalyticsRange {
  fromDate?: string
  toDate?: string
}

export interface PaymentMethodBreakdown {
  methodType: string
  category: string
  totalCollected: number
  awaitingVerificationPayments: number
  totalRefunds: number
  netCollected: number
}

export interface FinancialOverview {
  totalCollected: number
  awaitingVerificationPayments: number
  totalRefunds: number
  netCollected: number
  paymentMethods: PaymentMethodBreakdown[]
}

export interface AppointmentOverview {
  confirmedAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  noShowAppointments: number
  pendingVerificationAppointments: number
}

export interface DoctorPerformanceItem {
  doctorId: string
  doctorName: string
  confirmedAppointments: number
  completedAppointments: number
  collectedAmount: number
  expectedAmount: number
}

export interface DoctorPerformance {
  doctors: DoctorPerformanceItem[]
}