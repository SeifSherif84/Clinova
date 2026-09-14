import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowRight, CheckCircle2, MailCheck, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import AuthShell from '@/components/auth-shell'
import { useApi } from '@/hooks/use-api'
import { getErrorMessage } from '@/lib/api'

export default function ConfirmEmailPage() {
  const { t } = useTranslation()
  const api = useApi()
  const params = new URLSearchParams(window.location.search)
  const email = params.get('email') ?? ''
  const token = params.get('token') ?? ''
  const confirmation = useQuery({
    queryKey: ['auth', 'confirm-email', email, token],
    queryFn: () => api.request<string>(`/api/auth/confirm-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`, {}, { authenticated: false, notifyOnError: false }),
    enabled: Boolean(email && token),
    retry: false,
  })
  const invalidLink = !email || !token

  return (
    <AuthShell eyebrow={t('confirmEmail.eyebrow')} title={t('confirmEmail.title')} description={t('confirmEmail.description')}>
      <div className="grid justify-items-center gap-3 text-center">
        {confirmation.isLoading && !invalidLink && <><span className="grid size-16 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary"><MailCheck className="size-7 animate-pulse" /></span><h2 className="mt-2 font-heading text-2xl font-medium">{t('confirmEmail.verifying')}</h2><p className="text-sm text-muted-foreground">{t('confirmEmail.wait')}</p><span className="mt-3 h-1 w-full overflow-hidden rounded-full bg-primary/8"><i className="block h-full w-1/2 animate-pulse rounded-full bg-primary" /></span></>}
        {confirmation.isSuccess && <><span className="grid size-16 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary"><CheckCircle2 className="size-7" /></span><h2 className="mt-2 font-heading text-2xl font-medium">{t('confirmEmail.confirmed')}</h2><p className="mb-2 text-sm leading-6 text-muted-foreground">{t('confirmEmail.confirmedDescription')}</p><Link to="/login" search={{ redirect: undefined }} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90">{t('common.continueToSignIn')} <ArrowRight className="size-4 rtl:rotate-180" /></Link></>}
        {(confirmation.isError || invalidLink) && <><span className="grid size-16 place-items-center rounded-2xl border border-destructive/20 bg-destructive/10 text-destructive"><XCircle className="size-7" /></span><h2 className="mt-2 font-heading text-2xl font-medium">{t('confirmEmail.failed')}</h2><p className="mb-2 text-sm leading-6 text-muted-foreground">{invalidLink ? t('confirmEmail.incomplete') : getErrorMessage(confirmation.error)}</p><Link to="/auth/status" search={{ reason: 'unconfirmed', email }} className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-border bg-muted/55 px-5 text-sm font-bold text-foreground hover:bg-accent">{t('confirmEmail.requestNew')}</Link></>}
      </div>
    </AuthShell>
  )
}
