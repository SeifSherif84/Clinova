import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { CalendarDays, Camera, ExternalLink, IdCard, LoaderCircle, LogOut, Mail, Phone, RefreshCw, Save, UserRound } from 'lucide-react'
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import ConfirmationDialog from '@/components/confirmation-dialog'
import DoctorWorkspaceShell from '@/components/doctor-workspace-shell'
import FormField from '@/components/form-field'
import Notice from '@/components/notice'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useApi } from '@/hooks/use-api'
import { getErrorMessage } from '@/lib/api'
import type { Gender, SecretaryProfile, UpdateSecretaryProfileRequest } from '@/types/secretary'

const profileKey = ['secretary', 'profile'] as const
const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/webp']
const maxImageSize = 5 * 1024 * 1024
const iconBox = 'grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
const primaryButton = 'h-11 rounded-xl bg-primary text-sm font-bold normal-case text-primary-foreground hover:bg-primary/90'

export default function SecretaryProfilePage() {
  const { t } = useTranslation()
  const api = useApi()
  const profile = useQuery({ queryKey: profileKey, queryFn: () => api.request<SecretaryProfile>('/api/secretaries/me', {}, { notifyOnError: false }) })

  return (
    <DoctorWorkspaceShell active="secretary-profile">
      <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-10">
        <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-primary uppercase"><UserRound className="size-3" />{t('secretary.workspace')}</Badge>
        <h1 className="mt-2 font-sans text-3xl font-bold sm:text-4xl">{t('secretary.profile.title')}</h1>
        <p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground sm:text-sm">{t('secretary.profile.description')}</p>
        <div className="mt-6">
          {profile.isLoading && <p role="status" className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />{t('secretary.profile.loading')}</p>}
          {profile.isError && <div className="grid justify-items-start gap-3"><Notice message={getErrorMessage(profile.error)} /><Button variant="outline" className="h-11 rounded-xl text-sm font-bold normal-case" disabled={profile.isFetching} onClick={() => profile.refetch()}>{profile.isFetching ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <RefreshCw />}{t('errors.tryAgain')}</Button></div>}
          {profile.data && <ProfileContent key={profile.data.id + profile.dataUpdatedAt} profile={profile.data} />}
        </div>
      </div>
    </DoctorWorkspaceShell>
  )
}

function ProfileContent({ profile }: { profile: SecretaryProfile }) {
  const { t } = useTranslation()
  const api = useApi()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const pictureInput = useRef<HTMLInputElement>(null)
  const [firstName, setFirstName] = useState(profile.firstName)
  const [lastName, setLastName] = useState(profile.lastName)
  const [dateOfBirth, setDateOfBirth] = useState(profile.dateOfBirth ?? '')
  const [gender, setGender] = useState<Gender | null>(profile.gender)
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [confirmLeave, setConfirmLeave] = useState(false)
  const refresh = () => queryClient.invalidateQueries({ queryKey: profileKey })

  const save = useMutation({
    mutationFn: (body: UpdateSecretaryProfileRequest) => api.request<string>('/api/secretaries/me', { method: 'PATCH', body: JSON.stringify(body) }, { notifyOnError: false }),
    onSuccess: async () => { setSuccess(t('secretary.profile.saved')); await refresh() },
  })
  const upload = useMutation({
    mutationFn: (file: File) => { const body = new FormData(); body.set('ProfilePicture', file); return api.request<string>('/api/secretaries/me/profile-picture', { method: 'PATCH', body }, { notifyOnError: false }) },
    onSuccess: async () => { setSuccess(t('secretary.profile.pictureSaved')); await refresh() },
  })
  const leave = useMutation({
    mutationFn: (clinicId: number) => api.request<string>(`/api/clinics/${clinicId}/secretaries/me`, { method: 'DELETE' }, { notifyOnError: false }),
    onSuccess: async () => { setConfirmLeave(false); await queryClient.invalidateQueries({ queryKey: ['secretary'] }); navigate({ to: '/secretary/invitations' }) },
  })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(''); setSuccess('')
    const body: UpdateSecretaryProfileRequest = {}
    if (firstName.trim() !== profile.firstName) body.firstName = firstName.trim()
    if (lastName.trim() !== profile.lastName) body.lastName = lastName.trim()
    if ((dateOfBirth || null) !== profile.dateOfBirth) body.dateOfBirth = dateOfBirth || null
    if (gender !== profile.gender) body.gender = gender
    if (body.firstName === '' || body.lastName === '') return setFormError(t('secretary.profile.nameRequired'))
    if (!Object.keys(body).length) return setFormError(t('secretary.profile.noChanges'))
    save.mutate(body)
  }
  function choosePicture(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setFormError(''); setSuccess('')
    if (!acceptedImageTypes.includes(file.type)) return setFormError(t('validation.imageType'))
    if (file.size > maxImageSize) return setFormError(t('validation.imageSize'))
    upload.mutate(file)
  }

  const fullName = `${profile.firstName} ${profile.lastName}`
  const errorMessage = formError || (save.error ? getErrorMessage(save.error) : upload.error ? getErrorMessage(upload.error) : '')
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,1fr)]">
      {success && <Notice tone="success" message={success} />}
      {errorMessage && <Notice message={errorMessage} />}
      <Card className="rounded-2xl border border-border bg-card">
        <CardHeader className="!pb-3 border-b border-border/40">
          <CardTitle className="flex items-center gap-2 font-sans text-xl font-bold normal-case tracking-normal"><span className={iconBox}><UserRound className="size-5" /></span>{t('secretary.profile.personalTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-5" onSubmit={submit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField id="secretaryProfileFirstName" label={t('fields.firstName')} value={firstName} onChange={(event) => setFirstName(event.target.value)} maxLength={50} icon={<UserRound size={18} />} required />
              <FormField id="secretaryProfileLastName" label={t('fields.lastName')} value={lastName} onChange={(event) => setLastName(event.target.value)} maxLength={50} icon={<UserRound size={18} />} required />
              <FormField id="secretaryProfileBirth" type="date" label={t('secretary.profile.dateOfBirth')} value={dateOfBirth} max={new Date().toISOString().slice(0, 10)} onChange={(event) => setDateOfBirth(event.target.value)} icon={<CalendarDays size={18} />} />
              <div className="grid gap-2">
                <Label id="secretaryProfileGender" className="text-xs font-semibold text-foreground/80">{t('secretary.profile.gender')}</Label>
                <div role="radiogroup" aria-labelledby="secretaryProfileGender" className="flex w-fit gap-1 rounded-full border border-border bg-card/70 p-1.5">
                  {([1, 2] as const).map((value) => (
                    <Button key={value} type="button" role="radio" aria-checked={gender === value} variant={gender === value ? 'default' : 'ghost'} className="h-9 rounded-full px-4 text-sm font-bold normal-case tracking-normal" onClick={() => setGender(value)}>
                      {t(value === 1 ? 'secretary.profile.male' : 'secretary.profile.female')}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <Button type="submit" className={primaryButton + ' justify-self-start px-5'} disabled={save.isPending}>{save.isPending ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <Save />}{t('secretary.profile.save')}</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid content-start gap-5">
        <Card className="rounded-2xl border border-border bg-card">
          <CardContent className="grid justify-items-center gap-4 text-center">
            <span className="grid size-24 place-items-center overflow-hidden rounded-3xl bg-primary/10 text-3xl font-bold text-primary">
              {profile.profilePicture ? <img className="size-full object-cover" src={profile.profilePicture} alt="" /> : profile.firstName.charAt(0)}
            </span>
            <strong className="font-sans text-lg font-bold leading-tight">{fullName}</strong>
            <input ref={pictureInput} className="sr-only" type="file" accept=".jpg,.jpeg,.png,.webp" onChange={choosePicture} aria-label={t('secretary.profile.changePicture')} />
            <Button variant="outline" className="h-11 rounded-xl text-sm font-bold normal-case" disabled={upload.isPending} onClick={() => pictureInput.current?.click()}>{upload.isPending ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <Camera />}{t('secretary.profile.changePicture')}</Button>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-border bg-card">
          <CardContent className="grid gap-3">
            {[{ icon: Mail, label: t('fields.email'), value: profile.email }, { icon: Phone, label: t('fields.phone'), value: profile.phoneNumber }].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/45 p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4" /></span>
                <div className="min-w-0"><small className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{label}</small><strong dir="ltr" className="block truncate text-sm font-bold">{value}</strong></div>
              </div>
            ))}
            {profile.nationalIdImageUrl && <Button variant="outline" className="h-11 rounded-xl text-sm font-bold normal-case" render={<a href={profile.nationalIdImageUrl} target="_blank" rel="noreferrer" />}><IdCard />{t('secretary.profile.nationalId')}<ExternalLink className="size-3.5" /></Button>}
          </CardContent>
        </Card>
        {typeof profile.clinicId === 'number' && (
          <Card className="rounded-2xl border border-destructive/20 bg-destructive/5">
            <CardContent className="grid gap-3">
              <strong className="text-sm font-bold text-destructive">{t('secretary.profile.leaveTitle')}</strong>
              <p className="text-xs leading-6 text-muted-foreground">{t('secretary.profile.leaveDescription')}</p>
              <Button variant="destructive" className="h-11 rounded-xl text-sm font-bold normal-case" disabled={leave.isPending} onClick={() => { leave.reset(); setConfirmLeave(true) }}><LogOut className="rtl:rotate-180" />{t('secretary.profile.leave')}</Button>
            </CardContent>
          </Card>
        )}
      </div>
      <ConfirmationDialog
        open={confirmLeave}
        title={t('secretary.profile.leaveConfirmTitle')}
        description={t('secretary.profile.leaveConfirm')}
        confirmLabel={t('secretary.profile.leave')}
        cancelLabel={t('invitations.keepPending')}
        destructive
        pending={leave.isPending}
        error={leave.error ? getErrorMessage(leave.error) : undefined}
        onConfirm={() => typeof profile.clinicId === 'number' && leave.mutate(profile.clinicId)}
        onOpenChange={(open) => { if (!open && !leave.isPending) setConfirmLeave(false) }}
      />
    </div>
  )
}
