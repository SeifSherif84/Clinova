import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, CreditCard, Landmark, LoaderCircle, RefreshCw, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import DoctorWorkspaceShell from '@/components/doctor-workspace-shell'
import Notice from '@/components/notice'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useApi } from '@/hooks/use-api'
import { useAuth } from '@/hooks/use-auth'
import type { ClinicDetails, ClinicMember } from '@/types/clinic'
import { paymobButtonClass } from './setup-section'

export function PaymobPageFrame({ clinicId, title, description, back = 'settings', children }: {
  clinicId: string; title: string; description: string; back?: 'connect' | 'clinic' | 'settings' | 'help'
  children: (clinic: ClinicDetails) => ReactNode
}) {
  const { t } = useTranslation()
  const id = Number(clinicId)
  const valid = Number.isSafeInteger(id) && id > 0
  const api = useApi()
  const auth = useAuth()
  const clinic = useQuery({ queryKey: ['doctor', 'clinics', id], queryFn: () => api.request<ClinicDetails>('/api/clinics/' + id, {}, { notifyOnError: false }), enabled: valid })
  const members = useQuery({ queryKey: ['doctor', 'clinics', id, 'members'], queryFn: () => api.request<ClinicMember[]>('/api/clinics/' + id + '/members', {}, { notifyOnError: false }), enabled: valid })
  const owner = members.data?.some((member) => member.id === auth.user?.id && member.isOwner)
  const failed = clinic.isError || members.isError
  const backPath = back === 'help' ? '/doctor/clinics/$clinicId/payments/paymob/help' : back === 'clinic' ? '/doctor/clinics/$clinicId' : back === 'settings' ? '/doctor/clinics/$clinicId/payments' : '/doctor/clinics/$clinicId/payments/paymob/connect'

  const topBackLink = (
    <Link className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition hover:text-foreground" to={backPath} params={{ clinicId }}>
      <ArrowLeft className="size-4 rtl:rotate-180" />
      {t(back === 'help' ? 'paymob.backHelp' : back === 'clinic' ? 'paymob.back' : back === 'settings' ? 'paymob.backSettings' : 'paymob.backConnect')}
    </Link>
  )

  return <DoctorWorkspaceShell active="clinics" topBackLink={topBackLink}>
    <div className="mx-auto w-full min-w-0 max-w-5xl p-4 sm:p-6 lg:p-10">
      {!valid ? <p className="text-sm text-muted-foreground">{t('clinicDetails.invalidId')}</p>
        : failed ? <><Notice message={t('common.genericError')} /><p role="alert" className="text-sm text-muted-foreground">{t('common.genericError')}</p><Button variant="outline" className={paymobButtonClass + ' mt-4'} onClick={() => { void clinic.refetch(); void members.refetch() }}><RefreshCw />{t('errors.tryAgain')}</Button></>
        : clinic.isPending || members.isPending ? <div role="status" className="flex min-h-64 items-center justify-center gap-3 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />{t('paymob.loading')}</div>
        : !owner ? <Alert role="note" className="rounded-xl"><ShieldCheck /><AlertDescription>{t('paymob.ownerOnly')}</AlertDescription></Alert>
        : clinic.data ? <>
          <header className="mb-6">
            <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary"><CreditCard className="size-3" />{t('paymob.eyebrow')}</Badge>
            <h1 className="mt-2 font-sans text-3xl font-bold sm:text-4xl">{t('paymob.pageTitle')}</h1>
            <p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground sm:text-sm">{t('paymob.pageDescription')}</p>
            <section className="relative isolate mt-5 overflow-hidden rounded-3xl border border-primary/10 bg-card p-6 sm:p-10">
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
              <div aria-hidden="true" className="pointer-events-none absolute -end-20 -top-20 -z-10 size-72 rounded-full bg-primary/10 blur-3xl" />
              <div className="grid items-center gap-10 lg:grid-cols-[1.3fr_1fr]">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                    <Landmark className="size-3.5 shrink-0" />
                    <span className="min-w-0 break-words">{clinic.data.name}</span>
                  </span>
                  <h2 className="mt-4 max-w-lg font-sans text-3xl leading-tight font-bold sm:text-4xl">{title}</h2>
                  <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground">{description}</p>
                </div>
                <div className="relative mx-auto grid h-36 w-full max-w-xs grid-cols-[auto_1fr_auto] items-center gap-2 sm:h-40 sm:max-w-sm">
  {/* سيب العمود الأول زي ما هو، وعدّل عمود Paymob بس */}
  {/* سيب العمود الأول زي ما هو، وعدّل عمود Paymob بس */}
                  <span className="relative z-10 grid size-20 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 ring-8 ring-primary/10">
                    <Landmark className="size-8" />
                  </span>
<div className="relative h-full w-full">
  <svg aria-hidden="true" className="absolute inset-0 size-full" viewBox="0 0 160 80" fill="none">
    <defs>
      <linearGradient id="paymobLink" x1="0" y1="40" x2="160" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="currentColor" className="text-primary/50" />
        <stop offset="100%" stopColor="currentColor" className="text-primary/0" />
      </linearGradient>
    </defs>
    <path id="paymobCurve" d="M0 42 Q80 10 160 42" stroke="url(#paymobLink)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    <circle r="3.5" className="fill-primary">
      <animateMotion dur="2.8s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear">
        <mpath href="#paymobCurve" />
      </animateMotion>
      <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="2.8s" repeatCount="indefinite" />
    </circle>
  </svg>
</div>
<div className="relative z-10 mt-1.5 grid shrink-0 justify-items-center">
  <span className="flex h-14 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-md">
    <img src="/payment-providers/paymob2.png" alt="" className="h-12 max-w-[95%] object-contain" />
  </span>
</div>
                </div>
              </div>
            </section>
          </header>
          {children(clinic.data)}
        </> : null}
    </div>
  </DoctorWorkspaceShell>
}
