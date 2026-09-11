import { Link } from '@tanstack/react-router'
import { ArrowRight, CalendarDays, HeartPulse, ShieldCheck, Sparkles, Stethoscope } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Brand from '@/components/brand'
import MedicalIllustration from '@/components/medical-illustration'
import PreferencesControls from '@/components/preferences-controls'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

const Arrow = () => <ArrowRight className="size-4 rtl:rotate-180" />

export default function LandingPage() {
  const { t } = useTranslation()

  return (
    <main className="relative min-h-svh overflow-hidden bg-background text-foreground selection:bg-primary/25">
      <div className="pointer-events-none absolute -top-48 -end-48 size-[34rem] rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -start-48 size-[32rem] rounded-full bg-warm/10 blur-3xl" />
      <nav className="relative z-20 mx-auto flex min-h-20 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:min-h-24 sm:px-6 lg:px-8">
        <Brand />
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="me-1 hidden items-center gap-2 text-muted-foreground xl:inline-flex"><ShieldCheck className="size-3.5" /> {t('common.securePlatform')}</Badge>
          <PreferencesControls compact />
          <Link to="/login" search={{ redirect: undefined }} className="hidden rounded-xl px-4 py-3 text-sm font-semibold text-foreground/75 transition-colors hover:bg-accent hover:text-foreground md:inline-flex">{t('common.signIn')}</Link>
          <Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/10 transition hover:-translate-y-0.5 hover:bg-primary/90 sm:px-5">{t('landing.getStarted')} <Arrow /></Link>
        </div>
      </nav>

      <section className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-8 px-4 pt-10 pb-14 sm:px-6 sm:pt-16 lg:min-h-[42rem] lg:grid-cols-2 lg:gap-12 lg:px-8 lg:pt-8">
        <div className="text-center lg:text-start">
          <Badge className="rounded-full border border-primary/15 bg-primary/5 px-3 py-2 text-primary"><Sparkles className="size-3.5" /> {t('landing.badge')}</Badge>
          <h1 className="mx-auto mt-6 max-w-3xl font-heading text-5xl leading-[.95] font-medium tracking-[-.055em] text-foreground sm:text-6xl md:text-7xl lg:mx-0 lg:text-[5.4rem] rtl:tracking-normal xl:text-[6.2rem]">{t('landing.titleStart')} <em className="font-medium text-warm">{t('landing.titleAccent')}</em> {t('landing.titleEnd')}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base lg:mx-0 lg:text-lg">{t('landing.description')}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link to="/register/patient" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/10 transition hover:-translate-y-0.5 hover:bg-primary/90">{t('landing.joinPatient')} <Arrow /></Link>
            <Link to="/register/doctor" className="inline-flex min-h-13 items-center justify-center rounded-xl border border-border bg-card/55 px-6 py-3 text-sm font-bold text-foreground transition hover:-translate-y-0.5 hover:bg-accent">{t('landing.joinDoctor')}</Link>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-3 border-t border-border pt-6 text-start sm:max-w-xl lg:mt-12">
            <div className="grid gap-1"><strong className="font-heading text-base sm:text-lg">{t('landing.accessValue')}</strong><span className="text-[9px] text-muted-foreground sm:text-[11px]">{t('landing.accessLabel')}</span></div>
            <div className="grid gap-1 border-x border-border px-3 sm:px-5"><strong className="font-heading text-base sm:text-lg">{t('landing.placeValue')}</strong><span className="text-[9px] text-muted-foreground sm:text-[11px]">{t('landing.placeLabel')}</span></div>
            <div className="grid gap-1"><strong className="font-heading text-base sm:text-lg">{t('landing.verifiedValue')}</strong><span className="text-[9px] text-muted-foreground sm:text-[11px]">{t('landing.verifiedLabel')}</span></div>
          </div>
        </div>

        <div className="relative mx-auto grid w-full max-w-2xl place-items-center lg:min-h-[36rem]">
          <div className="pointer-events-none absolute size-[82%] rounded-full border border-primary/10" />
          <div className="pointer-events-none absolute size-[64%] animate-[spin_30s_linear_infinite] rounded-full border border-dashed border-primary/15 motion-reduce:animate-none" />
          <MedicalIllustration />
          <Card className="absolute top-[12%] start-0 hidden flex-row items-center gap-3 rounded-2xl border border-border bg-card/85 px-4 py-3 shadow-xl backdrop-blur-xl sm:flex lg:-start-4"><HeartPulse className="size-5 text-warm" /><span className="grid"><strong className="text-xs">{t('landing.connectedCare')}</strong><small className="text-[10px] text-muted-foreground">{t('landing.connectedCareDescription')}</small></span></Card>
          <Card className="absolute end-0 bottom-[12%] hidden flex-row items-center gap-3 rounded-2xl border border-border bg-card/85 px-4 py-3 shadow-xl backdrop-blur-xl sm:flex lg:-end-4"><CalendarDays className="size-5 text-warm" /><span className="grid"><strong className="text-xs">{t('landing.schedule')}</strong><small className="text-[10px] text-muted-foreground">{t('landing.scheduleDescription')}</small></span></Card>
        </div>
      </section>

      <section className="relative z-10 mx-auto grid w-full max-w-7xl gap-4 px-4 pb-16 sm:px-6 md:grid-cols-2 lg:px-8 lg:pb-24">
        <Card className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border border-border bg-card/60 p-5 transition hover:-translate-y-1 hover:border-primary/25 hover:bg-card sm:p-6">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><HeartPulse className="size-6" /></span>
          <div><Badge className="text-primary">{t('landing.patientsBadge')}</Badge><h2 className="mt-1 font-heading text-xl font-medium normal-case">{t('landing.patientsTitle')}</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">{t('landing.patientsDescription')}</p></div>
          <Link to="/register/patient" className="grid size-10 place-items-center rounded-full bg-primary/8 text-primary transition group-hover:translate-x-1 group-hover:bg-primary/15 rtl:group-hover:-translate-x-1" aria-label={t('landing.registerPatientLabel')}><Arrow /></Link>
        </Card>
        <Card className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border border-border bg-card/60 p-5 transition hover:-translate-y-1 hover:border-warm/25 hover:bg-card sm:p-6">
          <span className="grid size-14 place-items-center rounded-2xl bg-warm/10 text-warm"><Stethoscope className="size-6" /></span>
          <div><Badge className="text-warm">{t('landing.cliniciansBadge')}</Badge><h2 className="mt-1 font-heading text-xl font-medium normal-case">{t('landing.cliniciansTitle')}</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">{t('landing.cliniciansDescription')}</p></div>
          <Link to="/register/doctor" className="grid size-10 place-items-center rounded-full bg-warm/8 text-warm transition group-hover:translate-x-1 group-hover:bg-warm/15 rtl:group-hover:-translate-x-1" aria-label={t('landing.registerDoctorLabel')}><Arrow /></Link>
        </Card>
      </section>
    </main>
  )
}
