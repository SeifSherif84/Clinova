import { useMutation } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, Clock3, LoaderCircle, MailCheck, RefreshCcw, ShieldAlert, Stethoscope } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import AuthShell from '@/components/auth-shell'
import Notice from '@/components/notice'
import { Button } from '@/components/ui/button'
import { useApi } from '@/hooks/use-api'
import { getErrorMessage } from '@/lib/api'

const statusKeys = {
  pending: { eyebrow: 'pendingEyebrow', title: 'pendingTitle', description: 'pendingDescription', icon: Clock3 },
  rejected: { eyebrow: 'rejectedEyebrow', title: 'rejectedTitle', description: 'rejectedDescription', icon: ShieldAlert },
  unconfirmed: { eyebrow: 'unconfirmedEyebrow', title: 'unconfirmedTitle', description: 'unconfirmedDescription', icon: MailCheck },
  'check-email': { eyebrow: 'createdEyebrow', title: 'createdTitle', description: 'createdDescription', icon: MailCheck },
  'doctor-created': { eyebrow: 'doctorEyebrow', title: 'doctorTitle', description: 'doctorDescription', icon: Stethoscope },
} as const

export default function AuthStatusPage() {
  const { t } = useTranslation()
  const api = useApi()
  const params = new URLSearchParams(window.location.search)
  const reason = params.get('reason') ?? 'check-email'
  const email = params.get('email') ?? ''
  const content = statusKeys[reason as keyof typeof statusKeys] ?? statusKeys['check-email']
  const Icon = content.icon
  const resend = useMutation({ mutationFn: () => api.request<string>('/api/auth/resend-email-confirmation', { method: 'POST', body: JSON.stringify({ email }) }, { authenticated: false, notifyOnError: false }) })
  const canResend = ['unconfirmed', 'check-email', 'doctor-created'].includes(reason) && Boolean(email)
  const statusTone = reason === 'rejected' ? 'bg-destructive text-white shadow-lg ring-4 shadow-destructive/30 ring-destructive/10' : reason === 'pending' || reason === 'doctor-created' ? 'bg-warm text-white shadow-lg ring-4 shadow-warm/30 ring-warm/10' : 'bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10'

  return (
    <AuthShell eyebrow={t(`authStatus.${content.eyebrow}`)} title={t(`authStatus.${content.title}`)} description={t(`authStatus.${content.description}`)}>
      <div className="grid justify-items-center gap-4 text-center">
        <span className={`grid size-16 place-items-center rounded-full ${statusTone}`}><Icon className="size-7" /></span>
        {email && <p className="max-w-full truncate text-sm font-semibold text-muted-foreground">{t('authStatus.sentTo')} <strong dir="ltr" className="font-bold text-foreground">{email}</strong></p>}
        {reason === 'pending' && (
          <div className="my-3 flex w-full items-start justify-center">
            <span className="grid w-20 justify-items-center gap-1 text-[9px] text-primary"><i className="grid size-6 place-items-center rounded-full bg-primary text-primary-foreground not-italic">1</i>{t('authStatus.verified')}</span>
            <b className="mt-3 h-px w-5 bg-border sm:w-9" />
            <span className="grid w-20 justify-items-center gap-1 text-[9px] text-primary"><i className="grid size-6 place-items-center rounded-full border border-primary not-italic ring-4 ring-primary/5">2</i>{t('authStatus.review')}</span>
            <b className="mt-3 h-px w-5 bg-border sm:w-9" />
            <span className="grid w-20 justify-items-center gap-1 text-[9px] text-muted-foreground"><i className="grid size-6 place-items-center rounded-full border border-border not-italic">3</i>{t('authStatus.ready')}</span>
          </div>
        )}
        {resend.isSuccess && <Notice tone="success" message={t('authStatus.resendSuccess')} />}
        {resend.error && <Notice message={getErrorMessage(resend.error)} />}
        <div className="grid w-full gap-3 pt-1">
          {canResend && <Button className="h-10 cursor-pointer rounded-xl bg-primary px-4 text-[13px] font-bold tracking-normal text-primary-foreground normal-case hover:bg-primary/90" type="button" onClick={() => resend.mutate()} disabled={resend.isPending}>{resend.isPending ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <RefreshCcw className="size-4" />} {resend.isPending ? t('authStatus.sending') : t('authStatus.resend')}</Button>}
          <Link to="/login" search={{ redirect: undefined }} className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-foreground/5 px-4 text-[13px] font-bold normal-case tracking-normal text-foreground transition-colors hover:bg-foreground/10">{canResend ? t('authStatus.confirmedAction') : t('common.backToSignIn')} <ArrowRight className="size-4 rtl:rotate-180" /></Link>
        </div>
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"><ArrowLeft className="size-4 rtl:rotate-180" /> {t('common.returnHome')}</Link>
      </div>
    </AuthShell>
  )
}
