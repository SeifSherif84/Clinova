import { Link } from '@tanstack/react-router'
import { ArrowRight, CalendarDays, HeartPulse, LayoutDashboard, ShieldCheck, Sparkles, Stethoscope } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Brand from '@/components/brand'
import MedicalIllustration from '@/components/medical-illustration'
import PreferencesControls from '@/components/preferences-controls'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'

const Arrow = () => <ArrowRight className="size-4 rtl:rotate-180" />
const CardArrow = () => <ArrowRight className="size-4 transition group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />

export default function LandingPage() {
  const { t } = useTranslation()
  const auth = useAuth()

  return (
    <main className="relative min-h-svh overflow-hidden bg-background text-foreground selection:bg-primary/25">
      <div className="pointer-events-none absolute -top-48 -end-48 size-[34rem] rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -start-48 size-[32rem] rounded-full bg-warm/10 blur-3xl" />
      <nav className="relative z-20 mx-auto flex min-h-20 w-full max-w-screen-2xl items-center justify-between gap-3 px-4 sm:min-h-24 sm:px-6 lg:px-8">
        <span className="min-w-0 sm:hidden"><Brand compact /></span>
        <span className="hidden sm:block"><Brand /></span>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                    <Badge variant="secondary" className="me-1 hidden items-center gap-2 text-sm font-bold text-muted-foreground xl:inline-flex [&>svg]:size-4!"><ShieldCheck /> {t('common.securePlatform')}</Badge>
          <PreferencesControls compact />
          {auth.isAuthenticated ? (
            <Link to="/dashboard" className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-bold text-primary-foreground transition hover:bg-primary/90">
              <LayoutDashboard className="size-4" />
              {t('landing.dashboardButton')}
            </Link>
          ) : <>
            <Link to="/login" search={{ redirect: undefined }} className="hidden h-10 cursor-pointer items-center justify-center rounded-xl bg-foreground/5 px-4 text-[13px] font-bold text-foreground transition-colors hover:bg-foreground/10 md:inline-flex">{t('common.signIn')}</Link>
            <Link to="/register" className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-3 text-[13px] font-bold whitespace-nowrap text-primary-foreground transition hover:bg-primary/90 sm:px-4">{t('landing.getStarted')} <Arrow /></Link>
          </>}
        </div>
      </nav>

      <section className="relative z-10 mx-auto grid w-full max-w-screen-2xl items-center gap-8 px-4 pt-10 pb-14 sm:px-6 sm:pt-16 lg:min-h-[42rem] lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12 lg:px-8 lg:pt-8">
        <div className="text-center lg:text-start">
          <span className="inline-flex items-center justify-center gap-1.5 text-sm font-bold tracking-[.1em] text-primary uppercase lg:justify-start"><Sparkles className="size-4 text-primary" /> {t('landing.badge')}</span>
          <h1 className="mx-auto mt-3 max-w-3xl font-sans text-4xl leading-[1.1] font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:mx-0 lg:text-6xl rtl:tracking-normal xl:text-7xl">{t('landing.titleStart')} <em className="font-bold not-italic text-warm">{t('landing.titleAccent')}</em> {t('landing.titleEnd')}</h1>
          <p className="mx-auto mt-8 max-w-md text-sm leading-7 text-muted-foreground sm:text-base lg:mx-0 lg:text-lg">{t('landing.description')}</p>
<div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
  <Link to="/register/patient" className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition hover:-translate-y-1 hover:bg-primary/90 sm:w-auto">
    {t('landing.joinPatient')}
    <ArrowRight className="size-4 rtl:rotate-180" />
  </Link>
  <Link to="/register/doctor" className="inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-foreground/5 px-6 text-sm font-bold text-foreground transition hover:-translate-y-1 hover:bg-foreground/10 sm:w-auto">
    {t('landing.joinDoctor')}
  </Link>
</div>
<div className="mx-auto mt-10 grid grid-cols-3 gap-2 border-t border-border pt-6 text-start sm:max-w-xl sm:gap-3 lg:mx-0 lg:mt-12">
  <div className="group grid gap-1 transition hover:-translate-y-0.5"><strong className="font-sans text-base transition group-hover:text-primary min-[400px]:text-lg sm:text-xl">{t('landing.accessValue')}</strong><span className="text-[10px] font-semibold text-muted-foreground sm:text-xs">{t('landing.accessLabel')}</span></div>
  <div className="group grid gap-1 border-x border-border px-2 transition hover:-translate-y-0.5 min-[400px]:px-3 sm:px-5"><strong className="font-sans text-base transition group-hover:text-primary min-[400px]:text-lg sm:text-xl">{t('landing.placeValue')}</strong><span className="text-[10px] font-semibold text-muted-foreground sm:text-xs">{t('landing.placeLabel')}</span></div>
  <div className="group grid gap-1 transition hover:-translate-y-0.5"><strong className="font-sans text-base transition group-hover:text-primary min-[400px]:text-lg sm:text-xl">{t('landing.verifiedValue')}</strong><span className="text-[10px] font-semibold text-muted-foreground sm:text-xs">{t('landing.verifiedLabel')}</span></div>
</div>
        </div>

        <div className="relative mx-auto w-full max-w-md pb-8 md:max-w-xl lg:max-w-none">
          <div className="relative -rotate-2 overflow-hidden rounded-[2rem] border border-primary/15 bg-gradient-to-br from-primary/15 via-card to-warm/10 p-6 shadow-xl shadow-primary/10 rtl:rotate-2">
            <MedicalIllustration />
          </div>
          <Card className="absolute start-0 top-4 max-w-[85%] flex-row items-center gap-2 rounded-2xl border border-border bg-card/90 px-3 py-2 shadow-xl backdrop-blur-xl sm:-start-6 sm:top-6 sm:max-w-none sm:gap-3 sm:px-4 sm:py-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><HeartPulse className="size-5" /></span><span className="grid"><strong className="text-sm">{t('landing.connectedCare')}</strong><small className="text-xs font-semibold text-muted-foreground">{t('landing.connectedCareDescription')}</small></span></Card>
          <Card className="absolute end-0 bottom-0 max-w-[85%] flex-row items-center gap-2 rounded-2xl border border-border bg-card/90 px-3 py-2 shadow-xl backdrop-blur-xl sm:-end-6 sm:max-w-none sm:gap-3 sm:px-4 sm:py-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><CalendarDays className="size-5" /></span><span className="grid"><strong className="text-sm">{t('landing.schedule')}</strong><small className="text-xs font-semibold text-muted-foreground">{t('landing.scheduleDescription')}</small></span></Card>
        </div>
      </section>

      <section className="relative z-10 mx-auto grid w-full max-w-screen-2xl gap-4 px-4 pb-16 sm:px-6 md:grid-cols-2 lg:px-8 lg:pb-24">
<Card className="group grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-border bg-card/60 p-4 transition hover:-translate-y-1 hover:border-primary/25 hover:bg-card sm:gap-4 sm:p-6">
  <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary sm:size-14"><HeartPulse className="size-6" /></span>
  <div><Badge className="text-sm font-bold text-primary">{t('landing.patientsBadge')}</Badge><h2 className="mt-1 font-sans text-xl font-bold normal-case">{t('landing.patientsTitle')}</h2><p className="mt-1 text-sm font-semibold leading-5 text-muted-foreground">{t('landing.patientsDescription')}</p></div>
  <Link to="/register/patient" className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground" aria-label={t('landing.registerPatientLabel')}><CardArrow /></Link>
</Card>
<Card className="group grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-border bg-card/60 p-4 transition hover:-translate-y-1 hover:border-warm/25 hover:bg-card sm:gap-4 sm:p-6">
  <span className="grid size-12 place-items-center rounded-2xl bg-warm/10 text-warm sm:size-14"><Stethoscope className="size-6" /></span>
  <div><Badge className="text-sm font-bold text-warm">{t('landing.cliniciansBadge')}</Badge><h2 className="mt-1 font-sans text-xl font-bold normal-case">{t('landing.cliniciansTitle')}</h2><p className="mt-1 text-sm font-semibold leading-5 text-muted-foreground">{t('landing.cliniciansDescription')}</p></div>
  <Link to="/register/doctor" className="grid size-10 place-items-center rounded-full bg-warm/10 text-warm transition-colors group-hover:bg-warm group-hover:text-white" aria-label={t('landing.registerDoctorLabel')}><CardArrow /></Link>
</Card>
      </section>
    </main>
  )
}
