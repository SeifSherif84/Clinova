import { Link } from '@tanstack/react-router'
import { Building2, MailOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// Shown when the signed-in secretary has not joined a clinic yet.
export default function ClinicNotAssigned() {
  const { t } = useTranslation()
  return <Card className="items-center rounded-3xl border border-dashed border-primary/25 bg-gradient-to-br from-primary/5 via-card to-warm/5 px-6 py-14 text-center">
    <span className="relative grid place-items-center">
      <span className="absolute inset-0 animate-ping rounded-3xl bg-primary/10 motion-reduce:animate-none" />
      <span className="relative grid size-20 place-items-center rounded-3xl bg-primary/10 text-primary shadow-inner"><Building2 className="size-9" /></span>
    </span>
    <h2 className="mt-6 font-heading text-2xl font-bold sm:text-3xl">{t('secretary.myClinic.notAssignedTitle')}</h2>
    <p className="mt-2 max-w-md text-xs leading-6 text-muted-foreground sm:text-sm">{t('secretary.myClinic.notAssignedDescription')}</p>
    <Button className="mt-5 h-11 rounded-xl bg-primary px-5 text-sm font-bold normal-case tracking-normal text-primary-foreground hover:bg-primary/90" render={<Link to="/secretary/invitations" />}><MailOpen />{t('secretary.myClinic.viewInvitations')}</Button>
  </Card>
}
