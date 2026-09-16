import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, BadgeCheck, Bell, BriefcaseMedical, Building2, CalendarDays, Camera, Clock3, FileBadge, FileText, LoaderCircle, LogOut, Mail, PencilLine, Phone, RefreshCw, Save, ShieldCheck, Sparkles, Stethoscope, Upload, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Brand from '@/components/brand'
import FormField from '@/components/form-field'
import Notice from '@/components/notice'
import PreferencesControls from '@/components/preferences-controls'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useApi } from '@/hooks/use-api'
import { useAuth } from '@/hooks/use-auth'
import { getErrorMessage } from '@/lib/api'
import type { LookupOption } from '@/types/auth'
import type { ClinicSummary } from '@/types/clinic'
import type { DoctorProfile, UpdateDoctorProfileRequest } from '@/types/doctor'

const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/webp']
const maxImageSize = 5 * 1024 * 1024

interface ProfileFormState {
  title: string
  experienceYears: string
  bio: string
  dateOfBirth: string
  gender: string | null
}

const emptyForm: ProfileFormState = { title: '', experienceYears: '', bio: '', dateOfBirth: '', gender: null }

function profileToForm(profile: DoctorProfile): ProfileFormState {
  return {
    title: profile.title ?? '',
    experienceYears: profile.experienceYears == null ? '' : String(profile.experienceYears),
    bio: profile.bio ?? '',
    dateOfBirth: profile.dateOfBirth ?? '',
    gender: profile.gender == null ? null : String(profile.gender),
  }
}

function ReadOnlyField({ icon, label, value }: { icon: ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-border bg-background/35 p-3.5">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-primary/8 text-primary">{icon}</span>
      <span className="grid min-w-0 gap-0.5">
        <small className="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</small>
        <strong className="truncate text-xs font-semibold">{value || '—'}</strong>
      </span>
    </div>
  )
}

export default function DoctorProfilePage() {
  const { t } = useTranslation()
  const api = useApi()
  const auth = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ProfileFormState>(emptyForm)
  const [isEditing, setIsEditing] = useState(false)
  const [formError, setFormError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [pictureFile, setPictureFile] = useState<File | null>(null)
  const [pictureError, setPictureError] = useState('')
  const [pictureSuccess, setPictureSuccess] = useState('')

  const profile = useQuery({ queryKey: ['doctor', 'profile'], queryFn: () => api.request<DoctorProfile>('/api/doctors/me', {}, { notifyOnError: false }) })
  const clinics = useQuery({ queryKey: ['doctor', 'clinics'], queryFn: () => api.request<ClinicSummary[]>('/api/clinics') })
  const genders = useQuery({ queryKey: ['lookups', 'genders'], queryFn: () => api.request<LookupOption[]>('/api/lookups/genders', {}, { notifyOnError: false }) })
  const logout = useMutation({ mutationFn: auth.signOut, onSettled: () => navigate({ to: '/login', search: { redirect: undefined } }) })
  const updateProfile = useMutation({
    mutationFn: (body: UpdateDoctorProfileRequest) => api.request<string>('/api/doctors/me', { method: 'PATCH', body: JSON.stringify(body) }, { notifyOnError: false }),
    onSuccess: async (message) => {
      setProfileSuccess(message || t('doctorProfile.saved'))
      setIsEditing(false)
      await queryClient.invalidateQueries({ queryKey: ['doctor', 'profile'] })
    },
  })
  const updatePicture = useMutation({
    mutationFn: (file: File) => {
      const body = new FormData()
      body.set('ProfilePicture', file)
      return api.request<string>('/api/doctors/me/profile-picture', { method: 'PATCH', body }, { notifyOnError: false })
    },
    onSuccess: async (message) => {
      setPictureSuccess(message || t('doctorProfile.pictureSaved'))
      setPictureFile(null)
      await queryClient.invalidateQueries({ queryKey: ['doctor', 'profile'] })
    },
  })

  const picturePreview = useMemo(() => pictureFile ? URL.createObjectURL(pictureFile) : null, [pictureFile])
  useEffect(() => () => { if (picturePreview) URL.revokeObjectURL(picturePreview) }, [picturePreview])

  const fullName = profile.data ? `${profile.data.firstName} ${profile.data.lastName}` : auth.user?.name ?? ''
  const initials = profile.data ? `${profile.data.firstName[0]}${profile.data.lastName[0]}`.toUpperCase() : fullName[0]?.toUpperCase()
  const activePicture = picturePreview ?? profile.data?.profilePicture
  const approvalStatus = profile.data?.approvalStatusName ?? ''
  const isApproved = approvalStatus.toLowerCase() === 'approved'
  const displayedForm = profile.data && !isEditing ? profileToForm(profile.data) : form
  const navItem = 'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-foreground [&>svg]:size-4'
  const today = new Date().toISOString().slice(0, 10)

  function updateField<Key extends keyof ProfileFormState>(key: Key, value: ProfileFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function startEditing() {
    if (profile.data) setForm(profileToForm(profile.data))
    setFormError('')
    setProfileSuccess('')
    setIsEditing(true)
  }

  function cancelEditing() {
    if (profile.data) setForm(profileToForm(profile.data))
    setFormError('')
    updateProfile.reset()
    setIsEditing(false)
  }

  function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    setProfileSuccess('')
    const experienceYears = form.experienceYears === '' ? null : Number(form.experienceYears)
    if (experienceYears != null && (!Number.isInteger(experienceYears) || experienceYears < 0 || experienceYears > 100)) {
      setFormError(t('doctorProfile.experienceError'))
      return
    }
    updateProfile.mutate({
      title: form.title.trim(),
      experienceYears,
      bio: form.bio.trim(),
      dateOfBirth: form.dateOfBirth || null,
      gender: form.gender == null ? null : Number(form.gender),
    })
  }

  function handlePictureChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setPictureError('')
    setPictureSuccess('')
    updatePicture.reset()
    if (!file) return setPictureFile(null)
    if (!acceptedImageTypes.includes(file.type) || file.size > maxImageSize) {
      setPictureFile(null)
      setPictureError(t(file.size > maxImageSize ? 'validation.imageSize' : 'validation.imageType'))
      event.target.value = ''
      return
    }
    setPictureFile(file)
  }

  return (
    <main className="min-h-svh bg-background text-foreground lg:grid lg:grid-cols-[16.5rem_1fr]">
      <aside className="sticky top-0 hidden h-svh flex-col border-e border-sidebar-border bg-sidebar px-5 py-7 lg:flex">
        <Brand />
        <nav className="mt-12 grid gap-1">
          <Link className={navItem} to="/dashboard"><Sparkles /> {t('dashboard.overview')}</Link>
          <a className={navItem} href="/dashboard#appointments"><CalendarDays /> {t('dashboard.appointments')}</a>
          <Link className={navItem} to="/doctor/clinics"><Building2 /> {t('dashboard.clinics')}</Link>
          <a className={navItem} href="/dashboard#schedule"><Clock3 /> {t('dashboard.workingHours')}</a>
          <Link className={`${navItem} bg-sidebar-accent text-sidebar-foreground [&>svg]:text-sidebar-primary`} to="/doctor/profile"><Stethoscope /> {t('dashboard.profile')}</Link>
        </nav>
        <Card className="mt-auto flex-row items-center gap-3 rounded-xl border border-primary/10 bg-primary/5 px-3 py-3 animate-glow">
  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary"><ShieldCheck className="size-4" /></span>
  <span className="grid"><strong className="text-xs">{t('dashboard.secureSession')}</strong><small className="text-[10px] text-muted-foreground">{t('dashboard.protected')}</small></span>
</Card>
      </aside>

      <section className="min-w-0">
        <header className="sticky top-0 z-30 flex min-h-20 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur-xl sm:px-6 lg:px-10">
          <div className="me-auto lg:hidden"><Brand compact /></div>
          <Link className="me-auto hidden items-center gap-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground lg:flex" to="/dashboard"><ArrowLeft className="size-4 rtl:rotate-180" />{t('doctorProfile.back')}</Link>
          <PreferencesControls compact />
          <Button variant="outline" size="icon" className="relative rounded-xl border-border bg-card/40 text-muted-foreground" aria-label={t('dashboard.notifications')}><Bell className="size-4" /></Button>
          <div className="hidden max-w-56 text-end sm:grid"><strong className="truncate text-base font-bold text-foreground">{fullName || t('dashboard.member')}</strong><small className="truncate text-xs font-medium text-muted-foreground">{profile.data?.medicalSpecialtyName || t('dashboard.member')}</small></div>
          <Button variant="outline" size="icon" className="rounded-xl border-border bg-card/40 text-muted-foreground" aria-label={t('common.signOut')} onClick={() => logout.mutate()} disabled={logout.isPending}><LogOut className="size-4 rtl:rotate-180" /></Button>
        </header>

        <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div><Badge className="rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">{t('doctorProfile.eyebrow')}</Badge><h1 className="mt-2 font-sans text-3xl font-bold sm:text-4xl">{t('doctorProfile.title')}</h1><p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground sm:text-sm">{t('doctorProfile.description')}</p></div>
            <Link className="inline-flex items-center gap-2 text-xs font-semibold text-primary lg:hidden" to="/dashboard"><ArrowLeft className="size-4 rtl:rotate-180" />{t('doctorProfile.back')}</Link>
          </div>

          {profile.isLoading && <Card className="min-h-80 items-center justify-center rounded-3xl border border-border bg-card"><LoaderCircle className="size-7 animate-spin text-primary" /><p className="text-xs text-muted-foreground">{t('doctorProfile.loading')}</p></Card>}
          {profile.isError && <Card className="items-center rounded-3xl border border-destructive/20 bg-card p-8 text-center"><p className="text-sm font-semibold text-destructive">{getErrorMessage(profile.error)}</p><Button className="mt-3 rounded-xl normal-case" variant="outline" onClick={() => profile.refetch()}><RefreshCw />{t('doctorProfile.retry')}</Button></Card>}

          {profile.data && (
            <div className="grid gap-5">
              <Card className="overflow-visible rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/12 via-card to-warm/5 p-5 sm:p-7">
                <div className="grid items-center gap-5 sm:grid-cols-[auto_1fr_auto]">
                  <div className="relative mx-auto sm:mx-0"><div className="grid size-36 place-items-center overflow-hidden rounded-3xl border-4 border-card bg-gradient-to-br from-primary to-primary/65 text-3xl font-bold text-primary-foreground shadow-lg">{activePicture ? <img className="size-full object-cover" src={activePicture} alt={t('doctorProfile.pictureAlt', { name: fullName })} /> : initials}</div></div>
                  <div className="min-w-0 text-center sm:text-start">
  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
    <h2 className="truncate text-3xl font-bold tracking-tight sm:text-4xl">{fullName}</h2>
    <Badge className={isApproved ? 'rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary' : 'rounded-full bg-warm/10 px-2.5 py-1 text-xs text-warm'}><BadgeCheck />{approvalStatus}</Badge>
  </div>
  <div className="mt-3 flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
    <Badge className="w-fit rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"><Stethoscope className="size-3" />{profile.data.medicalSpecialtyName}</Badge>
    {profile.data.title && <span className="text-sm font-semibold text-primary">{profile.data.title}</span>}
  </div>
</div>
                  {!isEditing && <Button className="mx-auto h-11 rounded-xl text-sm font-bold normal-case sm:mx-0" onClick={startEditing}><PencilLine />{t('doctorProfile.edit')}</Button>}
                </div>
              </Card>

              <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(19rem,1fr)]">
                <Card className="self-start overflow-visible rounded-2xl border border-border bg-card">
                  <CardHeader className="!pb-3 border-b border-border/40"><CardTitle className="flex items-center gap-2 font-sans text-xl font-bold normal-case tracking-normal"><span className="grid size-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
  <BriefcaseMedical className="size-7" />
</span>{t('doctorProfile.professionalTitle')}</CardTitle><p className="text-xs leading-5 text-muted-foreground">{isEditing ? t('doctorProfile.editingHint') : t('doctorProfile.professionalDescription')}</p></CardHeader>
                  <CardContent>
                    {(formError || updateProfile.error) && <Notice message={formError || getErrorMessage(updateProfile.error)} />}
                    {profileSuccess && <Notice tone="success" message={profileSuccess} />}
                    <form className="mt-5 grid gap-5" onSubmit={handleProfileSubmit}>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <FormField id="doctorTitle" label={t('doctorProfile.clinicalTitle')} value={displayedForm.title} onChange={(event) => updateField('title', event.target.value)} maxLength={50} disabled={!isEditing} placeholder={t('doctorProfile.clinicalTitlePlaceholder')} />
                        <FormField id="experienceYears" label={t('doctorProfile.experience')} type="number" min={0} max={100} step={1} value={displayedForm.experienceYears} onChange={(event) => updateField('experienceYears', event.target.value)} disabled={!isEditing} placeholder="0" />
                        <FormField id="dateOfBirth" label={t('doctorProfile.dateOfBirth')} type="date" max={today} value={displayedForm.dateOfBirth} onChange={(event) => updateField('dateOfBirth', event.target.value)} disabled={!isEditing} />
                        <div className="grid gap-2"><Label className="text-xs font-semibold text-foreground/80">{t('doctorProfile.gender')}</Label><Select items={genders.data?.map((gender) => ({ value: String(gender.id), label: gender.name })) ?? []} value={displayedForm.gender} onValueChange={(value) => updateField('gender', value)} disabled={!isEditing || genders.isLoading || genders.isError}><SelectTrigger className="h-12 w-full rounded-xl border border-input bg-background/40 px-3 text-foreground"><UserRound className="size-[18px] text-primary/70" /><SelectValue placeholder={genders.isLoading ? t('doctorProfile.loadingGenders') : t('doctorProfile.chooseGender')} /></SelectTrigger><SelectContent className="rounded-xl border border-border bg-popover">{genders.data?.map((gender) => <SelectItem className="rounded-lg" key={gender.id} value={String(gender.id)}>{gender.name}</SelectItem>)}</SelectContent></Select>{genders.isError && <small className="text-[11px] text-destructive">{t('doctorProfile.gendersError')}</small>}</div>
                      </div>
                      <div className="grid gap-2"><Label htmlFor="doctorBio" className="text-xs font-semibold text-foreground/80">{t('doctorProfile.bio')}</Label><textarea id="doctorBio" className="min-h-48 resize-y rounded-xl border border-input bg-background/40 p-3 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/10 disabled:opacity-60" value={displayedForm.bio} onChange={(event) => updateField('bio', event.target.value)} maxLength={1000} disabled={!isEditing} placeholder={t('doctorProfile.bioPlaceholder')} /><small className="text-end text-[10px] text-muted-foreground">{displayedForm.bio.length}/1000</small></div>
                      {isEditing && <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" className="rounded-xl normal-case" onClick={cancelEditing} disabled={updateProfile.isPending}>{t('doctorProfile.cancel')}</Button><Button type="submit" className="rounded-xl normal-case" disabled={updateProfile.isPending || genders.isError}>{updateProfile.isPending ? <LoaderCircle className="animate-spin" /> : <Save />}{t('doctorProfile.save')}</Button></div>}
                    </form>
                  </CardContent>
                </Card>

                <div className="grid content-start gap-5">
                  <Card className="rounded-2xl border border-border bg-card"><CardHeader className="!pb-3 border-b border-border/40"><CardTitle className="flex items-center gap-2 font-sans text-xl font-bold normal-case tracking-normal"><span className="grid size-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
  <Building2 className="size-7" />
</span>{t('doctorProfile.clinicsTitle')}<Badge className="ms-auto px-2.5 py-1 text-sm font-semibold text-muted-foreground">{clinics.data?.length ?? 0}</Badge></CardTitle></CardHeader><CardContent className="grid gap-3">{clinics.isLoading && <LoaderCircle className="animate-spin text-primary" />}{clinics.data?.slice(0, 3).map((clinic) => <Link className="flex items-center gap-3 rounded-xl border border-border bg-background/35 p-3 text-xs font-semibold transition hover:border-primary/30" key={clinic.id} to="/doctor/clinics/$clinicId" params={{ clinicId: String(clinic.id) }}><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Building2 className="size-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm">{clinic.name}</span><small className="block text-[10px] font-normal text-muted-foreground">{clinic.regionName}</small></span></Link>)}{clinics.data?.length === 0 && <p className="text-xs leading-5 text-muted-foreground">{t('doctorProfile.noClinics')}</p>}<Button className="h-11 rounded-xl text-sm font-bold normal-case" render={<Link to="/doctor/clinics" />}>{t('doctorProfile.manageClinics')}</Button></CardContent></Card>

                  <Card className="rounded-2xl border border-border bg-card"><CardHeader className="!pb-3 border-b border-border/40"><CardTitle className="flex items-center gap-2 font-sans text-xl font-bold normal-case tracking-normal"><span className="grid size-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
  <UserRound className="size-7" />
</span>{t('doctorProfile.accountTitle')}</CardTitle></CardHeader><CardContent className="grid gap-3"><ReadOnlyField icon={<Mail className="size-4" />} label={t('doctorProfile.email')} value={profile.data.email} /><ReadOnlyField icon={<Phone className="size-4" />} label={t('doctorProfile.phone')} value={profile.data.phoneNumber} /><ReadOnlyField icon={<Stethoscope className="size-4" />} label={t('doctorProfile.specialty')} value={profile.data.medicalSpecialtyName} /><ReadOnlyField icon={<FileBadge className="size-4" />} label={t('doctorProfile.syndicateNumber')} value={profile.data.syndicateNumber} /><p className="text-[10px] leading-4 text-muted-foreground">{t('doctorProfile.readOnlyHint')}</p></CardContent></Card>

                  <Card className="rounded-2xl border border-border bg-card"><CardHeader className="!pb-3 border-b border-border/40"><CardTitle className="flex items-center gap-2 font-sans text-xl font-bold normal-case tracking-normal"><span className="grid size-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
  <Camera className="size-7" />
</span>{t('doctorProfile.pictureTitle')}</CardTitle></CardHeader><CardContent className="grid gap-3">{(pictureError || updatePicture.error) && <Notice message={pictureError || getErrorMessage(updatePicture.error)} />}{pictureSuccess && <Notice tone="success" message={pictureSuccess} />}<Label htmlFor="profilePicture" className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-primary/30 bg-primary/4 p-4 transition hover:bg-primary/8"><Input id="profilePicture" className="sr-only" type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handlePictureChange} /><span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><Upload className="size-4" /></span><span className="grid min-w-0"><strong className="truncate text-xs">{pictureFile?.name || t('doctorProfile.choosePicture')}</strong><small className="text-[10px] font-normal text-muted-foreground">{t('doctorProfile.pictureRules')}</small></span></Label><Button className="h-11 rounded-xl bg-primary text-sm font-bold normal-case text-primary-foreground hover:bg-primary/90" disabled={!pictureFile || updatePicture.isPending} onClick={() => pictureFile && updatePicture.mutate(pictureFile)}>{updatePicture.isPending ? <LoaderCircle className="animate-spin" /> : <Camera />}{t('doctorProfile.updatePicture')}</Button></CardContent></Card>

                  <Card className="rounded-2xl border border-border bg-card"><CardHeader className="!pb-3 border-b border-border/40"><CardTitle className="flex items-center gap-2 font-sans text-xl font-bold normal-case tracking-normal"><span className="grid size-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
  <ShieldCheck className="size-7" />
</span>{t('doctorProfile.verificationTitle')}</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-3"><a className="grid min-h-24 place-items-center gap-2 rounded-xl border border-border bg-background/35 p-3 text-center text-xs font-semibold transition hover:border-primary/40" href={profile.data.syndicateCardImageUrl} target="_blank" rel="noreferrer"><FileText className="size-5 text-primary" />{t('doctorProfile.syndicateCard')}</a><a className="grid min-h-24 place-items-center gap-2 rounded-xl border border-border bg-background/35 p-3 text-center text-xs font-semibold transition hover:border-primary/40" href={profile.data.nationalIdImageUrl} target="_blank" rel="noreferrer"><FileText className="size-5 text-primary" />{t('doctorProfile.nationalId')}</a><p className="col-span-2 text-[10px] leading-4 text-muted-foreground">{t('doctorProfile.documentsHint')}</p></CardContent></Card>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
