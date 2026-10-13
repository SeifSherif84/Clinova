// A Paymob account is saved with these four keys only. Integration IDs are added to the saved account separately.
export const credentialNames = ['publicKey', 'secretKey', 'hmacSecret', 'apiKey'] as const
export type CredentialName = typeof credentialNames[number]
export const accountCredentialNames = credentialNames
export type PaymobCredentials = Record<CredentialName, string>
