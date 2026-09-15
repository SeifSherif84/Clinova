import { useMutation } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, LoaderCircle, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import AuthShell from '@/components/auth-shell'
import FormField from '@/components/form-field'
import Notice from '@/components/notice'
import { Button } from '@/components/ui/button'
import { useApi } from '@/hooks/use-api'
import { getErrorMessage } from '@/lib/api'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const api = useApi()
  const [email, setEmail] = useState('')
  const reset = useMutation({ mutationFn: (address: string) => api.request<string>('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ email: address }) }, { authenticated: false, notifyOnError: false }) })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const address = String(new FormData(event.currentTarget).get('email'))
    setEmail(address)
    reset.mutate(address)
  }

  return (
    <AuthShell eyebrow={t('forgotPassword.eyebrow')} title={t('forgotPassword.title')} description={t('forgotPassword.description')}>
      <form className="grid gap-5" onSubmit={handleSubmit}>
        {reset.isSuccess && <Notice tone="success" message={t('forgotPassword.success', { email })} />}
        {reset.error && <Notice message={getErrorMessage(reset.error)} />}
        <FormField id="resetEmail" name="email" type="email" label={t('fields.email')} placeholder="you@example.com" icon={<Mail size={18} />} autoComplete="email" required />
        <Button className="h-12 rounded-xl bg-primary text-sm font-bold tracking-normal text-primary-foreground normal-case hover:bg-primary/90" type="submit" disabled={reset.isPending}>
          {reset.isPending ? <LoaderCircle className="size-4 animate-spin" /> : <>{t('forgotPassword.submit')} <ArrowRight className="size-4 rtl:rotate-180" /></>}
        </Button>
        <Link to="/login" search={{ redirect: undefined }} className="inline-flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-primary"><ArrowLeft className="size-4 rtl:rotate-180" /> {t('common.backToSignIn')}</Link>
      </form>
    </AuthShell>
  )
}
