import { AlertCircle, LogIn, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import i18n from '@/i18n'
import { ApiError } from '@/lib/api'
import { ErrorContext, type ErrorNotification } from '@/providers/error-context'
import { Button } from '@/components/ui/button'

function flattenValidationErrors(errors: ApiError['errors']) {
  if (!errors) return []
  if (Array.isArray(errors)) return errors
  return Object.values(errors).flat()
}

function presentError(error: unknown): Omit<ErrorNotification, 'id'> | null {
  if (error instanceof DOMException && error.name === 'AbortError') return null

  const status = error instanceof ApiError ? error.status : undefined
  const fallback = error instanceof Error ? error.message : i18n.t('errors.unexpectedMessage')
  const validation = error instanceof ApiError ? flattenValidationErrors(error.errors).slice(0, 3) : []
  const serverMessage = error instanceof ApiError ? error.message : fallback

  if (status === 0 || error instanceof TypeError) return { title: i18n.t('errors.networkTitle'), message: i18n.t('errors.networkMessage'), status: 0 }
  if (status === 400) return { title: i18n.t('errors.badRequestTitle'), message: validation.length ? validation.join(' · ') : serverMessage, status }
  if (status === 401) return { title: i18n.t('errors.unauthorizedTitle'), message: i18n.t('errors.unauthorizedMessage'), status }
  if (status === 403) return { title: i18n.t('errors.forbiddenTitle'), message: serverMessage || i18n.t('errors.forbiddenMessage'), status }
  if (status === 404) return { title: i18n.t('errors.notFoundTitle'), message: serverMessage || i18n.t('errors.notFoundMessage'), status }
  if (status === 409) return { title: i18n.t('errors.conflictTitle'), message: serverMessage || i18n.t('errors.conflictMessage'), status }
  if (status === 429) return { title: i18n.t('errors.rateLimitTitle'), message: i18n.t('errors.rateLimitMessage'), status }
  if (status && status >= 500) return { title: i18n.t('errors.serverTitle'), message: i18n.t('errors.serverMessage'), status }
  return { title: i18n.t('errors.unexpectedTitle'), message: i18n.t('errors.unexpectedMessage'), status }
}

function ErrorToast({ notification, onDismiss }: { notification: ErrorNotification; onDismiss: () => void }) {
  return (
    <div className="pointer-events-auto w-full max-w-sm animate-in slide-in-from-top-2 fade-in rounded-2xl border border-destructive/25 bg-card/95 p-4 text-card-foreground shadow-2xl backdrop-blur-xl" role="alert">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive"><AlertCircle className="size-4" /></span>
        <div className="min-w-0 flex-1"><strong className="text-sm">{notification.title}</strong><p className="mt-1 text-xs leading-5 text-muted-foreground">{notification.message}</p>{notification.status === 401 && <Button className="mt-3 h-8 rounded-lg px-3 normal-case" render={<a href="/login" />}><LogIn />{i18n.t('errors.signIn')}</Button>}</div>
        <Button variant="ghost" size="icon-xs" className="rounded-lg text-muted-foreground" aria-label={i18n.t('errors.dismiss')} onClick={onDismiss}><X /></Button>
      </div>
    </div>
  )
}

export default function ErrorProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<ErrorNotification[]>([])

  const dismissError = useCallback((id: string) => {
    setNotifications((current) => current.filter((notification) => notification.id !== id))
  }, [])

  const clearErrors = useCallback(() => setNotifications([]), [])

  const reportError = useCallback((error: unknown) => {
    const presentation = presentError(error)
    if (!presentation) return
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    setNotifications((current) => {
      const duplicate = current.some((item) => item.status === presentation.status && item.message === presentation.message)
      return duplicate ? current : [...current.slice(-2), { id, ...presentation }]
    })
    window.setTimeout(() => dismissError(id), 7000)
  }, [dismissError])

  useEffect(() => {
    const handleWindowError = (event: ErrorEvent) => reportError(event.error ?? event.message)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => reportError(event.reason)
    window.addEventListener('error', handleWindowError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    return () => {
      window.removeEventListener('error', handleWindowError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [reportError])

  const value = useMemo(() => ({ reportError, dismissError, clearErrors }), [clearErrors, dismissError, reportError])

  return (
    <ErrorContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 left-4 z-[250] grid justify-items-end gap-3 sm:left-auto sm:w-96" aria-live="assertive" aria-atomic="false">
        {notifications.map((notification) => <ErrorToast key={notification.id} notification={notification} onDismiss={() => dismissError(notification.id)} />)}
      </div>
    </ErrorContext.Provider>
  )
}
