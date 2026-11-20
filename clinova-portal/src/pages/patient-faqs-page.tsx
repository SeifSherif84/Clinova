import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { ArrowRight, ChevronDown, CircleHelp, House, MessageSquareText } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import PatientShell from '@/components/patient-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { faqTopics, useFaqs, useTopics } from '@/lib/patient-faq'

export default function PatientFaqsPage() {
  const { t } = useTranslation()
  const search = useSearch({ from: '/patient/faqs' })
  const navigate = useNavigate({ from: '/patient/faqs' })
  const faqs = useFaqs()
  const topics = useTopics()
  const topic = faqTopics.find((item) => item === search.topic) ?? faqTopics[0]
  const visible = faqs.filter((item) => item.topic === topic)
  const openId = search.q

  useEffect(() => {
    if (openId) document.getElementById('faq-' + openId)?.scrollIntoView({ block: 'center' })
  }, [openId, topic])

  const chip = (selected: boolean) => `inline-flex h-9 shrink-0 cursor-pointer items-center rounded-full border px-4 text-[13px] font-bold whitespace-nowrap transition focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'}`

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

        <div role="group" aria-label={t('patientPortal.help.topicsTitle', { defaultValue: 'Browse Help Topics' })} className="-mx-1 mt-8 flex gap-2 overflow-x-auto px-1 pb-1">
          {topics.map((item) => <button key={item.id} type="button" aria-pressed={topic === item.id} className={chip(topic === item.id)} onClick={() => navigate({ search: { topic: item.id }, replace: true, resetScroll: false })}>{item.title}</button>)}
        </div>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
          <Card className="relative isolate gap-0 overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/15 via-card to-primary/5 p-6 sm:p-8 lg:sticky lg:top-28 dark:bg-card dark:bg-none">
            <span aria-hidden="true" className="pointer-events-none absolute -end-12 -top-12 -z-10 size-48 rounded-full bg-primary/10 blur-3xl dark:hidden" />
            <div className="flex items-center gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10"><CircleHelp className="size-7" /></span>
              <h2 className="min-w-0 font-sans text-2xl font-bold">{t('patientPortal.faqPage.stillTitle', { defaultValue: 'Still have questions?' })}</h2>
            </div>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{t('patientPortal.faqPage.stillDescription', { defaultValue: 'Browse doctors and clinics, or check your appointments for the latest on your visits.' })}</p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Button className="h-10 cursor-pointer rounded-xl bg-primary px-4 text-[13px] font-bold normal-case tracking-normal text-primary-foreground hover:bg-primary/90" render={<Link to="/patient/help" />}><MessageSquareText className="size-4" />{t('patientPortal.help.contactCta', { defaultValue: 'Contact support' })}</Button>
              <Button variant="ghost" className="h-10 cursor-pointer rounded-xl bg-foreground/5 px-4 text-[13px] font-bold normal-case tracking-normal text-foreground hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-primary/30" render={<Link to="/patient/doctors" />}>{t('patientPortal.hero.cta', { defaultValue: 'Find a doctor' })}<ArrowRight className="size-4 rtl:rotate-180" /></Button>
            </div>
          </Card>

          <div className="grid gap-3">
            {visible.map((item, index) => <details key={`${item.id}-${openId ?? ''}-${topic ?? ''}`} id={'faq-' + item.id} open={openId ? item.id === openId : index === 0} className="group scroll-mt-28 rounded-2xl border border-border bg-card px-5 transition duration-200 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 open:border-primary/25 open:shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-start text-base font-bold marker:hidden focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 group-open:text-primary motion-reduce:transition-none" />
              </summary>
              <p className="pb-5 text-[15px] leading-7 font-medium text-foreground/80">{item.a}</p>
            </details>)}
          </div>
        </div>
      </div>
    </div>
  </PatientShell>
}