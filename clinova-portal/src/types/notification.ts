export type NotificationType =
  | 'AppointmentReminder'
  | 'BookingConfirmation'
  | 'PaymentSuccess'
  | 'InvitationReceived'
  | 'InvitationAccepted'
  | 'InvitationRejected'
  | 'InvitationCancelled'
  | 'MemberRemoved'
  | 'MemberLeft'
  | 'ReviewSubmitted'
  | string

export interface NotificationItem {
  id: number
  title: string
  message: string
  type: NotificationType
  isRead: boolean
  createdAt: string
}
