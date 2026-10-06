import { CircleHelp, Eye, EyeOff, LockKeyhole, PencilLine, X } from 'lucide-react'
import { useState, type FocusEventHandler } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '@/components/ui/popover'
import type { CredentialName } from './credentials'

export function CredentialHelp({ name }: { name: CredentialName }) {
  const { t } = useTranslation()
  const sensitive = name === 'secretKey' || name === 'hmacSecret' || name === 'apiKey'
  const label = t('paymob.fields.' + name + '.label')
  return <Popover>
    <PopoverTrigger render={<Button type="button" variant="ghost" size="icon" className="size-9 rounded-xl text-muted-foreground" />} aria-label={t('paymob.help', { field: label })}><CircleHelp className="size-4" /></PopoverTrigger>
    <PopoverContent className="max-h-[70svh] w-96 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl text-start motion-reduce:animate-none">
      <PopoverTitle className="text-sm font-bold normal-case">{label}</PopoverTitle>
      <dl className="grid gap-3">{(['what', 'why', 'where'] as const).map((part) => <div key={part}><dt className="text-xs font-bold">{t('paymob.' + part)}</dt><dd className="mt-1 text-xs leading-6 text-muted-foreground">{t('paymob.fields.' + name + '.' + part)}</dd></div>)}</dl>
      {sensitive && <p className="border-t pt-3 text-xs leading-6 text-muted-foreground">{t('paymob.secureEntry')}</p>}
    </PopoverContent>
  </Popover>
}

export function CredentialField({ name, disabled, error, onBlur, stored = false, replacing = true, currentIntegrationId, onReplace }: {
  name: CredentialName; disabled?: boolean; error?: string; onBlur?: FocusEventHandler<HTMLInputElement>
  stored?: boolean; replacing?: boolean; currentIntegrationId?: string; onReplace?: (replace: boolean) => void
}) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  const sensitive = name === 'secretKey' || name === 'hmacSecret' || name === 'apiKey'
  const label = t('paymob.fields.' + name + '.label')
  const id = 'paymob-' + name
  const savedView = onReplace !== undefined && !replacing
  // These are fixed presentation masks, never values or substrings from the backend.
  const masked = !stored ? t('paymob.metadataUnavailable') : name === 'publicKey' ? 'pk_••••••••••••' : name === 'cardIntegrationId' ? currentIntegrationId ?? t('paymob.metadataUnavailable') : '••••••••••••••••••'
  function changeReplacement(next: boolean) {
    setVisible(false)
    onReplace?.(next)
  }
  return <div id={id + '-section'} tabIndex={-1} className={'grid min-w-0 scroll-mt-28 content-start gap-2 rounded-xl outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring' + (name === 'cardIntegrationId' ? ' border-t border-border pt-5 sm:col-span-2' : '')}>
    <div className="flex items-center gap-1">
      <Label htmlFor={id} className="text-xs font-bold normal-case tracking-normal text-foreground/80">{label}</Label><CredentialHelp name={name} />
    </div>
    {sensitive ? <p id={id + '-sensitive'} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground"><LockKeyhole className="size-3 shrink-0" />{t('paymob.sensitive')}</p> : <span aria-hidden="true" className="hidden h-4 sm:block" />}
    {savedView ? <>
      <Input key="saved" id={id} readOnly value={masked} dir="ltr" aria-describedby={id + '-saved-hint'} className="h-12 rounded-xl border border-input bg-muted/30 px-3 text-sm" />
      <p id={id + '-saved-hint'} className="text-xs leading-6 text-muted-foreground">{t('paymob.replaceHint')}</p>
      <Button type="button" variant="outline" disabled={disabled} className="h-auto min-h-11 w-fit max-w-full whitespace-normal rounded-xl px-3 py-2 text-xs font-bold normal-case tracking-normal" onClick={() => changeReplacement(true)}><PencilLine />{t('paymob.replace', { field: label })}</Button>
    </> : <>
      <div className="relative">
        <Input key="entry" autoFocus={Boolean(onReplace)} id={id} name={name} required disabled={disabled} dir="ltr" type={sensitive && !visible ? 'password' : 'text'}
          autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false}
          inputMode={name === 'cardIntegrationId' ? 'numeric' : 'text'} pattern={name === 'cardIntegrationId' ? '[0-9]*[1-9][0-9]*' : undefined}
          aria-invalid={Boolean(error) || undefined} onBlur={onBlur}
          aria-describedby={id + '-description' + (sensitive ? ' ' + id + '-sensitive' : '') + (error ? ' ' + id + '-error' : '')}
          placeholder={t(onReplace ? 'paymob.newValue' : 'paymob.enter', { field: label })}
          className={'h-12 rounded-xl border border-input bg-background/40 px-3 text-sm focus-visible:border-primary/50 ' + (sensitive ? 'pr-12' : '')} />
        {sensitive && <Button type="button" variant="ghost" size="icon" disabled={disabled} aria-label={t(visible ? 'paymob.hide' : 'paymob.show', { field: label })} aria-pressed={visible} onClick={() => setVisible(!visible)} className="absolute right-1 top-1 size-10 rounded-lg text-muted-foreground">{visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</Button>}
      </div>
      {error && <p id={id + '-error'} className="text-xs leading-6 text-muted-foreground">{error}</p>}
      {onReplace && <Button type="button" variant="ghost" disabled={disabled} className="h-auto min-h-11 w-fit max-w-full whitespace-normal rounded-xl px-0 py-2 text-xs font-bold normal-case tracking-normal text-muted-foreground" onClick={() => changeReplacement(false)}><X />{t('paymob.keepExisting', { field: label })}</Button>}
    </>}
    <p id={id + '-description'} className="text-xs leading-6 text-muted-foreground">{t('paymob.ux.shortFields.' + name)}</p>
  </div>
}
