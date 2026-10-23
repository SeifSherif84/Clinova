import { Link } from '@tanstack/react-router'
import { BadgeCheck, Banknote, Building2, CalendarPlus, ExternalLink, ImageIcon, Landmark, LoaderCircle, MapPin, Percent, Phone, RefreshCw, Stethoscope, UsersRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import ClinicNotAssigned from '@/components/clinic-not-assigned'
import DoctorAvatar from '@/components/doctor-avatar'
import DoctorWorkspaceShell from '@/components/doctor-workspace-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSecretaryClinic, useSecretaryClinicMembers } from '@/hooks/use-secretary-clinic'
import { getErrorMessage } from '@/lib/api'
import { depositAmount, formatMoney, isNotAssignedError } from '@/lib/guest-reservation'
import type { ClinicDetails } from '@/types/clinic'

const button = 'h-11 rounded-xl text-sm font-bold normal-case tracking-normal'
const iconBox = 'grid size-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'

function SectionTitle({ icon, children, count }: { icon: ReactNode; children: ReactNode; count?: number }) {
  return <CardHeader className="!pb-3 border-b border-border/40">
    <CardTitle className="flex items-center gap-2 font-sans text-xl font-bold normal-case tracking-normal">
      <span className={iconBox}>{icon}</span>{children}
      {count !== undefined && <span className="ms-auto rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">{count}</span>}
    </CardTitle>
  </CardHeader>
}

function Tile({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-border/60 bg-background/45 p-4 transition hover:border-primary/30 hover:bg-primary/5">
    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary [&>svg]:size-4">{icon}</span>
    <div className="min-w-0"><small className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{label}</small><strong className="block truncate text-sm font-bold">{value}</strong></div>
  </div>
}

export default function SecretaryClinicPage() {
  const { t } = useTranslation()
  const clinic = useSecretaryClinic()
  const notAssigned = isNotAssignedError(clinic.error)

  return (
    <DoctorWorkspaceShell active="secretary-clinic">
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-10">
        <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-primary uppercase"><Building2 className="size-3" />{t('secretary.workspace')}</Badge>
        <h1 className="mt-2 font-sans text-3xl font-bold sm:text-4xl">{t('secretary.myClinic.title')}</h1>
        <p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground sm:text-sm">{t('secretary.myClinic.description')}</p>

        <div className="mt-6">
          {clinic.isLoading && <p role="status" className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />{t('secretary.myClinic.loading')}</p>}
          {notAssigned && <ClinicNotAssigned />}
          {clinic.isError && !notAssigned && <Card className="items-center rounded-3xl border border-destructive/20 bg-card p-8 text-center">
            <p className="text-sm font-bold text-destructive">{getErrorMessage(clinic.error)}</p>
            <Button variant="outline" className={button + ' mt-3'} disabled={clinic.isFetching} onClick={() => clinic.refetch()}>{clinic.isFetching ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <RefreshCw />}{t('errors.tryAgain')}</Button>
          </Card>}
          {clinic.data && <ClinicOverview clinic={clinic.data} />}
        </div>
      </div>
    </DoctorWorkspaceShell>
  )
}

function ClinicOverview({ clinic }: { clinic: ClinicDetails }) {
  const { t, i18n } = useTranslation()
  const members = useSecretaryClinicMembers()
  const money = (value: number) => formatMoney(value, i18n.resolvedLanguage)
  const address = [`${clinic.buildingNumber} ${clinic.streetName}`.trim(), clinic.regionName].filter(Boolean).join(' · ')

  return <div className="grid gap-5">
    <Card className="relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/12 via-card to-primary/5 p-5 sm:p-7">
      <span className="pointer-events-none absolute -end-16 -top-16 size-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Building2 className="size-7" /></span>
          <h2 className="mt-4 font-sans text-3xl font-bold break-words sm:text-5xl">{clinic.name}</h2>
          <p className="mt-3 flex items-start gap-2 text-xs leading-6 text-muted-foreground sm:text-sm"><MapPin className="mt-1 size-4 shrink-0 text-primary" />{address}</p>
          {clinic.landmark && <p className="flex items-start gap-2 text-xs leading-6 text-muted-foreground sm:text-sm"><Landmark className="mt-1 size-4 shrink-0 text-primary" />{clinic.landmark}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {clinic.googleMapsUrl && <Button variant="outline" className={button} render={<a href={clinic.googleMapsUrl} target="_blank" rel="noreferrer" />}><MapPin />{t('secretary.myClinic.openMaps')}<ExternalLink className="size-3.5" /></Button>}
          <Button className={button + ' bg-primary px-5 text-primary-foreground hover:bg-primary/90'} render={<Link to="/secretary/guest-booking" search={{ doctorId: undefined }} />}><CalendarPlus />{t('secretary.guest.title')}</Button>
        </div>
      </div>
    </Card>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,1fr)]">
      <div className="grid content-start gap-5">
        <Card className="rounded-2xl border border-border bg-card">
          <SectionTitle icon={<Building2 className="size-5" />}>{t('secretary.myClinic.infoTitle')}</SectionTitle>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Tile icon={<Banknote />} label={t('secretary.myClinic.fee')} value={money(clinic.consultationFee)} />
            <Tile icon={<Percent />} label={t('secretary.myClinic.deposit')} value={t('secretary.myClinic.depositValue', { percentage: clinic.depositPercentage, amount: money(depositAmount(clinic.consultationFee, clinic.depositPercentage)) })} />
            <Tile icon={<MapPin />} label={t('secretary.myClinic.region')} value={clinic.regionName} />
            <Tile icon={<Landmark />} label={t('secretary.myClinic.landmark')} value={clinic.landmark || '—'} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border bg-card">
          <SectionTitle icon={<ImageIcon className="size-5" />} count={clinic.images.length}>{t('secretary.myClinic.imagesTitle')}</SectionTitle>
          <CardContent>
            {clinic.images.length ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {clinic.images.map((image, index) => <a key={image.id} href={image.url} target="_blank" rel="noreferrer" className="rounded-2xl border border-border/60 bg-background/40 p-2 transition hover:border-primary/30">
                <img className="aspect-video size-full rounded-xl object-cover" src={image.url} alt={t('secretary.myClinic.imageAlt', { number: index + 1 })} loading="lazy" />
              </a>)}
            </div> : <p className="text-xs leading-6 text-muted-foreground sm:text-sm">{t('secretary.myClinic.noImages')}</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid content-start gap-5">
        <Card className="rounded-2xl border border-border bg-card">
          <SectionTitle icon={<UsersRound className="size-5" />} count={members.data?.length}>{t('secretary.myClinic.doctorsTitle')}</SectionTitle>
          <CardContent className="grid gap-3">
            {members.isLoading && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />{t('secretary.guest.loadingDoctors')}</p>}
            {members.isError && <div className="grid justify-items-start gap-2">
              <p className="text-sm font-bold text-destructive">{getErrorMessage(members.error)}</p>
              <Button variant="outline" className={button} disabled={members.isFetching} onClick={() => members.refetch()}>{members.isFetching ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <RefreshCw />}{t('errors.tryAgain')}</Button>
            </div>}
            {members.data && !members.data.length && <p className="text-xs leading-6 text-muted-foreground sm:text-sm">{t('secretary.myClinic.noDoctors')}</p>}
            {members.data?.map((member) => <div key={member.id} className="flex min-w-0 items-center gap-3 rounded-2xl border border-border/60 bg-background/45 p-3 transition hover:border-primary/30 hover:bg-primary/5">
              <DoctorAvatar name={member.fullName} picture={member.profilePicture} />
              <div className="min-w-0 flex-1">
                <strong className="block truncate text-sm font-bold">{member.fullName}</strong>
                <span className="flex items-center gap-1.5 truncate text-xs text-muted-foreground"><Stethoscope className="size-3.5 shrink-0 text-primary" />{member.medicalSpecialty}</span>
              </div>
              {member.isOwner && <Badge className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary"><BadgeCheck className="size-3" />{t('secretary.myClinic.owner')}</Badge>}
              <Button variant="outline" size="icon" className="shrink-0 rounded-xl border-border bg-card/40 text-muted-foreground hover:border-primary/30 hover:text-primary" aria-label={t('secretary.myClinic.bookFor', { name: member.fullName })} title={t('secretary.myClinic.bookFor', { name: member.fullName })} render={<Link to="/secretary/guest-booking" search={{ doctorId: member.id }} />}><CalendarPlus className="size-4" /></Button>
            </div>)}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border bg-card">
          <SectionTitle icon={<Phone className="size-5" />} count={clinic.phoneNumbers.length}>{t('secretary.myClinic.phonesTitle')}</SectionTitle>
          <CardContent className="grid gap-2">
            {clinic.phoneNumbers.length ? clinic.phoneNumbers.map((phone) => <a key={phone.id} href={`tel:${phone.phoneNumber}`} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/45 p-3 text-sm font-bold transition hover:border-primary/30 hover:bg-primary/5">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Phone className="size-4" /></span>
              <span dir="ltr">{phone.phoneNumber}</span>
            </a>) : <p className="text-xs leading-6 text-muted-foreground sm:text-sm">{t('secretary.myClinic.noPhones')}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
}
