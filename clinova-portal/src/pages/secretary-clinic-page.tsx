import { Link } from '@tanstack/react-router'
import { BadgeCheck, Building2, CalendarPlus, CircleDollarSign, ExternalLink, ImageIcon, Landmark, LoaderCircle, MapPin, Phone, RefreshCw, Stethoscope, UsersRound, WalletCards } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import ClinicNotAssigned from '@/components/clinic-not-assigned'
import DoctorAvatar from '@/components/doctor-avatar'
import DoctorWorkspaceShell from '@/components/doctor-workspace-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent} from '@/components/ui/card'
import { useSecretaryClinic, useSecretaryClinicMembers } from '@/hooks/use-secretary-clinic'
import { getErrorMessage } from '@/lib/api'
import { depositAmount, formatMoney, isNotAssignedError } from '@/lib/guest-reservation'
import type { ClinicDetails } from '@/types/clinic'

const button = 'h-11 rounded-xl text-sm font-bold normal-case tracking-normal'

function SectionTitle({ icon, children, count }: { icon: ReactNode; children: ReactNode; count?: number }) {
  return <div className="relative overflow-hidden rounded-t-2xl border-b border-border/40 bg-gradient-to-br from-primary/15 via-primary/[0.05] to-transparent p-5">
    <span className="pointer-events-none absolute -end-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" />
    <div className="relative flex items-center gap-3.5">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10">{icon}</span>
      <h3 className="min-w-0 flex-1 truncate font-sans text-xl font-bold">{children}</h3>
      {count !== undefined && <span className="rounded-full bg-muted px-2.5 py-1 text-sm font-bold text-foreground">{count}</span>}
    </div>
  </div>
}

function Tile({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/45 p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5">
    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary [&>svg]:size-4.5">{icon}</span>
    <span className="grid gap-0.5"><small className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</small><strong className="text-sm">{value}</strong></span>
  </div>
}

export default function SecretaryClinicPage() {
  const { t } = useTranslation()
  const clinic = useSecretaryClinic()
  const notAssigned = isNotAssignedError(clinic.error)

  return (
    <DoctorWorkspaceShell active="secretary-clinic">
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-10">
        <div>
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
          <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-primary uppercase">
            <UsersRound className="size-3" />
            {t('secretary.myClinic.secretaryBadge', { defaultValue: 'Secretary' })}
          </Badge>
          <h2 className="mt-3 break-words font-sans text-3xl font-bold sm:text-5xl">{clinic.name}</h2>
          <p className="mt-3 flex min-w-0 items-start gap-2 text-xs font-bold text-muted-foreground">
            <MapPin className="size-4 shrink-0 text-primary" />
            <span className="min-w-0 break-words">{address}{clinic.landmark ? ` · ${clinic.landmark}` : ''}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {clinic.googleMapsUrl && <Button variant="outline" className={button} render={<a href={clinic.googleMapsUrl} target="_blank" rel="noreferrer" />}><MapPin />{t('secretary.myClinic.openMaps')}<ExternalLink className="size-3.5" /></Button>}
          <Button className={button + ' bg-primary px-5 text-primary-foreground hover:bg-primary/90'} render={<Link to="/secretary/guest-booking" search={{ doctorId: undefined }} />}><CalendarPlus />{t('secretary.guest.title')}</Button>
        </div>
      </div>
    </Card>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,1fr)]">
      <div className="grid content-start gap-5">
        <Card className="gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0">
          <SectionTitle icon={<Building2 className="size-6" />}>{t('secretary.myClinic.infoTitleShort', { defaultValue: 'Information' })}</SectionTitle>
          <CardContent className="grid gap-3 p-5 sm:grid-cols-2">
            <Tile icon={<MapPin />} label={t('secretary.myClinic.region')} value={clinic.regionName} />
            <Tile icon={<Landmark />} label={t('secretary.myClinic.landmark')} value={clinic.landmark || '—'} />
            <Tile icon={<CircleDollarSign />} label={t('secretary.myClinic.fee')} value={money(clinic.consultationFee)} />
            <Tile icon={<WalletCards />} label={t('secretary.myClinic.deposit')} value={t('secretary.myClinic.depositValue', { percentage: clinic.depositPercentage, amount: money(depositAmount(clinic.consultationFee, clinic.depositPercentage)) })} />
          </CardContent>
        </Card>

        <Card className="gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0">
          <SectionTitle icon={<ImageIcon className="size-6" />} count={clinic.images.length}>{t('secretary.myClinic.imagesTitle')}</SectionTitle>
          <CardContent className="p-5">
            {clinic.images.length ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {clinic.images.map((image, index) => <a key={image.id} href={image.url} target="_blank" rel="noreferrer" className="rounded-2xl border border-border/60 bg-background/40 p-2 transition hover:border-primary/30">
                <img className="aspect-video size-full rounded-xl object-cover" src={image.url} alt={t('secretary.myClinic.imageAlt', { number: index + 1 })} loading="lazy" />
              </a>)}
            </div> : <p className="text-xs leading-6 text-muted-foreground sm:text-sm">{t('secretary.myClinic.noImages')}</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid content-start gap-5">
        <Card className="gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0">
          <SectionTitle icon={<UsersRound className="size-6" />} count={members.data?.length}>{t('secretary.myClinic.doctorsTitle')}</SectionTitle>
          <CardContent className="grid gap-3 p-5">
            {members.isLoading && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />{t('secretary.guest.loadingDoctors')}</p>}
            {members.isError && <div className="grid justify-items-start gap-2">
              <p className="text-sm font-bold text-destructive">{getErrorMessage(members.error)}</p>
              <Button variant="outline" className={button} disabled={members.isFetching} onClick={() => members.refetch()}>{members.isFetching ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <RefreshCw />}{t('errors.tryAgain')}</Button>
            </div>}
            {members.data && !members.data.length && <p className="text-xs leading-6 text-muted-foreground sm:text-sm">{t('secretary.myClinic.noDoctors')}</p>}
            {members.data?.length ? <ul className="-mx-2 grid divide-y divide-border/50">
              {members.data.map((member) => <li key={member.id} className="group flex min-w-0 items-center gap-4 rounded-2xl px-2 py-3.5 transition-colors hover:bg-primary/5">
                <span className="shrink-0 rounded-2xl ring-2 ring-primary/10 ring-offset-2 ring-offset-card transition group-hover:ring-primary/35"><DoctorAvatar className="size-16" name={member.fullName} picture={member.profilePicture} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <strong className="truncate text-base font-bold">{member.fullName}</strong>
                    {member.isOwner && <Badge className="shrink-0 rounded-full border border-primary/20 bg-primary px-3 py-1 text-[10px] font-bold tracking-wider text-primary-foreground uppercase [&>svg]:size-3.5!"><BadgeCheck />{t('secretary.myClinic.owner')}</Badge>}
                  </div>
                  <span className="mt-1 flex items-center gap-1.5 truncate text-xs font-semibold text-muted-foreground"><Stethoscope className="size-3.5 shrink-0 text-primary" />{member.medicalSpecialty}</span>
                </div>
                <Button variant="ghost" size="icon" className="size-10 shrink-0 rounded-full bg-primary/10 text-primary transition hover:bg-primary hover:text-primary-foreground" aria-label={t('secretary.myClinic.bookFor', { name: member.fullName })} title={t('secretary.myClinic.bookFor', { name: member.fullName })} render={<Link to="/secretary/guest-booking" search={{ doctorId: member.id }} />}><CalendarPlus className="size-4" /></Button>
              </li>)}
            </ul> : null}
          </CardContent>
        </Card>

        <Card className="gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0">
          <SectionTitle icon={<Phone className="size-6" />} count={clinic.phoneNumbers.length}>{t('secretary.myClinic.phonesTitle')}</SectionTitle>
          <CardContent className="grid gap-2 p-5">
            {clinic.phoneNumbers.length ? clinic.phoneNumbers.map((phone) => <div key={phone.id} className="flex cursor-default items-center gap-3 rounded-2xl border border-border/60 bg-background/45 p-3 text-sm font-bold transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Phone className="size-4" /></span>
              <span dir="ltr" className="cursor-text select-text">{phone.phoneNumber}</span>
            </div>) : <p className="text-xs leading-6 text-muted-foreground sm:text-sm">{t('secretary.myClinic.noPhones')}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
}
