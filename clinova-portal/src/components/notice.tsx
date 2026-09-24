import { useEffect } from 'react'
import { Check, Info, TriangleAlert, X } from 'lucide-react'
import { toast } from 'sonner'

type Tone = 'error' | 'success' | 'info'

const toneStyles = {
  error: { border: 'border-destructive/25', tint: 'bg-destructive/[0.04]', icon: 'bg-destructive text-white', Icon: TriangleAlert },
  success: { border: 'border-primary/25', tint: 'bg-primary/[0.05]', icon: 'bg-primary text-primary-foreground', Icon: Check },
  info: { border: 'border-border', tint: 'bg-muted/50', icon: 'bg-muted-foreground text-background', Icon: Info },
}

export default function Notice({ message, tone = 'error' }: { message: string; tone?: Tone }) {
  useEffect(() => {
    if (!message) return
    const { border, tint, icon, Icon } = toneStyles[tone]

    toast(
      <div className={`relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border bg-card p-4 pe-11 shadow-xl ${border}`}>
        <span className={`pointer-events-none absolute inset-0 ${tint}`} />
        <span className={`relative grid size-9 shrink-0 place-items-center rounded-full shadow-sm ${icon}`}>
          <Icon className="size-[18px]" strokeWidth={2.5} />
        </span>
        <p className="relative min-w-0 flex-1 text-sm font-bold leading-5 text-foreground">{message}</p>
        <button
          type="button"
          onClick={() => toast.dismiss(message)}
          className="absolute end-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground/60 outline-none transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>
      </div>,
      { id: message, duration: 5000, unstyled: true, closeButton: false },
    )
  }, [message, tone])

  return null
}