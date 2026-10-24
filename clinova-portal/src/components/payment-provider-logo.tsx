import type { ManualPaymentMethodType } from '@/types/manual-payment-method'

const sizes = {
  md: { wrap: 'h-12 w-24', insta: 'w-32', vodafone: 'size-9' },
  sm: { wrap: 'h-9 w-16', insta: 'w-20', vodafone: 'size-6' },
}

export default function ProviderLogo({ type, size = 'md', className = '' }: { type: ManualPaymentMethodType; size?: 'md' | 'sm'; className?: string }) {
  const s = sizes[size]
  // Preserve original brand artwork on a white surface, including in dark mode.
  return <span aria-hidden="true" className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ${s.wrap} ${className}`}>
    {type === 'InstaPay'
      ? <img src="/payment-providers/instapay.png" alt="" className={`absolute max-w-none ${s.insta}`} />
      : <img src="/payment-providers/vodafone.svg" alt="" className={s.vodafone} />}
  </span>
}
