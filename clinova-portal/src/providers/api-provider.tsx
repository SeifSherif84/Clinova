import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { API_BASE_URL, parseApiResponse, persistTokens, readStoredTokens, STORAGE_KEYS } from '@/lib/api'
import { ApiContext, type ApiRequestConfig } from '@/providers/api-context'
import type { LoginResponse, SessionTokens } from '@/types/auth'

function withHeaders(init: RequestInit, accessToken?: string | null) {
  const headers = new Headers(init.headers)

  if (!(init.body instanceof FormData) && init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  return headers
}

export default function ApiProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState<SessionTokens | null>(() => readStoredTokens())
  const refreshPromise = useRef<Promise<SessionTokens> | null>(null)
  const persistentSession = useRef(Boolean(localStorage.getItem(STORAGE_KEYS.accessToken)))

  const setSession = useCallback((nextTokens: SessionTokens, persistent = true) => {
    persistentSession.current = persistent
    persistTokens(nextTokens, persistent)
    setTokens(nextTokens)
  }, [])

  const clearSession = useCallback(() => {
    persistTokens(null)
    setTokens(null)
  }, [])

  const refreshSession = useCallback(async () => {
    if (!tokens?.refreshToken) throw new Error('No refresh token is available.')

    if (!refreshPromise.current) {
      refreshPromise.current = fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      })
        .then((response) => parseApiResponse<LoginResponse>(response))
        .then((response) => {
          const nextTokens = {
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
          }
          setSession(nextTokens, persistentSession.current)
          return nextTokens
        })
        .catch((error) => {
          clearSession()
          throw error
        })
        .finally(() => {
          refreshPromise.current = null
        })
    }

    return refreshPromise.current
  }, [clearSession, setSession, tokens])

  const request = useCallback(
    async <T,>(path: string, init: RequestInit = {}, config: ApiRequestConfig = {}) => {
      const authenticated = config.authenticated ?? true
      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: withHeaders(init, authenticated ? tokens?.accessToken : null),
      })

      if (response.status !== 401 || !authenticated || !tokens?.refreshToken) {
        if (response.status === 401 && authenticated) clearSession()
        return parseApiResponse<T>(response)
      }

      const refreshed = await refreshSession()
      const retryResponse = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: withHeaders(init, refreshed.accessToken),
      })

      return parseApiResponse<T>(retryResponse)
    },
    [clearSession, refreshSession, tokens],
  )

  const value = useMemo(
    () => ({ accessToken: tokens?.accessToken ?? null, request, setSession, clearSession }),
    [clearSession, request, setSession, tokens],
  )

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>
}
