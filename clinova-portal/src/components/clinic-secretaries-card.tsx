import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { LoaderCircle, MailPlus, UserMinus, UserRoundCog } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import ConfirmationDialog from '@/components/confirmation-dialog'
import FormField from '@/components/form-field'
import Notice from '@/components/notice'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useApi } from '@/hooks/use-api'
import { getErrorMessage } from '@/lib/api'
import type { ClinicSecretary } from '@/types/secretary'

// Owner-only: the clinic's secretaries, removal, and secretary invitations by email.
export function SecretaryInviteCard({ clinicId }: { clinicId: number }) {
  const { t } = useTranslation()
  const api = useApi()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState('')
  const invite = useMutation({
    mutationFn: (value: string) => api.request<string>(`/api/secretary-invitations/send/clinic/${clinicId}`, { method: 'POST', body: JSON.stringify({ email: value }) }, { notifyOnError: false }),
    onSuccess: async () => {
      setEmail(''); setSuccess(t('secretary.clinic.inviteSuccess'))
      await queryClient.invalidateQueries({ queryKey: ['doctor', 'invitations', 'secretaries'] })
    },
  })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = email.trim()
    if (!value || invite.isPending) return
    setSuccess(''); invite.mutate(value)
  }

  return (
    <Card className="min-w-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0">
      <div className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-primary/15 via-primary/[0.05] to-transparent p-5">
        <span className="pointer-events-none absolute -end-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative flex items-center gap-3.5">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10">
            <UserRoundCog className="size-6" />
          </span>
          <h3 className="min-w-0 flex-1 truncate font-sans text-xl font-bold">{t('secretary.clinic.inviteTitle')}</h3>
        </div>
      </div>
      <CardContent className="grid gap-4 p-5">
        {success && <Notice tone="success" message={success} />}
        {invite.error && <Notice message={getErrorMessage(invite.error)} />}
        <form className="grid gap-3" onSubmit={submit}>
          <p className="text-xs leading-5 font-bold text-muted-foreground">{t('secretary.clinic.inviteDescription')}</p>
          <FormField id="inviteSecretaryEmail" label={t('secretary.clinic.email')} type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={256} autoComplete="email" placeholder="secretary@example.com" required />
          <Button type="submit" className="h-11 rounded-xl bg-primary text-sm font-bold normal-case text-primary-foreground hover:bg-primary/90" disabled={invite.isPending}>
            {invite.isPending ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <MailPlus />}
            {t('secretary.clinic.invite')}
          </Button>
          <Link className="text-center text-sm font-semibold text-primary transition hover:text-primary/80" to="/doctor/invitations">{t('clinicDetails.viewInvitations')}</Link>
        </form>
      </CardContent>
    </Card>
  )
}

export default function ClinicSecretariesCard({ clinicId }: { clinicId: number }) {
  const { t } = useTranslation()
  const api = useApi()
  const queryClient = useQueryClient()
  const [success, setSuccess] = useState('')
  const [removing, setRemoving] = useState<ClinicSecretary | null>(null)
  const queryKey = ['doctor', 'clinics', clinicId, 'secretaries']

  const secretaries = useQuery({ queryKey, queryFn: () => api.request<ClinicSecretary[]>(`/api/clinics/${clinicId}/secretaries`, {}, { notifyOnError: false }) })
  const remove = useMutation({
    mutationFn: (secretaryId: string) => api.request<string>(`/api/clinics/${clinicId}/secretaries/${secretaryId}`, { method: 'DELETE' }, { notifyOnError: false }),
    onSuccess: async () => {
      setRemoving(null); setSuccess(t('secretary.clinic.removeSuccess'))
      await queryClient.invalidateQueries({ queryKey })
    },
  })

  // Hide the card as soon as the clinic has no secretaries; keep only the success toast after a removal.
  if (secretaries.isSuccess && !secretaries.data.length) return success ? <Notice tone="success" message={success} /> : null

  return (
    <>
      <Card className="min-w-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0">
        <div className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-primary/15 via-primary/[0.05] to-transparent p-5">
          <span className="pointer-events-none absolute -end-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" />
          <div className="relative flex items-center gap-3.5">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10">
              <UserRoundCog className="size-6" />
            </span>
            <h3 className="min-w-0 flex-1 truncate font-sans text-xl font-bold">{t('secretary.clinic.title')}</h3>
            <Badge className="px-2.5 py-1 text-sm font-bold text-foreground">{secretaries.data?.length ?? 0}</Badge>
          </div>
        </div>
        <CardContent className="grid gap-3 p-5">
          {success && <Notice tone="success" message={success} />}
          {secretaries.isLoading && <LoaderCircle className="animate-spin text-primary motion-reduce:animate-none" />}
          {secretaries.error && <Notice message={getErrorMessage(secretaries.error)} />}
          {secretaries.isSuccess && !secretaries.data.length && <p className="text-xs leading-5 text-muted-foreground sm:col-span-2">{t('secretary.clinic.empty')}</p>}
          {secretaries.data?.map((secretary) => (
            <div key={secretary.id} className="group flex min-w-0 items-center gap-3 rounded-2xl border border-primary/15 bg-primary/[0.06] p-3 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
              <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl border-4 border-card bg-primary/10 text-xl font-bold text-primary shadow-md">
                {secretary.profilePicture ? <img className="size-full object-cover" src={secretary.profilePicture} alt="" /> : secretary.fullName.charAt(0)}
              </span>
              <strong className="min-w-0 flex-1 truncate text-sm font-bold">{secretary.fullName}</strong>
              <Button
                variant="destructive"
                size="icon"
                className="size-9 shrink-0 cursor-pointer rounded-full border border-foreground/15 bg-foreground/10 text-foreground shadow-sm transition hover:border-[#c98a82]/50 hover:bg-[#f6e6e3] hover:text-[#b5645a] dark:hover:border-[#c98a82]/30 dark:hover:bg-[#c98a82]/15 dark:hover:text-[#d9968d]"
                aria-label={t('secretary.clinic.remove', { name: secretary.fullName })}
                disabled={remove.isPending}
                onClick={() => { remove.reset(); setSuccess(''); setRemoving(secretary) }}
              >
                {remove.isPending ? <LoaderCircle className="size-4 animate-spin" /> : <UserMinus className="size-4" />}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={Boolean(removing)}
        title={t('secretary.clinic.removeTitle')}
        description={t('secretary.clinic.removeDescription', { name: removing?.fullName })}
        confirmLabel={t('secretary.clinic.removeConfirm')}
        cancelLabel={t('clinicDetails.keepMember')}
        destructive
        pending={remove.isPending}
        error={remove.error ? getErrorMessage(remove.error) : undefined}
        onConfirm={() => removing && remove.mutate(removing.id)}
        onOpenChange={(open) => { if (!open && !remove.isPending) { setRemoving(null); remove.reset() } }}
      />
    </>
  )
}
