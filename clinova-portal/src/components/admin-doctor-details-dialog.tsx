import { Check, ExternalLink, ImageOff, Maximize2, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import DoctorAvatar from '@/components/doctor-avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DoctorModeration, doctorStatusTone } from '@/lib/admin-doctors'
import { resolveFileUrl } from '@/lib/secretary-appointments'
import type { AdminDoctor } from '@/types/admin-doctor'

const buttonClass = 'h-10 rounded-xl px-4 text-[13px] font-bold normal-case tracking-normal'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="grid gap-3" aria-label={title}>
    <h3 className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase rtl:tracking-normal">{title}</h3>
    {children}
  </section>
}

// One bordered list of label/value rows: every row is the same height and no cell is left alone.
function Rows({ children }: { children: ReactNode }) {
  return <dl className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-muted/20">{children}</dl>
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return <div className="grid min-w-0 gap-0.5 px-4 py-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-6">
    <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
    <dd className="min-w-0 text-sm font-bold break-words sm:text-end">{children}</dd>
  </div>
}

function DocumentCard({ title, url, onView }: { title: string; url: string | null; onView: (src: string, title: string) => void }) {
  const { t } = useTranslation()
  const [failed, setFailed] = useState(false)
  const src = url?.trim() ? resolveFileUrl(url) : ''
  const available = Boolean(src) && !failed
  return <figure className="grid min-w-0 gap-2">
    <figcaption className="text-xs font-semibold text-muted-foreground">{title}</figcaption>
    {available
      ? <button type="button" aria-label={t('admin.doctors.viewDocument', { name: title })} onClick={() => onView(src, title)} className="group relative cursor-zoom-in overflow-hidden rounded-2xl border border-border bg-muted/30 outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
        <img src={src} alt={title} loading="lazy" onError={() => setFailed(true)} className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none" />
        <span aria-hidden="true" className="absolute inset-0 grid place-items-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100 motion-reduce:transition-none"><Maximize2 className="size-6 drop-shadow" /></span>
      </button>
      : <div className="grid aspect-[4/3] place-items-center rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-center">
        <div className="grid justify-items-center gap-2">
          <ImageOff className="size-7 text-muted-foreground" />
          <p className="text-xs font-semibold text-muted-foreground">{t('admin.doctors.documentUnavailable')}</p>
        </div>
      </div>}
  </figure>
}

function Lightbox({ src, title, onClose }: { src: string; title: string; onClose: () => void }) {
  const { t } = useTranslation()
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    // Capture phase so Escape closes only the viewer and not the dialog behind it.
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.stopPropagation(); onClose() } }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[70] grid place-items-center bg-black/85 p-4 backdrop-blur-sm" onClick={onClose}>
      {failed
        ? <p className="rounded-2xl bg-card px-5 py-4 text-sm font-bold" onClick={(event) => event.stopPropagation()}>{t('admin.doctors.documentUnavailable')}</p>
        : <img src={src} alt={title} onError={() => setFailed(true)} onClick={(event) => event.stopPropagation()} className="max-h-[85svh] max-w-full rounded-2xl object-contain shadow-2xl" />}
      <div className="absolute end-4 top-4 flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
        <a href={src} target="_blank" rel="noreferrer noopener" aria-label={t('admin.doctors.openOriginal')} title={t('admin.doctors.openOriginal')} className="grid size-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"><ExternalLink className="size-5" /></a>
        <button type="button" aria-label={t('admin.doctors.close')} onClick={onClose} className="grid size-10 cursor-pointer place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"><X className="size-5" /></button>
      </div>
      <p className="absolute bottom-5 left-1/2 max-w-[90%] -translate-x-1/2 truncate rounded-full bg-black/50 px-3 py-1 text-xs font-bold text-white backdrop-blur">{title}</p>
    </div>,
    document.body,
  )
}

export default function AdminDoctorDetailsDialog({ doctor, busy, formatDate, onClose, onModerate }: {
  doctor: AdminDoctor | null
  busy: boolean
  formatDate: (value: string) => string
  onClose: () => void
  onModerate: (doctor: AdminDoctor, status: DoctorModeration) => void
}) {
  const { t } = useTranslation()
  const [viewing, setViewing] = useState<{ src: string; title: string } | null>(null)
  const viewingRef = useRef(viewing)
  viewingRef.current = viewing
  const pending = doctor?.approvalStatus === 'Pending'

  return <>
    <Dialog open={Boolean(doctor)} onOpenChange={(open) => { if (!open && !viewingRef.current) onClose() }}>
      <DialogContent showCloseButton={false} className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto rounded-3xl border border-border bg-card p-0 text-card-foreground shadow-2xl sm:max-w-2xl">
        {doctor && <>
          <DialogHeader className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-primary/15 via-primary/[0.05] to-transparent p-5 pe-16 text-start sm:p-6 sm:pe-20 dark:bg-none">
            <span className="pointer-events-none absolute -end-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl dark:hidden" />
            <div className="relative flex items-start gap-4">
              <DoctorAvatar className="size-16 shrink-0 sm:size-20" name={doctor.doctorName} picture={doctor.profilePictureImageUrl} />
              <div className="grid min-w-0 flex-1 gap-1.5">
                <DialogTitle className="font-sans text-xl leading-tight font-bold break-words normal-case tracking-normal sm:text-2xl">{doctor.doctorName}</DialogTitle>
                <DialogDescription className="text-start text-sm leading-5 font-medium break-words text-foreground/70">{[doctor.medicalSpecialty, doctor.title].filter(Boolean).join(' · ')}</DialogDescription>
                <Badge className={`mt-1 h-auto w-fit rounded-full border px-3 py-1 text-[11px] font-bold ${doctorStatusTone(doctor.approvalStatus)}`}>{t('admin.doctors.status.' + doctor.approvalStatus, { defaultValue: doctor.approvalStatus })}</Badge>
              </div>
            </div>
            <button type="button" aria-label={t('admin.doctors.close')} onClick={onClose} className="absolute end-4 top-4 grid size-9 cursor-pointer place-items-center rounded-xl bg-foreground/5 text-foreground transition-colors hover:bg-foreground/10"><X className="size-4" /></button>
          </DialogHeader>

          <div className="grid gap-7 p-5 sm:p-6">
            <Section title={t('admin.doctors.personal')}>
              <Rows>
                <Row label={t('admin.doctors.email')}><span dir="ltr">{doctor.email}</span></Row>
                <Row label={t('admin.doctors.phone')}><span dir="ltr">{doctor.phoneNumber}</span></Row>
                <Row label={t('admin.doctors.registeredOn')}>{formatDate(doctor.createdAt)}</Row>
              </Rows>
            </Section>

            <Section title={t('admin.doctors.professional')}>
              <Rows>
                <Row label={t('admin.doctors.specialty')}>{doctor.medicalSpecialty}</Row>
                {doctor.title && <Row label={t('doctorProfile.clinicalTitle')}>{doctor.title}</Row>}
                {doctor.experienceYears != null && <Row label={t('admin.doctors.experience')}>{t('admin.doctors.years', { count: doctor.experienceYears })}</Row>}
              </Rows>
              {doctor.bio?.trim() && <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3.5">
                <p className="text-xs font-semibold text-muted-foreground">{t('admin.doctors.bio')}</p>
                <p dir="auto" className="mt-2 text-start text-[15px] leading-8 font-medium break-words whitespace-pre-line text-foreground">{doctor.bio}</p>
              </div>}
            </Section>

            <Section title={t('admin.doctors.verification')}>
              <Rows>
                <Row label={t('admin.doctors.syndicateNumber')}><span dir="ltr" className="font-mono">{doctor.syndicateNumber}</span></Row>
              </Rows>
              <div className="grid gap-4 sm:grid-cols-2">
                <DocumentCard key={doctor.doctorId + 'syndicate'} title={t('admin.doctors.syndicateCard')} url={doctor.syndicateCardImageUrl} onView={(src, title) => setViewing({ src, title })} />
                <DocumentCard key={doctor.doctorId + 'national'} title={t('admin.doctors.nationalId')} url={doctor.nationalIdImageUrl} onView={(src, title) => setViewing({ src, title })} />
              </div>
            </Section>

            {pending && (
              <div className="flex flex-col-reverse gap-2 border-t border-border/60 pt-5 sm:flex-row sm:justify-end">
                <Button variant="destructive" className={buttonClass + ' w-full cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:translate-y-0 disabled:shadow-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:w-auto'} disabled={busy} onClick={() => onModerate(doctor, DoctorModeration.Rejected)}><X className="size-4" />{t('admin.doctors.reject')}</Button>
                <Button className={buttonClass + ' w-full cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:translate-y-0 disabled:shadow-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:w-auto'} disabled={busy} onClick={() => onModerate(doctor, DoctorModeration.Approved)}><Check className="size-4" />{t('admin.doctors.approve')}</Button>
              </div>
            )}
          </div>
        </>}
      </DialogContent>
    </Dialog>
    {viewing && <Lightbox src={viewing.src} title={viewing.title} onClose={() => window.setTimeout(() => setViewing(null), 0)} />}
  </>
}