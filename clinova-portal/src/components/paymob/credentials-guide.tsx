import { BookOpen, ChevronRight, CreditCard, ExternalLink, KeyRound, Link2, LockKeyhole, X } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { PaymobEnvironmentNote } from './environment-note'
import { SetupScreenshot } from './setup-screenshot'
import { SetupSection, paymobButtonClass } from './setup-section'

export function PaymobCredentialsGuide() {
  const { t } = useTranslation()
  const id = useId()
  return <div className="min-w-0">
      <p className="max-w-full font-sans text-2xl font-bold leading-snug text-nowrap sm:text-3xl">{t('paymob.requiredCredentials')}</p>
      <div className="relative mt-8 overflow-x-auto overflow-y-visible pb-2">
        <div className="flex min-w-max items-start">
          {([
            { name: 'Public Key', key: 'publicKey' },
            { name: 'Secret Key', key: 'secretKey' },
            { name: 'HMAC Secret', key: 'hmacSecret' },
            { name: 'ApiKey', key: 'apiKey' },
            { name: 'Card Integration ID', key: 'cardIntegrationId' },
          ] as const).map((credential, i, arr) => (
            <div key={credential.name} className="flex items-start">
              <div className="group relative flex w-24 flex-col items-center gap-2.5">
                <span className="relative z-10 grid size-9 shrink-0 cursor-default place-items-center rounded-full border-2 border-primary/25 bg-card text-xs font-bold text-primary transition-colors duration-200 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                  {i + 1}
                </span>
                <span className="text-center text-xs font-bold leading-5 text-foreground/80">{credential.name}</span>
                <div role="tooltip" className="pointer-events-none absolute -top-2 left-1/2 z-20 w-52 -translate-x-1/2 -translate-y-full rounded-xl border border-border bg-popover p-3 text-start text-xs leading-5 font-normal text-popover-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  {t('paymob.fields.' + credential.key + '.what')}
                </div>
              </div>
              {i < arr.length - 1 && <span aria-hidden="true" className="mx-1 mt-4.5 h-px w-10 shrink-0 bg-primary/25 sm:w-16" />}
            </div>
          ))}
          <span aria-hidden="true" className="mx-1 mt-4.5 h-px w-10 shrink-0 bg-gradient-to-r from-primary/25 to-primary sm:w-16" />
          <div className="flex w-24 shrink-0 flex-col items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
              <Link2 className="size-4" />
            </span>
            <span className="text-center text-xs font-bold leading-5 text-primary">Paymob</span>
          </div>
        </div>
      </div>
      <SetupSection id={id + "-api-keys"} icon={KeyRound} title={t('paymob.apiSection')} description={t('paymob.credentialsDescription')}>
        <div dir="ltr" className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
          {t('paymob.apiPath').split(' → ').map((part, i, arr) => (
            <span key={part} className="flex items-center gap-1.5">
              <span className={`text-xs font-bold sm:text-sm ${i === arr.length - 1 ? 'text-primary' : 'text-foreground/70'}`}>{part}</span>
              {i < arr.length - 1 && <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50" />}
            </span>
          ))}
        </div>
        <dl className="my-6 grid grid-cols-1 sm:grid-cols-2">
          {(['publicKey', 'secretKey', 'hmacSecret', 'apiKey'] as const).map((name, i) => {
            const isLeftCol = i % 2 === 0
            const isTopRow = i < 2
const cellClasses = [
  'flex items-baseline gap-4 border-border px-0 py-6',
  i < 3 ? 'border-b' : '',
  !isTopRow ? 'sm:border-b-0' : '',
  isLeftCol ? 'sm:border-e sm:pe-7' : 'sm:ps-7',
].filter(Boolean).join(' ')
            return (
<div key={name} className={cellClasses}>
  <div className="min-w-0 max-w-sm">
    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1.5">
      <span aria-hidden="true" className="font-serif text-base font-bold text-foreground italic [font-variant-numeric:lining-nums]">{i + 1}</span>
      <dt className="text-base font-bold tracking-tight">{t('paymob.fields.' + name + '.label')}</dt>
      {name !== 'publicKey' && (
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
          <LockKeyhole className="size-3.5 shrink-0" />
          {t('paymob.sensitive')}
        </span>
      )}
    </div>
    <dd className="mt-2.5 ps-[1.6rem] text-xs leading-6 text-muted-foreground sm:text-sm">{t('paymob.fields.' + name + '.what')}</dd>
  </div>
</div>
            )
          })}
        </dl>
        <SetupScreenshot section={t('paymob.apiKeys')} src="/paymob-screenshot/paymobApiKeys.png" />
      </SetupSection>
      <SetupSection id={id + "-card-integration"} icon={CreditCard} title={t('paymob.integrationSection')} description={t('paymob.fields.cardIntegrationId.what')}>
        <ol className="mb-5 grid gap-4">{(t('paymob.integrationSteps', { returnObjects: true }) as string[]).map((step, i) => <li key={step} className="flex items-center gap-3.5 text-sm leading-7 font-medium text-foreground/75"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-foreground">{i + 1}</span><span>{step}</span></li>)}</ol>
        <SetupScreenshot section={t('paymob.paymentIntegrations')} src="/paymob-screenshot/paymobPaymentIntegrations.png" />
      </SetupSection>
      <PaymobEnvironmentNote />
      <p className="mt-5 flex items-start gap-2.5 text-xs leading-6 font-semibold text-foreground/70">
  <LockKeyhole className="mt-0.5 size-4 shrink-0 text-primary" />
  {t('paymob.secureEntry')}
</p>
      <Button role="link" variant="link" className={paymobButtonClass + ' my-3 h-auto min-h-11 whitespace-normal px-0 text-start'} render={<a href="https://developers.paymob.com/paymob-docs/getting-started/new-dashboard" target="_blank" rel="noopener noreferrer" />}><ExternalLink />{t('paymob.officialGuide')}</Button>
  </div>
}

export function PaymobCredentialsGuideDialog({ label }: { label?: string }) {
  const { t } = useTranslation()
  return <Dialog>
    <DialogTrigger render={<Button type="button" className={paymobButtonClass + ' h-auto min-h-11 whitespace-normal bg-primary text-primary-foreground hover:bg-primary/90'} />}><BookOpen />{label ?? t('paymob.openGuide')}</DialogTrigger>
    <DialogContent showCloseButton={false} className="flex max-h-[90svh] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-3xl motion-reduce:animate-none">
      <DialogHeader className="shrink-0 border-b p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <DialogTitle className="font-sans text-xl font-bold normal-case tracking-normal">{t('paymob.guideTitle')}</DialogTitle>
          <DialogClose render={<Button type="button" variant="ghost" size="icon" className="size-11 shrink-0 rounded-xl" />} aria-label={t('paymob.close')}><X /></DialogClose>
        </div>
        <DialogDescription>{t('paymob.ux.guideStays')}</DialogDescription>
      </DialogHeader>
      <div className="min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6"><PaymobCredentialsGuide /></div>
      <div className="shrink-0 border-t p-4 sm:px-6">
        <DialogClose render={<Button type="button" className={paymobButtonClass + ' w-full sm:w-auto'} />}><X />{t('paymob.ux.returnToForm')}</DialogClose>
      </div>
    </DialogContent>
  </Dialog>
}
