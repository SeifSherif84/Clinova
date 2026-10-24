import type { ManualPaymentMethodType } from '@/types/manual-payment-method'

export default function ProviderLogo({ type, className = '' }: { type: ManualPaymentMethodType; className?: string }) {
  // Preserve original brand artwork on a white surface, including in dark mode.
  return <span aria-hidden="true" className={`relative flex h-12 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ${className}`}>
    {type === 'InstaPay'
      ? <img src="/payment-providers/instapay.png" alt="" className="absolute w-32 max-w-none" />
      : <img src="/payment-providers/vodafone.svg" alt="" className="size-9" />}
  </span>
}
