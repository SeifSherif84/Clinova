import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowRight, LoaderCircle, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import AuthShell from '@/components/auth-shell'
import FormField from '@/components/form-field'
import Notice from '@/components/notice'
import PasswordField from '@/components/password-field'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/use-auth'
import { ApiError, getErrorMessage } from '@/lib/api'

function blockedReason(error: ApiError) {
  const message = error.message.toLowerCase()
  if (message.includes('pending')) return 'pending'
  if (message.includes('rejected')) return 'rejected'
  if (message.includes('confirm')) return 'unconfirmed'
  return null
}

export default function LoginPage() {
  const { t } = useTranslation()
  const auth = useAuth()
  const navigate = useNavigate()
  const [remember, setRemember] = useState(true)

  const login = useMutation({
    mutationFn: ({ credentials, persistent }: { credentials: { email: string; password: string }; persistent: boolean }) => auth.signIn(credentials, persistent),
    onSuccess: () => navigate({ to: '/dashboard' }),
    onError: (error, variables) => {
      if (error instanceof ApiError && error.status === 403) {
        const reason = blockedReason(error)
        if (reason) navigate({ to: '/auth/status', search: { reason, email: variables.credentials.email } })
      }
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    login.mutate({ credentials: { email: String(form.get('email')), password: String(form.get('password')) }, persistent: remember })
  }

  return (
    <AuthShell eyebrow={t('login.eyebrow')} title={t('login.title')} description={t('login.description')}>
      <form className="grid gap-5" onSubmit={handleSubmit}>
        {login.error && !(login.error instanceof ApiError && login.error.status === 403) && <Notice message={getErrorMessage(login.error)} />}
        <FormField id="email" name="email" type="email" label={t('login.email')} placeholder="you@example.com" icon={<Mail size={18} />} autoComplete="email" required />
        <PasswordField id="password" name="password" label={t('login.password')} placeholder={t('login.passwordPlaceholder')} autoComplete="current-password" required />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2"><Checkbox id="remember" className="rounded border-input data-checked:bg-primary" checked={remember} onCheckedChange={setRemember} /><Label htmlFor="remember" className="cursor-pointer text-xs font-normal text-muted-foreground">{t('login.remember')}</Label></div>
          <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:text-primary/75">{t('login.forgot')}</Link>
        </div>
        <Button className="h-12 rounded-xl bg-primary text-sm font-bold tracking-normal text-primary-foreground normal-case hover:bg-primary/90" type="submit" disabled={login.isPending}>
          {login.isPending ? <LoaderCircle className="size-4 animate-spin" /> : <>{t('login.submit')} <ArrowRight className="size-4 rtl:rotate-180" /></>}
        </Button>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3"><Separator /><span className="text-center text-[10px] tracking-widest text-muted-foreground uppercase">{t('login.newHere')}</span><Separator /></div>
        <p className="text-center text-xs text-muted-foreground">{t('login.newToClinova')} <Link to="/register" className="font-semibold text-primary hover:text-primary/75">{t('common.createAccount')}</Link></p>
      </form>
    </AuthShell>
  )
}
