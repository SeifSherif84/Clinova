import { Link } from '@tanstack/react-router'
import { ChevronDown, LoaderCircle, PencilLine, Power, PowerOff, Settings2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ConfirmationDialog from '@/components/confirmation-dialog'
import Notice from '@/components/notice'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { usePaymobAccountAction, type PaymobAccountAction } from '@/hooks/use-paymob-configuration'
import { ApiError } from '@/lib/api'
import type { SavedPaymobConfiguration } from '@/lib/paymob-configuration'
import { paymobButtonClass } from './setup-section'

export const paymobMenuItemClass = 'gap-2.5 rounded-lg px-3 py-2.5 text-sm font-bold normal-case tracking-normal cursor-pointer'
type Confirmation = 'deactivate' | 'delete' | 'history'

export function PaymobAccountMenu({ clinicId, account }: { clinicId: string; account: SavedPaymobConfiguration }) {
  const { t } = useTranslation()
  const mutation = usePaymobAccountAction(clinicId)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const busy = mutation.isPending

  function run(action: PaymobAccountAction) {
    if (busy) return
    setError(''); setSuccess('')
    mutation.mutate({ accountId: account.accountId, action }, {
      onSuccess: () => { setConfirmation(null); setSuccess(t('paymob.account.' + action + 'd')) },
      onError: (failure) => {
        // Accounts with payment history cannot be deleted; offer to deactivate instead.
        if (action === 'delete' && failure instanceof ApiError && failure.status === 400 && /existing payments/i.test(failure.message)) { setConfirmation('history'); return }
        setConfirmation(null)
        setError(t(failure instanceof ApiError && failure.status === 403 ? 'paymob.account.accessError' : 'paymob.account.error'))
      },
    })
  }
  function open(next: Confirmation) { setError(''); setConfirmation(next) }

  const copy = confirmation === 'history'
    ? { title: t('paymob.account.historyTitle'), description: t(account.isActive ? 'paymob.account.historyDescription' : 'paymob.account.historyInactive'), confirm: t(account.isActive ? 'paymob.account.deactivate' : 'paymob.account.close') }
    : confirmation === 'deactivate'
      ? { title: t('paymob.account.deactivateTitle'), description: t('paymob.account.deactivateDescription'), confirm: t('paymob.account.deactivate') }
      : { title: t('paymob.account.deleteTitle'), description: t('paymob.account.deleteDescription'), confirm: t('paymob.account.delete') }

  function confirm() {
    if (confirmation === 'delete') run('delete')
    else if (confirmation === 'history' && !account.isActive) setConfirmation(null)
    else run('deactivate')
  }

  return <>
    {success && <Notice tone="success" message={success} />}
    {error && <Notice message={error} />}
    <DropdownMenu>
      <DropdownMenuTrigger disabled={busy} aria-busy={busy} render={<Button variant="outline" className={paymobButtonClass + ' border-transparent bg-muted text-foreground hover:bg-foreground/10'} />}>
        {busy ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <Settings2 />}
        {t(account.status === 'NeedsAttention' ? 'paymob.reviewSettings' : 'paymob.manage')}
        <ChevronDown className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5">
        <DropdownMenuItem className={paymobMenuItemClass} render={<Link to="/doctor/clinics/$clinicId/payments/paymob/manage" params={{ clinicId }} />}>
          <PencilLine className="size-4 text-primary" />{t('paymob.account.edit')}
        </DropdownMenuItem>
        {account.isActive
          ? <DropdownMenuItem className={paymobMenuItemClass} onClick={() => open('deactivate')}><PowerOff className="size-4 text-warm" />{t('paymob.account.deactivate')}</DropdownMenuItem>
          : <DropdownMenuItem className={paymobMenuItemClass} onClick={() => run('activate')}><Power className="size-4 text-primary" />{t('paymob.account.activate')}</DropdownMenuItem>}
        <DropdownMenuSeparator className="my-1.5" />
        <DropdownMenuItem variant="destructive" className={paymobMenuItemClass} onClick={() => open('delete')}>
          <Trash2 className="size-4" />{t('paymob.account.delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <ConfirmationDialog
      open={Boolean(confirmation)}
      title={copy.title}
      description={copy.description}
      confirmLabel={copy.confirm}
      cancelLabel={t('paymob.account.keep')}
      destructive={confirmation === 'delete'}
      pending={busy}
      onConfirm={confirm}
      onOpenChange={(next) => { if (!next && !busy) setConfirmation(null) }}
    />
  </>
}
