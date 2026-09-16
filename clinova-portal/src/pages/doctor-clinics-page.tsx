import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Building2, CircleDollarSign, LoaderCircle, MapPin, Plus, RefreshCw, WalletCards } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import DoctorWorkspaceShell from '@/components/doctor-workspace-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useApi } from '@/hooks/use-api'
import { getErrorMessage } from '@/lib/api'
import type { ClinicSummary } from '@/types/clinic'

export default function DoctorClinicsPage() {
  const { t, i18n } = useTranslation()
  const api = useApi()
  const clinics = useQuery({ queryKey: ['doctor', 'clinics'], queryFn: () => api.request<ClinicSummary[]>('/api/clinics', {}, { notifyOnError: false }) })
  const money = new Intl.NumberFormat(i18n.resolvedLanguage === 'ar' ? 'ar-EG' : 'en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 2 })

  return (
    <DoctorWorkspaceShell active="clinics">
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><Badge className="rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
  {t('clinics.eyebrow')}
</Badge><h1 className="mt-2 font-sans text-3xl font-bold sm:text-4xl">{t('clinics.title')}</h1><p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground sm:text-sm">{t('clinics.description')}</p></div>
          <Button className="h-11 rounded-xl bg-primary text-sm font-bold normal-case text-primary-foreground hover:bg-primary/90" render={<Link to="/doctor/clinics/new" />}><Plus />{t('clinics.addClinic')}</Button>
        </div>

        {clinics.isLoading && <Card className="mt-6 min-h-72 items-center justify-center rounded-3xl border border-border bg-card"><LoaderCircle className="size-7 animate-spin text-primary" /><p className="text-xs text-muted-foreground">{t('clinics.loading')}</p></Card>}
        {clinics.isError && <Card className="mt-6 items-center rounded-3xl border border-destructive/20 bg-card p-8 text-center"><p className="text-sm font-semibold text-destructive">{getErrorMessage(clinics.error)}</p><Button className="mt-3 rounded-xl normal-case" variant="outline" onClick={() => clinics.refetch()}><RefreshCw />{t('clinics.retry')}</Button></Card>}

{clinics.data?.length === 0 && (
  <Card className="mt-6 items-center rounded-3xl border border-dashed border-primary/25 bg-gradient-to-br from-primary/5 via-card to-warm/5 p-10 text-center sm:p-16">
    <div className="relative grid place-items-center">
      <span className="absolute size-24 animate-ping rounded-full bg-primary/10 motion-reduce:animate-none" />
      <span className="relative grid size-20 place-items-center rounded-3xl bg-primary/10 text-primary shadow-inner"><Building2 className="size-9" /></span>
    </div>
    <h2 className="mt-6 font-heading text-2xl font-bold sm:text-3xl">{t('clinics.emptyTitle')}</h2>
    <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{t('clinics.emptyDescription')}</p>
  </Card>
)}

        {clinics.data && clinics.data.length > 0 && (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {clinics.data.map((clinic) => (
<Card key={clinic.id} className="group rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
  <CardContent className="grid h-full gap-5">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Building2 className="size-6" /></span>
        <div>
          <h2 className="font-sans text-lg font-bold leading-tight">{clinic.name}</h2>
          <Badge className="mt-1 rounded-full bg-primary/8 px-2 py-0.5 text-[10px] text-primary">{t('clinics.connected')}</Badge>
        </div>
      </div>
    </div>
    <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" />{clinic.buildingNumber} {clinic.streetName}, {clinic.regionName}{clinic.landmark ? ` · ${clinic.landmark}` : ''}</p>
    <div className="grid grid-cols-2 gap-3">
      <span className="grid gap-1.5 rounded-xl bg-background/45 p-3"><small className="flex items-center gap-1.5 text-[9px] font-semibold tracking-wider text-foreground/60 uppercase"><CircleDollarSign className="size-4" />{t('clinics.consultation')}</small><strong className="text-sm">{money.format(clinic.consultationFee)}</strong></span>
      <span className="grid gap-1.5 rounded-xl bg-background/45 p-3"><small className="flex items-center gap-1.5 text-[9px] font-semibold tracking-wider text-foreground/60 uppercase"><WalletCards className="size-4" />{t('clinics.deposit')}</small><strong className="text-sm">{clinic.depositPercentage}%</strong></span>
    </div>
    <Button className="mt-auto w-full rounded-xl bg-primary normal-case font-bold text-primary-foreground hover:bg-primary/90" render={<Link to="/doctor/clinics/$clinicId" params={{ clinicId: String(clinic.id) }} />}>{t('clinics.openClinic')}<ArrowRight className="rtl:rotate-180" /></Button>
  </CardContent>
</Card>
            ))}
          </div>
        )}
      </div>
    </DoctorWorkspaceShell>
  )
}
