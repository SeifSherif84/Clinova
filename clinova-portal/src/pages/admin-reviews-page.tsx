import { useNavigate, useSearch } from '@tanstack/react-router'
import { Check, ChevronLeft, ChevronRight, EyeOff, LoaderCircle, MessageSquareText, RefreshCw, RotateCcw, Search, SearchX, Star, UserRound, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import AdminShell from '@/components/admin-shell'
import ConfirmationDialog from '@/components/confirmation-dialog'
import Notice from '@/components/notice'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminReviews, useModerateReview } from '@/hooks/use-admin-reviews'
import { getErrorMessage } from '@/lib/api'
import { ReviewModeration, reviewStatusFilters, reviewStatusTone } from '@/lib/admin-reviews'
import type { AdminReview, AdminReviewFilters, ReviewStatusFilter } from '@/types/admin-review'

const pageSize = 10
const debounceMs = 400
const buttonClass = 'h-10 rounded-xl px-4 text-[13px] font-bold normal-case tracking-normal'
const grayButtonClass = buttonClass + ' border-transparent bg-foreground/5 text-foreground shadow-none hover:bg-foreground/10 dark:border-transparent dark:bg-foreground/5 dark:hover:bg-foreground/10'

function Stars({ value, label }: { value: number; label: string }) {
  return (
    <span className="flex items-center gap-0.5" role="img" aria-label={label}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star key={index} className={`size-4 ${index < Math.round(value) ? 'fill-current text-warm' : 'text-muted-foreground/25'}`} />
      ))}
    </span>
  )
}

// The search text updates locally on every keystroke and reaches the URL once typing pauses.
function useDebouncedSearch(value: string | undefined, setFilters: (patch: AdminReviewFilters) => void) {
  const [draft, setDraft] = useState(value ?? '')
  const [synced, setSynced] = useState(value)
  if (value !== synced) {
    setSynced(value)
    if ((value ?? '') !== draft.trim()) setDraft(value ?? '')
  }
  useEffect(() => {
    const next = draft.trim() || undefined
    if (next === value) return
    const timer = setTimeout(() => setFilters({ q: next }), debounceMs)
    return () => clearTimeout(timer)
  }, [draft, value, setFilters])
  return [draft, setDraft] as const
}

export default function AdminReviewsPage() {
  const { t, i18n } = useTranslation()
  const search = useSearch({ from: '/admin/reviews' })
  const navigate = useNavigate({ from: '/admin/reviews' })
  const resultsRef = useRef<HTMLElement>(null)
  const [success, setSuccess] = useState('')
  const [confirmation, setConfirmation] = useState<{ review: AdminReview; status: ReviewModeration } | null>(null)

  // Any filter change returns to the first page and keeps the other filters.
  const setFilters = useCallback((patch: AdminReviewFilters) => {
    navigate({ search: (current) => ({ ...current, ...patch, pageIndex: undefined }), replace: true, resetScroll: false })
  }, [navigate])
  const [draft, setDraft] = useDebouncedSearch(search.q, setFilters)

  const reviews = useAdminReviews(search, pageSize)
  const moderate = useModerateReview()
  const page = reviews.data
  const activeFilters = [search.status, search.q].filter(Boolean).length

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.resolvedLanguage === 'ar' ? 'ar-EG' : 'en-EG', { dateStyle: 'medium', timeStyle: 'short' }),
    [i18n.resolvedLanguage],
  )
  function formatDate(value: string) {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
  }

  const statusOptions: { value: ReviewStatusFilter | undefined; label: string }[] = [
    { value: undefined, label: t('admin.reviews.all') },
    ...reviewStatusFilters.map((value) => ({ value, label: t('admin.reviews.' + value) })),
  ]

  function clearFilters() {
    setDraft('')
    navigate({ search: {}, replace: true, resetScroll: false })
  }

  function goTo(pageIndex: number) {
    navigate({ search: (current) => ({ ...current, pageIndex: pageIndex > 1 ? pageIndex : undefined }), resetScroll: false })
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    resultsRef.current?.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  function askToModerate(review: AdminReview, status: ReviewModeration) {
    setSuccess('')
    moderate.reset()
    setConfirmation({ review, status })
  }

  function confirmModeration() {
    if (!confirmation || moderate.isPending) return
    const { review, status } = confirmation
    moderate.mutate({ reviewId: review.reviewId, status }, {
      onSuccess: () => {
        setConfirmation(null)
        setSuccess(t(status === ReviewModeration.Approved ? 'admin.reviews.approveSuccess' : 'admin.reviews.rejectSuccess'))
      },
    })
  }

  const approving = confirmation?.status === ReviewModeration.Approved
  const confirmationCopy = approving
    ? { title: t('admin.reviews.approveTitle'), description: t('admin.reviews.approveConfirm'), confirmLabel: t('admin.reviews.approve') }
    : { title: t('admin.reviews.rejectTitle'), description: t('admin.reviews.rejectConfirm'), confirmLabel: t('admin.reviews.reject') }

  return (
    <AdminShell>
      <div className="mx-auto w-full min-w-0 max-w-screen-2xl p-4 sm:p-6 lg:p-10">
        <div>
          <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-primary uppercase"><MessageSquareText className="size-3" />{t('admin.reviews.eyebrow')}</Badge>
          <h1 className="mt-2 font-sans text-3xl font-bold sm:text-4xl">{t('admin.reviews.title')}</h1>
          <p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground sm:text-sm">{t('admin.reviews.description')}</p>
        </div>

        {success && <div className="mt-4"><Notice tone="success" message={success} /></div>}

        <div className="mt-6 grid gap-3 lg:flex lg:items-center lg:gap-4">
          <div role="group" aria-label={t('admin.reviews.filterLabel')} className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 lg:mx-0 lg:shrink-0 lg:overflow-visible lg:px-0 lg:pb-0">
            {statusOptions.map((option) => {
              const selected = search.status === option.value
              return (
                <button
                  key={option.label}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setFilters({ status: option.value })}
                  className={`h-10 shrink-0 rounded-full border px-4 text-[13px] font-bold whitespace-nowrap transition focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none motion-reduce:transition-none ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'}`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:min-w-0 lg:flex-1 lg:flex-nowrap lg:justify-end">
            <div className="group relative w-full min-w-0 flex-1 sm:max-w-md lg:max-w-sm">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <input
                type="search"
                id="adminReviewSearch"
                value={draft}
                maxLength={100}
                aria-label={t('admin.reviews.searchPlaceholder')}
                placeholder={t('admin.reviews.searchPlaceholder')}
                onChange={(event) => setDraft(event.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-card ps-9 pe-3 text-base font-semibold text-foreground outline-none transition placeholder:font-medium sm:h-10 sm:text-[15px] focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/10"
              />
            </div>
            {activeFilters > 0 && <Button variant="outline" className={grayButtonClass + ' w-full shrink-0 sm:w-auto'} onClick={clearFilters}><RotateCcw className="size-3.5" />{t('admin.reviews.clearFilters')}</Button>}
          </div>
        </div>

        <section ref={resultsRef} className="mt-6 scroll-mt-24" aria-busy={reviews.isFetching}>
          {page && page.totalCount > 0 && (
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground/70" role="status">
              {reviews.isFetching && <LoaderCircle className="size-3.5 animate-spin motion-reduce:animate-none" />}
              {t('admin.reviews.showing', { from: (page.pageIndex - 1) * page.pageSize + 1, to: (page.pageIndex - 1) * page.pageSize + page.items.length, total: page.totalCount })}
            </div>
          )}

          {reviews.isLoading && (
            <div className="grid gap-4" role="status" aria-label={t('admin.reviews.loading')}>
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
                  <div className="flex items-center gap-3.5"><Skeleton className="size-12 rounded-full motion-reduce:animate-none" /><div className="grid gap-2"><Skeleton className="h-4 w-40 rounded-lg motion-reduce:animate-none" /><Skeleton className="h-3 w-28 rounded-lg motion-reduce:animate-none" /></div></div>
                  <Skeleton className="h-4 w-24 rounded-lg motion-reduce:animate-none" />
                  <Skeleton className="h-16 w-full rounded-lg motion-reduce:animate-none" />
                </div>
              ))}
            </div>
          )}

          {reviews.isError && !page && (
            <Card className="items-center rounded-3xl border border-destructive/20 bg-card p-5 text-center sm:p-8">
              <p className="text-sm font-bold text-destructive">{getErrorMessage(reviews.error)}</p>
              <Button variant="outline" className={grayButtonClass + ' mt-3'} disabled={reviews.isFetching} onClick={() => reviews.refetch()}>
                {reviews.isFetching ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <RefreshCw />}
                {t('admin.reviews.retry')}
              </Button>
            </Card>
          )}

          {page && page.items.length === 0 && (
            <section className="relative isolate grid place-items-center overflow-hidden px-4 py-14 text-center sm:py-24">
              <div className="relative">
                <span className="absolute inset-0 rounded-full bg-primary/15 motion-safe:animate-pulse" />
                <span className="relative grid size-20 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 ring-8 ring-primary/10">
                  {activeFilters ? <SearchX className="size-8" /> : <MessageSquareText className="size-8" />}
                </span>
              </div>
              <h2 className="mt-8 font-sans text-2xl font-bold sm:text-3xl">{t(activeFilters ? 'admin.reviews.noMatchTitle' : 'admin.reviews.emptyTitle')}</h2>
              <p className="mt-4 max-w-md text-sm leading-7 font-medium text-muted-foreground sm:text-base">{t(activeFilters ? 'admin.reviews.noMatchDescription' : 'admin.reviews.emptyDescription')}</p>
              {activeFilters > 0 && <Button variant="outline" className={grayButtonClass + ' mt-6'} onClick={clearFilters}><RotateCcw />{t('admin.reviews.clearFilters')}</Button>}
            </section>
          )}

          {page && page.items.length > 0 && (
            <>
              <div className={`grid items-stretch gap-4 transition-opacity motion-reduce:transition-none md:grid-cols-2 2xl:grid-cols-3 ${reviews.isPlaceholderData ? 'opacity-60' : ''}`}>
                {page.items.map((review) => {
                  const isPending = review.status === 'Pending'
                  return (
                    <article key={review.reviewId} className={`flex h-full min-w-0 flex-col gap-4 rounded-2xl border bg-card p-4 transition hover:shadow-md sm:p-5 ${isPending ? 'border-warm/35' : 'border-border'}`}>
                      <header className="flex min-w-0 items-start gap-3">
                        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary ring-2 ring-primary/15">
                          {review.isAnonymous ? <EyeOff className="size-5" /> : <UserRound className="size-5" />}
                        </span>
                        <div className="grid min-w-0 flex-1 gap-0.5 text-start">
                          <strong className="truncate font-sans text-base font-bold leading-tight">{review.isAnonymous ? t('admin.reviews.anonymous') : review.patientName}</strong>
                          <time dateTime={review.createdAt} className="truncate text-xs font-semibold text-muted-foreground">{formatDate(review.createdAt)}</time>
                        </div>
                        <Badge className={`h-auto shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${reviewStatusTone(review.status)}`}>{t('admin.reviews.status.' + review.status, { defaultValue: review.status })}</Badge>
                      </header>

                      <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2">
                        <Stars value={review.rating} label={t('admin.reviews.ratingLabel', { count: review.rating })} />
                        <span className="ms-auto text-xs font-bold text-warm tabular-nums">{review.rating}/5</span>
                      </div>

                      {review.comment?.trim() ? (
                        <p dir="auto" className="border-s-[3px] border-primary/40 ps-3.5 text-start text-lg leading-9 font-normal break-words whitespace-pre-line text-foreground">{review.comment}</p>
                      ) : (
                        <p className="border-s-2 border-border ps-4 text-sm font-semibold text-muted-foreground italic">{t('admin.reviews.noComment')}</p>
                      )}

                      {isPending && (
                        <footer className="mt-auto flex flex-col gap-2 border-t border-border/60 pt-3 sm:flex-row sm:items-center sm:justify-end">
                          <Button variant="destructive" className={buttonClass + ' w-full cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:translate-y-0 disabled:shadow-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:w-auto'} disabled={moderate.isPending} onClick={() => askToModerate(review, ReviewModeration.Rejected)}><X className="size-4" />{t('admin.reviews.reject')}</Button>
                          <Button className={buttonClass + ' w-full cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:translate-y-0 disabled:shadow-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:w-auto'} disabled={moderate.isPending} onClick={() => askToModerate(review, ReviewModeration.Approved)}><Check className="size-4" />{t('admin.reviews.approve')}</Button>
                        </footer>
                      )}
                    </article>
                  )
                })}
              </div>

              {page.totalPages > 1 && (
                <nav aria-label={t('admin.reviews.pagination')} className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-bold text-muted-foreground">{t('admin.reviews.pageOf', { page: page.pageIndex, total: page.totalPages })}</span>
                  <div className="flex w-full gap-2 max-sm:[&>button]:flex-1 sm:w-auto">
                    <Button variant="outline" className={grayButtonClass} disabled={page.pageIndex <= 1 || reviews.isFetching} onClick={() => goTo(page.pageIndex - 1)}><ChevronLeft className="rtl:rotate-180" />{t('admin.reviews.previous')}</Button>
                    <Button variant="outline" className={grayButtonClass} disabled={page.pageIndex >= page.totalPages || reviews.isFetching} onClick={() => goTo(page.pageIndex + 1)}>{t('admin.reviews.next')}<ChevronRight className="rtl:rotate-180" /></Button>
                  </div>
                </nav>
              )}
            </>
          )}
        </section>
      </div>

      <ConfirmationDialog
        open={Boolean(confirmation)}
        title={confirmationCopy.title}
        description={confirmationCopy.description}
        confirmLabel={confirmationCopy.confirmLabel}
        cancelLabel={t('admin.reviews.keep')}
        destructive={!approving}
        pending={moderate.isPending}
        error={moderate.error ? getErrorMessage(moderate.error) : undefined}
        onConfirm={confirmModeration}
        onOpenChange={(open) => {
          if (!open && !moderate.isPending) {
            setConfirmation(null)
            moderate.reset()
          }
        }}
      />
    </AdminShell>
  )
}