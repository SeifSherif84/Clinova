import { createContext } from 'react'

export interface ErrorNotification {
  id: string
  title: string
  message: string
  status?: number
}

export interface ErrorContextValue {
  reportError: (error: unknown) => void
  dismissError: (id: string) => void
  clearErrors: () => void
}

export const ErrorContext = createContext<ErrorContextValue | null>(null)
