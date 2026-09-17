export type InvitationStatus = 'Pending' | 'Accepted' | 'Rejected'

interface InvitationBase {
  id: number
  clinicName: string
  status: InvitationStatus | string
  sentAt: string
  respondedAt: string | null
}

export interface SentInvitation extends InvitationBase {
  receiverName: string
}

export interface ReceivedInvitation extends InvitationBase {
  senderName: string
}

export type InvitationAction = 'accept' | 'reject' | 'cancel'
