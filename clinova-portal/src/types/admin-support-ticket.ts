export type TicketStatus = 'Open' | 'InProgress' | 'Resolved'

export interface AdminSupportTicket {
  id: number
  patientId: string
  patientName: string
  category: string
  status: TicketStatus | string
  originalMessage: string
  createdAt: string
}

export interface AdminSupportTicketsResult {
  pageIndex: number
  pageSize: number
  totalCount: number
  totalPages: number
  items: AdminSupportTicket[]
}

export interface AdminTicketMessage {
  id: number
  senderId: string
  message: string
  createdAt: string
}

export interface AdminSupportTicketDetails extends AdminSupportTicket {
  messages: AdminTicketMessage[]
}

// Mirrors the list page's URL search params; a missing key means that filter is off.
export interface AdminTicketFilters {
  status?: TicketStatus
  pageIndex?: number
}