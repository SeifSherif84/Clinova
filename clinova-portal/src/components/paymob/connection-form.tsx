import { CircleCheck, FileText, Info, Link2, LoaderCircle, LockKeyhole, ShieldCheck, X } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import Notice from '@/components/notice'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { PaymobCredentialsGuideDialog } from './credentials-guide'
import { Label } from '@/components/ui/label'
import type { SavedPaymobConfiguration } from '@/lib/paymob-configuration'
import { CredentialField } from './credential-field'
import { credentialNames, type CredentialName, type PaymobCredentials } from './credentials'
import { paymobButtonClass } from './setup-section'

type SaveStatus = 'idle' | 'saving' | 'saved'
type Props = { unavailableNoticeId?: string } & (
  | { mode?: 'connect'; existing?: never; onConnect?: (credentials: PaymobCredentials) => Promise<void>; onUpdate?: never }
  | { mode: 'update'; existing: SavedPaymobConfiguration; onConnect?: never; onUpdate?: (changes: Partial<PaymobCredentials>) => Promise<void> }

)

// Save callbacks must resolve only after storage succeeds. Their response is never rendered.
// The routed pages intentionally supply none until the complete save contract is integrated.
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
    if (name === 'cardIntegrationId' && !/^[0-9]*[1-9][0-9]*$/.test(value)) return t('paymob.invalidIntegration')
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
      <div className="mb-5 flex flex-col items-start gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p role="status" className="text-sm font-bold">{update && !selectedCount ? t('paymob.noChanges') : t('paymob.ux.fieldsFilled', { filled: filledCount, total: selectedCount })}</p>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">{t('paymob.ux.guideStays')}</p>
        </div>
        <PaymobCredentialsGuideDialog label={t('paymob.ux.findCredentials')} />
      </div>
      {update && <p className="mb-5 text-sm text-muted-foreground">{t('paymob.unchanged')}</p>}
      <div key={fieldVersion} className="grid gap-5 sm:grid-cols-2">
        {credentialNames.map((name) => <CredentialField key={name} name={name} disabled={busy} error={fieldErrors[name]}
          onBlur={(event) => {
            // Let submit validate and focus errors without moving the button mid-click.
            if (event.relatedTarget instanceof HTMLElement && event.relatedTarget.closest('button[type="submit"]')) return
            if (!busy) setFieldErrors((errors) => ({ ...errors, [name]: validateField(name) }))
          }}
          stored={update ? props.existing.storedFields[name] : false}
          currentIntegrationId={update ? props.existing.cardIntegrationId : undefined}
          replacing={!update || Boolean(replacing[name])}
          onReplace={update ? (replace) => replaceField(name, replace) : undefined} />)}
      </div>
      <div className="mt-6 flex flex-col items-start gap-3 rounded-2xl bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold"><ShieldCheck className="size-5 shrink-0 text-primary" />{t('paymob.securityTitle')}</p>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">{t('paymob.securityShort')}</p>
        </div>
        <Dialog>
          <DialogTrigger render={<Button type="button" variant="ghost" className={paymobButtonClass + ' h-auto min-h-11 whitespace-normal text-start'} />}><LockKeyhole />{t('paymob.ux.securityDetails')}</DialogTrigger>
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
      <fieldset disabled={busy} className="mt-8 grid gap-4">
        <legend className="mb-4 text-sm font-bold">{t('paymob.consentTitle')}</legend>
        <div className="flex items-start gap-3">
          <Checkbox id="paymob-authorized" checked={authorized} onCheckedChange={setAuthorized} className="mt-1 rounded" />
          <Label htmlFor="paymob-authorized" className="min-h-11 cursor-pointer text-xs font-normal leading-6 sm:text-sm">{t(update ? 'paymob.updateConsent' : 'paymob.authorized')}</Label>
        </div>
        {!update && <div className="flex items-start gap-3">
          <Checkbox id="paymob-understood" checked={understood} onCheckedChange={setUnderstood} className="mt-1 rounded" />
          <Label htmlFor="paymob-understood" className="min-h-11 cursor-pointer text-xs font-normal leading-6 sm:text-sm">{t('paymob.understood')}</Label>
        </div>}
      </fieldset>
      <div className="mt-5 text-xs leading-6 text-muted-foreground">
        <p className="flex items-center gap-2 font-bold"><FileText className="size-4 shrink-0" />{t('paymob.ux.legalDocuments')}</p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">{['terms', 'privacy', 'paymentsTerms'].map((key) => <li key={key}>{t('paymob.' + key)}</li>)}</ul>
        <p className="mt-1">{t('paymob.ux.legalNotice')}</p>
      </div>
      <div className="mt-6 flex flex-col items-start gap-3 border-t pt-6">
        <p id="paymob-next-step" aria-live="polite" className="text-sm font-bold">{t('paymob.' + nextStep)}</p>
        <Button type="submit" disabled={!available || !complete || !authorized || (!update && !understood) || busy} aria-describedby={'paymob-next-step paymob-save-note' + (!available ? ' ' + (props.unavailableNoticeId ?? 'paymob-unavailable') : '')} className={paymobButtonClass + ' h-auto min-h-11 w-full whitespace-normal py-3 sm:w-auto'} aria-busy={busy}>
          {busy ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <Link2 className="size-4" />}{t(busy ? 'paymob.saving' : update ? 'paymob.update' : 'paymob.connect')}
        </Button>
        <p id="paymob-save-note" className="text-xs leading-6 text-muted-foreground">{t('paymob.saveNote')}</p>
      </div>
    </form>}
  </div>
}
