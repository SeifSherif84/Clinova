import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Briefcase, ChevronLeft, ChevronRight, House, MapPin, RefreshCw, RotateCcw, Search, SearchX, Star, Stethoscope } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PatientShell from '@/components/patient-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useApi } from '@/hooks/use-api'
import { getErrorMessage } from '@/lib/api'
import type { LookupOption } from '@/types/auth'
import type { PaginatedResult, PatientDoctorResponse } from '@/types/doctor'

const ALL = 'all'
const pageSize = 12
const grayButton = 'h-10 cursor-pointer rounded-xl bg-foreground/5 px-4 text-[13px] font-bold normal-case tracking-normal text-foreground hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-primary/30'
const primaryButton = 'h-10 cursor-pointer rounded-xl bg-primary px-4 text-[13px] font-bold normal-case tracking-normal text-primary-foreground hover:bg-primary/90'

function DoctorCard({ doctor }: { doctor: PatientDoctorResponse }) {
  const { t } = useTranslation()
  const [imageFailed, setImageFailed] = useState(false)
  const picture = doctor.profilePictureUrl && !imageFailed ? doctor.profilePictureUrl : null
  const initials = doctor.doctorName.replace(/^dr\.?\s*/i, '').split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()

  return <Link to="/patient/doctors/$doctorId" params={{ doctorId: String(doctor.doctorId) }} className="group relative isolate grid cursor-pointer content-start gap-3 overflow-hidden rounded-2xl border border-border bg-card p-3 transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
    <div className="relative aspect-[1/1] w-full overflow-hidden rounded-xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent">
      {picture
        ? <img src={picture} alt={doctor.doctorName} loading="lazy" onError={() => setImageFailed(true)} className="size-full object-cover object-top transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none" />
        : <span className="grid size-full place-items-center font-sans text-4xl font-bold text-primary">{initials}</span>}
      {doctor.averageRating != null && doctor.averageRating > 0 && <span dir="ltr" className="absolute start-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-xs font-bold tabular-nums shadow-md backdrop-blur" aria-label={t('patientPortal.doctors.ratingLabel', { rating: doctor.averageRating.toFixed(1), defaultValue: 'Rated {{rating}} out of 5' })}>
        <Star className="size-3.5 fill-warm text-warm" />
        {doctor.averageRating.toFixed(1)}
      </span>}
    </div>

    <div className="grid gap-1 px-1 pb-1 text-center">
      <h2 className="truncate font-sans text-base font-bold leading-tight">{doctor.doctorName}</h2>
      <p className="flex items-center justify-center gap-1.5 truncate text-[13px] font-semibold text-primary"><Stethoscope className="size-3.5 shrink-0" /><span className="truncate">{doctor.medicalSpecialtyName}</span></p>
      {doctor.experienceYears != null && <p className="flex items-center justify-center gap-1.5 text-[13px] font-semibold text-muted-foreground">
        <Briefcase className="size-3.5 shrink-0 text-primary/70" />
        {t('patientPortal.doctors.experienceShort', { years: doctor.experienceYears, defaultValue: '{{years}} yrs' })}
      </p>}
    </div>
  </Link>
}

export default function PatientDoctorsPage() {
  const { t } = useTranslation()
  const api = useApi()
  const [name, setName] = useState('')
  const [debouncedName, setDebouncedName] = useState('')
  const [specialtyId, setSpecialtyId] = useState(ALL)
  const [governorateId, setGovernorateId] = useState(ALL)
  const [regionId, setRegionId] = useState(ALL)
  const [pageIndex, setPageIndex] = useState(1)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedName(name.trim())
      setPageIndex(1)
    }, 400)
    return () => window.clearTimeout(timer)
  }, [name])

  const specialties = useQuery({
    queryKey: ['lookups', 'medical-specialties'],
    queryFn: () => api.request<LookupOption[]>('/api/lookups/medical-specialties', {}, { notifyOnError: false }),
  })
  const governorates = useQuery({
    queryKey: ['lookups', 'governorates'],
    queryFn: () => api.request<LookupOption[]>('/api/lookups/governorates', {}, { notifyOnError: false }),
  })
  const regions = useQuery({
    queryKey: ['lookups', 'regions', governorateId],
    queryFn: () => api.request<LookupOption[]>(`/api/lookups/regions?governorateId=${governorateId}`, {}, { notifyOnError: false }),
    enabled: governorateId !== ALL,
  })

  const doctors = useQuery({
    queryKey: ['patient', 'doctors', { debouncedName, specialtyId, governorateId, regionId, pageIndex }],
    queryFn: () => {
      const params = new URLSearchParams({ PageIndex: String(pageIndex), PageSize: String(pageSize) })
      if (debouncedName) params.set('DoctorName', debouncedName)
      if (specialtyId !== ALL) params.set('MedicalSpecialtyId', specialtyId)
      if (governorateId !== ALL) params.set('GovernorateId', governorateId)
      if (regionId !== ALL) params.set('RegionId', regionId)
      return api.request<PaginatedResult<PatientDoctorResponse>>(`/api/doctors/search?${params.toString()}`, {}, { notifyOnError: false })
    },
    placeholderData: keepPreviousData,
  })

  const hasFilters = Boolean(name || specialtyId !== ALL || governorateId !== ALL || regionId !== ALL)
  const result = doctors.data
  const totalPages = result?.totalPages ?? 0
  const allLabel = (key: string, fallback: string) => ({ value: ALL, label: t(key, { defaultValue: fallback }) })

  function clearFilters() {
    setName('')
    setDebouncedName('')
    setSpecialtyId(ALL)
    setGovernorateId(ALL)
    setRegionId(ALL)
    setPageIndex(1)
  }

  function changeGovernorate(value: string | null) {
    setGovernorateId(value ?? ALL)
    setRegionId(ALL)
    setPageIndex(1)
  }

  return <PatientShell>
    <div className="relative isolate overflow-hidden">
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <nav aria-label="breadcrumb" className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"><House className="size-3.5" />{t('patientPortal.nav.home', { defaultValue: 'Home' })}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="text-foreground">{t('patientPortal.nav.doctors', { defaultValue: 'Find a Doctor' })}</span>
        </nav>

        <div className="mt-6 max-w-2xl">
          <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-primary uppercase"><Stethoscope className="size-3" />{t('patientPortal.doctors.eyebrow', { defaultValue: 'Doctors' })}</Badge>
          <h1 className="mt-3 font-sans text-3xl font-bold sm:text-5xl">{t('patientPortal.doctors.title', { defaultValue: 'Find the right doctor' })}</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">{t('patientPortal.doctors.description', { defaultValue: 'Search by name, specialty, or location and browse doctors who fit what you need.' })}</p>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-3 sm:p-4">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
            <div className="grid min-w-44 max-w-72 flex-1 gap-1.5">
              <label htmlFor="doctorSearch" className="text-[13px] font-bold text-muted-foreground">{t('patientPortal.doctors.labelName', { defaultValue: 'Or type a name' })}</label>
              <div className="group relative">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <input
                  type="search"
                  id="doctorSearch"
                  value={name}
                  maxLength={100}
                  autoComplete="off"
                  aria-label={t('patientPortal.doctors.searchLabel', { defaultValue: 'Doctor name' })}
                  placeholder={t('patientPortal.doctors.searchPlaceholder', { defaultValue: 'Search by name' })}
                  onChange={(event) => setName(event.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background/40 ps-9 pe-3 text-base font-medium outline-none transition placeholder:text-sm placeholder:font-medium focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/10"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <span className="text-[13px] font-bold text-muted-foreground">{t('patientPortal.doctors.labelSpecialty', { defaultValue: "I'm looking for a doctor" })}</span>
              <Select
                items={[allLabel('patientPortal.doctors.allSpecialties', 'All specialties'), ...(specialties.data?.map((item) => ({ value: String(item.id), label: item.name })) ?? [])]}
                value={specialtyId}
                onValueChange={(value) => { setSpecialtyId(value ?? ALL); setPageIndex(1) }}
                disabled={specialties.isLoading || specialties.isError}
              >
                <SelectTrigger aria-label={t('patientPortal.doctors.specialty', { defaultValue: 'Specialty' })} className="h-10 w-auto min-w-44 shrink-0 cursor-pointer rounded-xl border border-input bg-background/40 px-3 text-sm disabled:cursor-not-allowed">
                  <Stethoscope className="size-4 text-primary/70" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="w-auto min-w-60 max-w-[min(26rem,calc(100vw-2rem))] rounded-xl border border-border bg-popover text-popover-foreground">
                  <SelectItem className="rounded-lg" value={ALL}>{t('patientPortal.doctors.allSpecialties', { defaultValue: 'All specialties' })}</SelectItem>
                  {specialties.data?.map((item) => <SelectItem className="items-start whitespace-normal rounded-lg py-2 leading-5" key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <span className="text-[13px] font-bold text-muted-foreground">{t('patientPortal.doctors.labelGovernorate', { defaultValue: 'In governorate' })}</span>
              <Select
                items={[allLabel('patientPortal.doctors.allGovernorates', 'All governorates'), ...(governorates.data?.map((item) => ({ value: String(item.id), label: item.name })) ?? [])]}
                value={governorateId}
                onValueChange={changeGovernorate}
                disabled={governorates.isLoading || governorates.isError}
              >
                <SelectTrigger aria-label={t('patientPortal.doctors.governorate', { defaultValue: 'Governorate' })} className="h-10 w-auto min-w-40 shrink-0 cursor-pointer rounded-xl border border-input bg-background/40 px-3 text-sm disabled:cursor-not-allowed">
                  <MapPin className="size-4 text-primary/70" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="w-56 rounded-xl border border-border bg-popover text-popover-foreground">
                  <SelectItem className="rounded-lg" value={ALL}>{t('patientPortal.doctors.allGovernorates', { defaultValue: 'All governorates' })}</SelectItem>
                  {governorates.data?.map((item) => <SelectItem className="rounded-lg" key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <span className="text-[13px] font-bold text-muted-foreground">{t('patientPortal.doctors.labelRegion', { defaultValue: 'In region' })}</span>
              <Select
                items={[allLabel('patientPortal.doctors.allRegions', 'All regions'), ...(regions.data?.map((item) => ({ value: String(item.id), label: item.name })) ?? [])]}
                value={regionId}
                onValueChange={(value) => { setRegionId(value ?? ALL); setPageIndex(1) }}
                disabled={governorateId === ALL || regions.isLoading || regions.isError}
              >
                <SelectTrigger aria-label={t('patientPortal.doctors.region', { defaultValue: 'Region' })} className="h-10 w-auto min-w-36 shrink-0 cursor-pointer rounded-xl border border-input bg-background/40 px-3 text-sm disabled:cursor-not-allowed">
                  <MapPin className="size-4 text-primary/70" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="w-auto min-w-64 max-w-[min(26rem,calc(100vw-2rem))] rounded-xl border border-border bg-popover text-popover-foreground">
                  <SelectItem className="rounded-lg" value={ALL}>{t('patientPortal.doctors.allRegions', { defaultValue: 'All regions' })}</SelectItem>
                  {regions.data?.map((item) => <SelectItem className="items-start whitespace-normal rounded-lg py-2 leading-5" key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {hasFilters && <Button type="button" variant="ghost" className={grayButton + ' ms-auto shrink-0'} onClick={clearFilters}><RotateCcw className="size-3.5" />{t('patientPortal.doctors.clear', { defaultValue: 'Clear filters' })}</Button>}
          </div>
        </div>

        <div className="mt-8">
          {doctors.isLoading && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6" role="status" aria-label={t('patientPortal.doctors.loading', { defaultValue: 'Loading doctors' })}>
            {Array.from({ length: 12 }, (_, index) => <Skeleton key={index} className="aspect-[4/5] rounded-2xl motion-reduce:animate-none" />)}
          </div>}

          {doctors.isError && !result && <Card className="items-center rounded-3xl border border-destructive/20 bg-card p-8 text-center">
            <p className="text-sm font-bold text-destructive">{getErrorMessage(doctors.error)}</p>
            <Button type="button" variant="ghost" className={grayButton + ' mt-3'} disabled={doctors.isFetching} onClick={() => doctors.refetch()}><RefreshCw className="size-4" />{t('errors.tryAgain')}</Button>
          </Card>}

          {result && result.items.length === 0 && <section className="relative isolate grid place-items-center overflow-hidden px-4 py-20 text-center sm:py-28">
            <div className="relative">
              <span className="relative grid size-16 place-items-center rounded-full bg-primary text-primary-foreground ring-8 ring-primary/10">
                {hasFilters ? <SearchX className="size-7" /> : <Stethoscope className="size-7" />}
              </span>
              <span className="absolute -end-6 -top-3 size-3 rounded-full bg-primary/40 motion-safe:animate-bounce" />
              <span className="absolute -start-8 top-8 size-2 rounded-full bg-primary/30 motion-safe:animate-pulse" />
              <span className="absolute -end-10 bottom-4 size-2.5 rounded-full bg-primary/25 motion-safe:animate-pulse" />
            </div>

            <h2 className="mt-10 font-sans text-2xl font-bold sm:text-4xl">{t('patientPortal.doctors.emptyTitle', { defaultValue: 'No doctors found' })}</h2>
            <p className="mt-5 max-w-md text-sm leading-7 font-medium text-muted-foreground sm:text-base">{t('patientPortal.doctors.emptyDescription', { defaultValue: 'Try a different name or loosen your filters to see more doctors.' })}</p>
            {hasFilters && <Button type="button" className={primaryButton + ' mt-6'} onClick={clearFilters}><RotateCcw className="size-4" />{t('patientPortal.doctors.clear', { defaultValue: 'Clear filters' })}</Button>}
          </section>}

          {result && result.items.length > 0 && <>
            <p className="mb-4 text-sm font-bold text-muted-foreground" aria-live="polite">{t('patientPortal.doctors.results', { total: result.totalCount, defaultValue: '{{total}} doctors found' })}</p>
            <div className={'grid grid-cols-2 gap-3 transition-opacity sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 ' + (doctors.isFetching ? 'opacity-60' : '')}>
              {result.items.map((doctor) => <DoctorCard key={doctor.doctorId} doctor={doctor} />)}
            </div>

            {totalPages > 1 && <nav aria-label="pagination" className="mt-8 flex items-center justify-center gap-3">
              <Button type="button" variant="ghost" className={grayButton} disabled={pageIndex <= 1 || doctors.isFetching} onClick={() => setPageIndex((current) => Math.max(1, current - 1))}><ChevronLeft className="size-4 rtl:rotate-180" />{t('patientPortal.doctors.previous', { defaultValue: 'Previous' })}</Button>
              <span className="text-xs font-bold tabular-nums text-muted-foreground">{t('patientPortal.doctors.pageOf', { page: result.pageIndex, total: totalPages, defaultValue: 'Page {{page}} of {{total}}' })}</span>
              <Button type="button" variant="ghost" className={grayButton} disabled={pageIndex >= totalPages || doctors.isFetching} onClick={() => setPageIndex((current) => Math.min(totalPages, current + 1))}>{t('patientPortal.doctors.next', { defaultValue: 'Next' })}<ChevronRight className="size-4 rtl:rotate-180" /></Button>
            </nav>}
          </>}
        </div>
      </div>
    </div>
  </PatientShell>
}