export const paymobTutorials = [
  'create-account', 'api-keys', 'hmac-secret', 'api-key', 'card-integration',
  'test-live', 'why-credentials', 'credential-security', 'update-disconnect',
] as const
export type PaymobTutorial = typeof paymobTutorials[number]
export function isPaymobTutorial(value: string): value is PaymobTutorial {
  return paymobTutorials.includes(value as PaymobTutorial)
}
