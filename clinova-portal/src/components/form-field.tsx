import type { InputHTMLAttributes, ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon?: ReactNode
  hint?: string
  error?: string
}

export default function FormField({ label, icon, hint, error, id, className = '', ...props }: FormFieldProps) {
  return (
    <div className={`grid min-w-0 max-w-full gap-2 ${className}`}>
      <Label htmlFor={id} className="text-xs font-semibold text-foreground/80">{label}</Label>
      <div className="relative min-w-0 max-w-full">
        {icon && <span className="pointer-events-none absolute top-1/2 start-3 z-10 -translate-y-1/2 text-primary/70">{icon}</span>}
        <Input id={id} aria-invalid={Boolean(error)} className={`h-12 rounded-xl border border-input bg-background/40 px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/10 ${icon ? 'ps-10' : ''}`} {...props} />
      </div>
      {(hint || error) && <small className={`min-w-0 break-words text-[11px] leading-4 ${error ? 'text-destructive' : 'text-muted-foreground'}`}>{error ?? hint}</small>}
    </div>
  )
}
