import { createContext } from 'react'
import type { NotificationItem } from '@/types/notification'

export interface NotificationContextValue {
  notifications: NotificationItem[]
  unreadCount: number
  isLoading: boolean
  isError: boolean
  error: unknown
  markingId: number | null
  isMarkingAll: boolean
  refetch: () => void
  markAsRead: (notificationId: number) => void
  markAllAsRead: () => void
}

export const NotificationContext = createContext<NotificationContextValue | null>(null)
