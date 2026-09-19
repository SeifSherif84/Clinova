import { useContext } from 'react'
import { NotificationContext } from '@/providers/notification-context'

export function useNotifications() {
  const context = useContext(NotificationContext)

  if (!context) throw new Error('useNotifications must be used inside NotificationProvider.')
  return context
}
