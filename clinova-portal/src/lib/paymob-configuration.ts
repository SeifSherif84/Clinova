import type { PaymobCredentials } from '@/components/paymob/credentials'

export const paymobStatuses = ['NotConfigured', 'PendingVerification', 'Ready', 'Restricted', 'Disabled', 'NeedsAttention'] as const
export type PaymobStatus = typeof paymobStatuses[number]
export type PaymobPaymentMethod = 'Card' | 'Wallet'
export interface PaymobIntegration {
  id: number
  paymentMethod: PaymobPaymentMethod
  integrationId: number
  isActive: boolean
}
export interface SavedPaymobConfiguration {
  accountId: number
  status: PaymobStatus
  isReady: boolean
  storedFields: Record<keyof PaymobCredentials, boolean>
  integrations: PaymobIntegration[]
}
function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined
}
function positiveInt(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0 && Number(value) <= 2147483647
}
// Allowlist metadata before caching it. Keys and provider messages never enter the cache.
export function readSavedPaymobConfiguration(value: unknown): SavedPaymobConfiguration | null {
  if (!Array.isArray(value) || value.some((item) => !record(item))) throw new Error('Payment settings unavailable')
  const accounts = value.map(record).filter((item) => item?.provider === 'Paymob')
  if (!accounts.length) return null
  const account = accounts[0]
  if (accounts.length !== 1 || !account || !positiveInt(account.id) || !paymobStatuses.includes(account.status as PaymobStatus) || typeof account.isReady !== 'boolean' || account.isReady !== (account.status === 'Ready') || !Array.isArray(account.integrations)) throw new Error('Payment settings unavailable')
  const integrations = account.integrations.map((value): PaymobIntegration => {
    const item = record(value)
    if (!item || !positiveInt(item.id) || !positiveInt(item.integrationId) || !['Card', 'Wallet'].includes(String(item.paymentMethod)) || typeof item.isActive !== 'boolean') throw new Error('Payment settings unavailable')
    return { id: item.id, paymentMethod: item.paymentMethod as PaymobPaymentMethod, integrationId: item.integrationId, isActive: item.isActive }
  })
  return {
    accountId: account.id, status: account.status as PaymobStatus, isReady: account.isReady,
    storedFields: { publicKey: true, secretKey: true, hmacSecret: true, apiKey: true }, integrations,
  }
}
