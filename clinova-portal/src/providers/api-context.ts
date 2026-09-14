import { createContext } from 'react'
import type { SessionTokens } from '@/types/auth'

export interface ApiRequestConfig {
  authenticated?: boolean
  notifyOnError?: boolean
}

export interface ApiContextValue {
  accessToken: string | null
  isRequesting: boolean
  request: <T>(path: string, init?: RequestInit, config?: ApiRequestConfig) => Promise<T>
  setSession: (tokens: SessionTokens, persistent?: boolean) => void
  clearSession: () => void
}

export const ApiContext = createContext<ApiContextValue | null>(null)
