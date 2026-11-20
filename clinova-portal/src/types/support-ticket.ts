export interface SupportTicketMessage {
  id: number
  senderId: string
  message: string
  createdAt: string
}

// The API serializes category/status as text; numeric ids are tolerated and mapped through the lookups.
export interface PatientSupportTicket {
  id: number
  category: string | number
  status: string | number
  originalMessage: string
  createdAt: string
  messages: SupportTicketMessage[]
}

export interface CreateSupportTicketRequest {
  category: number
  originalMessage: string
}