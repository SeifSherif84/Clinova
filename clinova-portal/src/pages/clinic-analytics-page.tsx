import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft, Building2, ShieldAlert, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppointmentsSection } from '@/components/analytics/appointments-section'
import { DateRangeFilter } from '@/components/analytics/date-range-filter'
import { DoctorsSection } from '@/components/analytics/doctors-section'
import { FinancialSection } from '@/components/analytics/financial-section'
import DoctorWorkspaceShell from '@/components/doctor-workspace-shell'
import Notice from '@/components/notice'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useApi } from '@/hooks/use-api'
import { useClinicAnalytics } from '@/hooks/use-clinic-analytics'
import { isValidRange, presetRange, type AnalyticsPreset } from '@/lib/analytics'
import { ApiError } from '@/lib/api'
import type { AnalyticsRange } from '@/types/analytics'
import type { ClinicDetails } from '@/types/clinic'

export default function ClinicAnalyticsPage() {
  const { t, i18n } = useTranslation()
  const api = useApi()
  const { clinicId } = useParams({ from: '/doctor/clinics/$clinicId/analytics' })
  const id = Number(clinicId)
  const validId = Number.isInteger(id) && id > 0
  const [preset, setPreset] = useState<AnalyticsPreset>('all')
  const [custom, setCustom] = useState<AnalyticsRange>({})
  const [openSection, setOpenSection] = useState<'financial' | 'appointments' | 'doctors' | null>('financial')

  const range = useMemo<AnalyticsRange>(
    () => (preset === 'custom' ? custom : presetRange(preset)),
    [preset, custom],
  )

  const rangeValid = isValidRange(range)

  // Same cache entry as the clinic details page, used here only for the clinic name.
  const clinic = useQuery({
    queryKey: ['doctor', 'clinics', id],
    queryFn: () =>
      api.request<ClinicDetails>(
        `/api/clinics/${id}`,
        {},
        { notifyOnError: false },
      ),
    enabled: validId,
  })

  const { financial, appointments, doctors } = useClinicAnalytics(id, range)

  const refreshing =
    financial.isFetching || appointments.isFetching || doctors.isFetching

  const blocked = [financial.error, appointments.error, doctors.error].find(
    (error) =>
      error instanceof ApiError &&
      (error.status === 403 || error.status === 404),
  )

  const blockedStatus = blocked instanceof ApiError ? blocked.status : undefined

  function selectPreset(next: AnalyticsPreset) {
    if (next === 'custom' && preset !== 'custom') {
      // Start the custom range from what is currently shown.
      const current = presetRange(preset)
      setCustom(current.fromDate ? current : presetRange('last30'))
    }

    setPreset(next)
  }

  function refresh() {
    if (!rangeValid) return

    void Promise.all([
      financial.refetch(),
      appointments.refetch(),
      doctors.refetch(),
    ])
  }

  const backLink = (
    <Link
      className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition hover:text-foreground"
      to="/doctor/clinics/$clinicId"
      params={{ clinicId }}
    >
      <ArrowLeft className="size-4 rtl:rotate-180" />
      {t('analytics.back')}
    </Link>
  )

  return (
    <DoctorWorkspaceShell active="clinics" topBackLink={backLink}>
      <div className="mx-auto w-full min-w-0 max-w-7xl p-4 sm:p-6 lg:p-10">
        {!validId ? (
          <Notice message={t('clinicDetails.invalidId')} />
        ) : blockedStatus !== undefined ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
            <span className="grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground">
              <ShieldAlert className="size-6" />
            </span>

            <h1 className="mt-4 font-heading text-xl font-bold sm:text-2xl">
              {t(
                blockedStatus === 403
                  ? 'analytics.forbiddenTitle'
                  : 'analytics.notFoundTitle',
              )}
            </h1>

            <p className="mt-2 max-w-md text-xs leading-6 text-muted-foreground sm:text-sm">
              {t(
                blockedStatus === 403
                  ? 'analytics.forbiddenDescription'
                  : 'analytics.notFoundDescription',
              )}
            </p>

            <Button
              variant="outline"
              className="mt-5 h-11 rounded-xl text-sm font-bold normal-case"
              render={
                <Link
                  to="/doctor/clinics/$clinicId"
                  params={{ clinicId }}
                />
              }
            >
              <ArrowLeft className="rtl:rotate-180" />
              {t('analytics.back')}
            </Button>
          </div>
        ) : (
          <>
            <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-primary uppercase">
              <TrendingUp className="size-3" />
              {t('analytics.eyebrow')}
            </Badge>

            <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="font-sans text-3xl font-bold sm:text-4xl">
                  {t('analytics.title')}
                </h1>

                <p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground sm:text-sm">
                  {t('analytics.description')}
                </p>
              </div>

              {clinic.data && (
                <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                  <Building2 className="size-3.5 shrink-0" />
                  <span className="min-w-0 break-words">
                    {clinic.data.name}
                  </span>
                </span>
              )}
            </div>

            <div className="mt-8 grid gap-6">
              <DateRangeFilter
                preset={preset}
                custom={custom}
                invalid={!rangeValid}
                refreshing={refreshing}
                onPreset={selectPreset}
                onCustom={(patch) =>
                  setCustom((current) => ({ ...current, ...patch }))
                }
                onRefresh={refresh}
              />

              {!rangeValid && (
                <Notice message={t('analytics.invalidRange')} />
              )}

              <div className="grid gap-4">
                <FinancialSection
                  query={financial}
                  language={i18n.resolvedLanguage}
                  open={openSection === 'financial'}
                  onToggle={() =>
                    setOpenSection((current) =>
                      current === 'financial' ? null : 'financial',
                    )
                  }
                />

                <AppointmentsSection
                  query={appointments}
                  open={openSection === 'appointments'}
                  onToggle={() =>
                    setOpenSection((current) =>
                      current === 'appointments' ? null : 'appointments',
                    )
                  }
                />

                <DoctorsSection
                  query={doctors}
                  language={i18n.resolvedLanguage}
                  open={openSection === 'doctors'}
                  onToggle={() =>
                    setOpenSection((current) =>
                      current === 'doctors' ? null : 'doctors',
                    )
                  }
                />
              </div>
            </div>
          </>
        )}
      </div>
    </DoctorWorkspaceShell>
  )
}