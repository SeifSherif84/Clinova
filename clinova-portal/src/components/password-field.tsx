import { Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { useState, type InputHTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  hint?: string
  error?: string
}

export default function PasswordField({ label, hint, error, id, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const { t } = useTranslation()

  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-xs font-semibold text-foreground/80">{label}</Label>
      <div className="relative">
        <LockKeyhole className="pointer-events-none absolute top-1/2 start-3 z-10 size-[18px] -translate-y-1/2 text-primary/70" />
        <Input id={id} type={visible ? 'text' : 'password'} aria-invalid={Boolean(error)} className="h-12 rounded-xl border border-input bg-background/40 pe-11 ps-10 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/10" {...props} />
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute top-1/2 end-1.5 -translate-y-1/2 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary"
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? t('common.hidePassword') : t('common.showPassword')}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </Button>
      </div>
      {(hint || error) && <small className={`text-[11px] leading-4 ${error ? 'text-destructive' : 'text-muted-foreground'}`}>{error ?? hint}</small>}
    </div>
  )
}
