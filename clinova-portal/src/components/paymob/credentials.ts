export const credentialNames = ['publicKey', 'secretKey', 'hmacSecret', 'apiKey', 'cardIntegrationId'] as const
export type CredentialName = typeof credentialNames[number]
export const accountCredentialNames = ['publicKey', 'secretKey', 'hmacSecret', 'apiKey'] as const
export type PaymobCredentials = Record<typeof accountCredentialNames[number], string>

