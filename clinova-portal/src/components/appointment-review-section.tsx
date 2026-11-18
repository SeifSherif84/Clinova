import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { EyeOff, LoaderCircle, MessageSquareText, Pencil, RefreshCw, Star, Trash2, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ConfirmationDialog from '@/components/confirmation-dialog'
import Notice from '@/components/notice'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useApi } from '@/hooks/use-api'
import { ApiError, getErrorMessage } from '@/lib/api'
import { parseUtc } from '@/lib/patient-appointments'

interface AppointmentReview {
  id: number
  appointmentId: number
  rating: number
  comment: string | null
  isAnonymous: boolean
  status: string
  createdAt: string
}

const grayButton = 'h-10 cursor-pointer rounded-xl bg-foreground/5 px-4 text-[13px] font-bold normal-case tracking-normal text-foreground hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-primary/30'
const primaryButton = 'h-10 cursor-pointer rounded-xl px-4 text-[13px] font-bold normal-case tracking-normal'

function StarPicker({ value, onChange, label }: { value: number; onChange: (value: number) => void; label: (n: number) => string }) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  return <div dir="ltr" role="radiogroup" className="inline-flex gap-1" onMouseLeave={() => setHover(0)}>
    {[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={label(n)} onClick={() => onChange(n)} onMouseEnter={() => setHover(n)} className="cursor-pointer rounded-md p-0.5 outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none">
      <Star className={`size-8 ${n <= shown ? 'fill-warm text-warm' : 'text-muted-foreground/30'}`} />
    </button>)}
  </div>
}

export default function AppointmentReviewSection({ appointmentId, status }: { appointmentId: number; status: string }) {
  const { t, i18n } = useTranslation()
  const api = useApi()
  const queryClient = useQueryClient()
  const locale = i18n.resolvedLanguage === 'ar' ? 'ar-EG' : 'en-EG'
  const tr = (key: string, defaultValue: string, options?: Record<string, string | number>) => t('patientPortal.appointments.review.' + key, { defaultValue, ...options })
  const completed = status === 'Completed'
  const queryKey = ['patient', 'appointments', 'review', appointmentId]

  const [editing, setEditing] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  // A 404 here only means "no review yet", so it resolves to null instead of an error.
  const review = useQuery({
    queryKey,
    enabled: completed,
    queryFn: async () => {
      try {
        return await api.request<AppointmentReview>(`/api/reviews/appointments/${appointmentId}`, {}, { notifyOnError: false })
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null
        throw error
      }
    },
  })
  const current = review.data ?? null

  const refresh = () => queryClient.invalidateQueries({ queryKey })
  function resetForm() { setRating(0); setComment(''); setAnonymous(false); setFormError(''); setEditing(false) }

  const submit = useMutation({
    mutationFn: () => api.request<string>(`/api/reviews/appointments/${appointmentId}/submit`, { method: 'POST', body: JSON.stringify({ rating, comment: comment.trim() || null, isAnonymous: anonymous }) }, { notifyOnError: false }),
    onSuccess: async (message) => { setNotice(message); resetForm(); await refresh() },
  })
  const update = useMutation({
    mutationFn: (body: { rating?: number; comment?: string; isAnonymous?: boolean }) => api.request<string>(`/api/reviews/${current?.id}/appointments/${appointmentId}`, { method: 'PATCH', body: JSON.stringify(body) }, { notifyOnError: false }),
    onSuccess: async (message) => { setNotice(message); resetForm(); await refresh() },
  })
  const remove = useMutation({
    mutationFn: () => api.request<string>(`/api/reviews/${current?.id}/appointments/${appointmentId}`, { method: 'DELETE' }, { notifyOnError: false }),
    onSuccess: async (message) => { setNotice(message); setConfirmOpen(false); resetForm(); await refresh() },
  })

  function startEdit() {
    if (!current) return
    setRating(current.rating); setComment(current.comment ?? ''); setAnonymous(current.isAnonymous)
    setFormError(''); setNotice(''); update.reset(); setEditing(true)
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFormError(''); setNotice('')
    if (rating < 1 || rating > 5) return setFormError(tr('ratingRequired', 'Please choose a rating.'))
    if (!editing || !current) return submit.mutate()
    // Only changed fields are sent; an empty comment can't clear an existing one on the backend.
    const body: { rating?: number; comment?: string; isAnonymous?: boolean } = {}
    if (rating !== current.rating) body.rating = rating
    const text = comment.trim()
    if (text && text !== (current.comment ?? '')) body.comment = text
    if (anonymous !== current.isAnonymous) body.isAnonymous = anonymous
    if (!Object.keys(body).length) return setFormError(tr('noChanges', 'There are no changes to save.'))
    update.mutate(body)
  }

  const busy = submit.isPending || update.isPending
  const error = formError || (submit.error ? getErrorMessage(submit.error) : '') || (update.error ? getErrorMessage(update.error) : '')
  const showForm = completed && !review.isLoading && !review.isError && (current === null || editing)

  return <section className="grid gap-2 rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:px-6" aria-label={tr('title', 'Your review')}>
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2.5 font-sans text-lg font-bold tracking-normal normal-case">
        <span className="text-primary [&>svg]:size-6"><MessageSquareText /></span>
        {completed ? (current && !editing ? tr('title', 'Your review') : tr('rateTitle', 'Rate your experience')) : tr('shareTitle', 'Share your experience')}
      </h2>
      {completed && current && !editing && <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${current.status === 'Approved' ? 'border-primary/20 bg-primary/10 text-primary' : 'border-warm/25 bg-warm/10 text-warm'}`}>
        {current.status === 'Approved' ? tr('approved', 'Published') : tr('pending', 'Pending approval')}
      </span>}
    </div>

    {!completed && <p className="mt-3 text-base leading-7 font-medium text-muted-foreground">{tr('later', "You'll be able to rate your doctor and share your experience after your appointment is completed.")}</p>}

    {completed && notice && <div className="mt-4"><Notice tone="success" message={notice} /></div>}

    {completed && review.isLoading && <div className="mt-4 grid gap-3"><Skeleton className="h-8 w-48" /><Skeleton className="h-16 w-full rounded-2xl" /></div>}

    {completed && review.isError && <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
      <p className="min-w-0 flex-1 text-sm font-bold text-destructive">{getErrorMessage(review.error)}</p>
      <Button type="button" variant="ghost" className={grayButton} disabled={review.isFetching} onClick={() => review.refetch()}><RefreshCw className="size-4" />{t('errors.tryAgain')}</Button>
    </div>}

    {showForm && <form onSubmit={onSubmit} className={`grid gap-4 ${editing ? 'mt-2' : ''}`}>
      <StarPicker value={rating} onChange={setRating} label={(n) => tr('starLabel', '{{count}} out of 5', { count: n })} />
      <div>
        <textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} rows={3} aria-label={tr('comment', 'Comment')} placeholder={tr('commentPlaceholder', 'Write a comment (optional)')} className="w-full resize-y rounded-xl border border-input bg-background/40 px-3 py-2.5 text-base leading-7 font-medium outline-none transition placeholder:text-sm placeholder:font-medium focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/10" />
        <div className="mt-1.5 flex flex-wrap justify-between gap-2 text-[13px] font-semibold text-muted-foreground">
          <span>{tr('commentHint', 'Reviews with a comment are published after admin approval.')}</span>
          <span dir="ltr" className="tabular-nums">{comment.length}/1000</span>
        </div>
      </div>
      <button type="button" role="switch" aria-checked={anonymous} onClick={() => setAnonymous((value) => !value)} className="group flex w-full cursor-pointer items-center justify-between gap-4 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-start transition focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none motion-reduce:transition-none">
        <span className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><EyeOff className="size-4" /></span>
          <span className="grid min-w-0">
            <strong className="text-sm font-bold">{tr('anonymous', 'Submit anonymously')}</strong>
            <small className="text-xs font-semibold text-muted-foreground">{tr('anonymousHint', 'Your name will be hidden from other patients.')}</small>
          </span>
        </span>
        <span aria-hidden="true" className={`relative h-6 w-11 shrink-0 rounded-full transition-colors motion-reduce:transition-none ${anonymous ? 'bg-primary' : 'bg-foreground/20'}`}>
          <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all motion-reduce:transition-none ${anonymous ? 'start-[1.375rem]' : 'start-0.5'}`} />
        </span>
      </button>
      {error && <Notice message={error} />}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" className={primaryButton} disabled={busy}>{busy && <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />}{editing ? tr('save', 'Save changes') : tr('submit', 'Submit review')}</Button>
        {editing && <Button type="button" variant="ghost" className={grayButton} disabled={busy} onClick={resetForm}>{tr('cancel', 'Cancel')}</Button>}
      </div>
    </form>}

    {completed && current && !editing && <div className="mt-1 grid gap-4">
      <span dir="ltr" aria-label={tr('starLabel', '{{count}} out of 5', { count: current.rating })} className="inline-flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`size-6 ${n <= current.rating ? 'fill-warm text-warm' : 'text-muted-foreground/30'}`} />)}
      </span>

      {current.comment && <p className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-base leading-7 font-medium whitespace-pre-line text-foreground"><span aria-hidden="true" className="me-0.5">“</span>{current.comment}<span aria-hidden="true" className="ms-0.5">”</span></p>}

      {current.status !== 'Approved' && <p className="text-sm leading-6 font-semibold text-warm">{tr('pendingHint', 'Your review is waiting for admin approval.')}</p>}

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border/50 pt-3 text-sm font-semibold text-muted-foreground">
        <UserRound className="size-4" />{current.isAnonymous ? tr('anonymousShown', 'Posted anonymously') : tr('namedShown', 'Posted with your name')}
        <span aria-hidden="true">·</span>{parseUtc(current.createdAt).toLocaleDateString(locale, { dateStyle: 'medium' })}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="ghost" className={grayButton + ' w-full'} onClick={startEdit}><Pencil className="size-4" />{tr('edit', 'Edit review')}</Button>
        <Button type="button" variant="ghost" className={grayButton + ' w-full text-destructive hover:text-destructive'} onClick={() => { remove.reset(); setConfirmOpen(true) }}><Trash2 className="size-4" />{tr('delete', 'Delete review')}</Button>
      </div>
    </div>}

    <ConfirmationDialog
      open={confirmOpen}
      title={tr('deleteTitle', 'Delete your review?')}
      description={tr('deleteDescription', 'This cannot be undone.')}
      confirmLabel={tr('delete', 'Delete review')}
      cancelLabel={tr('keep', 'Keep review')}
      destructive
      pending={remove.isPending}
      error={remove.error ? getErrorMessage(remove.error) : undefined}
      onConfirm={() => remove.mutate()}
      onOpenChange={(open) => { if (!open && !remove.isPending) { setConfirmOpen(false); remove.reset() } }}
    />
  </section>
}