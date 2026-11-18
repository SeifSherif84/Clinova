import { Link } from '@tanstack/react-router'
import { ArrowRight, CalendarDays, ChevronDown, CircleHelp, House } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import PatientShell from '@/components/patient-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function PatientFaqsPage() {
  const { t } = useTranslation()
  const faqs = [
    { q: t('patientPortal.faq.q1', { defaultValue: 'How do I book an appointment?' }), a: t('patientPortal.faq.a1', { defaultValue: 'Find a doctor, choose one of the available time slots, and confirm your booking.' }) },
    { q: t('patientPortal.faq.q2', { defaultValue: 'Where can I see my appointments?' }), a: t('patientPortal.faq.a2', { defaultValue: 'Open My Appointments from the top menu to see your upcoming and previous visits.' }) },
    { q: t('patientPortal.faq.q3', { defaultValue: 'How do I update my details or photo?' }), a: t('patientPortal.faq.a3', { defaultValue: 'Open the account menu at the top right and choose My profile.' }) },
    { q: t('patientPortal.faq.q4', { defaultValue: 'Will I be told about changes to my appointment?' }), a: t('patientPortal.faq.a4', { defaultValue: 'Yes. Updates appear under the bell icon and on the Notifications page.' }) },
  ]

  return <PatientShell>
    <div className="relative isolate overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 -end-40 -z-10 size-[30rem] rounded-full bg-primary/15 blur-3xl" />
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <nav aria-label="breadcrumb" className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"><House className="size-3.5" />{t('patientPortal.nav.home', { defaultValue: 'Home' })}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="text-foreground">{t('patientPortal.nav.faqs', { defaultValue: 'FAQs' })}</span>
        </nav>

        <div className="mt-6 max-w-2xl">
          <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-primary uppercase"><CircleHelp className="size-3" />{t('patientPortal.nav.faqs', { defaultValue: 'FAQs' })}</Badge>
          <h1 className="mt-3 font-sans text-3xl font-bold sm:text-5xl">{t('patientPortal.faqPage.title', { defaultValue: 'Frequently asked questions' })}</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">{t('patientPortal.faqPage.description', { defaultValue: 'Quick answers about finding doctors, booking, and managing your account.' })}</p>
        </div>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
          <Card className="relative isolate gap-0 overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/15 via-card to-primary/5 p-6 sm:p-8 lg:sticky lg:top-28">
            <span aria-hidden="true" className="pointer-events-none absolute -end-12 -top-12 -z-10 size-48 rounded-full bg-primary/10 blur-3xl" />
            <span className="grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10"><CircleHelp className="size-7" /></span>
            <h2 className="mt-6 font-sans text-2xl font-bold">{t('patientPortal.faqPage.stillTitle', { defaultValue: 'Still have questions?' })}</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{t('patientPortal.faqPage.stillDescription', { defaultValue: 'Browse doctors and clinics, or check your appointments for the latest on your visits.' })}</p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Button className="h-10 cursor-pointer rounded-xl bg-primary px-4 text-[13px] font-bold normal-case tracking-normal text-primary-foreground hover:bg-primary/90" render={<Link to="/patient/doctors" />}>{t('patientPortal.hero.cta', { defaultValue: 'Find a doctor' })}<ArrowRight className="size-4 rtl:rotate-180" /></Button>
              <Button variant="ghost" className="h-10 cursor-pointer rounded-xl bg-foreground/5 px-4 text-[13px] font-bold normal-case tracking-normal text-foreground hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-primary/30" render={<Link to="/patient/appointments" />}><CalendarDays className="size-4" />{t('patientPortal.nav.appointments', { defaultValue: 'My Appointments' })}</Button>
            </div>
          </Card>

          <div className="grid gap-3">
            {faqs.map((item, index) => <details key={item.q} open={index === 0} className="group rounded-2xl border border-border bg-card px-5 transition open:border-primary/25 open:shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-start text-sm font-bold marker:hidden focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 group-open:text-primary" />
              </summary>
              <p className="pb-5 text-sm leading-7 text-muted-foreground">{item.a}</p>
            </details>)}
          </div>
        </div>
      </div>
    </div>
  </PatientShell>
}