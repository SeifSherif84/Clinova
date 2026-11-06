import { useMutation } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowRight, KeyRound, LoaderCircle } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import AuthShell from '@/components/auth-shell'
import Notice from '@/components/notice'
import PasswordField from '@/components/password-field'
import { Button } from '@/components/ui/button'
import { useApi } from '@/hooks/use-api'
import { getErrorMessage } from '@/lib/api'

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const api = useApi()
  const [formError, setFormError] = useState('')
  const params = new URLSearchParams(window.location.search)
  const email = params.get('email') ?? ''
  const token = params.get('token') ?? ''
  const update = useMutation({ mutationFn: ({ newPassword, confirmPassword }: { newPassword: string; confirmPassword: string }) => api.request<string>(`/api/auth/update-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`, { method: 'POST', body: JSON.stringify({ newPassword, confirmPassword }) }, { authenticated: false, notifyOnError: false }) })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    const form = new FormData(event.currentTarget)
    const newPassword = String(form.get('newPassword'))
    const confirmPassword = String(form.get('confirmPassword'))
    if (!email || !token) return setFormError(t('validation.invalidResetLink'))
    if (!passwordPattern.test(newPassword)) return setFormError(t('validation.passwordRules'))
    if (newPassword !== confirmPassword) return setFormError(t('validation.passwordMismatch'))
    update.mutate({ newPassword, confirmPassword })
  }

  return (
    <AuthShell eyebrow={t('resetPassword.eyebrow')} title={t('resetPassword.title')} description={t('resetPassword.description')}>
      {update.isSuccess ? (
        <div className="grid justify-items-center gap-3 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10"><KeyRound className="size-7" /></span>
          <h2 className="mt-2 font-sans text-2xl font-bold">{t('resetPassword.updatedTitle')}</h2>
          <p className="mb-2 text-sm text-muted-foreground">{t('resetPassword.updatedDescription')}</p>
          <Link to="/login" search={{ redirect: undefined }} className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-bold normal-case tracking-normal text-primary-foreground transition-colors hover:bg-primary/90">{t('common.continueToSignIn')} <ArrowRight className="size-4 rtl:rotate-180" /></Link>
        </div>
      ) : (
        <form className="grid gap-5" onSubmit={handleSubmit}>
          {(formError || update.error) && <Notice message={formError || getErrorMessage(update.error)} />}
          <PasswordField id="newPassword" name="newPassword" label={t('fields.newPassword')} placeholder={t('fields.strongPassword')} hint={t('fields.passwordHint')} autoComplete="new-password" required />
          <PasswordField id="confirmNewPassword" name="confirmPassword" label={t('fields.confirmNewPassword')} placeholder={t('fields.repeatNewPassword')} autoComplete="new-password" required />
          <Button className="h-10 cursor-pointer rounded-xl bg-primary px-4 text-[13px] font-bold tracking-normal text-primary-foreground normal-case hover:bg-primary/90" type="submit" disabled={update.isPending}>
            {update.isPending ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <>{t('resetPassword.submit')} <ArrowRight className="size-4 rtl:rotate-180" /></>}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
