import type { CredentialName } from '@/components/paymob/credentials'

export const paymobStatuses = ['NotConfigured', 'Connected', 'NeedsAttention', 'Disabled'] as const
export type PaymobStatus = typeof paymobStatuses[number]
export const paymobIssueCodes = ['PaymobAuthenticationFailed', 'InvalidIntegration', 'HmacVerificationFailed', 'ProviderUnavailable', 'UnknownConfigurationIssue'] as const
export type PaymobIssueCode = typeof paymobIssueCodes[number]
export interface PaymobStatusMetadata {
  status: PaymobStatus
  issueCode?: PaymobIssueCode
  lastUpdatedAt?: string
}
export interface SavedPaymobConfiguration {
  accountId: number
  storedFields: Record<CredentialName, boolean>
  cardIntegrationId?: string
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined
}
function safeDate(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value)) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

// Construct a fresh allowlisted object BEFORE data reaches the query cache.
// Never forward provider messages, credentials, unknown fields, or raw payloads.
export function readPaymobStatus(value: unknown): PaymobStatusMetadata {
  const input = record(value)
  if (!input || input.provider !== 'Paymob' || !paymobStatuses.includes(input.status as PaymobStatus)) throw new Error('Payment settings unavailable')
  const status = input.status as PaymobStatus
  return {
    status,
    issueCode: status === 'NeedsAttention' && paymobIssueCodes.includes(input.issueCode as PaymobIssueCode) ? input.issueCode as PaymobIssueCode : undefined,
    lastUpdatedAt: safeDate(input.lastUpdatedAt),
  }
}

export function readSavedPaymobConfiguration(value: unknown): SavedPaymobConfiguration | null {
  if (!Array.isArray(value)) throw new Error('Payment settings unavailable')
  const accounts = value.map(record).filter((item) => item?.provider === 'Paymob')
  if (!accounts.length) return null
  const account = accounts[0]
  if (accounts.length !== 1 || !account || !Number.isSafeInteger(account.id) || Number(account.id) <= 0 || !Array.isArray(account.integrations)) throw new Error('Payment settings unavailable')
  const cards = account.integrations.map(record).filter((item) => item?.paymentMethod === 'Card' && Number.isSafeInteger(item.integrationId) && Number(item.integrationId) > 0)
  const activeCards = cards.filter((item) => item?.isActive === true)
  const card = activeCards.length === 1 ? activeCards[0] : cards.length === 1 ? cards[0] : undefined
  // The current account-creation contract requires all four keys.
  // These flags represent presence; no saved key values enter the frontend model.
  return {
    accountId: Number(account.id),
    storedFields: { publicKey: true, secretKey: true, hmacSecret: true, apiKey: true, cardIntegrationId: Boolean(card) },
    cardIntegrationId: card ? String(card.integrationId) : undefined,
  }
}
