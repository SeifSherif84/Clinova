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
        {confirmation.isLoading && !invalidLink && <><span className="grid size-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10"><MailCheck className="size-7 animate-pulse motion-reduce:animate-none" /></span><h2 className="mt-2 font-sans text-2xl font-bold">{t('confirmEmail.verifying')}</h2><p className="text-sm text-muted-foreground">{t('confirmEmail.wait')}</p><span className="mt-3 h-1 w-full overflow-hidden rounded-full bg-primary/8"><i className="block h-full w-1/2 animate-pulse rounded-full bg-primary" /></span></>}
        {confirmation.isSuccess && <><span className="grid size-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10"><CheckCircle2 className="size-7" /></span><h2 className="mt-2 font-sans text-2xl font-bold">{t('confirmEmail.confirmed')}</h2><p className="mb-2 text-sm leading-6 text-muted-foreground">{t('confirmEmail.confirmedDescription')}</p><Link to="/login" search={{ redirect: undefined }} className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-bold normal-case tracking-normal text-primary-foreground transition-colors hover:bg-primary/90">{t('common.continueToSignIn')} <ArrowRight className="size-4 rtl:rotate-180" /></Link></>}
        {(confirmation.isError || invalidLink) && <><span className="grid size-16 place-items-center rounded-full bg-destructive text-white shadow-lg ring-4 shadow-destructive/30 ring-destructive/10"><XCircle className="size-7" /></span><h2 className="mt-2 font-sans text-2xl font-bold">{t('confirmEmail.failed')}</h2><p className="mb-2 text-sm leading-6 text-muted-foreground">{invalidLink ? t('confirmEmail.incomplete') : getErrorMessage(confirmation.error)}</p><Link to="/auth/status" search={{ reason: 'unconfirmed', email }} className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-xl bg-foreground/5 px-4 text-[13px] font-bold normal-case tracking-normal text-foreground transition-colors hover:bg-foreground/10">{t('confirmEmail.requestNew')}</Link></>}
      </div>
    </AuthShell>
  )
}
