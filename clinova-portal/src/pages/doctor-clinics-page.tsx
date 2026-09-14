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
          <div><Badge className="text-primary">{t('clinics.eyebrow')}</Badge><h1 className="mt-2 font-heading text-3xl font-medium sm:text-4xl">{t('clinics.title')}</h1><p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground sm:text-sm">{t('clinics.description')}</p></div>
          <Button className="rounded-xl normal-case" render={<Link to="/doctor/clinics/new" />}><Plus />{t('clinics.addClinic')}</Button>
        </div>

        {clinics.isLoading && <Card className="mt-6 min-h-72 items-center justify-center rounded-3xl border border-border bg-card"><LoaderCircle className="size-7 animate-spin text-primary" /><p className="text-xs text-muted-foreground">{t('clinics.loading')}</p></Card>}
        {clinics.isError && <Card className="mt-6 items-center rounded-3xl border border-destructive/20 bg-card p-8 text-center"><p className="text-sm font-semibold text-destructive">{getErrorMessage(clinics.error)}</p><Button className="mt-3 rounded-xl normal-case" variant="outline" onClick={() => clinics.refetch()}><RefreshCw />{t('clinics.retry')}</Button></Card>}

        {clinics.data?.length === 0 && (
          <Card className="mt-6 items-center rounded-3xl border border-dashed border-primary/25 bg-card/70 p-8 text-center sm:p-12">
            <span className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary"><Building2 className="size-7" /></span>
            <h2 className="font-heading text-2xl font-medium">{t('clinics.emptyTitle')}</h2>
            <p className="max-w-md text-xs leading-6 text-muted-foreground">{t('clinics.emptyDescription')}</p>
            <Button className="rounded-xl normal-case" render={<Link to="/doctor/clinics/new" />}><Plus />{t('clinics.createFirst')}</Button>
          </Card>
        )}

        {clinics.data && clinics.data.length > 0 && (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {clinics.data.map((clinic) => (
              <Card key={clinic.id} className="group rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
                <CardContent className="grid h-full gap-5">
                  <div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><Building2 className="size-5" /></span><Badge className="rounded-full bg-primary/8 px-2 py-1 text-primary">{t('clinics.connected')}</Badge></div>
                  <div><h2 className="font-heading text-xl font-medium">{clinic.name}</h2><p className="mt-2 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" />{clinic.buildingNumber} {clinic.streetName}, {clinic.regionName}{clinic.landmark ? ` · ${clinic.landmark}` : ''}</p></div>
                  <div className="grid grid-cols-2 gap-3"><span className="grid gap-1 rounded-xl bg-background/45 p-3"><small className="flex items-center gap-1 text-[9px] tracking-wider text-muted-foreground uppercase"><CircleDollarSign className="size-3" />{t('clinics.consultation')}</small><strong className="text-xs">{money.format(clinic.consultationFee)}</strong></span><span className="grid gap-1 rounded-xl bg-background/45 p-3"><small className="flex items-center gap-1 text-[9px] tracking-wider text-muted-foreground uppercase"><WalletCards className="size-3" />{t('clinics.deposit')}</small><strong className="text-xs">{clinic.depositPercentage}%</strong></span></div>
                  <Button className="mt-auto w-full rounded-xl normal-case" variant="outline" render={<Link to="/doctor/clinics/$clinicId" params={{ clinicId: String(clinic.id) }} />}>{t('clinics.openClinic')}<ArrowRight className="rtl:rotate-180" /></Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DoctorWorkspaceShell>
  )
}
