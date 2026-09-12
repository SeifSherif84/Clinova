import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function Notice({ message, tone = 'error' }: { message: string; tone?: 'error' | 'success' | 'info' }) {
  const Icon = tone === 'success' ? CheckCircle2 : tone === 'info' ? Info : AlertCircle
  const tones = {
    error: 'border-destructive/25 bg-destructive/8 text-destructive after:bg-destructive',
    success: 'border-primary/25 bg-primary/8 text-primary after:bg-primary',
    info: 'border-border bg-muted/55 text-foreground after:bg-muted-foreground',
  }
  return <Alert variant={tone === 'error' ? 'destructive' : 'default'} className={`rounded-xl ${tones[tone]}`}><Icon className="size-4" /><AlertDescription className="text-xs leading-5 text-current">{message}</AlertDescription></Alert>
}
