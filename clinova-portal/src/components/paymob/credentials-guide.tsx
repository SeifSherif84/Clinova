import { BookOpen, CreditCard, ExternalLink, KeyRound, LockKeyhole, X } from 'lucide-react'
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
      <p className="text-sm font-bold">{t('paymob.requiredCredentials')}</p>
      <ul className="mt-3 flex flex-wrap gap-2">{['Public Key', 'Secret Key', 'HMAC Secret', 'ApiKey', 'Card Integration ID'].map((name) => <li key={name} className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-bold">{name}</li>)}</ul>
      <SetupSection id={id + "-api-keys"} icon={KeyRound} title={t('paymob.apiSection')} description={t('paymob.credentialsDescription')}>
        <p dir="ltr" className="text-xs font-bold leading-6 text-primary sm:text-sm">{t('paymob.apiPath')}</p>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">{t('paymob.currentPath')}</p>
        <p className="mt-3 text-xs leading-6 text-muted-foreground">{t('paymob.separateKeys')}</p>
        <dl className="my-5 grid gap-5 sm:grid-cols-2">
          {(['publicKey', 'secretKey', 'hmacSecret', 'apiKey'] as const).map((name) => <div key={name} className="border-s-2 border-primary/15 ps-4">
            <dt className="text-sm font-bold">{t('paymob.fields.' + name + '.label')}</dt>
            {name !== 'publicKey' && <p className="mt-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground"><LockKeyhole className="size-3 shrink-0" />{t('paymob.sensitive')}</p>}
            <dd className="mt-2 text-xs leading-6 text-muted-foreground sm:text-sm">{t('paymob.fields.' + name + '.what')}</dd>
          </div>)}
        </dl>
        <SetupScreenshot section={t('paymob.apiKeys')} />
      </SetupSection>
      <SetupSection id={id + "-card-integration"} icon={CreditCard} title={t('paymob.integrationSection')} description={t('paymob.fields.cardIntegrationId.what')}>
        <ol className="mb-5 grid gap-3">{(t('paymob.integrationSteps', { returnObjects: true }) as string[]).map((step, i) => <li key={step} className="flex items-start gap-3 text-sm leading-6 text-muted-foreground"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span><span>{step}</span></li>)}</ol>
        <SetupScreenshot section={t('paymob.paymentIntegrations')} />
      </SetupSection>
      <PaymobEnvironmentNote />
      <p className="mt-5 flex items-start gap-2 text-xs leading-6 text-muted-foreground"><LockKeyhole className="mt-1 size-4 shrink-0 text-primary" />{t('paymob.secureEntry')}</p>
      <Button role="link" variant="link" className={paymobButtonClass + ' my-3 h-auto min-h-11 whitespace-normal px-0 text-start'} render={<a href="https://developers.paymob.com/paymob-docs/getting-started/new-dashboard" target="_blank" rel="noopener noreferrer" />}><ExternalLink />{t('paymob.officialGuide')}</Button>
  </div>
}

export function PaymobCredentialsGuideDialog({ label }: { label?: string }) {
  const { t } = useTranslation()
  return <Dialog>
    <DialogTrigger render={<Button type="button" variant="outline" className={paymobButtonClass + ' h-auto min-h-11 whitespace-normal'} />}><BookOpen />{label ?? t('paymob.openGuide')}</DialogTrigger>
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
