import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react'
import { toast } from 'sonner'
import { useApi } from '@/hooks/use-api'
import { useAuth } from '@/hooks/use-auth'
import { API_BASE_URL } from '@/lib/api'
import { NotificationContext } from '@/providers/notification-context'
import { router } from '@/router'
import type { NotificationItem } from '@/types/notification'
import { playNotificationSound } from '@/lib/notification-sound'

const notificationQueryKey = ['notifications'] as const
const invitationsUrl = '/doctor/invitations'

function showLiveNotificationToast(notification: NotificationItem) {
  if (!notification.type.startsWith('Invitation')) {
    toast(notification.title, { description: notification.message, duration: 7000 })
    return
  }

  const toastReference: { id?: string | number } = {}
  const navigateToInvitations = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

    event.preventDefault()
    if (toastReference.id !== undefined) toast.dismiss(toastReference.id)
    void router.navigate({ to: invitationsUrl })
  }

  toastReference.id = toast(
    <a
      href={invitationsUrl}
      className="block w-full rounded-md text-start outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      onClick={navigateToInvitations}
    >
      <strong className="block text-sm text-foreground">{notification.title}</strong>
      <span className="mt-1 block text-xs font-normal leading-5 text-muted-foreground">{notification.message}</span>
    </a>,
    { duration: 7000, className: 'cursor-pointer' },
  )
}

export default function NotificationProvider({ children }: { children: ReactNode }) {
  const api = useApi()
  const auth = useAuth()
  const queryClient = useQueryClient()
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: notificationQueryKey,
    queryFn: () => api.request<NotificationItem[]>('/api/notifications', {}, { notifyOnError: false }),
    enabled: auth.isAuthenticated,
  })

  const markOne = useMutation({
    mutationFn: (id: number) => api.request<void>(`/api/notifications/${id}/mark-as-read`, { method: 'POST' }),
    onSuccess: (_response, id) => queryClient.setQueryData<NotificationItem[]>(notificationQueryKey, (current) =>
      current?.map((item) => item.id === id ? { ...item, isRead: true } : item)),
  })
  const markAll = useMutation({
    mutationFn: () => api.request<void>('/api/notifications/mark-all-as-read', { method: 'POST' }),
    onSuccess: () => queryClient.setQueryData<NotificationItem[]>(notificationQueryKey, (current) =>
      current?.map((item) => ({ ...item, isRead: true }))),
  })

  useEffect(() => {
    if (!auth.isAuthenticated || !api.accessToken) return
    const connection = new HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/notifications`, { accessTokenFactory: () => api.accessToken ?? '' })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()

    connection.on('ReceiveNotification', (notification: NotificationItem) => {
      queryClient.setQueryData<NotificationItem[]>(notificationQueryKey, (current) => [
        notification,
        ...(current ?? []).filter((item) => item.id !== notification.id),
      ])
      showLiveNotificationToast(notification)
      playNotificationSound()
      if (notification.type.startsWith('Invitation')) {
        void queryClient.invalidateQueries({ queryKey: ['doctor', 'invitations'] })
      }
      if (notification.type === 'InvitationAccepted') {
        void queryClient.invalidateQueries({ queryKey: ['doctor', 'clinics'] })
      }
    })

    let disposed = false
    void connection.start()
      .then(() => {
        if (disposed) return connection.stop()
      })
      .catch(() => {
        if (!disposed) void refetch()
      })

    return () => {
      disposed = true
      connection.off('ReceiveNotification')
      if (connection.state !== HubConnectionState.Connecting) void connection.stop()
    }
  }, [api.accessToken, auth.isAuthenticated, queryClient, refetch])

  useEffect(() => {
    if (!auth.isAuthenticated) {
      queryClient.removeQueries({ queryKey: notificationQueryKey })
    }
  }, [auth.isAuthenticated, queryClient])

  const notifications = useMemo(
    () => [...(data ?? [])].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [data],
  )
  const unreadCount = notifications.filter((item) => !item.isRead).length
  const value = useMemo(() => ({
    notifications,
    unreadCount,
    isLoading,
    isError,
    error,
    markingId: markOne.isPending ? (markOne.variables ?? null) : null,
    isMarkingAll: markAll.isPending,
    refetch: () => { void refetch() },
    markAsRead: (id: number) => markOne.mutate(id),
    markAllAsRead: () => markAll.mutate(),
  }), [error, isError, isLoading, markAll, markOne, notifications, refetch, unreadCount])

  return <NotificationContext.Provider value={value}>
    {children}
  </NotificationContext.Provider>
}
