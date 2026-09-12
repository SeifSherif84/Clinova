import { ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Brand from '@/components/brand'
import MedicalIllustration from '@/components/medical-illustration'
import PreferencesControls from '@/components/preferences-controls'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AuthShellProps {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  wide?: boolean
}

export default function AuthShell({ eyebrow, title, description, children, wide = false }: AuthShellProps) {
  const { t } = useTranslation()

  return (
    <main className="relative min-h-svh overflow-x-hidden bg-background text-foreground selection:bg-primary/25">
      <div className="pointer-events-none absolute -top-40 -end-40 size-[28rem] rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -start-40 size-[30rem] rounded-full bg-warm/10 blur-3xl" />
      <header className="relative z-20 mx-auto flex min-h-20 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:min-h-24 sm:px-6 lg:px-8">
        <Brand />
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="hidden items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-2 text-[10px] tracking-wider text-primary lg:inline-flex">
            <ShieldCheck className="size-3.5" /> {t('common.protectedAccess')}
          </Badge>
          <PreferencesControls />
        </div>
      </header>

      <section className={`relative z-10 mx-auto grid w-full max-w-7xl items-start gap-8 px-4 pb-10 sm:px-6 sm:pb-16 lg:grid-cols-[minmax(0,.85fr)_minmax(30rem,1.15fr)] lg:gap-12 lg:px-8 xl:gap-20 ${wide ? 'xl:grid-cols-[minmax(0,.72fr)_minmax(38rem,1.28fr)]' : ''}`}>
        <aside className="hidden pt-12 lg:sticky lg:top-0 lg:flex lg:flex-col">
          <Badge variant="secondary" className="text-primary">{t('shell.badge')}</Badge>
          <h2 className="mt-5 max-w-xl font-heading text-5xl leading-[1.02] font-medium tracking-[-.04em] text-foreground xl:text-6xl">{t('shell.title')}</h2>
          <p className="mt-5 max-w-lg text-sm leading-7 text-muted-foreground">{t('shell.description')}</p>
          <div className="mx-auto -my-8 w-full max-w-md xl:max-w-lg"><MedicalIllustration /></div>
          <div className="flex items-center gap-3">
            <span className="flex ps-2" aria-hidden="true">
              <i className="-ms-2 size-8 rounded-full border-2 border-background bg-gradient-to-br from-primary to-primary/40" />
              <i className="-ms-2 size-8 rounded-full border-2 border-background bg-gradient-to-br from-warm to-warm/45" />
              <i className="-ms-2 size-8 rounded-full border-2 border-background bg-gradient-to-br from-muted-foreground/40 to-muted-foreground" />
            </span>
            <span className="grid"><strong className="text-xs">{t('shell.privateTitle')}</strong><small className="text-[10px] text-muted-foreground">{t('shell.privateDescription')}</small></span>
          </div>
        </aside>

        <Card className="gap-0 overflow-hidden rounded-3xl border border-border bg-card/95 py-0 shadow-2xl shadow-foreground/10 ring-1 ring-foreground/5 backdrop-blur-xl">
          <CardHeader className="gap-3 px-5 pt-7 pb-5 sm:px-8 sm:pt-9 lg:px-10 lg:pt-10">
            <Badge variant="secondary" className="text-primary">{eyebrow}</Badge>
            <CardTitle className="font-heading text-3xl leading-tight font-medium tracking-[-.035em] text-foreground normal-case sm:text-4xl lg:text-5xl">{title}</CardTitle>
            <CardDescription className="max-w-xl text-sm leading-6 text-muted-foreground">{description}</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-7 sm:px-8 sm:pb-9 lg:px-10 lg:pb-10">{children}</CardContent>
        </Card>
      </section>
    </main>
  )
}
