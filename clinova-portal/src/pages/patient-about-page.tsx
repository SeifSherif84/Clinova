import { Link } from '@tanstack/react-router'
import { ArrowRight, BadgeCheck, Building2, CalendarCheck2, CalendarDays, Check, ClipboardList, Clock3, FileSpreadsheet, FileText, HeartPulse, MessageSquareText, PenLine, Search, Stethoscope, UserRound, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import logoUrl from '@/assets/logo.svg'
import PatientShell from '@/components/patient-shell'
import { Badge } from '@/components/ui/badge'

const container = 'mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8'

function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return <span className={`text-xs font-bold tracking-[.14em] uppercase ${light ? 'text-primary-foreground/80' : 'text-primary'}`}>{children}</span>
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return <div className="mx-auto max-w-2xl text-center">
    <Eyebrow>{eyebrow}</Eyebrow>
    <h2 className="mt-2 font-sans text-2xl font-bold sm:text-4xl">{title}</h2>
    {description && <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">{description}</p>}
  </div>
}

function CheckItem({ children, tone = 'primary' }: { children: ReactNode; tone?: 'primary' | 'warm' }) {
  return <li className="flex items-start gap-3 text-sm leading-7 font-medium text-foreground/80">
    <span className={`mt-1 grid size-5 shrink-0 place-items-center rounded-full ${tone === 'warm' ? 'bg-warm/15 text-warm' : 'bg-primary/10 text-primary'}`}><Check className="size-3" strokeWidth={3} /></span>
    <span className="min-w-0">{children}</span>
  </li>
}

export default function PatientAboutPage() {
  const { t } = useTranslation()
  const a = (key: string, defaultValue: string) => t('patientPortal.about.' + key, { defaultValue })

  const journey = [
    { key: 'one', icon: <Search className="size-5" />, title: a('step1Title', 'Discover the right doctor'), text: a('step1Text', 'Search for doctors using filters such as medical specialty and location.') },
    { key: 'two', icon: <Stethoscope className="size-5" />, title: a('step2Title', 'Explore and compare'), text: a('step2Text', 'Read doctor profiles, see clinic information, and check patient reviews to make a more informed decision.') },
    { key: 'three', icon: <CalendarDays className="size-5" />, title: a('step3Title', 'Choose an available appointment'), text: a('step3Text', 'Select a clinic and pick from the available appointment slots.') },
    { key: 'four', icon: <Wallet className="size-5" />, title: a('step4Title', 'Confirm your booking with a deposit'), text: a('step4Text', 'Pay a deposit to confirm and secure the time you selected. It turns your choice into a confirmed appointment instead of an unconfirmed booking.'), deposit: true },
    { key: 'five', icon: <ClipboardList className="size-5" />, title: a('step5Title', 'Manage your appointments'), text: a('step5Text', 'Follow your appointments and keep an eye on booking and payment statuses, including refund information when it applies.') },
    { key: 'six', icon: <MessageSquareText className="size-5" />, title: a('step6Title', 'Share your experience'), text: a('step6Text', 'After your appointment is completed, submit a review and share how it went.') },
  ]
  const depositPoints = [
    a('depositPoint1', 'Your selected time becomes a confirmed appointment.'),
    a('depositPoint2', 'Fewer slots are held by bookings that are never honored.'),
    a('depositPoint3', 'A fairer, more reliable booking for patients and doctors alike.'),
  ]
  const patientBenefits = [
    a('wp1', 'Discover doctors using specialty and location filters.'),
    a('wp2', 'Explore doctor profiles, clinic information, and reviews.'),
    a('wp3', 'Choose from available appointment slots.'),
    a('wp4', 'Confirm appointments through the deposit-based booking process.'),
    a('wp5', 'Track appointments, payment statuses, and applicable refunds.'),
    a('wp6', 'Share reviews after your appointments.'),
  ]
  const clinicBenefits = [
    a('wc1', 'Organize clinic appointments and schedules.'),
    a('wc2', 'Manage clinic operations through a dedicated platform.'),
    a('wc3', 'Handle appointment-related payment workflows.'),
    a('wc4', 'Give secretaries a more organized way to manage daily tasks.'),
  ]

  return <PatientShell>
    {/* Hero */}
    <section className="relative isolate overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 -end-40 -z-10 size-[34rem] rounded-full bg-primary/15 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 -start-40 -z-10 size-[30rem] rounded-full bg-warm/10 blur-3xl" />
      <div className={`${container} grid items-center gap-10 pt-10 pb-14 sm:gap-14 sm:pt-16 sm:pb-16 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-16 lg:pb-24`}>
        <div className="text-center lg:text-start">
          <Badge className="rounded-full border border-primary/15 bg-primary/10 px-4 py-1.5 text-[11px] font-semibold tracking-wider text-primary uppercase">{a('eyebrow', 'About Clinova')}</Badge>
          <h1 className="mt-5 font-sans text-3xl leading-[1.1] min-[400px]:text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl rtl:tracking-normal">{a('heroTitle', 'Better Connections. Better Care.')}</h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-8 font-medium text-foreground/80 lg:mx-0 sm:text-lg">{a('heroDescription', 'Bringing patients, doctors, and clinics together through a simpler, more organized healthcare experience.')}</p>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base lg:mx-0">{a('heroNote', 'Clinova is more than a doctor-booking website. It connects the patient booking experience with the clinic management experience in one platform.')}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link to="/patient/doctors" className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90">
              {a('ctaFind', 'Find a doctor')}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
            <a href="#journey" className="inline-flex h-12 cursor-pointer items-center justify-center rounded-xl bg-foreground/5 px-6 text-sm font-bold text-foreground transition hover:bg-foreground/10">{a('ctaHow', 'See how it works')}</a>
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-xl grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto_minmax(0,1fr)] sm:gap-0">
          <style>{`
            @keyframes about-flow { 0% { inset-inline-start: 0; opacity: 0 } 15% { opacity: 1 } 85% { opacity: 1 } 100% { inset-inline-start: calc(100% - 6px); opacity: 0 } }
            @keyframes about-breathe { 0%, 100% { transform: scale(1); opacity: .55 } 50% { transform: scale(1.14); opacity: .15 } }
            @keyframes about-beat { 0%, 70%, 100% { transform: scale(1) } 14% { transform: scale(1.12) } 28% { transform: scale(1) } 42% { transform: scale(1.07) } }
            .about-dot { animation: about-flow 1.8s linear infinite }
            .about-dot-2 { animation-delay: .9s }
            .about-ring { animation: about-breathe 3s ease-in-out infinite }
            .about-beat { animation: about-beat 2.4s ease-in-out infinite }
            @media (prefers-reduced-motion: reduce) { .about-dot, .about-ring, .about-beat { animation: none } .about-dot { display: none } }
          `}</style>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-lg shadow-primary/5 sm:p-5">
            <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10"><UserRound className="size-5" /></span>
            <strong className="mt-4 block text-base font-bold">{a('sidePatients', 'Patients')}</strong>
            <p className="mt-1 text-xs leading-6 font-medium text-muted-foreground">{a('sidePatientsText', 'Discover doctors, book, and follow their visits.')}</p>
          </div>
          <span aria-hidden="true" className="relative hidden w-8 border-t-2 border-dashed border-primary/30 sm:block"><span className="about-dot absolute -top-1 size-1.5 rounded-full bg-primary" /></span>
          <div className="relative order-first col-span-2 mx-auto grid place-items-center py-3 sm:order-none sm:col-span-1 sm:py-0">
            <span aria-hidden="true" className="about-ring absolute size-28 rounded-full bg-primary/10" />
            <span className="relative grid size-24 place-items-center rounded-full bg-card shadow-xl ring-8 ring-primary/10"><img src={logoUrl} alt="Clinova" className="about-beat size-14" /></span>
          </div>
          <span aria-hidden="true" className="relative hidden w-8 border-t-2 border-dashed border-primary/30 sm:block"><span className="about-dot about-dot-2 absolute -top-1 size-1.5 rounded-full bg-primary" /></span>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-lg shadow-primary/5 sm:p-5">
            <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10"><Building2 className="size-5" /></span>
            <strong className="mt-4 block text-base font-bold">{a('sideClinics', 'Clinics')}</strong>
            <p className="mt-1 text-xs leading-6 font-medium text-muted-foreground">{a('sideClinicsText', 'Organize appointments, schedules, and payments.')}</p>
          </div>
        </div>
      </div>
    </section>

    {/* Story */}
    <section className="border-y border-border/70 bg-card/40 py-12 sm:py-16 lg:py-24">
      <div className={`${container} grid items-start gap-8 sm:gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20`}>
        <div className="lg:sticky lg:top-28">
          <Eyebrow>{a('storyEyebrow', 'Our story')}</Eyebrow>
          <h2 className="mt-2 font-sans text-3xl font-bold sm:text-4xl">{a('storyTitle', 'Where it all started')}</h2>
          <blockquote className="mt-6 border-s-4 border-primary ps-4 font-sans text-lg leading-8 sm:mt-8 sm:ps-5 sm:text-xl sm:leading-9 font-semibold text-foreground/90">{a('storyQuote', 'Many clinics needed a more organized and modern way to manage their daily operations.')}</blockquote>
        </div>

        <div className="grid gap-8">
          <div className="grid gap-4 text-[15px] leading-7 text-foreground/80 sm:gap-5 sm:text-base sm:leading-8">
            <p>{a('storyP1', 'Clinova began with a simple observation. While working in marketing at a dental radiology center, our founder regularly visited doctors at their clinics.')}</p>
            <p>{a('storyP2', 'Along the way, a pattern kept appearing: many clinics were still managing appointments, schedules, and payments with paper and pen, Excel sheets, Word documents, or other outdated ways of organizing the day.')}</p>
            <p>{a('storyP3', 'It showed how much a clinic’s daily work depends on staying organized, and how much easier it could be with a modern, connected system.')}</p>
            <p className="font-semibold text-foreground">{a('storyP4', 'That observation became Clinova: one platform that helps doctors and secretaries organize clinic operations, and makes it easier for patients to discover doctors and book confirmed appointments.')}</p>
          </div>

          <div className="grid items-stretch gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 sm:p-5">
              <small className="text-xs font-bold tracking-wider text-muted-foreground uppercase">{a('beforeTitle', 'How many clinics were managing')}</small>
              <ul className="mt-4 grid gap-2.5">
                <li className="flex items-center gap-3 text-sm font-semibold text-muted-foreground"><PenLine className="size-4 shrink-0" />{a('beforePaper', 'Paper and pen')}</li>
                <li className="flex items-center gap-3 text-sm font-semibold text-muted-foreground"><FileSpreadsheet className="size-4 shrink-0" />{a('beforeExcel', 'Excel sheets')}</li>
                <li className="flex items-center gap-3 text-sm font-semibold text-muted-foreground"><FileText className="size-4 shrink-0" />{a('beforeWord', 'Word documents')}</li>
                <li className="flex items-center gap-3 text-sm font-semibold text-muted-foreground"><Clock3 className="size-4 shrink-0" />{a('beforeOther', 'Outdated organizational systems')}</li>
              </ul>
            </div>
            <span aria-hidden="true" className="grid place-items-center text-primary"><span className="grid size-10 place-items-center rounded-full bg-primary/10"><ArrowRight className="size-4 rotate-90 sm:rotate-0 rtl:sm:rotate-180" /></span></span>
            <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card p-4 shadow-sm sm:p-5">
              <small className="text-xs font-bold tracking-wider text-primary uppercase">{a('afterTitle', 'One connected platform')}</small>
              <ul className="mt-4 grid gap-2.5">
                <CheckItem>{a('after1', 'Doctors and secretaries organize clinic operations')}</CheckItem>
                <CheckItem>{a('after2', 'Patients discover doctors and book')}</CheckItem>
                <CheckItem>{a('after3', 'Both sides connected in one organized experience')}</CheckItem>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Mission */}
    <section className={`${container} py-12 sm:py-16 lg:py-24`}>
      <div className="relative isolate overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] bg-[#06382b] text-white shadow-2xl shadow-primary/20">
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-[.12] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:22px_22px]" />

        <div className="grid gap-8 p-5 min-[400px]:p-6 sm:gap-10 sm:p-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-center lg:gap-16 lg:p-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-bold tracking-[.14em] text-emerald-200 uppercase">
              <HeartPulse className="size-3.5" />
              {a('missionEyebrow', 'Our mission')}
            </span>
            <p className="mt-5 font-sans text-xl leading-[1.4] font-bold min-[400px]:text-2xl sm:mt-6 sm:text-3xl lg:text-[2rem]">{a('missionText', 'To make healthcare experiences more organized and accessible, by simplifying how patients find and book doctors and helping doctors and clinic staff manage their daily operations more efficiently.')}</p>
            <span aria-hidden="true" className="mt-8 block h-1 w-16 rounded-full bg-emerald-300/70" />
          </div>

          <ul className="grid gap-4 md:max-lg:grid-cols-2">
            <li className="group flex items-start gap-3 rounded-2xl border border-white/15 bg-white/[0.07] p-4 sm:gap-4 sm:p-5 transition duration-200 hover:bg-white/[0.12] motion-reduce:transition-none sm:p-6">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-emerald-300 text-[#06382b] shadow-lg shadow-emerald-300/20"><UserRound className="size-6" /></span>
              <div className="min-w-0">
                <strong className="block text-lg font-bold">{a('missionPatients', 'For patients')}</strong>
                <p className="mt-1 text-sm leading-7 font-medium text-white/80">{a('missionPatientsText', 'Finding and booking the right doctor feels simple and clear.')}</p>
              </div>
            </li>
            <li className="group flex items-start gap-3 rounded-2xl border border-white/15 bg-white/[0.07] p-4 sm:gap-4 sm:p-5 transition duration-200 hover:bg-white/[0.12] motion-reduce:transition-none sm:p-6">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-emerald-300 text-[#06382b] shadow-lg shadow-emerald-300/20"><Building2 className="size-6" /></span>
              <div className="min-w-0">
                <strong className="block text-lg font-bold">{a('missionClinics', 'For doctors and clinics')}</strong>
                <p className="mt-1 text-sm leading-7 font-medium text-white/80">{a('missionClinicsText', 'Daily operations stay organized and efficient.')}</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>

    {/* Patient journey */}
    <section id="journey" className="scroll-mt-28 border-y border-border/70 bg-card/40 py-12 sm:py-16 lg:py-24">
      <div className={container}>
        <SectionHeading eyebrow={a('journeyEyebrow', 'How Clinova works')} title={a('journeyTitle', 'The patient journey')} description={a('journeyDescription', 'Six steps, from searching for a doctor to sharing your experience.')} />
        <ol className="relative mx-auto mt-10 grid max-w-5xl sm:mt-14">
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-5 start-5 border-s-2 border-dashed border-primary/25 sm:inset-y-6 sm:start-6 lg:start-1/2" />
          {journey.map((step, index) => <li key={step.key} className="relative grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 sm:gap-x-5 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-x-10">
            <span className="relative z-10 col-start-1 row-start-1 grid size-10 place-items-center rounded-xl sm:size-12 bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10 lg:col-start-2">{step.icon}</span>
            <div className={`col-start-2 row-start-1 min-w-0 pb-10 lg:pb-12 ${index % 2 === 0 ? 'lg:col-start-1' : 'lg:col-start-3'}`}>
              <div className={`rounded-2xl border p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0 max-sm:p-4 sm:p-6 ${step.deposit ? 'border-primary/30 bg-gradient-to-br from-primary/[0.06] via-card to-card' : 'border-border bg-card hover:border-primary/30'}`}>
                <span className="text-base font-bold tracking-wider text-primary">0{index + 1}</span>
                <h3 className="mt-1 text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{step.text}</p>
                {step.deposit && <>
                  <ul className="mt-4 grid gap-2.5">{depositPoints.map((point) => <CheckItem key={point}>{point}</CheckItem>)}</ul>
                  <p className="mt-4 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm leading-6 font-semibold text-foreground/90">
                    <BadgeCheck className="mt-0.5 size-5 shrink-0 text-primary" />
                    {a('depositNote', 'The deposit is part of the total consultation fee, not an extra charge. You only pay the remaining balance at the clinic when you attend your appointment.')}
                  </p>
                </>}
              </div>
            </div>
          </li>)}
        </ol>
      </div>
    </section>

    {/* Respecting everyone's time */}
    <section className={`${container} py-12 sm:py-16 lg:py-24`}>
      <SectionHeading eyebrow={a('timeEyebrow', 'A fair commitment')} title={a('timeTitle', 'A booking experience that respects everyone’s time')} description={a('timeDescription', 'A confirmed appointment makes things more reliable for patients and for doctors.')} />
      <div className="mt-8 grid overflow-hidden rounded-3xl border border-border bg-card shadow-sm sm:mt-12 lg:grid-cols-2">
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10"><Clock3 className="size-6" /></span>
            <h3 className="text-xl font-bold">{a('timeDoctors', 'For doctors')}</h3>
          </div>
          <p className="mt-2 text-sm leading-7 text-muted-foreground sm:text-base">{a('timeDoctorsText', 'Protects valuable working hours by reducing unserious bookings and missed appointments.')}</p>
        </div>
        <div className="border-t border-border p-5 sm:p-6 lg:border-t-0 lg:border-s">
          <div className="flex items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10"><CalendarCheck2 className="size-6" /></span>
            <h3 className="text-xl font-bold">{a('timePatients', 'For patients')}</h3>
          </div>
          <p className="mt-2 text-sm leading-7 text-muted-foreground sm:text-base">{a('timePatientsText', 'Gives you confidence that the appointment you chose has actually been confirmed.')}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-6 rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/[0.07] via-card to-card p-5 sm:p-10 md:max-lg:grid-cols-2 lg:grid-cols-[minmax(0,4fr)_minmax(0,4fr)_minmax(0,4fr)] lg:gap-0">
        <div className="md:max-lg:col-span-2 lg:pe-10">
          <h3 className="text-lg font-bold">{a('policyTitle', 'Cancellations and refunds')}</h3>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">{a('policyNote', 'You can follow refund information for your appointments from My Appointments.')}</p>
        </div>
        <div className="border-t border-primary/15 pt-6 lg:border-t-0 lg:border-s lg:px-10 lg:pt-0">
          <strong className="block text-base font-bold text-foreground">{a('policyPatient', 'Patient cancellations')}</strong>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">{a('policyPatientText', 'Eligible cancellations can receive a full deposit refund when made within the applicable grace period or at least two hours before the appointment.')}</p>
        </div>
        <div className="border-t border-primary/15 pt-6 lg:border-t-0 lg:border-s lg:ps-10 lg:pt-0">
          <strong className="block text-base font-bold text-foreground">{a('policyClinic', 'Clinic cancellations')}</strong>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">{a('policyClinicText', 'If the clinic cancels the appointment, the patient receives a full deposit refund.')}</p>
        </div>
      </div>
    </section>

    {/* Why Clinova */}
    <section className="border-y border-border/70 bg-card/40 py-12 sm:py-16 lg:py-24">
      <div className={container}>
        <SectionHeading eyebrow={a('whyEyebrow', 'Why choose Clinova')} title={a('whyTitle', 'Built for both sides of care')} description={a('whyDescription', 'One platform that supports patients and the clinics that care for them.')} />
        <div className="mt-8 grid gap-5 sm:mt-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-5 sm:p-10">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10"><UserRound className="size-5" /></span>
              <h3 className="text-xl font-bold">{a('whyPatients', 'For patients')}</h3>
            </div>
            <ul className="mt-6 grid gap-3.5 sm:grid-cols-2">{patientBenefits.map((item) => <CheckItem key={item}>{item}</CheckItem>)}</ul>
          </div>
          <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-5 sm:p-10">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10"><Building2 className="size-5" /></span>
              <h3 className="text-xl font-bold">{a('whyClinics', 'For doctors and clinic staff')}</h3>
            </div>
            <ul className="mt-6 grid gap-3.5">{clinicBenefits.map((item) => <CheckItem key={item}>{item}</CheckItem>)}</ul>
          </div>
        </div>
      </div>
    </section>

    {/* Vision */}
    <section className={`${container} py-12 sm:py-16 lg:py-24`}>
      <div className="mx-auto max-w-3xl text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10"><HeartPulse className="size-7" /></span>
        <div className="mt-5"><Eyebrow>{a('visionEyebrow', 'Our vision')}</Eyebrow></div>
        <p className="mt-3 font-sans text-2xl leading-snug font-bold sm:text-4xl">{a('visionTitle', 'A more connected and organized healthcare experience.')}</p>
        <p className="mt-4 text-[15px] leading-7 text-muted-foreground sm:mt-5 sm:text-base sm:leading-8">{a('visionText', 'We want patients to find the right doctors and manage their appointments more easily, while helping doctors and clinics move toward more efficient and organized daily operations.')}</p>
      </div>
    </section>
  </PatientShell>
}