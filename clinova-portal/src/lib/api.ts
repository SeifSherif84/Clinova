import type { ApiProblem, SessionTokens } from '@/types/auth'
import i18n from '@/i18n'

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7269'
).replace(/\/$/, '')

export const STORAGE_KEYS = {
  accessToken: 'clinova.access-token',
  refreshToken: 'clinova.refresh-token',
} as const

export class ApiError extends Error {
  status: number
  title: string
  errors?: ApiProblem['errors']

  constructor(status: number, problem?: ApiProblem | string) {
    const message =
      typeof problem === 'string'
        ? problem
        : problem?.message ?? problem?.title ?? i18n.t('common.genericError')

    super(message)
    this.name = 'ApiError'
    this.status = status
    this.title = typeof problem === 'string' ? 'Request failed' : (problem?.title ?? 'Request failed')
    this.errors = typeof problem === 'string' ? undefined : problem?.errors
  }
}

export function normalizeApiError(error: unknown) {
  if (error instanceof ApiError || (error instanceof DOMException && error.name === 'AbortError')) return error
  if (error instanceof TypeError) {
    return new ApiError(0, { title: i18n.t('errors.networkTitle'), message: i18n.t('errors.networkMessage') })
  }
  return error instanceof Error ? error : new ApiError(0, i18n.t('errors.unexpectedMessage'))
}

export function readStoredTokens(): SessionTokens | null {
  const accessToken = localStorage.getItem(STORAGE_KEYS.accessToken) ?? sessionStorage.getItem(STORAGE_KEYS.accessToken)
  const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken) ?? sessionStorage.getItem(STORAGE_KEYS.refreshToken)

  return accessToken && refreshToken ? { accessToken, refreshToken } : null
}

export function persistTokens(tokens: SessionTokens | null, persistent = true) {
  localStorage.removeItem(STORAGE_KEYS.accessToken)
  localStorage.removeItem(STORAGE_KEYS.refreshToken)
  sessionStorage.removeItem(STORAGE_KEYS.accessToken)
  sessionStorage.removeItem(STORAGE_KEYS.refreshToken)

  if (!tokens) return

  const storage = persistent ? localStorage : sessionStorage
  storage.setItem(STORAGE_KEYS.accessToken, tokens.accessToken)
  storage.setItem(STORAGE_KEYS.refreshToken, tokens.refreshToken)
}

export async function parseApiResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T

  const contentType = response.headers.get('content-type') ?? ''
  let payload: unknown
  try {
    payload = contentType.includes('application/json') ? await response.json() : await response.text()
  } catch {
    payload = undefined
  }

  if (!response.ok) {
    throw new ApiError(response.status, payload as ApiProblem | string | undefined)
  }

  return payload as T
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : i18n.t('common.genericError')
}
