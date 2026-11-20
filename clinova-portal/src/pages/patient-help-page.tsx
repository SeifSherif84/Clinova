import { Link } from '@tanstack/react-router'
import { ArrowRight, ChevronDown, House, LifeBuoy, MessageSquareText, Search, SearchX, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PatientShell from '@/components/patient-shell'
import SupportContactForm from '@/components/support/support-contact-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { popularIds, useFaqs, useTopics } from '@/lib/patient-faq'

const supportEmail = 'clinova.team@gmail.com'

function scrollToContact() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById('contact')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}

export default function PatientHelpPage() {
  const { t } = useTranslation()
  const tr = (key: string, defaultValue: string, options?: Record<string, string | number>) => t('patientPortal.help.' + key, { defaultValue, ...options })
  const faqs = useFaqs()
  const topics = useTopics()
  const [query, setQuery] = useState('')
  const term = query.trim().toLowerCase()
  const topicTitle = (id: string) => topics.find((item) => item.id === id)?.title ?? ''
  const results = useMemo(() => term ? faqs.filter((item) => `${item.q} ${item.a} ${topicTitle(item.topic)}`.toLowerCase().includes(term)) : [], [faqs, term, topics])
  const popular = popularIds.map((id) => faqs.find((item) => item.id === id)).filter((item) => item !== undefined)

  return <PatientShell>
    <div className="relative isolate overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 -end-40 -z-10 size-[30rem] rounded-full bg-primary/15 blur-3xl dark:hidden" />
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <nav aria-label="breadcrumb" className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"><House className="size-3.5" />{t('patientPortal.nav.home', { defaultValue: 'Home' })}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="text-foreground">{t('patientPortal.nav.help', { defaultValue: 'Help Center' })}</span>
        </nav>

        {/* Hero */}
        <section className="mx-auto mt-10 max-w-3xl text-center">
          <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-primary uppercase"><LifeBuoy className="size-3" />{tr('eyebrow', 'Help Center')}</Badge>
          <h1 className="mt-4 font-sans text-4xl font-bold sm:text-6xl">{tr('title', 'We’re Here to Help')}</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">{tr('subtitle', 'Whether you need help with an appointment, payment, or your Clinova account, we’re here to make things easier.')}</p>
          <div className="group relative mt-8 text-start">
            <Search className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} aria-label={tr('searchLabel', 'Search help')} placeholder={tr('searchPlaceholder', 'Search for questions, e.g. refund or deposit')} className="h-14 w-full rounded-2xl border border-input bg-card ps-12 pe-12 text-base font-medium shadow-sm outline-none transition placeholder:text-sm placeholder:font-medium focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/10 [&::-webkit-search-cancel-button]:hidden" />
            {query && <button type="button" aria-label={tr('clearSearch', 'Clear search')} onClick={() => setQuery('')} className="absolute end-3 top-1/2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"><X className="size-4" /></button>}
          </div>
        </section>

        {term && <section aria-live="polite" className="mx-auto mt-6 max-w-3xl">
          {results.length === 0
            ? <div className="grid place-items-center rounded-3xl border border-dashed border-primary/25 bg-card/50 px-4 py-10 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary"><SearchX className="size-6" /></span>
              <h2 className="mt-4 font-sans text-lg font-bold">{tr('noResults', 'No matching questions')}</h2>
              <p className="mt-1 max-w-sm text-sm leading-7 text-muted-foreground">{tr('noResultsDesc', 'Try different words, or send our support team a message.')}</p>
              <Button type="button" className="mt-4 h-10 cursor-pointer rounded-xl px-4 text-[13px] font-bold normal-case tracking-normal" onClick={scrollToContact}>{tr('contactCta', 'Contact support')}</Button>
            </div>
            : <>
              <p className="mb-2 text-xs font-bold text-muted-foreground">{tr('resultsCount', '{{count}} results', { count: results.length })}</p>
              <ul className="divide-y divide-border/60 rounded-2xl border border-border bg-card">
                {results.map((item) => <li key={item.id}>
                  <Link to="/patient/faqs" search={{ topic: item.topic, q: item.id }} className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-primary/[0.05] focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none">
                    <span className="min-w-0 flex-1">
                      <strong className="block text-sm font-bold">{item.q}</strong>
                      <small className="text-xs font-semibold text-primary">{topicTitle(item.topic)}</small>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground transition group-hover:text-primary rtl:rotate-180" />
                  </Link>
                </li>)}
              </ul>
            </>}
        </section>}

        {/* Topics */}
        <section className="mt-16" aria-labelledby="help-topics">
          <h2 id="help-topics" className="font-sans text-2xl font-bold sm:text-3xl">{tr('topicsTitle', 'Browse Help Topics')}</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">{tr('topicsDesc', 'Pick a topic to jump straight to the questions that matter.')}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((topic) => <Link key={topic.id} to="/patient/faqs" search={{ topic: topic.id }} className="group relative flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/50 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/[0.04] hover:shadow-lg hover:shadow-primary/5 dark:hover:border-border/60 dark:hover:bg-card/50 dark:hover:shadow-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0">
              <span className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10"><topic.icon className="size-4.5" /></span>
                <strong className="min-w-0 flex-1 text-base font-bold">{topic.title}</strong>
              </span>
              <span className="block text-sm leading-6 font-medium text-muted-foreground">{topic.description}</span>
              <span className="mt-auto flex items-center gap-1.5 border-t border-border/50 pt-2.5 text-[13px] font-bold text-primary">
                {tr('browseTopic', 'Browse questions')}
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1 motion-reduce:transition-none" />
              </span>
            </Link>)}
          </div>
        </section>

        {/* Popular questions */}
        <section className="mx-auto mt-16 max-w-3xl" aria-labelledby="popular-questions">
          <h2 id="popular-questions" className="text-center font-sans text-2xl font-bold sm:text-3xl">{tr('popularTitle', 'Popular Questions')}</h2>
          <div className="mt-8 grid gap-3">
            {popular.map((item) => <details key={item.id} className="group rounded-2xl border border-border bg-card px-5 transition duration-200 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 open:border-primary/25 open:shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-start text-base font-bold marker:hidden focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 group-open:text-primary motion-reduce:transition-none" />
              </summary>
              <p className="pb-5 text-[15px] leading-7 font-medium text-foreground/80">{item.a}</p>
            </details>)}
          </div>
          <div className="mt-6 text-center">
            <Link to="/patient/faqs" className="inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:text-primary/80">{tr('viewAll', 'View All FAQs')}<ArrowRight className="size-4 rtl:rotate-180" /></Link>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="mt-20 scroll-mt-28" aria-labelledby="contact-title">
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
            <div>
              <div className="flex items-center gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10"><MessageSquareText className="size-6" /></span>
                <h2 id="contact-title" className="min-w-0 font-sans text-2xl font-bold sm:text-3xl">{tr('contactTitle', 'Contact Our Support Team')}</h2>
              </div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">{tr('contactDesc', 'Send us your question and our team will reply right here in Clinova. You can follow every conversation under My Support Requests.')}</p>
              <a href={`mailto:${supportEmail}`} className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 transition duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                <span className="grid gap-0.5 text-start">
                  <small className="text-[13px] font-bold text-muted-foreground">{tr('emailLabel', 'You can also email us')}</small>
                  <strong dir="ltr" className="text-base font-bold">{supportEmail}</strong>
                </span>
              </a>
            </div>
            <div className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
              <SupportContactForm />
            </div>
          </div>
        </section>
      </div>
    </div>
  </PatientShell>
}