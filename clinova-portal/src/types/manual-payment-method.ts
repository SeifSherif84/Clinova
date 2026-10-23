export type ManualPaymentMethodType = 'VodafoneCash' | 'InstaPay'

export interface ManualPaymentMethod {
  id: number
  type: ManualPaymentMethodType
  accountIdentifier: string
  isActive: boolean
}

export const manualPaymentTypeIds: Record<ManualPaymentMethodType, number> = {
  VodafoneCash: 1,
  InstaPay: 2,
}

export const manualPaymentProviders: readonly ManualPaymentMethodType[] = ['VodafoneCash', 'InstaPay']

export function isManualPaymentProvider(type: string): type is ManualPaymentMethodType {
  return (manualPaymentProviders as readonly string[]).includes(type)
}
