import { FlaskConical, HeartPulse} from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function PaymobEnvironmentNote() {
  const { t } = useTranslation()
  return (
    <section className="relative mt-6 overflow-hidden rounded-3xl border border-warm/15 bg-card">
<div className="border-b border-border/60 bg-warm/5 p-5 sm:p-6">
  <h3 className="font-sans text-base font-bold">{t('paymob.environmentTitle')}</h3>
  <p className="mt-1 text-xs leading-6 text-muted-foreground sm:text-sm">{t('paymob.environmentDescription')}</p>
</div>

      <div className="relative grid sm:grid-cols-2">
        <span aria-hidden="true" className="absolute inset-x-6 top-0 h-px bg-border sm:inset-x-0 sm:inset-y-6 sm:start-1/2 sm:h-auto sm:w-px" />
        <span aria-hidden="true" className="absolute start-1/2 top-0 z-10 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card px-2.5 py-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase sm:flex">
          {t('paymob.environmentOr', { defaultValue: 'or' })}
        </span>

<div className="flex flex-col gap-2.5 p-5 sm:p-6">
  <div className="flex items-center gap-2.5">
    <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-warm/10 text-warm">
      <FlaskConical className="size-4" />
    </span>
    <p className="text-sm font-bold text-foreground">{t('paymob.testLabel')}</p>
  </div>
  <p className="text-xs leading-6 text-muted-foreground">{t('paymob.testDescription')} {t('paymob.testNote')}</p>
</div>

        <div className="flex flex-col gap-2.5 p-5 sm:p-6">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <HeartPulse className="size-4" />
            </span>
            <p className="text-sm font-bold text-foreground">{t('paymob.liveLabel')}</p>
          </div>
          <p className="text-xs leading-6 text-muted-foreground">{t('paymob.liveDescription')}</p>
        </div>
      </div>
    </section>
  )
}