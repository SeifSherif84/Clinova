import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { Banknote, Briefcase, Building2, CalendarDays, ChevronLeft, ChevronRight, Clock3, ExternalLink, House, LoaderCircle, MapPin, Maximize2, MessageSquareText, Phone, RefreshCw, Star, Stethoscope, UserRound, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Notice from '@/components/notice'
import PatientShell from '@/components/patient-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useApi } from '@/hooks/use-api'
import { getErrorMessage } from '@/lib/api'
import type { AvailableDay, AvailableSlot, DoctorHeader, PaginatedReviews, PatientClinicDetails, PatientDoctorClinic, RatingSummary } from '@/types/doctor'

type Tr = (key: string, defaultValue: string, options?: Record<string, string | number>) => string

const reviewsPageSize = 5
const horizonDays = 30
const grayButton = 'h-10 cursor-pointer rounded-xl bg-foreground/5 px-4 text-[13px] font-bold normal-case tracking-normal text-foreground hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-primary/30'
const sectionClass = 'border-t border-border/60 pt-10'

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const parseDate = (value: string) => { const [y, m, d] = value.split('-').map(Number); return new Date(y, m - 1, d) }
const parseTime = (value: string) => { const [h, m] = value.split(':').map(Number); return new Date(2000, 0, 1, h, m) }
const phoneOf = (item: unknown) => typeof item === 'string' ? item : String((item as Record<string, unknown> | null)?.phoneNumber ?? '')
const imageOf = (item: unknown) => {
  if (typeof item === 'string') return item
  const record = item as Record<string, unknown> | null
  return String(record?.imageUrl ?? record?.url ?? '')
}

function Stars({ value, className = 'size-4' }: { value: number; className?: string }) {
  return <span dir="ltr" aria-hidden="true" className="inline-flex gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`${className} ${n <= Math.round(value) ? 'fill-warm text-warm' : 'text-muted-foreground/30'}`} />)}
  </span>
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <h2 className="flex items-center gap-2.5 font-sans text-xl font-bold sm:text-2xl">
    <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary [&>svg]:size-[18px]">{icon}</span>
    {children}
  </h2>
}

// Outlined "i" with a short accent dash underneath, drawn to match the app's icon size.
function AboutIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: 26, height: 26 }}>
    <circle cx="12" cy="3.5" r="2" stroke="currentColor" strokeWidth="1.75" />
    <rect x="9.75" y="8" width="4.5" height="11" rx="2.25" stroke="currentColor" strokeWidth="1.75" />
    <path d="M9.5 22.5h5" strokeWidth="2" strokeLinecap="round" className="stroke-warm" />
  </svg>
}

function ErrorBox({ error, onRetry, retryLabel }: { error: unknown; onRetry: () => void; retryLabel: string }) {
  return <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
    <p className="flex-1 text-sm font-bold text-destructive">{getErrorMessage(error)}</p>
    <Button type="button" variant="ghost" className={grayButton} onClick={onRetry}><RefreshCw className="size-4" />{retryLabel}</Button>
  </div>
}

function ClinicDetailsModal({ clinicId, doctorId, onClose, tr, retryLabel }: { clinicId: number; doctorId: string; onClose: () => void; tr: Tr; retryLabel: string }) {
  const api = useApi()
  const details = useQuery({
    queryKey: ['patient', 'doctor', doctorId, 'clinic-details', clinicId],
    queryFn: () => api.request<PatientClinicDetails>(`/api/clinics/${clinicId}/doctors/${doctorId}`, {}, { notifyOnError: false }),
  })
  const [viewing, setViewing] = useState<number | null>(null)
  const clinic = details.data
  const phones = clinic?.phoneNumbers.map(phoneOf).filter(Boolean) ?? []
  const images = clinic?.images.map(imageOf).filter(Boolean) ?? []

  // Escape closes the photo viewer first, then the modal; arrows move between photos.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { if (viewing != null) setViewing(null); else onClose(); return }
      if (viewing == null || images.length < 2) return
      const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
      if (step) setViewing((viewing + step + images.length) % images.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, viewing, images.length])

  const step = (direction: 1 | -1) => setViewing((current) => current == null ? current : (current + direction + images.length) % images.length)

  return <>
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/60 backdrop-blur-sm sm:place-items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={clinic?.name ?? tr('viewDetails', 'View clinic details')} onClick={(event) => event.stopPropagation()} className="max-h-[90svh] w-full max-w-4xl overflow-y-auto rounded-t-3xl border border-border bg-card shadow-2xl sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border/60 bg-card/95 px-5 py-4 backdrop-blur">
          <h3 className="flex min-w-0 items-center gap-2 font-sans text-lg font-bold"><Building2 className="size-5 shrink-0 text-primary" /><span className="truncate">{clinic?.name ?? tr('viewDetails', 'View clinic details')}</span></h3>
          <button type="button" aria-label={tr('close', 'Close')} onClick={onClose} className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-xl bg-foreground/5 hover:bg-foreground/10"><X className="size-4" /></button>
        </div>
        <div className="grid gap-6 p-5">
          {details.isLoading && <div className="grid gap-3"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-5 w-1/2" /><Skeleton className="h-40 w-full rounded-2xl" /></div>}
          {details.isError && <ErrorBox error={details.error} onRetry={() => details.refetch()} retryLabel={retryLabel} />}
          {clinic && <>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className={clinic.landmark ? '' : 'sm:col-span-2'}><dt className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">{tr('address', 'Address')}</dt><dd className="mt-1 text-sm font-semibold">{clinic.buildingNumber} {clinic.streetName}, {clinic.regionName}</dd></div>
              {clinic.landmark && <div className="sm:ps-10"><dt className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">{tr('landmark', 'Nearby landmark')}</dt><dd className="mt-1 text-sm font-semibold">{clinic.landmark}</dd></div>}
            </dl>
            {clinic.googleMapsUrl && <a href={clinic.googleMapsUrl} target="_blank" rel="noreferrer noopener" className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-bold text-primary-foreground transition hover:bg-primary/90 sm:w-fit sm:justify-start"><MapPin className="size-4" />{tr('openMap', 'Open in Google Maps')}<ExternalLink className="size-3.5" /></a>}
            {phones.length > 0 && <div>
              <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">{tr('phones', 'Phone numbers')}</p>
              <div className="mt-2 flex flex-wrap gap-2">{phones.map((phone) => <a key={phone} dir="ltr" href={`tel:${phone}`} className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 text-sm font-bold text-primary transition hover:bg-primary/15"><Phone className="size-3.5" />{phone}</a>)}</div>
            </div>}
            {images.length > 0 && <div>
              <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">{tr('photos', 'Photos')}</p>
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((src, index) => <button
                  key={src + index}
                  type="button"
                  aria-label={tr('viewPhoto', 'View photo')}
                  onClick={() => setViewing(index)}
                  className="group relative aspect-[4/3] cursor-zoom-in overflow-hidden rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <img src={src} alt={clinic.name} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none" />
                  <span aria-hidden="true" className="absolute inset-0 grid place-items-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/25 group-hover:opacity-100 motion-reduce:transition-none"><Maximize2 className="size-6 drop-shadow" /></span>
                </button>)}
              </div>
            </div>}
          </>}
        </div>
      </div>
    </div>

    {viewing != null && images[viewing] && <div role="dialog" aria-modal="true" aria-label={clinic?.name ?? tr('photos', 'Photos')} className="fixed inset-0 z-[60] grid place-items-center bg-black/85 p-4 backdrop-blur-sm" onClick={() => setViewing(null)}>
      <img src={images[viewing]} alt={clinic?.name ?? ''} onClick={(event) => event.stopPropagation()} className="max-h-[85svh] max-w-full rounded-2xl object-contain shadow-2xl" />
      <button type="button" aria-label={tr('close', 'Close')} onClick={() => setViewing(null)} className="absolute end-4 top-4 grid size-10 cursor-pointer place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"><X className="size-5" /></button>
      {images.length > 1 && <>
        <button type="button" aria-label={tr('previous', 'Previous')} onClick={(event) => { event.stopPropagation(); step(-1) }} className="absolute start-3 top-1/2 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 sm:start-5"><ChevronLeft className="size-5 rtl:rotate-180" /></button>
        <button type="button" aria-label={tr('next', 'Next')} onClick={(event) => { event.stopPropagation(); step(1) }} className="absolute end-3 top-1/2 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 sm:end-5"><ChevronRight className="size-5 rtl:rotate-180" /></button>
        <span dir="ltr" className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs font-bold tabular-nums text-white backdrop-blur">{viewing + 1} / {images.length}</span>
      </>}
    </div>}
  </>
}

export default function PatientDoctorPage() {
  const { t, i18n } = useTranslation()
  const api = useApi()
  const queryClient = useQueryClient()
  const { doctorId } = useParams({ from: '/patient/doctors/$doctorId' })
  const locale = i18n.resolvedLanguage === 'ar' ? 'ar-EG' : 'en-EG'
  const tr: Tr = (key, defaultValue, options) => t('patientPortal.doctorPage.' + key, { defaultValue, ...options })
  const money = (value: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP', maximumFractionDigits: 2 }).format(value)

  const [clinicId, setClinicId] = useState<number | null>(null)
  const [date, setDate] = useState<string | null>(null)
  const [slotId, setSlotId] = useState<number | null>(null)
  const [detailsId, setDetailsId] = useState<number | null>(null)
  const navigate = useNavigate()
  const [pictureFailed, setPictureFailed] = useState(false)
  const [bioExpanded, setBioExpanded] = useState(false)
  const range = useMemo(() => { const from = new Date(); const to = new Date(); to.setDate(to.getDate() + horizonDays); return { from: iso(from), to: iso(to) } }, [])
  const base = ['patient', 'doctor', doctorId] as const
  const retryLabel = t('errors.tryAgain')

  const header = useQuery({ queryKey: [...base, 'header'], queryFn: () => api.request<DoctorHeader>(`/api/doctors/${doctorId}/header`, {}, { notifyOnError: false }) })
  const summary = useQuery({ queryKey: [...base, 'rating-summary'], queryFn: () => api.request<RatingSummary>(`/api/reviews/doctors/${doctorId}/rating-summary`, {}, { notifyOnError: false }) })
  const reviews = useInfiniteQuery({
    queryKey: [...base, 'reviews'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.request<PaginatedReviews>(`/api/reviews/doctors/${doctorId}?pageIndex=${pageParam}&pageSize=${reviewsPageSize}`, {}, { notifyOnError: false }),
    getNextPageParam: (last) => (last.pageIndex < last.totalPages ? last.pageIndex + 1 : undefined),
  })
  const clinics = useQuery({ queryKey: [...base, 'clinics'], queryFn: () => api.request<PatientDoctorClinic[]>(`/api/clinics/doctors/${doctorId}`, {}, { notifyOnError: false }) })
  const days = useQuery({
    queryKey: [...base, 'days', clinicId, range.from],
    queryFn: () => api.request<AvailableDay[]>(`/api/appointment-slots/patient-appointment/doctors/${doctorId}/clinics/${clinicId}/available-days?From=${range.from}&To=${range.to}`, {}, { notifyOnError: false }),
    enabled: clinicId != null,
  })
  const slots = useQuery({
    queryKey: [...base, 'slots', clinicId, date],
    queryFn: () => api.request<AvailableSlot[]>(`/api/appointment-slots/patient-appointment/doctors/${doctorId}/clinics/${clinicId}/available-slots?Date=${date}`, {}, { notifyOnError: false }),
    enabled: clinicId != null && date != null,
  })
  const book = useMutation({
    mutationFn: (id: number) => api.request<string>(`/api/appointments/slots/${id}`, { method: 'POST' }, { notifyOnError: false }),
    onSuccess: (message) => {
      sessionStorage.setItem('flash', message)
      void queryClient.invalidateQueries({ queryKey: [...base, 'slots'] })
      void queryClient.invalidateQueries({ queryKey: [...base, 'days'] })
      void navigate({ to: '/patient/appointments' })
    },
    onError: () => { setSlotId(null); void slots.refetch() },
  })

  const doctor = header.data
  const rating = summary.data
  const allReviews = reviews.data?.pages.flatMap((page) => page.items) ?? []
  const selectedClinic = clinics.data?.find((clinic) => clinic.clinicId === clinicId)
  const selectedSlot = slots.data?.find((slot) => slot.id === slotId)
  const initials = doctor?.doctorName.replace(/^dr\.?\s*/i, '').split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() ?? ''
  const longBio = (doctor?.bio?.length ?? 0) > 320

  function chooseClinic(id: number) {
    if (id === clinicId) return
    setClinicId(id); setDate(null); setSlotId(null); book.reset()
  }
  function chooseDate(value: string) {
    if (value === date) return
    setDate(value); setSlotId(null); book.reset()
  }
  function bookHere(id: number) {
    chooseClinic(id)
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return <PatientShell>
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 pb-28 sm:px-6 sm:py-10 sm:pb-28 lg:px-8 lg:py-14 lg:pb-14">
      <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-2 text-xs font-bold text-muted-foreground">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"><House className="size-3.5" />{t('patientPortal.nav.home', { defaultValue: 'Home' })}</Link>
        <span aria-hidden="true">/</span>
        <Link to="/patient/doctors" className="transition-colors hover:text-primary">{t('patientPortal.nav.doctors', { defaultValue: 'Find a Doctor' })}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="text-foreground">{doctor?.doctorName ?? '…'}</span>
      </nav>

      <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_25rem] xl:gap-14">
        <main className="grid min-w-0 gap-10">
          {/* Header */}
          <section aria-busy={header.isLoading}>
            {header.isLoading && <div className="flex flex-col gap-6 sm:flex-row sm:items-center"><Skeleton className="size-28 rounded-3xl min-[400px]:size-36 sm:size-44" /><div className="grid flex-1 gap-3"><Skeleton className="h-6 w-32 rounded-full" /><Skeleton className="h-10 w-2/3" /><Skeleton className="h-5 w-1/2" /></div></div>}
            {header.isError && <ErrorBox error={header.error} onRetry={() => header.refetch()} retryLabel={retryLabel} />}
            {doctor && <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="relative size-28 shrink-0 overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/65 shadow-xl shadow-primary/15 ring-4 ring-card min-[400px]:size-36 sm:size-44">
                {doctor.profilePictureUrl && !pictureFailed
                  ? <img src={doctor.profilePictureUrl} alt={doctor.doctorName} onError={() => setPictureFailed(true)} className="size-full object-cover object-top" />
                  : <span className="grid size-full place-items-center font-sans text-5xl font-bold text-primary-foreground">{initials}</span>}
              </div>
              <div className="min-w-0">
                <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-primary uppercase"><Stethoscope className="size-3" />{doctor.medicalSpecialtyName}</Badge>
                <h1 className="mt-3 font-sans text-2xl leading-tight font-bold break-words min-[400px]:text-3xl sm:text-5xl">{doctor.doctorName}</h1>
                {doctor.title && <p className="mt-1.5 text-sm font-semibold text-muted-foreground sm:text-base">{doctor.title}</p>}
                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-bold">
                  {doctor.experienceYears != null && <span className="inline-flex items-center gap-2"><Briefcase className="size-4 text-primary" />{tr('experience', '{{years}} years of experience', { years: doctor.experienceYears })}</span>}
                  {rating && (rating.totalReviews > 0
                    ? <span className="inline-flex items-center gap-2"><Stars value={rating.averageRating} /><span dir="ltr" className="tabular-nums">{rating.averageRating.toFixed(1)}</span><span className="font-semibold text-muted-foreground">({tr('reviewsCount', '{{count}} reviews', { count: rating.totalReviews })})</span></span>
                    : <span className="inline-flex items-center gap-2 text-muted-foreground"><Star className="size-4" />{tr('noReviews', 'No reviews yet')}</span>)}
                </div>
              </div>
            </div>}
          </section>

          {/* About */}
          {doctor?.bio?.trim() && <section className={sectionClass}>
            <SectionTitle icon={<AboutIcon />}>{tr('about', 'About the doctor')}</SectionTitle>
            <p className={`mt-4 max-w-3xl text-sm leading-8 whitespace-pre-line text-muted-foreground sm:text-base ${longBio && !bioExpanded ? 'line-clamp-5' : ''}`}>{doctor.bio}</p>
            {longBio && <button type="button" onClick={() => setBioExpanded((v) => !v)} className="mt-2 cursor-pointer text-sm font-bold text-primary hover:underline">{bioExpanded ? tr('showLess', 'Show less') : tr('showMore', 'Read more')}</button>}
          </section>}

          {/* Reviews */}
          <section className={sectionClass}>
            <SectionTitle icon={<MessageSquareText />}>{tr('reviews', 'Patient reviews')}</SectionTitle>
            {summary.isLoading && <div className="mt-6 grid gap-6 sm:grid-cols-[12rem_1fr]"><Skeleton className="h-32 rounded-2xl" /><div className="grid gap-3">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-4" />)}</div></div>}
            {summary.isError && <ErrorBox error={summary.error} onRetry={() => summary.refetch()} retryLabel={retryLabel} />}
            {rating && rating.totalReviews > 0 && <div className="mt-6 grid items-center gap-6 sm:grid-cols-[12rem_1fr] sm:gap-10">
              <div className="text-center sm:text-start">
                <p className="text-[13px] font-bold tracking-wider text-muted-foreground uppercase">{tr('overallRating', 'Overall rating')}</p>
                <p dir="ltr" className="mt-1 font-sans text-6xl font-bold tabular-nums">{rating.averageRating.toFixed(1)}</p>
                <div className="mt-2 flex justify-center sm:justify-start"><Stars value={rating.averageRating} className="size-5" /></div>
                <p className="mt-2 text-[13px] font-bold text-muted-foreground">{tr('ratedBy', 'Rated by {{count}} visitors', { count: rating.totalReviews })}</p>
              </div>
              <ul className="grid gap-3.5" aria-label={tr('distribution', 'Rating distribution')}>
                {([[5, rating.ratingBreakdown.fiveStars], [4, rating.ratingBreakdown.fourStars], [3, rating.ratingBreakdown.threeStars], [2, rating.ratingBreakdown.twoStars], [1, rating.ratingBreakdown.oneStar]] as const).map(([stars, count]) => {
                  const percent = rating.totalReviews ? Math.round((count / rating.totalReviews) * 100) : 0
                  return <li key={stars} dir="ltr" className="flex items-center gap-3.5 text-sm font-bold tabular-nums">
                    <span className="flex w-10 items-center gap-1.5">{stars}<Star className="size-4 fill-warm text-warm" /></span>
                    <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-foreground/10"><span className="block h-full rounded-full bg-gradient-to-r from-warm to-warm/70 transition-all duration-500" style={{ width: `${percent}%` }} /></span>
                    <span className="w-16 text-end text-muted-foreground">{count} · {percent}%</span>
                  </li>
                })}
              </ul>
            </div>}

            {reviews.isLoading && <div className="mt-8 grid gap-6">{Array.from({ length: 3 }, (_, i) => <div key={i} className="grid gap-2"><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-full" /></div>)}</div>}
            {reviews.isError && <ErrorBox error={reviews.error} onRetry={() => reviews.refetch()} retryLabel={retryLabel} />}
            {reviews.data && allReviews.length === 0 && <div className="relative isolate mt-6 grid place-items-center overflow-hidden px-4 py-12 text-center">
              <div className="relative">
                <span className="relative grid size-14 place-items-center rounded-full bg-primary text-primary-foreground ring-8 ring-primary/10"><MessageSquareText className="size-6" /></span>
                <span className="absolute -end-6 -top-3 size-3 rounded-full bg-primary/40 motion-safe:animate-bounce" />
                <span className="absolute -start-8 top-8 size-2 rounded-full bg-primary/30 motion-safe:animate-pulse" />
                <span className="absolute -end-10 bottom-4 size-2.5 rounded-full bg-primary/25 motion-safe:animate-pulse" />
              </div>
              <h3 className="mt-6 font-sans text-lg font-bold">{tr('noReviews', 'No reviews yet')}</h3>
              <p className="mt-1 max-w-sm text-sm leading-7 font-medium text-muted-foreground">{tr('noReviewsDesc', 'Reviews from patients will appear here.')}</p>
            </div>}
            {allReviews.length > 0 && <>
              <ul className="mt-6 divide-y divide-border/60 border-t border-border/60">
                {allReviews.map((review) => <li key={review.reviewId} className="max-w-3xl py-5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {review.isAnonymous ? <UserRound className="size-5" /> : review.patientName.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <strong className="truncate text-base font-bold">{review.isAnonymous ? tr('anonymous', 'Anonymous Patient') : review.patientName}</strong>
                        <Stars value={review.rating} />
                      </div>
                      <time dateTime={review.createdAt} className="text-xs font-semibold text-muted-foreground">{new Date(review.createdAt).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}</time>
                    </div>
                  </div>
                  {review.comment?.trim()
                    ? <p className="mt-3 text-[15px] leading-7 whitespace-pre-line text-foreground/80 sm:ps-13"><span aria-hidden="true" className="me-0.5">“</span>{review.comment}<span aria-hidden="true" className="ms-0.5">”</span></p>
                    : <p className="mt-3 text-sm text-muted-foreground italic sm:ps-13">{tr('noComment', 'No written comment.')}</p>}
                </li>)}
              </ul>
              {reviews.hasNextPage && <div className="mt-4 flex justify-center"><Button type="button" variant="ghost" className={grayButton} disabled={reviews.isFetchingNextPage} onClick={() => reviews.fetchNextPage()}>{reviews.isFetchingNextPage && <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />}{tr('loadMore', 'Show more reviews')}</Button></div>}
            </>}
          </section>

          {/* Clinics */}
          <section className={sectionClass}>
            <SectionTitle icon={<Building2 />}>{tr('clinics', 'Clinics')}</SectionTitle>
            {clinics.isLoading && <div className="mt-6 grid gap-4 md:grid-cols-2">{Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-56 rounded-3xl" />)}</div>}
            {clinics.isError && <ErrorBox error={clinics.error} onRetry={() => clinics.refetch()} retryLabel={retryLabel} />}
            {clinics.data && clinics.data.length === 0 && <div className="relative isolate mt-6 grid place-items-center overflow-hidden px-4 py-12 text-center">
              <div className="relative">
                <span className="relative grid size-14 place-items-center rounded-full bg-primary text-primary-foreground ring-8 ring-primary/10"><Building2 className="size-6" /></span>
                <span className="absolute -end-6 -top-3 size-3 rounded-full bg-primary/40 motion-safe:animate-bounce" />
                <span className="absolute -start-8 top-8 size-2 rounded-full bg-primary/30 motion-safe:animate-pulse" />
                <span className="absolute -end-10 bottom-4 size-2.5 rounded-full bg-primary/25 motion-safe:animate-pulse" />
              </div>
              <h3 className="mt-6 font-sans text-lg font-bold">{tr('noClinics', 'No clinics available')}</h3>
              <p className="mt-1 max-w-sm text-sm leading-7 font-medium text-muted-foreground">{tr('noClinicsDesc', 'This doctor has not added a clinic yet.')}</p>
            </div>}
            {clinics.data && clinics.data.length > 0 && <div className="mt-6 grid gap-4 md:grid-cols-2">
              {clinics.data.map((clinic) => {
                const selected = clinic.clinicId === clinicId
                return <article key={clinic.clinicId} className={`group grid content-between gap-5 rounded-3xl border p-5 transition duration-300 motion-reduce:transition-none ${selected ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-border bg-card hover:border-primary/30 hover:shadow-lg'}`}>
                  <div>
                    <h3 className="font-sans text-lg font-bold">{clinic.clinicName}</h3>
                    <p className="mt-1.5 flex items-start gap-1.5 text-sm font-semibold text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" />{clinic.streetName}, {clinic.regionName}, {clinic.governorateName}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-1 rounded-2xl bg-foreground/[0.04] p-2.5 text-center max-[400px]:[&_p:nth-child(2)]:text-sm sm:gap-2 sm:p-3">
                    <div><p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">{tr('consultation', 'Consultation')}</p><p className="mt-1 text-[15px] font-bold">{money(clinic.consultationFee)}</p></div>
                    <div className="border-x border-border/60"><p className="text-xs font-bold tracking-wider text-primary uppercase">{tr('deposit', 'Deposit')}</p><p className="mt-1 text-[15px] font-bold text-primary">{money(clinic.depositAmount)}</p></div>
                    <div><p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">{tr('remaining', 'Remaining')}</p><p className="mt-1 text-[15px] font-bold">{money(clinic.remainingAmount)}</p></div>
                  </div>
                  <div className="flex flex-wrap gap-2 max-sm:[&>button]:flex-1">
                    <Button type="button" className="h-10 cursor-pointer rounded-xl px-4 text-[13px] font-bold normal-case tracking-normal" onClick={() => bookHere(clinic.clinicId)}><CalendarDays className="size-4" />{selected ? tr('selected', 'Selected') : tr('bookHere', 'Book here')}</Button>
                    <Button type="button" variant="ghost" className={grayButton} onClick={() => setDetailsId(clinic.clinicId)}>{tr('viewDetails', 'View clinic details')}</Button>
                  </div>
                </article>
              })}
            </div>}
          </section>
        </main>

        {/* Booking panel */}
        <aside id="booking" className="scroll-mt-28 md:max-lg:mx-auto md:max-lg:w-full md:max-lg:max-w-xl lg:sticky lg:top-28" aria-label={tr('bookTitle', 'Book an appointment')}>
          <div className="relative isolate overflow-hidden rounded-3xl border border-primary/15 bg-card p-4 shadow-xl shadow-primary/10 min-[400px]:p-5 sm:p-6">
            <span aria-hidden="true" className="pointer-events-none absolute -end-12 -top-12 -z-10 size-40 rounded-full bg-primary/10 blur-3xl" />
            <>
              <h2 className="font-sans text-xl font-bold">{tr('bookTitle', 'Book an appointment')}</h2>

              <p className="mt-5 text-[13px] font-bold tracking-wider text-muted-foreground uppercase">1 · {tr('step1', 'Choose a clinic')}</p>
              {clinics.isLoading && <Skeleton className="mt-2 h-16 rounded-2xl" />}
              {clinics.data && clinics.data.length === 0 && <p className="mt-2 text-sm text-muted-foreground">{tr('noClinics', 'No clinics available')}</p>}
              <div role="radiogroup" aria-label={tr('step1', 'Choose a clinic')} className="mt-2 grid gap-2">
                {clinics.data?.map((clinic) => {
                  const selected = clinic.clinicId === clinicId
                  return <button key={clinic.clinicId} type="button" role="radio" aria-checked={selected} onClick={() => chooseClinic(clinic.clinicId)} className={`cursor-pointer rounded-2xl border p-3 text-start transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${selected ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'border-border hover:bg-primary/5'}`}>
                    <strong className="block truncate text-[15px] font-bold">{clinic.clinicName}</strong>
                    <span className={`mt-0.5 block truncate text-[13px] font-semibold ${selected ? 'opacity-80' : 'text-muted-foreground'}`}>{clinic.regionName}, {clinic.governorateName}</span>
                  </button>
                })}
              </div>
              {selectedClinic && <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-foreground/[0.04] p-3 text-center text-xs">
                <div><p className="text-[13px] font-bold text-muted-foreground">{tr('consultation', 'Consultation')}</p><p className="mt-0.5 text-[15px] font-bold">{money(selectedClinic.consultationFee)}</p></div>
                <div className="border-x border-border/60"><p className="text-[13px] font-bold text-primary">{tr('deposit', 'Deposit')}</p><p className="mt-0.5 text-[15px] font-bold text-primary">{money(selectedClinic.depositAmount)}</p></div>
                <div><p className="text-[13px] font-bold text-muted-foreground">{tr('remaining', 'Remaining')}</p><p className="mt-0.5 text-[15px] font-bold">{money(selectedClinic.remainingAmount)}</p></div>
              </div>}

              <p className="mt-6 text-[13px] font-bold tracking-wider text-muted-foreground uppercase">2 · {tr('step2', 'Choose a day')}</p>
              {clinicId == null && <p className="mt-2 text-sm text-muted-foreground">{tr('selectClinicFirst', 'Select a clinic to see available days.')}</p>}
              {days.isLoading && <div className="mt-2 flex gap-2">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-20 w-16 shrink-0 rounded-2xl" />)}</div>}
              {days.isError && <ErrorBox error={days.error} onRetry={() => days.refetch()} retryLabel={retryLabel} />}
              {days.data && days.data.length === 0 && <p className="mt-2 rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">{tr('noDays', 'No available days in the next 30 days.')}</p>}
              {days.data && days.data.length > 0 && <div role="radiogroup" aria-label={tr('step2', 'Choose a day')} className="-mx-1 -mt-0.5 flex gap-2 overflow-x-auto px-1 pt-2.5 pb-2">
                {days.data.map((day) => {
                  const value = parseDate(day.date)
                  const selected = day.date === date
                  return <button key={day.date} type="button" role="radio" aria-checked={selected} onClick={() => chooseDate(day.date)} className={`grid w-16 shrink-0 cursor-pointer justify-items-center gap-0.5 rounded-2xl border py-3 transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${selected ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'border-border hover:bg-primary/5'}`}>
                    <span className="text-[11px] font-bold uppercase opacity-80">{value.toLocaleDateString(locale, { weekday: 'short' })}</span>
                    <span className="font-sans text-xl font-bold tabular-nums">{value.toLocaleDateString(locale, { day: 'numeric' })}</span>
                    <span className="text-[11px] font-semibold opacity-80">{value.toLocaleDateString(locale, { month: 'short' })}</span>
                  </button>
                })}
              </div>}

              <p className="mt-6 text-[13px] font-bold tracking-wider text-muted-foreground uppercase">3 · {tr('step3', 'Choose a time')}</p>
              {date == null && <p className="mt-2 text-sm text-muted-foreground">{tr('selectDayFirst', 'Select a day to see available times.')}</p>}
              {slots.isLoading && <div className="mt-2 grid grid-cols-3 gap-2">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}</div>}
              {slots.isError && <ErrorBox error={slots.error} onRetry={() => slots.refetch()} retryLabel={retryLabel} />}
              {slots.data && slots.data.length === 0 && <p className="mt-2 rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">{tr('noSlots', 'No available times on this day.')}</p>}
              {slots.data && slots.data.length > 0 && <div role="radiogroup" aria-label={tr('step3', 'Choose a time')} className="mt-2 grid grid-cols-3 gap-2 md:max-lg:grid-cols-4">
                {slots.data.map((slot) => {
                  const selected = slot.id === slotId
                  return <button key={slot.id} type="button" role="radio" aria-checked={selected} onClick={() => setSlotId(slot.id)} className={`h-11 cursor-pointer rounded-xl border text-[13px] font-bold tabular-nums transition sm:h-10 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${selected ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25' : 'border-border hover:bg-primary/5'}`}>
                    {parseTime(slot.startTime).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}
                  </button>
                })}
              </div>}

              {selectedClinic && date && selectedSlot && <div className="mt-6 grid gap-2 rounded-2xl bg-primary/5 p-4 text-[15px] font-semibold">
                <p className="text-[13px] font-bold tracking-wider text-primary uppercase">{tr('summary', 'Your booking')}</p>
                <p className="flex items-center gap-2"><Building2 className="size-4 shrink-0 text-primary" />{selectedClinic.clinicName}</p>
                <p className="flex items-center gap-2"><CalendarDays className="size-4 shrink-0 text-primary" />{parseDate(date).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                <p className="flex items-center gap-2"><Clock3 className="size-4 shrink-0 text-primary" /><span dir="ltr">{parseTime(selectedSlot.startTime).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })} – {parseTime(selectedSlot.endTime).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}</span></p>
                <p className="flex items-center gap-2 font-bold text-primary"><Banknote className="size-4 shrink-0" />{tr('dueNow', 'Deposit due')}: {money(selectedClinic.depositAmount)}</p>
              </div>}

              {book.error && <Notice message={getErrorMessage(book.error)} />}
              <Button type="button" className="mt-5 h-12 w-full cursor-pointer rounded-xl text-sm font-bold normal-case tracking-normal" disabled={clinicId == null || date == null || slotId == null || book.isPending} onClick={() => slotId != null && book.mutate(slotId)}>
                {book.isPending ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <CalendarDays className="size-4" />}
                {book.isPending ? tr('booking', 'Booking…') : tr('book', 'Book appointment')}
              </Button>
            </>
          </div>
        </aside>
      </div>
    </div>

    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/90 p-3 backdrop-blur-xl lg:hidden">
      <Button type="button" className="h-11 w-full cursor-pointer rounded-xl text-sm font-bold normal-case tracking-normal" onClick={() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><CalendarDays className="size-4" />{tr('bookTitle', 'Book an appointment')}</Button>
    </div>

    {detailsId != null && <ClinicDetailsModal clinicId={detailsId} doctorId={doctorId} tr={tr} retryLabel={retryLabel} onClose={() => setDetailsId(null)} />}
  </PatientShell>
}