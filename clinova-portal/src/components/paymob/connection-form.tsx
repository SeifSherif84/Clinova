import { ArrowRight, CircleCheck, Info, Link2, LoaderCircle, LockKeyhole, ShieldCheck, X } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import Notice from '@/components/notice'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { PaymobCredentialsGuideDialog } from './credentials-guide'
import type { SavedPaymobConfiguration } from '@/lib/paymob-configuration'
import { CredentialField } from './credential-field'
import { accountCredentialNames as credentialNames, type PaymobCredentials } from './credentials'
import { paymobButtonClass } from './setup-section'

type CredentialName = keyof PaymobCredentials

type SaveStatus = 'idle' | 'saving' | 'saved'
type Props = { unavailableNoticeId?: string } & (
  | { mode?: 'connect'; existing?: never; onConnect?: (credentials: PaymobCredentials) => Promise<void>; onUpdate?: never }
  | { mode: 'update'; existing: SavedPaymobConfiguration; onConnect?: never; onUpdate?: (changes: Partial<PaymobCredentials>) => Promise<void> }

)

// Save callbacks must resolve only after storage succeeds. Their response is never rendered.
// Routed pages supply authenticated account create/update callbacks.
export function PaymobConnectionForm(props: Props) {
  const { t } = useTranslation()
  const update = props.mode === 'update'
  const available = update ? Boolean(props.onUpdate) : Boolean(props.onConnect)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [authorized, setAuthorized] = useState(false)
  const [understood, setUnderstood] = useState(false)
  const [filledCount, setFilledCount] = useState(0)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<CredentialName, string>>>({})
  const [replacing, setReplacing] = useState<Partial<Record<CredentialName, boolean>>>({})
  const [fieldVersion, setFieldVersion] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)
  const lock = useRef(false)
  const busy = status === 'saving'
  const selectedCount = update ? credentialNames.filter((name) => replacing[name]).length : credentialNames.length
  const complete = selectedCount > 0 && filledCount === selectedCount
  const confirmationsComplete = authorized && (update || understood)
  const nextStep = busy ? 'saving' : Object.values(fieldErrors).some(Boolean) ? 'validationTitle' : !available ? 'ux.previewOnly' : update && !selectedCount ? 'noChanges' : !complete ? 'ux.completeFields' : !confirmationsComplete ? update ? 'ux.confirmUpdate' : 'ux.confirmConnect' : update ? 'ux.readyUpdate' : 'ux.readyConnect'

  function selectedNames(selection = replacing) {
    return credentialNames.filter((name) => !update || selection[name])
  }
  function valueFor(name: CredentialName) {
    return formRef.current?.querySelector<HTMLInputElement>('[name="' + name + '"]')?.value.trim() ?? ''
  }
  function validateField(name: CredentialName) {
    const value = valueFor(name)
    if (!value) return t('paymob.fieldRequired', { field: t('paymob.fields.' + name + '.label') })

    return ''
  }
  function replaceField(name: CredentialName, replace: boolean) {
    const next = { ...replacing, [name]: replace }
    setReplacing(next)
    setFieldErrors((errors) => ({ ...errors, [name]: undefined }))
    setError('')
    const selected = selectedNames(next)
    setFilledCount(selected.filter((key) => Boolean(valueFor(key))).length)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!available || lock.current || status === 'saved') return
    const form = event.currentTarget
    const selected = selectedNames()
    if (!selected.length) { setError('noChanges'); return }
    const errors: Partial<Record<CredentialName, string>> = {}
    for (const name of selected) {
      const message = validateField(name)
      if (message) errors[name] = message
    }
    setFieldErrors(errors)
    if (Object.keys(errors).length) {
      setError('validationTitle')
      form.querySelector<HTMLInputElement>('[name="' + Object.keys(errors)[0] + '"]')?.focus()
      return
    }
    if (!authorized || (!update && !understood)) { setError('consentRequired'); return }
    const credentials: Partial<PaymobCredentials> = Object.fromEntries(selected.map((name) => [name, valueFor(name)]))
    lock.current = true
    setError('')
    setFieldErrors({})
    setStatus('saving')
    // Clear all DOM-held entries and visibility flags before awaiting the save.
    // Only the local request object lives until completion; mutation caches are not used.
    form.reset()
    setFieldVersion((version) => version + 1)
    setReplacing({})
    setFilledCount(0)
    try {
      if (props.mode === 'update') await props.onUpdate!(credentials)
      else await props.onConnect!(credentials as PaymobCredentials)
      setStatus('saved')
    } catch {
      // Provider exceptions may contain sensitive data. Never render/log/cache them.
      setStatus('idle')
      setError('saveError')
    } finally {
      credentialNames.forEach((name) => { delete credentials[name] })
      setAuthorized(false)
      setUnderstood(false)
      lock.current = false
    }
  }

  return <div>
    {!available && !props.unavailableNoticeId && <Alert role="note" className="mb-5 rounded-xl border-primary/15 bg-primary/5"><Info /><AlertDescription id="paymob-unavailable">{t(update ? 'paymob.updateUnavailable' : 'paymob.unavailable')}</AlertDescription></Alert>}
    <div aria-live="polite">
      {error && <><Notice message={t('paymob.' + error)} /><p className="mb-5 text-sm text-muted-foreground">{t('paymob.' + error)}</p></>}
      {status === 'saved' && <><Notice tone="success" message={t(update ? 'paymob.updated' : 'paymob.saved')} /><Alert role="status" className="rounded-xl border-primary/20 bg-primary/5"><CircleCheck className="text-primary" /><AlertTitle className="font-bold">{t(update ? 'paymob.updated' : 'paymob.saved')}</AlertTitle><AlertDescription className="leading-6">{t(update ? 'paymob.updatedDescription' : 'paymob.savedDescription')}</AlertDescription></Alert></>}
    </div>
    {status !== 'saved' && <form ref={formRef} autoComplete="off" noValidate aria-busy={busy} onSubmit={submit} onInput={(event) => {
      const selected = selectedNames()
      setFilledCount(selected.filter((name) => Boolean(valueFor(name))).length)
      const target = event.target
      if (target instanceof HTMLInputElement && credentialNames.includes(target.name as CredentialName)) {
        setFieldErrors((errors) => ({ ...errors, [target.name]: undefined }))
      }
      setError('')
    }}>
      <div className="mb-5 rounded-2xl border border-primary/15 bg-primary/5 p-4">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p role="status" className="text-sm font-bold">{update && !selectedCount ? t('paymob.noChanges') : t('paymob.ux.fieldsFilled', { filled: filledCount, total: selectedCount })}</p>
            <p className="mt-1 text-xs leading-6 text-muted-foreground">{t('paymob.ux.guideStays')}</p>
          </div>
          <PaymobCredentialsGuideDialog label={t('paymob.ux.findCredentials')} />
        </div>
        {selectedCount > 0 && (
          <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-background/80">
            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${Math.min(100, (filledCount / selectedCount) * 100)}%` }} />
          </div>
        )}
      </div>
      {update && <p className="mb-5 text-sm text-muted-foreground">{t('paymob.unchanged')}</p>}
      <div key={fieldVersion} className="grid gap-x-12 gap-y-6 sm:grid-cols-2">
        {credentialNames.map((name) => <CredentialField key={name} name={name} disabled={busy} error={fieldErrors[name]}
          onBlur={(event) => {
            // Let submit validate and focus errors without moving the button mid-click.
            if (event.relatedTarget instanceof HTMLElement && event.relatedTarget.closest('button[type="submit"]')) return
            if (!busy) setFieldErrors((errors) => ({ ...errors, [name]: validateField(name) }))
          }}
          stored={update ? props.existing.storedFields[name] : false}

          replacing={!update || Boolean(replacing[name])}
          onReplace={update ? (replace) => replaceField(name, replace) : undefined} />)}
      </div>
      <div className="mt-6 flex flex-col items-start gap-4 rounded-2xl bg-primary/5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-6">
        <div className="flex min-w-0 items-start gap-3.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><ShieldCheck className="size-[18px]" strokeWidth={1.75} /></span>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-5 text-foreground">{t('paymob.securityTitle')}</p>
            <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">{t('paymob.securityShort')}</p>
          </div>
        </div>
        <Dialog>
          <DialogTrigger render={<Button type="button" variant="ghost" className="group h-auto min-h-9 w-fit shrink-0 gap-2 whitespace-normal rounded-md px-0 py-1 text-start text-sm font-semibold normal-case tracking-normal text-primary hover:bg-transparent hover:underline hover:underline-offset-4 max-sm:ml-[50px]" />}>{t('paymob.ux.securityDetails')}<ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" /></DialogTrigger>
          <DialogContent showCloseButton={false} className="max-h-[85svh] overflow-y-auto rounded-2xl motion-reduce:animate-none">
            <DialogHeader>
              <DialogTitle className="font-sans text-xl font-bold normal-case tracking-normal">{t('paymob.securityTitle')}</DialogTitle>
              <DialogDescription>{t('paymob.secureEntry')}</DialogDescription>
            </DialogHeader>
            <ul className="grid gap-3">{['securityEncryption', 'securityBackend', 'securityApiKey', 'securityPatients', 'securitySharing'].map((key) => <li key={key} className="flex items-start gap-2 text-xs leading-6 text-muted-foreground sm:text-sm"><LockKeyhole className="mt-1 size-3.5 shrink-0 text-primary" />{t('paymob.' + key)}</li>)}</ul>
            <DialogClose render={<Button type="button" variant="outline" className={paymobButtonClass} />}><X />{t('paymob.close')}</DialogClose>
          </DialogContent>
        </Dialog>
      </div>
      <fieldset disabled={busy} className="mt-10 grid">
        <legend className="mb-3 text-sm font-bold text-foreground">{t('paymob.consentTitle')}</legend>
        <div className="flex items-start gap-4 py-1">
          <Checkbox id="paymob-authorized" aria-label={t(update ? 'paymob.updateConsent' : 'paymob.authorized')} checked={authorized} onCheckedChange={setAuthorized} className="mt-0.5 shrink-0 cursor-pointer rounded disabled:cursor-not-allowed" />
          <p className="max-w-2xl cursor-default select-none text-sm font-normal leading-6 text-foreground/85">{t(update ? 'paymob.updateConsent' : 'paymob.authorized')}</p>
        </div>
        {!update && <div className="flex items-start gap-4 py-1">
          <Checkbox id="paymob-understood" aria-label={t('paymob.understood')} checked={understood} onCheckedChange={setUnderstood} className="mt-0.5 shrink-0 cursor-pointer rounded disabled:cursor-not-allowed" />
          <p className="max-w-2xl cursor-default select-none text-sm font-normal leading-6 text-foreground/85">{t('paymob.understood')}</p>
        </div>}
      </fieldset>
      <div className="mt-10 grid gap-4">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
          <Button type="submit" disabled={!available || !complete || !authorized || (!update && !understood) || busy} aria-describedby={'paymob-next-step paymob-save-note' + (!available ? ' ' + (props.unavailableNoticeId ?? 'paymob-unavailable') : '')} className={paymobButtonClass + ' h-auto min-h-12 w-full shrink-0 whitespace-normal px-8 py-3 sm:w-auto'} aria-busy={busy}>
            {busy ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <Link2 className="size-4" />}{t(busy ? 'paymob.saving' : update ? 'paymob.update' : 'paymob.connect')}
          </Button>
          <p id="paymob-next-step" aria-live="polite" className="sr-only">{t('paymob.' + nextStep)}</p>
        </div>
        <p id="paymob-save-note" className="flex max-w-xl items-start gap-2 text-[13px] font-semibold leading-6 text-foreground/70"><Info className="mt-[5px] size-3.5 shrink-0 text-primary/70" />{t('paymob.saveNote')}</p>
      </div>
    </form>}
  </div>
}
