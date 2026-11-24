import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, EyeOff, LoaderCircle, RefreshCw, Star } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import DoctorWorkspaceShell from '@/components/doctor-workspace-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useApi } from '@/hooks/use-api'
import { getErrorMessage } from '@/lib/api'
import type { DoctorOwnReviewsResult } from '@/types/doctor'

const pageSize = 10
const grayButtonClass = 'h-10 rounded-xl px-4 text-[13px] font-bold normal-case tracking-normal border-transparent bg-foreground/5 text-foreground shadow-none hover:bg-foreground/10 dark:border-transparent dark:bg-foreground/5 dark:hover:bg-foreground/10'

function Stars({ value, label, className = 'size-4' }: { value: number; label: string; className?: string }) {
  return (
    <span className="flex items-center gap-0.5" role="img" aria-label={label}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star key={index} className={`${className} ${index < Math.round(value) ? 'fill-current text-warm' : 'text-muted-foreground/25'}`} />
      ))}
    </span>
  )
}

function initialsOf(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => Array.from(part)[0]).join('').toUpperCase()
}

export default function DoctorReviewsPage() {
  const { t, i18n } = useTranslation()
  const api = useApi()
  const [pageIndex, setPageIndex] = useState(1)
  const resultsRef = useRef<HTMLElement>(null)

  const reviews = useQuery({
    queryKey: ['doctor', 'reviews', pageIndex],
    queryFn: () => api.request<DoctorOwnReviewsResult>(`/api/reviews/my-reviews/management?pageIndex=${pageIndex}&pageSize=${pageSize}`, {}, { notifyOnError: false }),
    placeholderData: keepPreviousData,
  })
  const page = reviews.data
  const ringRadius = 52
  const ringLength = 2 * Math.PI * ringRadius
  const ringRatio = page ? Math.min(Math.max(page.averageRating / 5, 0), 1) : 0

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.resolvedLanguage === 'ar' ? 'ar-EG' : 'en-EG', { dateStyle: 'medium' }),
    [i18n.resolvedLanguage],
  )

  function formatDate(value: string) {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
  }

  function goTo(next: number) {
    setPageIndex(next)
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    resultsRef.current?.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  return (
    <DoctorWorkspaceShell active="reviews">
      <div className="mx-auto w-full min-w-0 max-w-screen-2xl p-4 sm:p-6 lg:p-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-primary uppercase">
              <Star className="size-3" />
              {t('doctorReviews.eyebrow')}
            </Badge>
            <h1 className="mt-2 font-sans text-3xl font-bold sm:text-4xl">{t('doctorReviews.title')}</h1>
            <p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground sm:text-sm">{t('doctorReviews.description')}</p>
          </div>
        </div>

        {reviews.isLoading && (
          <Card className="mt-6 min-h-72 items-center justify-center rounded-3xl border border-border bg-card">
            <LoaderCircle className="size-7 animate-spin text-primary motion-reduce:animate-none" />
            <p className="text-xs text-muted-foreground">{t('doctorReviews.loading')}</p>
          </Card>
        )}

        {reviews.isError && !page && (
          <Card className="mt-6 items-center rounded-3xl border border-destructive/20 bg-card p-5 text-center sm:p-8">
            <p className="text-sm font-bold text-destructive">{getErrorMessage(reviews.error)}</p>
            <Button variant="outline" className={grayButtonClass + ' mt-3'} disabled={reviews.isFetching} onClick={() => reviews.refetch()}>
              {reviews.isFetching ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <RefreshCw />}
              {t('doctorReviews.retry')}
            </Button>
          </Card>
        )}

        {page && page.totalCount === 0 && (
          <section className="relative isolate mt-6 grid place-items-center overflow-hidden px-4 py-20 text-center sm:py-28">
            <div className="relative">
              <span className="absolute inset-0 rounded-full bg-primary/15 motion-safe:animate-pulse" />
              <span className="relative grid size-20 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 ring-8 ring-primary/10">
                <Star className="size-8 motion-safe:animate-bounce [animation-duration:2.4s]" />
              </span>
              <span className="absolute -end-6 -top-3 size-3 rounded-full bg-primary/40 motion-safe:animate-pulse" />
              <span className="absolute -start-8 top-8 size-2 rounded-full bg-primary/30 motion-safe:animate-pulse [animation-delay:200ms]" />
              <span className="absolute -end-10 bottom-4 size-2.5 rounded-full bg-primary/25 motion-safe:animate-pulse [animation-delay:400ms]" />
            </div>
            <h2 className="mt-10 font-sans text-2xl font-bold sm:text-4xl">{t('doctorReviews.emptyTitle')}</h2>
            <p className="mt-5 max-w-md text-sm leading-7 font-medium text-muted-foreground sm:text-base">{t('doctorReviews.emptyDescription')}</p>
          </section>
        )}

        {page && page.totalCount > 0 && (
          <div className="mt-6 grid gap-6">
            {/* Rating summary */}
            <div className="flex flex-col items-center gap-6 border-b border-border/70 pb-8 text-center sm:flex-row sm:gap-10 sm:text-start">
              <div className="relative grid size-36 shrink-0 place-items-center sm:size-40">
                <svg viewBox="0 0 120 120" className="absolute inset-0 size-full -rotate-90 rtl:-scale-x-100" aria-hidden="true">
                  <circle cx="60" cy="60" r={ringRadius} fill="none" strokeWidth="8" className="stroke-primary/15" />
                  <circle
                    cx="60"
                    cy="60"
                    r={ringRadius}
                    fill="none"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={ringLength}
                    strokeDashoffset={ringLength * (1 - ringRatio)}
                    className="stroke-primary transition-[stroke-dashoffset] duration-700 motion-reduce:transition-none"
                  />
                </svg>
                <div className="relative grid justify-items-center leading-none">
                  <strong className="font-sans text-5xl font-bold tabular-nums sm:text-6xl">{page.averageRating.toFixed(1)}</strong>
                  <span className="mt-2 text-xs font-bold text-muted-foreground">{t('doctorReviews.outOf')}</span>
                </div>
              </div>

              <div className="grid justify-items-center gap-3 sm:justify-items-start">
                <small className="text-sm font-bold tracking-wider text-muted-foreground uppercase sm:text-base">{t('doctorReviews.averageRating')}</small>
                <Stars value={page.averageRating} label={t('doctorReviews.ratingLabel', { count: Number(page.averageRating.toFixed(1)) })} className="size-7 sm:size-8" />
                <p className="text-sm font-semibold text-muted-foreground sm:text-[15px]">{t('doctorReviews.totalReviews', { count: page.totalCount })}</p>
              </div>
            </div>

            {/* Reviews */}
            <section ref={resultsRef} className="scroll-mt-24" aria-busy={reviews.isFetching}>
              <div className={`grid gap-4 transition-opacity motion-reduce:transition-none lg:grid-cols-2 ${reviews.isPlaceholderData ? 'opacity-60' : ''}`}>
                {page.items.map((review) => (
                  <article
                    key={review.reviewId}
                    className="group flex min-w-0 flex-col gap-5 rounded-2xl border border-border bg-card p-5 transition hover:border-primary/30 hover:shadow-lg motion-reduce:transition-none sm:p-6"
                  >
                    <header className="flex min-w-0 items-center gap-3.5">
                      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary ring-2 ring-primary/15">
                        {review.isAnonymous ? <EyeOff className="size-5" /> : initialsOf(review.patientName)}
                      </span>
                      <div className="grid min-w-0 flex-1 gap-0.5 text-start">
                        <strong className="truncate font-sans text-base font-bold leading-tight sm:text-lg">
                          {review.isAnonymous ? t('doctorReviews.anonymous') : review.patientName}
                        </strong>
                        <time dateTime={review.createdAt} className="text-xs font-semibold text-muted-foreground">{formatDate(review.createdAt)}</time>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1 max-[380px]:hidden">
                        <Stars value={review.rating} label={t('doctorReviews.ratingLabel', { count: review.rating })} />
                        <span className="text-xs font-bold text-warm tabular-nums">{review.rating}/5</span>
                      </div>
                    </header>

                    <div className="hidden max-[380px]:block">
                      <Stars value={review.rating} label={t('doctorReviews.ratingLabel', { count: review.rating })} />
                    </div>

                    {review.comment ? (
                      <p
                        dir="auto"
                        className="border-s-2 border-primary/30 ps-4 text-start text-base leading-8 font-medium break-words whitespace-pre-line text-foreground sm:text-lg sm:leading-9"
                      >
                        {review.comment}
                      </p>
                    ) : (
                      <p className="border-s-2 border-border ps-4 text-sm font-semibold text-muted-foreground italic">{t('doctorReviews.noComment')}</p>
                    )}
                  </article>
                ))}
              </div>

              {page.totalPages > 1 && (
                <nav aria-label={t('doctorReviews.pagination')} className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-bold text-muted-foreground">{t('doctorReviews.pageOf', { page: page.pageIndex, total: page.totalPages })}</span>
                  <div className="flex w-full gap-2 max-sm:[&>button]:flex-1 sm:w-auto">
                    <Button variant="outline" className={grayButtonClass} disabled={page.pageIndex <= 1 || reviews.isFetching} onClick={() => goTo(page.pageIndex - 1)}>
                      <ChevronLeft className="rtl:rotate-180" />{t('doctorReviews.previous')}
                    </Button>
                    <Button variant="outline" className={grayButtonClass} disabled={page.pageIndex >= page.totalPages || reviews.isFetching} onClick={() => goTo(page.pageIndex + 1)}>
                      {t('doctorReviews.next')}<ChevronRight className="rtl:rotate-180" />
                    </Button>
                  </div>
                </nav>
              )}
            </section>
          </div>
        )}
      </div>
    </DoctorWorkspaceShell>
  )
}