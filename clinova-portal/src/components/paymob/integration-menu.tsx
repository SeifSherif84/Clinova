import { ChevronDown, Hash, LoaderCircle, PencilLine, Power, PowerOff, Save, Settings2, Trash2, X } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import ConfirmationDialog from '@/components/confirmation-dialog'
import Notice from '@/components/notice'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePaymobIntegrationAction, type PaymobIntegrationAction } from '@/hooks/use-paymob-configuration'
import { ApiError } from '@/lib/api'
import type { PaymobIntegration } from '@/lib/paymob-configuration'
import { paymobMenuItemClass } from './account-menu'
import { paymobButtonClass } from './setup-section'

const spinnerClass = 'size-4 animate-spin motion-reduce:animate-none'

export function PaymobIntegrationMenu({ clinicId, accountId, accountActive, integration, refreshing }: { clinicId: string; accountId: number; accountActive: boolean; integration: PaymobIntegration; refreshing: boolean }) {
  const { t } = useTranslation()
  const mutation = usePaymobIntegrationAction(clinicId)
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [value, setValue] = useState('')
  const [invalid, setInvalid] = useState(false)
  const [formError, setFormError] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const busy = mutation.isPending
  const method = t('paymob.method.' + integration.paymentMethod)

  function run(action: PaymobIntegrationAction) {
    if (busy) return
    setError(''); setFormError(''); setSuccess('')
    mutation.mutate({ accountId, integrationId: integration.id, action }, {
      onSuccess: () => { setEditing(false); setConfirmDelete(false); setSuccess(t('paymob.integration.' + action.kind + 'd', { method })) },
      onError: (failure) => {
        const message = t(failure instanceof ApiError && failure.status === 400 && /account is not active/i.test(failure.message) ? 'paymob.integration.accountInactive'
          : failure instanceof ApiError && failure.status === 403 ? 'paymob.integration.accessError' : 'paymob.integration.error')
        if (action.kind === 'update') { setFormError(message); return }
        setConfirmDelete(false); setError(message)
      },
    })
  }
  function openEditor() {
    setValue(String(integration.integrationId)); setInvalid(false); setFormError(''); setEditing(true)
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = value.trim()
    const id = Number(trimmed)
    if (!/^[0-9]+$/.test(trimmed) || !Number.isInteger(id) || id < 1 || id > 2147483647) {
      setFormError(t('paymob.integrationsInvalid')); setInvalid(true); input.current?.focus(); return
    }
    if (id === integration.integrationId) { setEditing(false); return }
    run({ kind: 'update', paymobIntegrationId: id })
  }

  return <>
    {success && <Notice tone="success" message={success} />}
    {error && <Notice message={error} />}
    <DropdownMenu>
      <DropdownMenuTrigger disabled={busy || refreshing} aria-busy={busy} aria-label={t('paymob.integration.manage', { method })} render={<Button variant="outline" className={paymobButtonClass} />}>
        {busy ? <LoaderCircle className={spinnerClass} /> : <Settings2 />}
        <span className="hidden sm:inline">{t('paymob.manage')}</span>
        <ChevronDown className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 rounded-xl p-1.5">
        <DropdownMenuItem className={paymobMenuItemClass} onClick={openEditor}><PencilLine className="size-4 text-primary" />{t('paymob.integration.edit')}</DropdownMenuItem>
        {integration.isActive
          ? <DropdownMenuItem className={paymobMenuItemClass} onClick={() => run({ kind: 'deactivate' })}><PowerOff className="size-4 text-warm" />{t('paymob.account.deactivate')}</DropdownMenuItem>
          // The backend only activates integrations on an active account.
          : <DropdownMenuItem className={paymobMenuItemClass} disabled={!accountActive} onClick={() => run({ kind: 'activate' })}><Power className="size-4 text-primary" />{t(accountActive ? 'paymob.account.activate' : 'paymob.integration.activateAccountFirst')}</DropdownMenuItem>}
        <DropdownMenuSeparator className="my-1.5" />
        <DropdownMenuItem variant="destructive" className={paymobMenuItemClass} onClick={() => { setError(''); setConfirmDelete(true) }}><Trash2 className="size-4" />{t('paymob.integration.delete')}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <Dialog open={editing} onOpenChange={(next) => { if (!next && !busy) setEditing(false) }}>
      <DialogContent showCloseButton={false} className="rounded-3xl border border-border bg-card p-5 motion-reduce:animate-none sm:max-w-md sm:p-7">
        <DialogHeader className="text-start">
          <DialogTitle className="font-sans text-xl font-bold normal-case tracking-normal">{t('paymob.integration.editTitle', { method })}</DialogTitle>
          <DialogDescription className="text-xs leading-6 sm:text-sm">{t('paymob.integration.editDescription')}</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={submit} className="grid gap-5">
          {formError && <Notice message={formError} />}
          <div className="grid gap-2">
            <Label htmlFor={'paymob-integration-edit-' + integration.id} className="text-xs font-semibold normal-case tracking-normal text-foreground/80">{t('paymob.integrationId')}</Label>
            <div className="relative">
              <Hash aria-hidden="true" className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input ref={input} id={'paymob-integration-edit-' + integration.id} autoFocus inputMode="numeric" dir="ltr" autoComplete="off" spellCheck={false} value={value} disabled={busy} aria-invalid={invalid || undefined}
                placeholder={t('paymob.integrationIdPlaceholder')}
                className="h-12 rounded-xl border border-input bg-background/40 ps-11 focus-visible:border-primary/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20"
                onChange={(event) => { setValue(event.target.value); setInvalid(false); setFormError('') }} />
            </div>
            <p className="text-xs leading-6 font-semibold text-muted-foreground">{t('paymob.integrationIdHint')}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <Button type="button" variant="outline" className={paymobButtonClass} disabled={busy} onClick={() => setEditing(false)}><X />{t('paymob.cancelIntegration')}</Button>
            <Button type="submit" className={paymobButtonClass} disabled={busy} aria-busy={busy}>{busy ? <LoaderCircle className={spinnerClass} /> : <Save />}{t('paymob.integration.save')}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <ConfirmationDialog
      open={confirmDelete}
      title={t('paymob.integration.deleteTitle', { method })}
      description={t('paymob.integration.deleteDescription', { method })}
      confirmLabel={t('paymob.integration.delete')}
      cancelLabel={t('paymob.cancelIntegration')}
      destructive
      pending={busy}
      onConfirm={() => run({ kind: 'delete' })}
      onOpenChange={(next) => { if (!next && !busy) setConfirmDelete(false) }}
    />
  </>
}
