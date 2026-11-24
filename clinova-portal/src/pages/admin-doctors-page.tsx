import { useNavigate, useSearch } from '@tanstack/react-router'
import { CalendarClock, ChevronLeft, ChevronRight, LoaderCircle, Mail, Phone, RefreshCw, RotateCcw, Search, SearchX, Stethoscope } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import AdminDoctorDetailsDialog from '@/components/admin-doctor-details-dialog'
import AdminShell from '@/components/admin-shell'
import ConfirmationDialog from '@/components/confirmation-dialog'
import DoctorAvatar from '@/components/doctor-avatar'
import Notice from '@/components/notice'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminDoctors, useModerateDoctor } from '@/hooks/use-admin-doctors'
import { getErrorMessage } from '@/lib/api'
import { DoctorModeration, doctorStatusFilters, doctorStatusTone, effectiveStatus } from '@/lib/admin-doctors'
import type { AdminDoctor, AdminDoctorFilters, DoctorStatusFilter } from '@/types/admin-doctor'

const pageSize = 10
const debounceMs = 400
const buttonClass = 'h-10 rounded-xl px-4 text-[13px] font-bold normal-case tracking-normal'
const grayButtonClass = buttonClass + ' border-transparent bg-foreground/5 text-foreground shadow-none hover:bg-foreground/10 dark:border-transparent dark:bg-foreground/5 dark:hover:bg-foreground/10'

// The search text updates locally on every keystroke and reaches the URL once typing pauses.
function useDebouncedSearch(value: string | undefined, setFilters: (patch: AdminDoctorFilters) => void) {
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

export default function AdminDoctorsPage() {
  const { t, i18n } = useTranslation()
  const search = useSearch({ from: '/admin/doctors' })
  const navigate = useNavigate({ from: '/admin/doctors' })
  const resultsRef = useRef<HTMLElement>(null)
  const [success, setSuccess] = useState('')
  const [selected, setSelected] = useState<AdminDoctor | null>(null)
  const [confirmation, setConfirmation] = useState<{ doctor: AdminDoctor; status: DoctorModeration } | null>(null)

  // Any filter change returns to the first page and keeps the other filters.
  const setFilters = useCallback((patch: AdminDoctorFilters) => {
    navigate({ search: (current) => ({ ...current, ...patch, pageIndex: undefined }), replace: true, resetScroll: false })
  }, [navigate])
  const [draft, setDraft] = useDebouncedSearch(search.q, setFilters)

  const doctors = useAdminDoctors(search, pageSize)
  const moderate = useModerateDoctor()
  const page = doctors.data
  const status = effectiveStatus(search)

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.resolvedLanguage === 'ar' ? 'ar-EG' : 'en-EG', { dateStyle: 'medium', timeStyle: 'short' }),
    [i18n.resolvedLanguage],
  )
  function formatDate(value: string) {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
  }

  function selectStatus(next: DoctorStatusFilter) {
    setFilters({ status: next === 'pending' ? undefined : next })
  }
  function clearSearch() {
    setDraft('')
    navigate({ search: (current) => ({ ...current, q: undefined, pageIndex: undefined }), replace: true, resetScroll: false })
  }
  function goTo(pageIndex: number) {
    navigate({ search: (current) => ({ ...current, pageIndex: pageIndex > 1 ? pageIndex : undefined }), resetScroll: false })
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    resultsRef.current?.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  function askToModerate(doctor: AdminDoctor, next: DoctorModeration) {
    setSuccess('')
    moderate.reset()
    setConfirmation({ doctor, status: next })
  }
  function confirmModeration() {
    if (!confirmation || moderate.isPending) return
    const { doctor, status: next } = confirmation
    moderate.mutate({ doctorId: doctor.doctorId, status: next }, {
      onSuccess: () => {
        setConfirmation(null)
        setSelected(null)
        setSuccess(t(next === DoctorModeration.Approved ? 'admin.doctors.approveSuccess' : 'admin.doctors.rejectSuccess'))
      },
    })
  }

  const approving = confirmation?.status === DoctorModeration.Approved
  const name = confirmation?.doctor.doctorName ?? ''
  const confirmationCopy = approving
    ? { title: t('admin.doctors.approveTitle'), description: t('admin.doctors.approveConfirm', { name }), confirmLabel: t('admin.doctors.approve') }
    : { title: t('admin.doctors.rejectTitle'), description: t('admin.doctors.rejectConfirm', { name }), confirmLabel: t('admin.doctors.reject') }

  return (
    <AdminShell>
      <div className="mx-auto w-full min-w-0 max-w-screen-2xl p-4 sm:p-6 lg:p-10">
        <div>
          <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-primary uppercase"><Stethoscope className="size-3" />{t('admin.doctors.eyebrow')}</Badge>
          <h1 className="mt-2 font-sans text-2xl font-bold min-[400px]:text-3xl sm:text-4xl">{t('admin.doctors.title')}</h1>
          <p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground sm:text-sm">{t('admin.doctors.description')}</p>
        </div>

        {success && <div className="mt-4"><Notice tone="success" message={success} /></div>}

        <div className="mt-6 grid gap-3 lg:flex lg:items-center lg:gap-4">
          <div role="group" aria-label={t('admin.doctors.filterLabel')} className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 lg:mx-0 lg:shrink-0 lg:overflow-visible lg:px-0 lg:pb-0">
            {doctorStatusFilters.map((value) => {
              const selected = status === value
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => selectStatus(value)}
                  className={`h-10 shrink-0 rounded-full border px-4 text-[13px] font-bold whitespace-nowrap transition focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none motion-reduce:transition-none ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'}`}
                >
                  {t('admin.doctors.filters.' + value)}
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:min-w-0 lg:flex-1 lg:flex-nowrap lg:justify-end">
            <div className="group relative w-full min-w-0 flex-1 sm:max-w-md lg:max-w-sm">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <input
                type="search"
                id="adminDoctorSearch"
                value={draft}
                maxLength={100}
                aria-label={t('admin.doctors.searchPlaceholder')}
                placeholder={t('admin.doctors.searchPlaceholder')}
                onChange={(event) => setDraft(event.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-card ps-9 pe-3 text-base font-semibold text-foreground outline-none transition placeholder:font-medium sm:h-10 sm:text-[15px] focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/10"
              />
            </div>
            {search.q && <Button variant="outline" className={grayButtonClass + ' w-full shrink-0 sm:w-auto'} onClick={clearSearch}><RotateCcw className="size-3.5" />{t('admin.doctors.clearSearch')}</Button>}
          </div>
        </div>

        <section ref={resultsRef} className="mt-6 scroll-mt-24" aria-busy={doctors.isFetching}>
          {page && page.totalCount > 0 && (
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground/70" role="status">
              {doctors.isFetching && <LoaderCircle className="size-3.5 animate-spin motion-reduce:animate-none" />}
              {t('admin.doctors.showing', { from: (page.pageIndex - 1) * page.pageSize + 1, to: (page.pageIndex - 1) * page.pageSize + page.items.length, total: page.totalCount })}
            </div>
          )}

          {doctors.isLoading && (
            <div className="grid gap-3" role="status" aria-label={t('admin.doctors.loading')}>
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="grid gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
                  <div className="flex items-center gap-3.5"><Skeleton className="size-14 rounded-xl motion-reduce:animate-none" /><div className="grid gap-2"><Skeleton className="h-4 w-44 rounded-lg motion-reduce:animate-none" /><Skeleton className="h-3 w-28 rounded-lg motion-reduce:animate-none" /></div></div>
                  <Skeleton className="h-4 w-full rounded-lg motion-reduce:animate-none" />
                </div>
              ))}
            </div>
          )}

          {doctors.isError && !page && (
            <Card className="items-center rounded-3xl border border-destructive/20 bg-card p-5 text-center sm:p-8">
              <p className="text-sm font-bold text-destructive">{getErrorMessage(doctors.error)}</p>
              <Button variant="outline" className={grayButtonClass + ' mt-3'} disabled={doctors.isFetching} onClick={() => doctors.refetch()}>
                {doctors.isFetching ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <RefreshCw />}
                {t('admin.doctors.retry')}
              </Button>
            </Card>
          )}

          {page && page.items.length === 0 && (
            <section className="relative isolate grid place-items-center overflow-hidden px-4 py-14 text-center sm:py-24">
              <div className="relative">
                <span className="absolute inset-0 rounded-full bg-primary/15 motion-safe:animate-pulse" />
                <span className="relative grid size-20 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 ring-8 ring-primary/10">
                  {search.q ? <SearchX className="size-8" /> : <Stethoscope className="size-8" />}
                </span>
              </div>
              <h2 className="mt-8 font-sans text-2xl font-bold sm:text-3xl">{search.q ? t('admin.doctors.noMatchTitle') : t('admin.doctors.empty.' + status + 'Title')}</h2>
              <p className="mt-4 max-w-md text-sm leading-7 font-medium text-muted-foreground sm:text-base">{search.q ? t('admin.doctors.noMatchDescription') : t('admin.doctors.empty.' + status + 'Description')}</p>
              {search.q && <Button variant="outline" className={grayButtonClass + ' mt-6'} onClick={clearSearch}><RotateCcw />{t('admin.doctors.clearSearch')}</Button>}
            </section>
          )}

          {page && page.items.length > 0 && (
            <>
              <ul className={`grid gap-3 transition-opacity motion-reduce:transition-none ${doctors.isPlaceholderData ? 'opacity-60' : ''}`}>
                {page.items.map((doctor) => {
                  const isPending = doctor.approvalStatus === 'Pending'
                  return (
                    <li key={doctor.doctorId}>
                      <article className={`flex min-w-0 flex-col gap-4 rounded-2xl border bg-card p-4 transition hover:shadow-md motion-reduce:transition-none sm:p-5 ${isPending ? 'border-warm/35' : 'border-border'}`}>
                        <header className="flex min-w-0 items-start gap-3">
                          <DoctorAvatar className="size-20 shrink-0 sm:size-24" name={doctor.doctorName} picture={doctor.profilePictureImageUrl} />
                          <div className="grid min-w-0 flex-1 content-center gap-1.5 self-center text-start">
                            <strong className="font-sans text-lg leading-tight font-bold break-words sm:text-xl">{doctor.doctorName}</strong>
                            <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-semibold text-primary sm:text-sm"><Stethoscope className="size-3.5 shrink-0" /><span className="break-words">{doctor.medicalSpecialty}</span></span>
                          </div>
                          <Badge className={`h-auto shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${doctorStatusTone(doctor.approvalStatus)}`}>{t('admin.doctors.status.' + doctor.approvalStatus, { defaultValue: doctor.approvalStatus })}</Badge>
                        </header>

                        <dl className="grid divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60 bg-muted/30 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] sm:divide-x sm:divide-y-0 rtl:sm:divide-x-reverse">
                          <div className="flex min-w-0 items-center gap-3 px-4 py-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Mail className="size-4" /></span>
                            <span className="grid min-w-0 gap-0.5">
                              <dt className="text-xs font-semibold text-muted-foreground">{t('fields.email')}</dt>
                              <dd dir="ltr" className="min-w-0 truncate text-start text-sm font-bold">{doctor.email}</dd>
                            </span>
                          </div>
                          <div className="flex min-w-0 items-center gap-3 px-4 py-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Phone className="size-4" /></span>
                            <span className="grid min-w-0 gap-0.5">
                              <dt className="text-xs font-semibold text-muted-foreground">{t('admin.doctors.phone', { defaultValue: 'Phone' })}</dt>
                              <dd dir="ltr" className="min-w-0 truncate text-start text-sm font-bold">{doctor.phoneNumber}</dd>
                            </span>
                          </div>
                          <div className="flex min-w-0 items-center gap-3 px-4 py-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><CalendarClock className="size-4" /></span>
                            <span className="grid min-w-0 gap-0.5">
                              <dt className="text-xs font-semibold text-muted-foreground">{t('admin.doctors.registered', { defaultValue: 'Registered' })}</dt>
                              <dd className="min-w-0 text-sm font-bold break-words">{formatDate(doctor.createdAt)}</dd>
                            </span>
                          </div>
                        </dl>

                        <div className="flex sm:justify-end">
                          <Button variant={isPending ? 'default' : 'outline'} className={(isPending ? buttonClass : grayButtonClass) + ' w-full cursor-pointer sm:w-auto'} onClick={() => setSelected(doctor)}>
                            {t(isPending ? 'admin.doctors.review' : 'admin.doctors.viewDetails')}
                            <ChevronRight className="size-4 rtl:rotate-180" />
                          </Button>
                        </div>
                      </article>
                    </li>
                  )
                })}
              </ul>

              {page.totalPages > 1 && (
                <nav aria-label={t('admin.doctors.pagination')} className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-bold text-muted-foreground">{t('admin.doctors.pageOf', { page: page.pageIndex, total: page.totalPages })}</span>
                  <div className="flex w-full gap-2 max-sm:[&>button]:flex-1 sm:w-auto">
                    <Button variant="outline" className={grayButtonClass} disabled={page.pageIndex <= 1 || doctors.isFetching} onClick={() => goTo(page.pageIndex - 1)}><ChevronLeft className="rtl:rotate-180" />{t('admin.doctors.previous')}</Button>
                    <Button variant="outline" className={grayButtonClass} disabled={page.pageIndex >= page.totalPages || doctors.isFetching} onClick={() => goTo(page.pageIndex + 1)}>{t('admin.doctors.next')}<ChevronRight className="rtl:rotate-180" /></Button>
                  </div>
                </nav>
              )}
            </>
          )}
        </section>
      </div>

      <AdminDoctorDetailsDialog doctor={selected} busy={moderate.isPending} formatDate={formatDate} onClose={() => setSelected(null)} onModerate={askToModerate} />

      <ConfirmationDialog
        open={Boolean(confirmation)}
        title={confirmationCopy.title}
        description={confirmationCopy.description}
        confirmLabel={confirmationCopy.confirmLabel}
        cancelLabel={t('admin.doctors.keep')}
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