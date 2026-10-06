import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Building2, CreditCard, LoaderCircle, RefreshCw, ShieldCheck } from 'lucide-react'
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

  return <DoctorWorkspaceShell active="clinics">
    <div className="mx-auto w-full min-w-0 max-w-5xl p-4 sm:p-6 lg:p-10">
      <Button role="link" variant="ghost" className={paymobButtonClass + ' mb-5 h-auto min-h-11 whitespace-normal px-0 text-muted-foreground'} render={<Link to={backPath} params={{ clinicId }} />}><ArrowLeft className="size-4 rtl:rotate-180" />{t(back === 'help' ? 'paymob.backHelp' : back === 'clinic' ? 'paymob.back' : back === 'settings' ? 'paymob.backSettings' : 'paymob.backConnect')}</Button>
      {!valid ? <p className="text-sm text-muted-foreground">{t('clinicDetails.invalidId')}</p>
        : failed ? <><Notice message={t('common.genericError')} /><p role="alert" className="text-sm text-muted-foreground">{t('common.genericError')}</p><Button variant="outline" className={paymobButtonClass + ' mt-4'} onClick={() => { void clinic.refetch(); void members.refetch() }}><RefreshCw />{t('errors.tryAgain')}</Button></>
        : clinic.isPending || members.isPending ? <div role="status" className="flex min-h-64 items-center justify-center gap-3 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />{t('paymob.loading')}</div>
        : !owner ? <Alert role="note" className="rounded-xl"><ShieldCheck /><AlertDescription>{t('paymob.ownerOnly')}</AlertDescription></Alert>
        : clinic.data ? <>
          <header className="mb-6">
            <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary"><CreditCard className="size-3" />{t('paymob.eyebrow')}</Badge>
            <p className="mt-4 flex items-center gap-2 text-xs font-bold text-muted-foreground"><Building2 className="size-3.5 shrink-0" /><span className="min-w-0 break-words">{clinic.data.name}</span></p>
            <h1 className="mt-3 font-sans text-3xl font-bold sm:text-4xl">{title}</h1>
            <p className="mt-3 max-w-3xl text-xs leading-6 text-muted-foreground sm:text-sm">{description}</p>
          </header>
          {children(clinic.data)}
        </> : null}
    </div>
  </DoctorWorkspaceShell>
}
