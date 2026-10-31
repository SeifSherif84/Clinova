import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { BadgeCheck, Camera, ChevronRight, ExternalLink, FileText, LoaderCircle, Mail, MoreHorizontal, PencilLine, Phone, RefreshCw, Save, ShieldCheck, Trash2, UserRound, X } from 'lucide-react'
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import ConfirmationDialog from '@/components/confirmation-dialog'
import DoctorWorkspaceShell from '@/components/doctor-workspace-shell'
import FormField from '@/components/form-field'
import Notice from '@/components/notice'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useApi } from '@/hooks/use-api'
import { useSecretaryClinic } from '@/hooks/use-secretary-clinic'
import { getErrorMessage } from '@/lib/api'
import type { LookupOption } from '@/types/auth'
import type { Gender, SecretaryProfile, UpdateSecretaryProfileRequest } from '@/types/secretary'

const profileKey = ['secretary', 'profile'] as const
const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/webp']
const maxImageSize = 5 * 1024 * 1024

function ReadOnlyField({ icon, label, value, ltr = false }: { icon: ReactNode; label: string; value?: string | null; ltr?: boolean }) {
  return (
    <div className="group flex min-w-0 items-center gap-3.5 rounded-2xl border border-border/60 bg-background/45 px-4 py-2.5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary/15">
        {icon}
      </span>
      <span className="grid min-w-0 gap-1">
        <small className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{label}</small>
        <strong dir={ltr ? 'ltr' : undefined} className="truncate text-sm font-bold">{value || '—'}</strong>
      </span>
    </div>
  )
}

export default function SecretaryProfilePage() {
  const { t } = useTranslation()
  const api = useApi()
  const profile = useQuery({ queryKey: profileKey, queryFn: () => api.request<SecretaryProfile>('/api/secretaries/me', {}, { notifyOnError: false }) })
  // The profile has no clinic id; the secretary's clinic endpoint provides it for "Leave clinic".
  const clinic = useSecretaryClinic()

  return (
    <DoctorWorkspaceShell active="secretary-profile">
      <div className="mx-auto min-w-0 w-full max-w-7xl p-4 sm:p-6 lg:p-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-primary uppercase">
              <UserRound className="size-3" />
              {t('secretary.profile.eyebrow')}
            </Badge>
            <h1 className="mt-2 font-sans text-3xl font-bold sm:text-4xl">{t('secretary.profile.title')}</h1>
            <p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground sm:text-sm">{t('secretary.profile.description')}</p>
          </div>
        </div>

        {profile.isLoading && (
          <Card className="min-h-80 items-center justify-center rounded-3xl border border-border bg-card">
            <LoaderCircle className="size-7 animate-spin text-primary motion-reduce:animate-none" />
            <p className="text-xs text-muted-foreground">{t('secretary.profile.loading')}</p>
          </Card>
        )}
        {profile.isError && (
          <Card className="items-center rounded-3xl border border-destructive/20 bg-card p-8 text-center">
            <p className="text-sm font-bold text-destructive">{getErrorMessage(profile.error)}</p>
            <Button className="mt-3 h-11 cursor-pointer rounded-xl text-sm font-bold normal-case" variant="outline" disabled={profile.isFetching} onClick={() => profile.refetch()}>
              {profile.isFetching ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <RefreshCw />}
              {t('errors.tryAgain')}
            </Button>
          </Card>
        )}
        {profile.data && <ProfileContent key={profile.data.id} profile={{ ...profile.data, clinicId: profile.data.clinicId ?? clinic.data?.id ?? null }} />}
      </div>
    </DoctorWorkspaceShell>
  )
}

function ProfileContent({ profile }: { profile: SecretaryProfile }) {
  const { t } = useTranslation()
  const api = useApi()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [firstName, setFirstName] = useState(profile.firstName)
  const [lastName, setLastName] = useState(profile.lastName)
  const [dateOfBirth, setDateOfBirth] = useState(profile.dateOfBirth ?? '')
  const [gender, setGender] = useState<Gender | null>(profile.gender)
  const [isEditing, setIsEditing] = useState(false)
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
  const [pictureFile, setPictureFile] = useState<File | null>(null)
  const [pictureModalOpen, setPictureModalOpen] = useState(false)
  const [pictureError, setPictureError] = useState('')
  const [pictureSuccess, setPictureSuccess] = useState('')
  const refresh = () => queryClient.invalidateQueries({ queryKey: profileKey })
  const genders = useQuery({
    queryKey: ['lookups', 'genders'],
    queryFn: () => api.request<LookupOption[]>('/api/lookups/genders', {}, { notifyOnError: false }),
  })
  const picturePreview = useMemo(() => (pictureFile ? URL.createObjectURL(pictureFile) : null), [pictureFile])
  useEffect(() => () => { if (picturePreview) URL.revokeObjectURL(picturePreview) }, [picturePreview])

  const save = useMutation({
    mutationFn: (body: UpdateSecretaryProfileRequest) => api.request<string>('/api/secretaries/me', { method: 'PATCH', body: JSON.stringify(body) }, { notifyOnError: false }),
    onSuccess: async () => { setSuccess(t('secretary.profile.saved')); setIsEditing(false); await refresh() },
  })
  const upload = useMutation({
    mutationFn: (file: File) => { const body = new FormData(); body.set('ProfilePicture', file); return api.request<string>('/api/secretaries/me/profile-picture', { method: 'PATCH', body }, { notifyOnError: false }) },
    onSuccess: async () => { setPictureSuccess(t('secretary.profile.pictureSaved')); setPictureFile(null); await refresh() },
  })
  const deleteAccount = useMutation({
    mutationFn: () => api.request<string>('/api/auth/account', { method: 'DELETE' }, { notifyOnError: false }),
    onSuccess: () => {
      api.clearSession()
      void navigate({ to: '/login', search: { redirect: undefined } })
    },
  })

  function resetForm() {
    setFirstName(profile.firstName); setLastName(profile.lastName)
    setDateOfBirth(profile.dateOfBirth ?? ''); setGender(profile.gender)
  }
  function startEditing() {
    resetForm(); setFormError(''); setSuccess(''); setIsEditing(true)
  }
  function cancelEditing() {
    resetForm(); setFormError(''); save.reset(); setIsEditing(false)
  }
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
  function handleDeleteAccount() {
    deleteAccount.reset()
    setDeleteConfirmationOpen(true)
  }

  function choosePicture(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setPictureError(''); setPictureSuccess('')
    upload.reset()
    if (!file) return setPictureFile(null)
    if (!acceptedImageTypes.includes(file.type) || file.size > maxImageSize) {
      setPictureFile(null)
      setPictureError(t(file.size > maxImageSize ? 'validation.imageSize' : 'validation.imageType'))
      event.target.value = ''
      return
    }
    setPictureFile(file)
    setPictureModalOpen(true)
  }

  const fullName = `${profile.firstName} ${profile.lastName}`
  const initials = `${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`.toUpperCase()
  const errorMessage = formError || (save.error ? getErrorMessage(save.error) : '')
  const activePicture = picturePreview ?? profile.profilePicture
  const hasSide = Boolean(profile.nationalIdImageUrl)
  const shown = isEditing
    ? { firstName, lastName, dateOfBirth, gender }
    : { firstName: profile.firstName, lastName: profile.lastName, dateOfBirth: profile.dateOfBirth ?? '', gender: profile.gender }

  return (
    <div className="min-w-0 grid gap-5">
      <Card className="relative min-w-0 overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/12 via-card to-primary/5 p-5 sm:p-7">
        <span className="pointer-events-none absolute -end-16 -top-16 size-56 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative z-10 min-w-0 grid items-center gap-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-7">
          <Label htmlFor="secretaryProfilePicture" className="group relative mx-auto grid cursor-pointer justify-items-center gap-2 sm:mx-0" title={t('doctorProfile.pictureRules')}>
            <Input id="secretaryProfilePicture" className="sr-only" type="file" accept=".jpg,.jpeg,.png,.webp" onChange={choosePicture} />
            <span className="relative grid size-36 place-items-center overflow-hidden rounded-3xl border-4 border-card bg-gradient-to-br from-primary to-primary/65 text-3xl font-bold text-primary-foreground shadow-lg transition group-hover:-translate-y-0.5 group-hover:shadow-xl">
              {activePicture ? <img className="size-full object-cover" src={activePicture} alt={t('doctorProfile.pictureAlt', { name: fullName })} /> : initials}
              <span className="absolute inset-0 grid place-items-center bg-black/55 opacity-0 transition group-hover:opacity-100">
                <span className="grid gap-1 justify-items-center text-white">
                  <Camera className="size-6" />
                  <small className="text-[10px] font-bold">{t('doctorProfile.choosePicture')}</small>
                </span>
              </span>
            </span>
            <span className="absolute -end-1 -bottom-1 grid size-9 place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-md transition group-hover:scale-110">
              <Camera className="size-4" />
            </span>
          </Label>

          <div className="min-w-0 text-center sm:text-start">
            <h2 className="break-words font-sans text-3xl leading-tight font-bold sm:text-5xl">{fullName}</h2>
          </div>

          <div className="mx-auto flex items-center gap-1 self-end sm:mx-0">
            {!isEditing && (
              <Button className="h-10 cursor-pointer rounded-xl px-4 text-sm font-bold normal-case" onClick={startEditing}>
                <PencilLine />
                {t('doctorProfile.edit')}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<button type="button" aria-label={t('secretary.profile.moreActions')} className="grid size-9 cursor-pointer place-items-center rounded-lg bg-foreground/5 text-foreground outline-none transition-colors hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-primary/30 data-[popup-open]:bg-foreground/10" />}
              >
                {deleteAccount.isPending ? <LoaderCircle className="size-[18px] animate-spin motion-reduce:animate-none" /> : <MoreHorizontal className="size-[18px]" />}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={10} className="w-72 overflow-hidden rounded-2xl border border-border bg-popover p-0 shadow-2xl ring-1 ring-black/5">
                <div className="flex items-center gap-3 border-b border-border/60 bg-gradient-to-br from-primary/10 via-primary/[0.03] to-transparent px-4 py-3.5">
                  <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary/65 text-xs font-bold text-primary-foreground">
                    {activePicture ? <img className="size-full object-cover" src={activePicture} alt="" /> : initials}
                  </span>
                  <span className="grid min-w-0 gap-0.5 text-start">
                    <strong className="truncate text-sm font-bold">{fullName}</strong>
                    <small dir="ltr" className="truncate text-start text-[11px] font-semibold text-muted-foreground">{profile.email}</small>
                  </span>
                </div>

                <div className="grid gap-0.5 px-1.5 py-1">
                  <DropdownMenuItem
                    className="group/item cursor-pointer items-center gap-3 rounded-xl px-2.5 py-1.5 text-start normal-case tracking-normal outline-none transition focus:bg-primary/8 data-[highlighted]:bg-primary/8"
                    onClick={() => document.getElementById('secretaryProfilePicture')?.click()}
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary transition group-hover/item:bg-primary/15">
                      <Camera className="size-4" />
                    </span>
                    <span className="grid min-w-0 flex-1 gap-0.5">
                      <span className="truncate text-[13px] font-semibold">{t('doctorProfile.choosePicture')}</span>
                      <span className="text-[11px] leading-4 font-semibold text-muted-foreground">{t('secretary.profile.changePictureShort', { defaultValue: 'JPG, PNG or WebP, up to 5 MB' })}</span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 transition group-hover/item:text-primary rtl:rotate-180" />
                  </DropdownMenuItem>
                </div>

                <div role="separator" className="mx-3 h-px bg-border/70" />

                <div className="grid gap-0.5 px-1.5 py-1">
                  <DropdownMenuItem
                    className="group/item cursor-pointer items-center gap-3 rounded-xl px-2.5 py-1.5 text-start normal-case tracking-normal outline-none transition focus:bg-destructive/10 data-[highlighted]:bg-destructive/10"
                    disabled={deleteAccount.isPending}
                    onClick={handleDeleteAccount}
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive transition group-hover/item:bg-destructive/15">
                      <Trash2 className="size-4" />
                    </span>
                    <span className="grid min-w-0 flex-1 gap-0.5">
                      <span className="truncate text-[13px] font-semibold text-destructive">{t('doctorProfile.deleteAccount')}</span>
                      <span className="text-[11px] leading-4 font-semibold text-muted-foreground">{t('secretary.profile.deleteAccountShort')}</span>
                    </span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {(pictureError || upload.error) && <Notice message={pictureError || getErrorMessage(upload.error)} />}
        {pictureSuccess && <Notice tone="success" message={pictureSuccess} />}
        {errorMessage && <Notice message={errorMessage} />}
        {success && <Notice tone="success" message={success} />}
      </Card>

      <div className={'min-w-0 grid items-start gap-5 ' + (hasSide ? 'xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]' : '')}>
        <div className="min-w-0 grid content-start gap-5">
          <Card className="min-w-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0">
            <div className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-primary/15 via-primary/[0.05] to-transparent p-3.5">
              <span className="pointer-events-none absolute -end-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" />
              <div className="relative flex items-center gap-2.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10">
                  <UserRound className="size-4.5" />
                </span>
                <h3 className="min-w-0 flex-1 truncate font-sans text-base font-bold">{t('secretary.profile.personalTitle')}</h3>
              </div>
            </div>
            <CardContent className="p-5">
              <form className="grid gap-5" onSubmit={submit}>
                <div className="grid min-w-0 gap-5 rounded-2xl border border-border/60 bg-muted/30 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:p-5">
                  <FormField id="secretaryProfileFirstName" label={t('fields.firstName')} value={shown.firstName} onChange={(event) => setFirstName(event.target.value)} maxLength={50} disabled={!isEditing} required />
                  <FormField id="secretaryProfileLastName" label={t('fields.lastName')} value={shown.lastName} onChange={(event) => setLastName(event.target.value)} maxLength={50} disabled={!isEditing} required />
                  <FormField id="secretaryProfileBirth" type="date" label={t('secretary.profile.dateOfBirth')} value={shown.dateOfBirth} max={new Date().toISOString().slice(0, 10)} onChange={(event) => setDateOfBirth(event.target.value)} disabled={!isEditing} />
                  <div className="grid gap-2">
                    <Label className="text-xs font-semibold text-foreground/80">{t('secretary.profile.gender')}</Label>
                    <Select
                      items={genders.data?.map((item) => ({ value: String(item.id), label: item.name })) ?? []}
                      value={shown.gender == null ? null : String(shown.gender)}
                      onValueChange={(value) => setGender(value == null ? null : (Number(value) as Gender))}
                      disabled={!isEditing || genders.isLoading || genders.isError}
                    >
                      <SelectTrigger className="h-12 w-full rounded-xl border border-input bg-background/40 px-3 text-foreground">
                        <UserRound className="size-[18px] text-primary/70" />
                        <SelectValue placeholder={genders.isLoading ? t('doctorProfile.loadingGenders') : t('doctorProfile.chooseGender')} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border border-border bg-popover">
                        {genders.data?.map((item) => (
                          <SelectItem className="rounded-lg" key={item.id} value={String(item.id)}>{item.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {genders.isError && <small className="text-[11px] text-destructive">{t('doctorProfile.gendersError')}</small>}
                  </div>
                </div>
                {isEditing && (
                  <div className="flex flex-wrap justify-end gap-2 border-t border-border/50 pt-5">
                    <Button type="button" variant="outline" className="h-11 cursor-pointer rounded-xl text-sm font-bold normal-case" onClick={cancelEditing} disabled={save.isPending}>
                      <X />
                      {t('doctorProfile.cancel')}
                    </Button>
                    <Button type="submit" className="h-11 cursor-pointer rounded-xl text-sm font-bold normal-case" disabled={save.isPending || genders.isError}>
                      {save.isPending ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <Save />}
                      {t('secretary.profile.save')}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          <Card className="min-w-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0">
            <div className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-primary/15 via-primary/[0.05] to-transparent p-3.5">
              <span className="pointer-events-none absolute -end-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" />
              <div className="relative flex items-center gap-2.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10">
                  <UserRound className="size-4.5" />
                </span>
                <h3 className="min-w-0 flex-1 truncate font-sans text-base font-bold">{t('doctorProfile.accountTitle')}</h3>
              </div>
            </div>
            <CardContent className="grid min-w-0 gap-3 p-5 sm:grid-cols-2">
              <ReadOnlyField icon={<Mail className="size-4" />} label={t('fields.email')} value={profile.email} ltr />
              <ReadOnlyField icon={<Phone className="size-4" />} label={t('secretary.profile.phoneNumber', { defaultValue: 'Phone number' })} value={profile.phoneNumber} ltr />
            </CardContent>
          </Card>

        </div>

        {hasSide && (
          <div className="min-w-0 grid content-start gap-5">
            {profile.nationalIdImageUrl && (
              <Card className="min-w-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0">
                <div className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-primary/15 via-primary/[0.05] to-transparent p-3.5">
                  <span className="pointer-events-none absolute -end-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" />
                  <div className="relative flex items-center gap-2.5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10">
                      <ShieldCheck className="size-4.5" />
                    </span>
                    <h3 className="min-w-0 flex-1 truncate font-sans text-base font-bold">{t('doctorProfile.verificationTitle')}</h3>
                  </div>
                </div>
                <CardContent className="grid grid-cols-1 gap-3 p-5">
                  <a className="group flex items-center gap-3.5 rounded-2xl border border-border bg-background/35 px-4 py-2.5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:shadow-lg" href={profile.nationalIdImageUrl} target="_blank" rel="noreferrer">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary/15">
                      <FileText className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-bold">{t('secretary.profile.nationalId')}</span>
                    <ExternalLink className="size-4 shrink-0 text-muted-foreground/50 transition group-hover:text-primary" />
                  </a>
                  <p className="text-xs font-bold leading-4 text-muted-foreground">{t('doctorProfile.documentsHint')}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {pictureModalOpen && pictureFile && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
            <div className="grid justify-items-center gap-3 bg-gradient-to-b from-primary/8 to-transparent px-6 pt-7 pb-2 text-center">
              <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Camera className="size-6" />
              </span>
              <div>
                <h3 className="font-sans text-lg font-bold">{t('doctorProfile.confirmPictureTitle')}</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{t('doctorProfile.confirmPictureDescription')}</p>
              </div>
            </div>

            <div className="grid justify-items-center px-6 py-5">
              <div className="relative size-36 overflow-hidden rounded-3xl border-4 border-background shadow-lg ring-1 ring-border">
                <img className="size-full object-cover" src={picturePreview ?? ''} alt="" />
              </div>
              <div className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-emerald-600/15 bg-emerald-50/70 px-4 py-3 dark:border-emerald-400/15 dark:bg-emerald-950/20">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <BadgeCheck className="size-5" />
                </span>
                <span className="min-w-0 text-start">
                  <strong className="block truncate text-sm font-bold">{pictureFile.name}</strong>
                  <small className="block text-xs font-medium text-muted-foreground">{t('doctorProfile.pictureRules')}</small>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-border/60 bg-background/40 p-4">
              <Button type="button" variant="outline" className="h-11 cursor-pointer rounded-xl text-sm font-bold normal-case" disabled={upload.isPending} onClick={() => { setPictureFile(null); setPictureModalOpen(false) }}>
                {t('doctorProfile.cancel')}
              </Button>
              <Button type="button" className="h-11 cursor-pointer rounded-xl text-sm font-bold normal-case" disabled={upload.isPending} onClick={() => { upload.mutate(pictureFile, { onSuccess: () => setPictureModalOpen(false) }) }}>
                {upload.isPending ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <Camera />}
                {t('doctorProfile.updatePicture')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationDialog
        open={deleteConfirmationOpen}
        title={t('doctorProfile.deleteAccountTitle')}
        description={t('doctorProfile.deleteAccountConfirm')}
        confirmLabel={t('doctorProfile.deleteAccount')}
        cancelLabel={t('doctorProfile.keepAccount')}
        destructive
        pending={deleteAccount.isPending}
        error={deleteAccount.error ? getErrorMessage(deleteAccount.error) : undefined}
        onConfirm={() => deleteAccount.mutate()}
        onOpenChange={(open) => {
          if (!open && !deleteAccount.isPending) {
            setDeleteConfirmationOpen(false)
            deleteAccount.reset()
          }
        }}
      />
    </div>
  )
}