import { Link } from '@tanstack/react-router'
import { Building2, MailOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

// Shown when the signed-in secretary has not joined a clinic yet.
export default function ClinicNotAssigned() {
  const { t } = useTranslation()
  return <section className="relative isolate grid place-items-center overflow-hidden px-4 py-20 text-center sm:py-28">
    <div className="relative">
      <span className="absolute inset-0 rounded-full bg-primary/15 motion-safe:animate-pulse" />
      <span className="relative grid size-20 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 ring-8 ring-primary/10">
        <Building2 className="size-8 motion-safe:animate-bounce [animation-duration:2.4s]" />
      </span>
      <span className="absolute -end-6 -top-3 size-3 rounded-full bg-primary/40 motion-safe:animate-pulse" />
      <span className="absolute -start-8 top-8 size-2 rounded-full bg-primary/30 motion-safe:animate-pulse [animation-delay:200ms]" />
      <span className="absolute -end-10 bottom-4 size-2.5 rounded-full bg-primary/25 motion-safe:animate-pulse [animation-delay:400ms]" />
    </div>

    <h2 className="mt-10 font-sans text-2xl font-bold sm:text-4xl">{t('secretary.myClinic.notAssignedTitle')}</h2>
    <p className="mt-5 max-w-md text-sm leading-7 font-medium text-muted-foreground sm:text-base">{t('secretary.myClinic.notAssignedDescription')}</p>
    <Button className="mt-6 h-10 cursor-pointer rounded-xl bg-primary px-4 text-[13px] font-bold normal-case tracking-normal text-primary-foreground hover:bg-primary/90" render={<Link to="/secretary/invitations" />}><MailOpen className="size-4" />{t('secretary.myClinic.viewInvitations')}</Button>
  </section>
}