import { Link, useRouterState } from '@tanstack/react-router'
import { ArrowLeft, CalendarDays, LayoutGrid, Stethoscope } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Notice from '@/components/notice'
import PatientShell from '@/components/patient-shell'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// Temporary landing for patient sections whose backend wiring is not finished yet.
export default function PatientComingSoonPage() {
  const { t } = useTranslation()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const [flash] = useState(() => {
    const value = sessionStorage.getItem('flash')
    sessionStorage.removeItem('flash')
    return value
  })
  const sections: Record<string, { icon: ReactNode; title: string; text: string }> = {
    '/patient/doctors': { icon: <Stethoscope className="size-8" />, title: t('patientPortal.nav.doctors', { defaultValue: 'Find a Doctor' }), text: t('patientPortal.soon.doctors', { defaultValue: 'Soon you’ll be able to search doctors and clinics and book your visit right here.' }) },
    '/patient/specialties': { icon: <LayoutGrid className="size-8" />, title: t('patientPortal.nav.specialties', { defaultValue: 'Specialties' }), text: t('patientPortal.soon.specialties', { defaultValue: 'Soon you’ll be able to browse care by medical specialty right here.' }) },
    '/patient/appointments': { icon: <CalendarDays className="size-8" />, title: t('patientPortal.nav.appointments', { defaultValue: 'My Appointments' }), text: t('patientPortal.soon.appointments', { defaultValue: 'Soon your upcoming and previous appointments will appear right here.' }) },
  }
  const section = sections[pathname] ?? sections['/patient/doctors']

  return <PatientShell>
    <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      {flash && <Notice tone="success" message={flash} />}
      <Card className="items-center rounded-3xl border border-dashed border-primary/25 bg-gradient-to-br from-primary/5 via-card to-warm/5 px-6 py-16 text-center">
        <span className="grid size-20 place-items-center rounded-3xl bg-primary/10 text-primary shadow-inner">{section.icon}</span>
        <h1 className="mt-6 font-sans text-2xl font-bold sm:text-3xl">{section.title}</h1>
        <p className="mt-2 max-w-md text-xs leading-6 text-muted-foreground sm:text-sm">{section.text}</p>
        <Button variant="ghost" className="mt-6 h-10 cursor-pointer rounded-xl bg-foreground/5 px-4 text-[13px] font-bold normal-case tracking-normal hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-primary/30" render={<Link to="/dashboard" />}><ArrowLeft className="size-4 rtl:rotate-180" />{t('patientPortal.soon.back', { defaultValue: 'Back to home' })}</Button>
      </Card>
    </div>
  </PatientShell>
}