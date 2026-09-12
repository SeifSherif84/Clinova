import { createContext } from 'react'
import type { AuthUser, LoginRequest } from '@/types/auth'

export interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  signIn: (request: LoginRequest, persistent?: boolean) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
