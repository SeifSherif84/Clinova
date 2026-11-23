import { Link } from '@tanstack/react-router'
import { ArrowRight, BadgeCheck, Bell, CalendarCheck2, CalendarDays, CircleCheckBig, Clock3, HeartPulse, MapPin, Search, ShieldCheck, Sparkles, Stethoscope } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import PatientShell from '@/components/patient-shell'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import doctorImage from '@/assets/doctor.webp'

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return <div className="mx-auto max-w-2xl text-center">
    <span className="text-xs font-bold tracking-[.14em] text-primary uppercase">{eyebrow}</span>
    <h2 className="mt-2 font-sans text-2xl font-bold sm:text-4xl">{title}</h2>
    {description && <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>}
  </div>
}

export default function PatientHomePage() {
  const { t } = useTranslation()
  const auth = useAuth()
  const firstName = auth.user?.name.split(' ')[0] || t('dashboard.fallbackName')
  const stats = [
    { icon: <Clock3 className="size-6" />, value: t('landing.accessValue'), label: t('landing.accessLabel') },
    { icon: <MapPin className="size-6" />, value: t('landing.placeValue'), label: t('landing.placeLabel') },
    { icon: <BadgeCheck className="size-6" />, value: t('landing.verifiedValue'), label: t('landing.verifiedLabel') },
  ]
  const features = [
    { icon: <Stethoscope className="size-6" />, title: t('patientPortal.why.doctors', { defaultValue: 'Doctors and clinics, together' }), text: t('patientPortal.why.doctorsDesc', { defaultValue: 'Browse doctors and see which clinic they practice in.' }) },
    { icon: <CalendarCheck2 className="size-6" />, title: t('patientPortal.why.times', { defaultValue: 'Real available times' }), text: t('patientPortal.why.timesDesc', { defaultValue: 'Only open time slots are shown, so what you pick is what you get.' }) },
    { icon: <Bell className="size-6" />, title: t('patientPortal.why.informed', { defaultValue: 'Always informed' }), text: t('patientPortal.why.informedDesc', { defaultValue: 'Updates about your appointments reach your notifications right away.' }) },
    { icon: <ShieldCheck className="size-6" />, title: t('patientPortal.why.secure', { defaultValue: 'Private and secure' }), text: t('patientPortal.why.secureDesc', { defaultValue: 'Your details stay protected behind your own account.' }) },
  ]
  const steps = [
    { icon: <Search className="size-5" />, title: t('patientPortal.steps.one', { defaultValue: 'Find your doctor' }), text: t('patientPortal.steps.oneDesc', { defaultValue: 'Search by name, specialty, or clinic and read about the doctor before you decide.' }) },
    { icon: <CalendarDays className="size-5" />, title: t('patientPortal.steps.two', { defaultValue: 'Choose a time' }), text: t('patientPortal.steps.twoDesc', { defaultValue: 'See the days and time slots that are actually available and pick the one that suits you.' }) },
    { icon: <CircleCheckBig className="size-5" />, title: t('patientPortal.steps.three', { defaultValue: 'Confirm your visit' }), text: t('patientPortal.steps.threeDesc', { defaultValue: 'Complete your booking and follow its status from your appointments and notifications.' }) },
  ]

  return <PatientShell>
    <section className="relative isolate overflow-hidden">
      <div className="mx-auto grid w-full max-w-screen-2xl items-center gap-10 px-4 pt-8 pb-12 sm:gap-14 sm:px-6 sm:pt-14 sm:pb-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20 lg:px-8 lg:pb-24">
        <div className="relative order-2 mx-auto w-full max-w-md pb-8 lg:order-1 lg:max-w-none">
          <div className="relative -rotate-2 overflow-hidden rounded-[2rem] border border-primary/15 shadow-xl shadow-primary/10 rtl:rotate-2">
            <img src={doctorImage} alt={t('illustration.label')} className="aspect-[20/21] w-full object-cover object-top" loading="eager" />
          </div>
          <Card className="absolute start-0 top-4 flex-row items-center gap-2 rounded-2xl border border-border bg-card/90 px-3 py-2 shadow-xl backdrop-blur-xl sm:-start-6 sm:top-6 sm:gap-3 sm:px-4 sm:py-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><HeartPulse className="size-5" /></span><span className="grid"><strong className="text-sm">{t('landing.connectedCare')}</strong><small className="text-xs font-semibold text-muted-foreground">{t('landing.connectedCareDescription')}</small></span></Card>
          <Card className="absolute end-0 bottom-0 flex-row items-center gap-2 rounded-2xl border border-border bg-card/90 px-3 py-2 shadow-xl backdrop-blur-xl sm:-end-6 sm:gap-3 sm:px-4 sm:py-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><CalendarDays className="size-5" /></span><span className="grid"><strong className="text-sm">{t('landing.schedule')}</strong><small className="text-xs font-semibold text-muted-foreground">{t('landing.scheduleDescription')}</small></span></Card>
        </div>

        <div className="order-1 text-center lg:order-2 lg:text-start">
          <Badge className="rounded-full border border-primary/15 bg-primary/10 px-4 py-1.5 text-[11px] font-semibold tracking-wider text-primary uppercase"><Sparkles className="size-3" />{t('patientPortal.hero.welcome', { defaultValue: 'Welcome back, {{name}}', name: firstName })}</Badge>
          <h1 className="mt-5 font-sans text-3xl leading-[1.1] font-bold tracking-tight min-[400px]:text-4xl sm:text-5xl lg:text-6xl rtl:tracking-normal">{t('patientPortal.hero.title', { defaultValue: 'Find the right doctor and book with confidence.' })}</h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base lg:mx-0">{t('patientPortal.hero.description', { defaultValue: 'Discover doctors and clinics, see real available times, and keep every appointment organized in one place.' })}</p>

          <dl className="mt-8 grid overflow-hidden rounded-3xl border border-border bg-card/70 text-start shadow-lg shadow-primary/5 backdrop-blur-xl sm:grid-cols-3 sm:divide-x sm:divide-border rtl:sm:divide-x-reverse max-sm:divide-y max-sm:divide-border">
            {stats.map((stat) => <div key={stat.label} className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-primary/5 sm:px-5 sm:py-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md ring-4 shadow-primary/25 ring-primary/10 transition duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:transform-none">{stat.icon}</span>
              <span className="grid min-w-0 gap-0.5">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="truncate font-sans text-lg font-bold">{stat.value}</dd>
                <span aria-hidden="true" className="truncate text-xs font-semibold text-muted-foreground">{stat.label}</span>
              </span>
            </div>)}
          </dl>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link to="/patient/doctors" className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90">
              {t('patientPortal.hero.cta', { defaultValue: 'Find a doctor' })}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
            <Link to="/patient/appointments" className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-foreground/5 px-6 text-sm font-bold text-foreground transition hover:bg-foreground/10">
              <CalendarDays className="size-4" />
              {t('patientPortal.nav.appointments', { defaultValue: 'My Appointments' })}
            </Link>
          </div>
        </div>
      </div>
    </section>

    <section className="border-t border-border/70 bg-gradient-to-b from-card/40 to-transparent py-12 sm:py-16 lg:py-24">
      <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow={t('patientPortal.why.eyebrow', { defaultValue: 'Why Clinova' })} title={t('patientPortal.why.title', { defaultValue: 'Healthcare that feels simple' })} description={t('patientPortal.why.description', { defaultValue: 'Everything you need to find care and keep track of it, without the confusion.' })} />
        <div className="mt-10 grid grid-cols-2 gap-3 sm:mt-14 sm:gap-5 lg:grid-cols-4">
          {features.map((feature) => <article key={feature.title} className="group relative isolate grid content-start gap-3 overflow-hidden rounded-3xl border border-border bg-card p-4 transition duration-300 sm:gap-5 sm:p-6 hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
            <span aria-hidden="true" className="pointer-events-none absolute -end-10 -top-10 -z-10 size-36 rounded-full bg-primary/10 opacity-60 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
            <span className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg ring-4 shadow-primary/25 ring-primary/10 transition duration-300 group-hover:scale-105 group-hover:-rotate-3 motion-reduce:transition-none motion-reduce:group-hover:transform-none rtl:group-hover:rotate-3">{feature.icon}</span>
            <div>
              <h3 className="text-sm font-bold sm:text-base">{feature.title}</h3>
              <p className="mt-1.5 text-xs leading-6 text-muted-foreground sm:mt-2 sm:text-sm sm:leading-7">{feature.text}</p>
            </div>
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-primary to-primary/20 transition-transform duration-300 group-hover:scale-x-100 motion-reduce:transition-none rtl:origin-right rtl:bg-gradient-to-l" />
          </article>)}
        </div>
      </div>
    </section>

    <section className="mx-auto w-full max-w-screen-2xl px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8 lg:pb-24">
      <SectionHeading eyebrow={t('patientPortal.steps.eyebrow', { defaultValue: 'How it works' })} title={t('patientPortal.steps.title', { defaultValue: 'Booking care in three calm steps' })} />
      <ol className="relative mt-8 grid gap-6 sm:mt-12 sm:grid-cols-3 sm:gap-6">
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-6 hidden border-t border-dashed border-primary/25 sm:block" />
        {steps.map((step, index) => <li key={step.title} className="group relative flex items-start gap-4 sm:flex-col sm:items-center sm:gap-3 sm:text-center">
          <span className="relative z-10 grid size-12 shrink-0 place-items-center rounded-full border-2 border-primary/20 bg-card text-primary shadow-sm transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-lg group-hover:shadow-primary/25">{step.icon}</span>
          <div className="sm:max-w-64">
            <span className="text-[11px] font-bold tracking-wider text-primary">0{index + 1}</span>
            <h3 className="text-base font-bold">{step.title}</h3>
            <p className="mt-1.5 text-xs leading-6 text-muted-foreground sm:text-sm">{step.text}</p>
          </div>
        </li>)}
      </ol>
    </section>
  </PatientShell>
}