import { useCallback, useMemo, type ReactNode } from 'react'
import { useApi } from '@/hooks/use-api'
import { AuthContext } from '@/providers/auth-context'
import type { AuthUser, LoginRequest, LoginResponse } from '@/types/auth'

const claimKeys = {
  id: ['sub', 'nameid', 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
  email: ['email', 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
  name: ['given_name', 'unique_name', 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'],
  role: ['role', 'roles', 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
} as const

function readClaim(payload: Record<string, unknown>, keys: readonly string[]) {
  for (const key of keys) {
    if (payload[key] != null) return payload[key]
  }
  return undefined
}

function decodeUser(token: string | null): AuthUser | null {
  if (!token) return null

  try {
    const encodedPayload = token.split('.')[1]
    const unpadded = encodedPayload.replace(/-/g, '+').replace(/_/g, '/')
    const normalized = unpadded.padEnd(Math.ceil(unpadded.length / 4) * 4, '=')
    const payload = JSON.parse(atob(normalized)) as Record<string, unknown>
    const roleClaim = readClaim(payload, claimKeys.role)
    const roles = Array.isArray(roleClaim)
      ? roleClaim.map(String)
      : roleClaim
        ? [String(roleClaim)]
        : []

    return {
      id: String(readClaim(payload, claimKeys.id) ?? ''),
      email: String(readClaim(payload, claimKeys.email) ?? ''),
      name: String(readClaim(payload, claimKeys.name) ?? 'Clinova member'),
      roles,
    }
  } catch {
    return null
  }
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const api = useApi()
  const user = useMemo(() => decodeUser(api.accessToken), [api.accessToken])

  const signIn = useCallback(
    async (credentials: LoginRequest, persistent = true) => {
      const response = await api.request<LoginResponse>(
        '/api/auth/login',
        { method: 'POST', body: JSON.stringify(credentials) },
        { authenticated: false },
      )

      api.setSession(
        { accessToken: response.accessToken, refreshToken: response.refreshToken },
        persistent,
      )
    },
    [api],
  )

  const signOut = useCallback(async () => {
    try {
      await api.request<string>('/api/auth/logout', { method: 'POST' })
    } finally {
      api.clearSession()
    }
  }, [api])

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(api.accessToken && user), signIn, signOut }),
    [api.accessToken, signIn, signOut, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
