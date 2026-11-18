import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { CalendarDays, ChevronRight, EyeOff, House, MapPin, MessageSquareText, RefreshCw, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import PatientShell from '@/components/patient-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useApi } from '@/hooks/use-api'
import { getErrorMessage } from '@/lib/api'
import { parseUtc } from '@/lib/patient-appointments'
import type { PatientGetHisOwnReviewResponse } from '@/types/patient-review'

const grayButton = 'h-10 cursor-pointer rounded-xl bg-foreground/5 px-4 text-[13px] font-bold normal-case tracking-normal text-foreground hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-primary/30'

const statusPill: Record<string, string> = {
  Approved: 'bg-primary/10 text-primary',
  Pending: 'bg-warm/10 text-warm',
  Rejected: 'bg-destructive/10 text-destructive',
}

function Stars({ value }: { value: number }) {
  return <span dir="ltr" className="inline-flex gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`size-5 ${n <= value ? 'fill-warm text-warm' : 'text-muted-foreground/30'}`} />)}
  </span>
}

type Group = { key: string; label: string; rows: PatientGetHisOwnReviewResponse[] }

// Consecutive grouping by month: the list is sorted newest first, so equal months sit next to each other.
function byMonth(rows: PatientGetHisOwnReviewResponse[], locale: string) {
  const out: Group[] = []
  for (const row of rows) {
    const day = parseUtc(row.createdAt)
    const key = `${day.getFullYear()}-${day.getMonth()}`
    const last = out.at(-1)
    if (last?.key === key) last.rows.push(row)
    else out.push({ key, label: day.toLocaleDateString(locale, { month: 'long', year: 'numeric' }), rows: [row] })
  }
  return out
}


function DateTile({ day, locale }: { day: Date; locale: string }) {
  return <span aria-hidden="true" className="grid size-16 shrink-0 place-items-center rounded-2xl bg-primary leading-none text-primary-foreground">
    <span className="grid justify-items-center gap-1">
      <small className="text-[11px] font-bold">{day.toLocaleDateString(locale, { month: 'short' })}</small>
      <strong className="font-sans text-2xl font-bold tabular-nums">{day.toLocaleDateString(locale, { day: 'numeric' })}</strong>
    </span>
  </span>
}

export default function PatientReviewsPage() {
  const { t, i18n } = useTranslation()
  const api = useApi()
  const locale = i18n.resolvedLanguage === 'ar' ? 'ar-EG' : 'en-EG'
  const tr = (key: string, defaultValue: string, options?: Record<string, string | number>) => t('patientPortal.reviews.' + key, { defaultValue, ...options })

  const reviews = useQuery({
    queryKey: ['patient', 'reviews', 'mine'],
    queryFn: () => api.request<PatientGetHisOwnReviewResponse[]>('/api/reviews/my-reviews', {}, { notifyOnError: false }),
  })
  // The backend already sorts newest first; sorting again keeps the page correct if that ever changes.
  const items = [...(reviews.data ?? [])].sort((a, b) => parseUtc(b.createdAt).getTime() - parseUtc(a.createdAt).getTime())

  const statusLabel = (status: string) => status === 'Approved' ? tr('statusApproved', 'Approved')
    : status === 'Rejected' ? tr('statusRejected', 'Rejected')
      : tr('statusPending', 'Pending approval')

  return <PatientShell>
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <nav aria-label="breadcrumb" className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"><House className="size-3.5" />{t('patientPortal.nav.home', { defaultValue: 'Home' })}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="text-foreground">{t('patientPortal.nav.reviews', { defaultValue: 'My Reviews' })}</span>
      </nav>

      <div className="mt-6 max-w-2xl">
        <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-primary uppercase"><MessageSquareText className="size-3" />{tr('eyebrow', 'Reviews')}</Badge>
        <h1 className="mt-3 font-sans text-3xl font-bold sm:text-5xl">{t('patientPortal.nav.reviews', { defaultValue: 'My Reviews' })}</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">{tr('subtitle', 'Manage and track your feedback about doctors.')}</p>
      </div>

      <div className="mt-8">
        {reviews.isLoading && <div role="status" aria-label={tr('loading', 'Loading your reviews')} className="divide-y divide-border/60">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="flex items-center gap-4 py-5">
            <Skeleton className="size-16 shrink-0 rounded-2xl motion-reduce:animate-none" />
            <div className="grid flex-1 gap-2.5"><Skeleton className="h-5 w-48 max-w-full motion-reduce:animate-none" /><Skeleton className="h-4 w-36 max-w-full motion-reduce:animate-none" /><Skeleton className="h-4 w-52 max-w-full motion-reduce:animate-none" /></div>
            <Skeleton className="hidden h-12 w-40 rounded-xl sm:block motion-reduce:animate-none" />
          </div>)}
        </div>}

        {reviews.isError && <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
          <p className="min-w-0 flex-1 text-sm font-bold text-destructive">{getErrorMessage(reviews.error)}</p>
          <Button type="button" variant="ghost" className={grayButton} disabled={reviews.isFetching} onClick={() => reviews.refetch()}><RefreshCw className="size-4" />{t('errors.tryAgain')}</Button>
        </div>}

        {reviews.isSuccess && items.length === 0 && <section className="relative isolate -mt-8 grid place-items-center overflow-hidden px-4 py-20 text-center sm:py-28">
          <div className="relative">
            <span className="relative grid size-16 place-items-center rounded-full bg-primary text-primary-foreground ring-8 ring-primary/10"><MessageSquareText className="size-7" /></span>
            <span className="absolute -end-6 -top-3 size-3 rounded-full bg-primary/40 motion-safe:animate-bounce" />
            <span className="absolute -start-8 top-8 size-2 rounded-full bg-primary/30 motion-safe:animate-pulse" />
            <span className="absolute -end-10 bottom-4 size-2.5 rounded-full bg-primary/25 motion-safe:animate-pulse" />
          </div>
          <h2 className="mt-10 font-sans text-2xl font-bold sm:text-4xl">{tr('emptyTitle', 'No reviews yet')}</h2>
          <p className="mt-5 max-w-md text-sm leading-7 font-medium text-muted-foreground sm:text-base">{tr('emptyDescription', 'Your submitted reviews will appear here after you share your experience with a doctor.')}</p>
          <Button className="mt-6 h-10 cursor-pointer rounded-xl bg-primary px-4 text-[13px] font-bold normal-case tracking-normal text-primary-foreground hover:bg-primary/90" render={<Link to="/patient/appointments" />}><CalendarDays className="size-4" />{t('patientPortal.nav.appointments', { defaultValue: 'My Appointments' })}</Button>
        </section>}

        {reviews.isSuccess && items.length > 0 && <>
          <div className="grid gap-10">
            {byMonth(items, locale).map((group) => <section key={group.key} aria-label={group.label}>
              <h2 className="flex items-center gap-3 text-sm font-bold text-muted-foreground">
                {group.label}
                <span className="ms-auto text-xs tabular-nums">{group.rows.length}</span>
              </h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.rows.map((review) => <Link
                  key={review.reviewId}
                  to="/patient/appointments/$appointmentId"
                  params={{ appointmentId: String(review.appointmentId) }}
                  aria-label={`${tr('viewAppointment', 'View Appointment')}: ${review.doctorName}`}
                  className="group flex h-full min-w-0 flex-col gap-4 rounded-3xl border border-border bg-card p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <div className="flex items-start gap-3.5">
                    <DateTile day={parseUtc(review.createdAt)} locale={locale} />
                    <div className="min-w-0 flex-1 self-center">
                      <h3 className="truncate font-sans text-lg font-bold">{review.doctorName}</h3>
                      <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                        <MapPin className="size-4 shrink-0 text-primary" />
                        <span className="min-w-0 truncate">{review.clinicName}</span>
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${statusPill[review.status] ?? 'bg-muted text-muted-foreground'}`}>{statusLabel(review.status)}</span>
                  </div>

                  <Stars value={review.rating} />

                  <div className="flex-1">
                    {review.comment?.trim()
                      ? <p dir="auto" className="line-clamp-4 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-base leading-7 font-medium whitespace-pre-line text-foreground"><span aria-hidden="true" className="me-0.5">“</span>{review.comment}<span aria-hidden="true" className="ms-0.5">”</span></p>
                      : <p className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-base leading-7 font-medium text-muted-foreground italic">{tr('noComment', 'No written comment.')}</p>}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    {review.isAnonymous && <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><EyeOff className="size-3.5" />{tr('anonymous', 'Anonymous review')}</span>}
                    <span className="ms-auto inline-flex items-center gap-0.5 text-sm font-bold text-primary">
                      {tr('viewAppointment', 'View Appointment')}
                      <ChevronRight className="size-4 transition group-hover:translate-x-0.5 motion-reduce:transition-none rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                    </span>
                  </div>
                </Link>)}
              </div>
            </section>)}
          </div>
        </>}
      </div>
    </div>
  </PatientShell>
}