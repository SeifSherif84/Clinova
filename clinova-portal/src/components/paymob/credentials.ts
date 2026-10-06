export const credentialNames = ['publicKey', 'secretKey', 'hmacSecret', 'apiKey', 'cardIntegrationId'] as const
export type CredentialName = typeof credentialNames[number]
export type PaymobCredentials = Record<CredentialName, string>

