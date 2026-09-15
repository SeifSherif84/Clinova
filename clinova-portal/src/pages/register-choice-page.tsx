import { Link } from '@tanstack/react-router'
import { ArrowRight, Check, HeartPulse, Stethoscope } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import AuthShell from '@/components/auth-shell'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export default function RegisterChoicePage() {
  const { t } = useTranslation()
  const arrow = <ArrowRight className="size-4 transition group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />

  return (
    <AuthShell eyebrow={t('registerChoice.eyebrow')} title={t('registerChoice.title')} description={t('registerChoice.description')} wide>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/register/patient" className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <Card className="h-full gap-0 rounded-2xl border border-border bg-gradient-to-br from-primary/8 to-background/20 py-0 transition group-hover:-translate-y-1 group-hover:border-primary/35 group-hover:from-primary/12">
            <CardContent className="flex min-h-80 flex-col p-5 sm:p-6">
<span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><HeartPulse className="size-6" /></span>
<Badge className="mt-6 font-bold text-primary">{t('registerChoice.patientBadge')}</Badge>
<strong className="mt-2 font-heading text-2xl font-bold">{t('registerChoice.patientTitle')}</strong>
<span className="mt-2 text-xs leading-5 text-muted-foreground">{t('registerChoice.patientDescription')}</span>
<span className="mt-5 grid gap-2 text-xs text-foreground/70"><i className="flex items-center gap-2 not-italic"><Check className="size-3.5 text-primary" />{t('registerChoice.simpleOnboarding')}</i><i className="flex items-center gap-2 not-italic"><Check className="size-3.5 text-primary" />{t('registerChoice.secureAccess')}</i></span>
<span className="mt-auto flex items-center justify-between pt-5 text-xs font-bold">{t('registerChoice.createPatient')} {arrow}</span>
            </CardContent>
          </Card>
        </Link>
        <Link to="/register/doctor" className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm">
          <Card className="h-full gap-0 rounded-2xl border border-border bg-gradient-to-br from-warm/8 to-background/20 py-0 transition group-hover:-translate-y-1 group-hover:border-warm/35 group-hover:from-warm/12">
            <CardContent className="flex min-h-80 flex-col p-5 sm:p-6">
<span className="grid size-14 place-items-center rounded-2xl bg-warm/10 text-warm"><Stethoscope className="size-6" /></span>
<Badge className="mt-6 font-bold text-warm">{t('registerChoice.doctorBadge')}</Badge>
<strong className="mt-2 font-heading text-2xl font-bold">{t('registerChoice.doctorTitle')}</strong>
<span className="mt-2 text-xs leading-5 text-muted-foreground">{t('registerChoice.doctorDescription')}</span>
<span className="mt-5 grid gap-2 text-xs text-foreground/70"><i className="flex items-center gap-2 not-italic"><Check className="size-3.5 text-warm" />{t('registerChoice.verifiedProfile')}</i><i className="flex items-center gap-2 not-italic"><Check className="size-3.5 text-warm" />{t('registerChoice.clinicCollaboration')}</i></span>
<span className="mt-auto flex items-center justify-between pt-5 text-xs font-bold">{t('registerChoice.applyDoctor')} {arrow}</span>
            </CardContent>
          </Card>
        </Link>
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">{t('registerChoice.alreadyAccount')} <Link to="/login" search={{ redirect: undefined }} className="font-semibold text-primary hover:text-primary/75">{t('common.signIn')}</Link></p>
    </AuthShell>
  )
}
