import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Bell, MailOpen, X } from 'lucide-react'
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
  const isInvitation = notification.type.startsWith('Invitation')
  const toastReference: { id?: string | number } = {}

  const navigateToInvitations = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

    event.preventDefault()
    if (toastReference.id !== undefined) toast.dismiss(toastReference.id)
    void router.navigate({ to: invitationsUrl })
  }

  const dismiss = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (toastReference.id !== undefined) toast.dismiss(toastReference.id)
  }

  const CardContent = (
    <div className="relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-primary/25 bg-card p-4 pe-11 shadow-xl">
      <span className="pointer-events-none absolute inset-0 bg-primary/[0.05]" />
      <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
        {isInvitation ? <MailOpen className="size-5" strokeWidth={2.25} /> : <Bell className="size-5" strokeWidth={2.25} />}
      </span>
      <div className="relative min-w-0 flex-1">
        <strong className="block text-base font-bold leading-tight text-foreground">{notification.title}</strong>
        <span className="mt-1 block text-sm font-bold leading-5 text-muted-foreground">{notification.message}</span>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="absolute end-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground/60 outline-none transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>
    </div>
  )

  if (!isInvitation) {
    toastReference.id = toast(CardContent, { duration: 7000, unstyled: true, closeButton: false })
    return
  }

  toastReference.id = toast(
    <a
      href={invitationsUrl}
      className="block w-full text-start outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:rounded-2xl"
      onClick={navigateToInvitations}
    >
      {CardContent}
    </a>,
    { duration: 7000, unstyled: true, closeButton: false, className: 'cursor-pointer' },
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
