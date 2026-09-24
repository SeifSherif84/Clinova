import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft, BadgeCheck, Building2, CalendarClock, Camera, CircleDollarSign, Crown, ExternalLink, Landmark, LoaderCircle, MailPlus, MapPin, PencilLine, Phone, Plus, RefreshCw, Save, Stethoscope, Trash2, TriangleAlert, UploadCloud, UserMinus, UsersRound, WalletCards} from 'lucide-react'
import { useEffect, useMemo, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import ConfirmationDialog from '@/components/confirmation-dialog'
import DoctorWorkspaceShell from '@/components/doctor-workspace-shell'
import FormField from '@/components/form-field'
import Notice from '@/components/notice'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApi } from '@/hooks/use-api'
import { useAuth } from '@/hooks/use-auth'
import { getErrorMessage } from '@/lib/api'
import type { ClinicDetails, ClinicMember, UpdateClinicRequest } from '@/types/clinic'

const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/webp']
const maxImageSize = 5 * 1024 * 1024
const phonePattern = /^01[0125]\d{8}$/

interface ClinicEditForm {
  name: string
  streetName: string
  buildingNumber: string
  landmark: string
  googleMapsUrl: string
  consultationFee: string
  depositPercentage: string
}

type ClinicConfirmation =
  | { type: 'remove-member'; memberId: string; memberName: string }
  | { type: 'delete-image'; imageId: number; imageNumber: number }
  | { type: 'delete-phone'; phoneNumberId: number; phoneNumber: string }
  | { type: 'delete-clinic' }
  | { type: 'leave-clinic' }

function toEditForm(clinic: ClinicDetails): ClinicEditForm {
  return { name: clinic.name, streetName: clinic.streetName, buildingNumber: clinic.buildingNumber, landmark: clinic.landmark ?? '', googleMapsUrl: clinic.googleMapsUrl ?? '', consultationFee: String(clinic.consultationFee), depositPercentage: String(clinic.depositPercentage) }
}

export default function ClinicDetailsPage() {
  const { t, i18n } = useTranslation()
  const { clinicId } = useParams({ from: '/doctor/clinics/$clinicId' })
  const numericClinicId = Number(clinicId)
  const api = useApi()
  const auth = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<ClinicEditForm | null>(null)
  const [newPhone, setNewPhone] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [newImages, setNewImages] = useState<File[]>([])
  const [localError, setLocalError] = useState('')
  const [success, setSuccess] = useState('')
  const [confirmation, setConfirmation] = useState<ClinicConfirmation | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const previews = useMemo(() => newImages.map((file) => ({ file, url: URL.createObjectURL(file) })), [newImages])
  useEffect(() => () => previews.forEach((item) => URL.revokeObjectURL(item.url)), [previews])

  const details = useQuery({ queryKey: ['doctor', 'clinics', numericClinicId], queryFn: () => api.request<ClinicDetails>(`/api/clinics/${numericClinicId}`, {}, { notifyOnError: false }), enabled: Number.isInteger(numericClinicId) && numericClinicId > 0 })
  const members = useQuery({ queryKey: ['doctor', 'clinics', numericClinicId, 'members'], queryFn: () => api.request<ClinicMember[]>(`/api/clinics/${numericClinicId}/members`, {}, { notifyOnError: false }), enabled: Number.isInteger(numericClinicId) && numericClinicId > 0 })
  const currentMember = members.data?.find((member) => member.id === auth.user?.id)
  const isOwner = Boolean(currentMember?.isOwner)
  const money = useMemo(() => new Intl.NumberFormat(i18n.resolvedLanguage === 'ar' ? 'ar-EG' : 'en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 2 }), [i18n.resolvedLanguage])

  async function refreshClinic() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['doctor', 'clinics'] }),
      queryClient.invalidateQueries({ queryKey: ['doctor', 'clinics', numericClinicId] }),
    ])
  }

  const updateClinic = useMutation({
    mutationFn: (body: UpdateClinicRequest) => api.request<string>(`/api/clinics/${numericClinicId}`, { method: 'PATCH', body: JSON.stringify(body) }, { notifyOnError: false }),
    onSuccess: async (message) => { setSuccess(message); setIsEditing(false); await refreshClinic() },
  })
  const addPhone = useMutation({
    mutationFn: (phoneNumber: string) => api.request<string>(`/api/clinics/${numericClinicId}/phone-numbers`, { method: 'POST', body: JSON.stringify({ phoneNumber }) }, { notifyOnError: false }),
    onSuccess: async (message) => { setSuccess(message); setNewPhone(''); await refreshClinic() },
  })
  const addImages = useMutation({
    mutationFn: (files: File[]) => { const body = new FormData(); files.forEach((file) => body.append('Images', file)); return api.request<string>(`/api/clinics/${numericClinicId}/images`, { method: 'POST', body }, { notifyOnError: false }) },
    onSuccess: async (message) => { setSuccess(message); setNewImages([]); await refreshClinic() },
  })
  const deleteImage = useMutation({
    mutationFn: (imageId: number) => api.request<string>('/api/clinics/' + numericClinicId + '/images/' + imageId, { method: 'DELETE' }, { notifyOnError: false }),
    onSuccess: async (message) => { setConfirmation(null); setSuccess(message); setNewImages([]); await refreshClinic() },
  })
  const deletePhone = useMutation({
    mutationFn: (phoneNumberId: number) => api.request<string>('/api/clinics/' + numericClinicId + '/phone-numbers/' + phoneNumberId, { method: 'DELETE' }, { notifyOnError: false }),
    onSuccess: async (message) => { setConfirmation(null); setSuccess(message); await refreshClinic() },
  })
  const sendInvitation = useMutation({
    mutationFn: (email: string) => api.request<string>(`/api/invitations/send/clinic/${numericClinicId}`, { method: 'POST', body: JSON.stringify({ email }) }, { notifyOnError: false }),
    onSuccess: async () => {
      setSuccess(t('clinicDetails.inviteSuccess'))
      setInviteEmail('')
      await queryClient.invalidateQueries({ queryKey: ['doctor', 'invitations', 'sent'] })
    },
  })
  const removeMember = useMutation({
    mutationFn: (memberId: string) => api.request<string>(`/api/clinics/${numericClinicId}/members/${memberId}`, { method: 'DELETE' }, { notifyOnError: false }),
    onSuccess: async (message) => { setConfirmation(null); setSuccess(message); await queryClient.invalidateQueries({ queryKey: ['doctor', 'clinics', numericClinicId, 'members'] }) },
  })
  const deleteClinic = useMutation({
    mutationFn: () => api.request<string>(`/api/clinics/${numericClinicId}`, { method: 'DELETE' }, { notifyOnError: false }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['doctor', 'clinics'] }); navigate({ to: '/doctor/clinics' }) },
  })
  const leaveClinic = useMutation({
    mutationFn: () => api.request<string>(`/api/clinics/${numericClinicId}/members/me`, { method: 'DELETE' }, { notifyOnError: false }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['doctor', 'clinics'] }); navigate({ to: '/doctor/clinics' }) },
  })

  const actionError = updateClinic.error || addPhone.error || addImages.error || sendInvitation.error
  const confirmationMutation = confirmation?.type === 'remove-member'
    ? removeMember
    : confirmation?.type === 'delete-image'
      ? deleteImage
      : confirmation?.type === 'delete-phone'
        ? deletePhone
        : confirmation?.type === 'delete-clinic'
          ? deleteClinic
          : leaveClinic
  const confirmationCopy = confirmation?.type === 'remove-member'
    ? {
        title: t('clinicDetails.removeMemberConfirmTitle'),
        description: t('clinicDetails.removeMemberConfirm', { name: confirmation.memberName }),
        confirmLabel: t('clinicDetails.removeMember'),
        cancelLabel: t('clinicDetails.keepMember'),
      }
    : confirmation?.type === 'delete-image'
      ? {
          title: t('clinicDetails.deleteImageConfirmTitle'),
          description: t('clinicDetails.deleteImageConfirm', { number: confirmation.imageNumber }),
          confirmLabel: t('clinicDetails.deleteImage'),
          cancelLabel: t('clinicDetails.notNow'),
        }
      : confirmation?.type === 'delete-phone'
        ? {
            title: t('clinicDetails.deletePhoneConfirmTitle'),
            description: t('clinicDetails.deletePhoneConfirm', { phone: confirmation.phoneNumber }),
            confirmLabel: t('clinicDetails.deletePhone'),
            cancelLabel: t('clinicDetails.notNow'),
          }
        : confirmation?.type === 'delete-clinic'
          ? {
              title: t('clinicDetails.deleteConfirmTitle'),
              description: t('clinicDetails.deleteConfirm'),
              confirmLabel: t('clinicDetails.deleteClinic'),
              cancelLabel: t('clinicDetails.notNow'),
            }
          : {
              title: t('clinicDetails.leaveConfirmTitle'),
              description: t('clinicDetails.leaveConfirm'),
              confirmLabel: t('clinicDetails.leaveClinic'),
              cancelLabel: t('clinicDetails.notNow'),
            }

  function updateEditField<Key extends keyof ClinicEditForm>(key: Key, value: ClinicEditForm[Key]) {
    setEditForm((current) => current ? { ...current, [key]: value } : current)
  }

  function startEditing() {
    if (details.data) setEditForm(toEditForm(details.data))
    setLocalError('')
    setSuccess('')
    setIsEditing(true)
  }

  function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editForm) return
    setLocalError('')
    setSuccess('')
    updateClinic.mutate({ ...editForm, consultationFee: Number(editForm.consultationFee), depositPercentage: Number(editForm.depositPercentage) })
  }

  function processImages(files: File[]) {
    if (!files.length) return
    const remaining = 6 - (details.data?.images.length ?? 0)
    const merged = [...newImages, ...files]
    setLocalError('')
    if (merged.length > remaining) { setLocalError(t('clinicDetails.imageCapacityError', { count: remaining })); return }
    const invalid = files.find((file) => !acceptedImageTypes.includes(file.type) || file.size > maxImageSize)
    if (invalid) { setLocalError(t(invalid.size > maxImageSize ? 'validation.imageSize' : 'validation.imageType')); return }
    setNewImages(merged)
  }

  function selectImages(event: ChangeEvent<HTMLInputElement>) {
    processImages(Array.from(event.target.files ?? []))
    event.target.value = ''
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setIsDragging(false)
    processImages(Array.from(event.dataTransfer.files))
  }

  // function removeNewImage(index: number) {
  //   setNewImages((current) => current.filter((_, i) => i !== index))
  // }

  function submitPhone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLocalError('')
    setSuccess('')
    const phone = newPhone.trim()
    if (!phonePattern.test(phone)) return setLocalError(t('clinicForm.phoneError'))
    if (details.data?.phoneNumbers.some((item) => item.phoneNumber === phone)) return setLocalError(t('clinicForm.phoneDuplicate'))
    addPhone.mutate(phone)
  }

  function submitInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLocalError('')
    setSuccess('')
    const email = inviteEmail.trim()
    if (!email) return
    sendInvitation.mutate(email)
  }

  function executeConfirmedAction() {
    if (!confirmation) return
    if (confirmation.type === 'remove-member') {
      removeMember.mutate(confirmation.memberId)
      return
    }
    if (confirmation.type === 'delete-image') {
      deleteImage.mutate(confirmation.imageId)
      return
    }
    if (confirmation.type === 'delete-phone') {
      deletePhone.mutate(confirmation.phoneNumberId)
      return
    }
    if (confirmation.type === 'delete-clinic') {
      deleteClinic.mutate()
      return
    }
    leaveClinic.mutate()
  }

  if (!Number.isInteger(numericClinicId) || numericClinicId <= 0) {
    return <DoctorWorkspaceShell active="clinics"><div className="p-10"><Notice message={t('clinicDetails.invalidId')} /></div></DoctorWorkspaceShell>
  }

  return (
    <DoctorWorkspaceShell active="clinics">
      <div className="mx-auto min-w-0 w-full max-w-7xl p-4 sm:p-6 lg:p-10">
        <Link className="inline-flex text-sm font-bold text-muted-foreground transition hover:text-foreground" to="/doctor/clinics">{t('clinicDetails.back')}</Link>
        {details.isLoading && <Card className="mt-6 min-h-80 items-center justify-center rounded-3xl border border-border bg-card"><LoaderCircle className="size-7 animate-spin text-primary" />{t('clinicDetails.loading')}</Card>}
        {details.isError && <Card className="mt-6 items-center rounded-3xl border border-destructive/20 p-8 text-center"><p className="text-sm text-destructive">{getErrorMessage(details.error)}</p><Button variant="outline" className="rounded-xl normal-case cursor-pointer" onClick={() => details.refetch()}><RefreshCw />{t('clinics.retry')}</Button></Card>}

        {details.data && (
          <div className="mt-5 min-w-0 grid gap-5">
<Card className="relative min-h-60 min-w-0 justify-end overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/12 via-card to-primary/5 p-6 sm:p-8">
  <div className="pointer-events-none absolute inset-0">
    <span className="absolute -top-16 -right-10 size-64 rounded-full bg-primary/10 blur-2xl" />
    <span className="absolute -bottom-24 left-1/3 size-72 rounded-full bg-warm/8 blur-3xl" />
    <svg className="absolute inset-0 size-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="clinicGrid" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.4" fill="currentColor" className="text-primary" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#clinicGrid)" />
    </svg>
  </div>
              <div className="relative z-10 flex min-w-0 flex-wrap items-end justify-between gap-5"><div className="min-w-0 flex-1"><Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-primary uppercase">
  <Building2 className="size-3" />
  {isOwner ? t('clinicDetails.owner') : t('clinicDetails.member')}
</Badge><h1 className="mt-3 break-words font-sans text-3xl font-bold sm:text-5xl">{details.data.name}</h1><p className="mt-3 flex min-w-0 items-start gap-2 break-words text-xs font-bold text-muted-foreground"><MapPin className="size-4 shrink-0 text-primary" />{details.data.buildingNumber} {details.data.streetName}, {details.data.regionName}{details.data.landmark ? ` · ${details.data.landmark}` : ''}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" className="h-11 rounded-xl text-sm font-bold normal-case" render={<Link to="/doctor/working-hours" search={{ clinicId: numericClinicId }} />}><CalendarClock />{t('dashboard.workingHours')}</Button>{details.data.googleMapsUrl && <Button variant="outline" className="h-11 rounded-xl text-sm font-bold normal-case" render={<a href={details.data.googleMapsUrl} target="_blank" rel="noreferrer" />}><MapPin />{t('clinicDetails.openMap')}<ExternalLink className="size-3.5" /></Button>}{isOwner && !isEditing && <Button className="h-11 rounded-xl bg-primary text-sm font-bold normal-case text-primary-foreground hover:bg-primary/90 cursor-pointer" onClick={startEditing}><PencilLine />{t('clinicDetails.edit')}</Button>}</div></div>
            </Card>

            {(localError || actionError) && <Notice message={localError || getErrorMessage(actionError)} />}
            {success && <Notice tone="success" message={success} />}

            <div className="min-w-0 grid items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,1fr)]">
              <div className="min-w-0 grid gap-5">
                <Card className="min-w-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0">
  <div className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-primary/15 via-primary/[0.05] to-transparent p-5">
    <span className="pointer-events-none absolute -end-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" />
    <div className="relative flex items-center gap-3.5">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10">
        <Building2 className="size-6" />
      </span>
      <h3 className="min-w-0 flex-1 truncate font-sans text-xl font-bold">{t('clinicDetails.information')}</h3>
    </div>
  </div>
                  <CardContent className="p-5">
                    {isEditing && editForm ? (
                      <form className="grid gap-5" onSubmit={submitEdit}><div className="grid min-w-0 gap-5 rounded-2xl border border-border/60 bg-muted/30 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:p-5"><FormField className="sm:col-span-2" id="editClinicName" label={t('clinicForm.name')} value={editForm.name} onChange={(event) => updateEditField('name', event.target.value)} maxLength={100} required /><FormField id="editStreet" label={t('clinicForm.street')} value={editForm.streetName} onChange={(event) => updateEditField('streetName', event.target.value)} maxLength={150} required /><FormField id="editBuilding" label={t('clinicForm.building')} value={editForm.buildingNumber} onChange={(event) => updateEditField('buildingNumber', event.target.value)} maxLength={10} required /><FormField id="editLandmark" label={t('clinicForm.landmark')} value={editForm.landmark} onChange={(event) => updateEditField('landmark', event.target.value)} maxLength={100} /><FormField id="editMaps" label={t('clinicForm.mapsUrl')} type="url" value={editForm.googleMapsUrl} onChange={(event) => updateEditField('googleMapsUrl', event.target.value)} maxLength={500} /><FormField id="editFee" label={t('clinicForm.consultationFee')} type="number" min={0} max={100000} step="0.01" value={editForm.consultationFee} onChange={(event) => updateEditField('consultationFee', event.target.value)} required /><FormField id="editDeposit" label={t('clinicForm.depositPercentage')} type="number" min={1} max={100} step="0.01" value={editForm.depositPercentage} onChange={(event) => updateEditField('depositPercentage', event.target.value)} required /></div><p className="text-[13px] font-semibold text-muted-foreground">{t('clinicDetails.regionEditGap')}</p><div className="flex justify-end gap-2 border-t border-border/50 pt-5"><Button type="button" variant="outline" className="rounded-xl normal-case cursor-pointer" onClick={() => setIsEditing(false)}>{t('clinicForm.cancel')}</Button><Button type="submit" className="rounded-xl normal-case cursor-pointer" disabled={updateClinic.isPending}>{updateClinic.isPending ? <LoaderCircle className="animate-spin" /> : <Save />}{t('clinicDetails.save')}</Button></div></form>
                    ) : (
                      <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
  <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/45 p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5">
    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><MapPin className="size-4.5" /></span>
    <span className="grid gap-0.5"><small className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t('clinicForm.region')}</small><strong className="text-sm">{details.data.regionName}</strong></span>
  </div>
  <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/45 p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5">
    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Landmark className="size-4.5" /></span>
    <span className="grid gap-0.5"><small className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t('clinicForm.landmark')}</small><strong className="text-sm">{details.data.landmark || '—'}</strong></span>
  </div>
  <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/45 p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5">
    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><CircleDollarSign className="size-4.5" /></span>
    <span className="grid gap-0.5"><small className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t('clinics.consultation')}</small><strong className="text-sm">{money.format(details.data.consultationFee)}</strong></span>
  </div>
  <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/45 p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5">
    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><WalletCards className="size-4.5" /></span>
    <span className="grid gap-0.5"><small className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t('clinics.deposit')}</small><strong className="text-sm">{details.data.depositPercentage}%</strong></span>
  </div>
</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="min-w-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0">
  <div className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-primary/15 via-primary/[0.05] to-transparent p-5">
    <span className="pointer-events-none absolute -end-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" />
    <div className="relative flex items-center gap-3.5">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10">
        <Camera className="size-6" />
      </span>
      <h3 className="min-w-0 flex-1 truncate font-sans text-xl font-bold">{t('clinicDetails.gallery')}</h3>
      <Badge className="px-2.5 py-1 text-sm font-bold text-foreground">{details.data.images.length}/6</Badge>
    </div>
  </div>
<CardContent className="grid gap-4 p-5">
  {details.data.images.length ? (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {details.data.images.map((image, index) => (
        <div className="relative grid gap-2 rounded-2xl border border-border/60 bg-background/40 p-2" key={image.id}>
          <a href={image.url} target="_blank" rel="noreferrer">
            <img className="aspect-video size-full rounded-xl object-cover" src={image.url} alt={t('clinicDetails.imageAlt', { number: index + 1 })} />
          </a>
{isOwner && (
  <Button
    type="button"
    variant="destructive"
    size="icon"
    className="absolute end-3 top-3 size-9 cursor-pointer rounded-full border border-white/40 bg-black/45 text-white shadow-md backdrop-blur-sm transition hover:border-[#c98a82]/60 hover:bg-[#b5645a] hover:text-white"
    aria-label={t('clinicDetails.deleteImage')}
    disabled={deleteImage.isPending}
    onClick={() => {
      deleteImage.reset()
      setSuccess('')
      setConfirmation({ type: 'delete-image', imageId: image.id, imageNumber: index + 1 })
    }}
  >
    {deleteImage.isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
  </Button>
)}
        </div>
      ))}
    </div>
  ) : <p className="text-xs font-bold text-muted-foreground">{t('clinicDetails.noImages')}</p>}
  {isOwner && details.data.images.length < 6 && (
    <div className="grid gap-3.5">
      <Label
        htmlFor="addClinicImages"
        onDragOver={(event) => { event.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed px-4 py-4 transition ${isDragging ? 'border-primary bg-primary/10' : 'border-primary/30 bg-primary/[0.03] hover:border-primary/60 hover:bg-primary/5'}`}
      >
        <Input className="sr-only" id="addClinicImages" type="file" multiple accept=".jpg,.jpeg,.png,.webp" onChange={selectImages} />
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-4 ring-primary/5">
          <UploadCloud className="size-6" />
        </span>
        <span className="grid min-w-0 flex-1 gap-0.5">
          <strong className="truncate text-sm font-bold">{newImages.length ? t('clinicForm.imagesSelected', { count: newImages.length }) : t('clinicDetails.addImages')}</strong>
          <small className="truncate text-[11px] text-muted-foreground">{t('clinicForm.imageRules')}</small>
        </span>
        <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {newImages.length}/{6 - details.data.images.length}
        </span>
      </Label>

      <Button className="h-10 w-fit rounded-xl bg-primary px-5 text-sm font-bold normal-case text-primary-foreground hover:bg-primary/90 cursor-pointer" disabled={!newImages.length || addImages.isPending} onClick={() => addImages.mutate(newImages)}>
        {addImages.isPending ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <Plus />}
        {t('clinicDetails.uploadImages')}
      </Button>
    </div>
  )}
</CardContent></Card>

<Card className="min-w-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0">
  <div className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-primary/15 via-primary/[0.05] to-transparent p-5">
    <span className="pointer-events-none absolute -end-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" />
    <div className="relative flex items-center gap-3.5">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10">
        <UsersRound className="size-6" />
      </span>
      <h3 className="min-w-0 flex-1 truncate font-sans text-xl font-bold">{t('clinicDetails.members')}</h3>
      <Badge className="px-2.5 py-1 text-sm font-bold text-foreground">{members.data?.length ?? 0}</Badge>
    </div>
  </div>
<CardContent className="grid gap-4 p-5 sm:grid-cols-2">
  {members.isLoading && <LoaderCircle className="animate-spin text-primary" />}
  {members.error && <Notice message={getErrorMessage(members.error)} />}
  {members.data?.map((member) => (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-primary/15 bg-primary/[0.06] transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg sm:[&:last-child:nth-child(odd)]:col-span-2" key={member.id}>
      <div className="relative h-16">
        {isOwner && !member.isOwner && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute end-3 top-3 size-9 cursor-pointer rounded-full border border-foreground/15 bg-foreground/10 text-foreground shadow-sm transition hover:border-[#c98a82]/50 hover:bg-[#f6e6e3] hover:text-[#b5645a] dark:hover:border-[#c98a82]/30 dark:hover:bg-[#c98a82]/15 dark:hover:text-[#d9968d]"
            aria-label={t('clinicDetails.removeMember')}
            disabled={removeMember.isPending}
            onClick={() => { removeMember.reset(); setSuccess(''); setConfirmation({ type: 'remove-member', memberId: member.id, memberName: member.fullName }) }}
          >
            {removeMember.isPending ? <LoaderCircle className="size-4 animate-spin" /> : <UserMinus className="size-4" />}
          </Button>
        )}
      </div>

      <div className="-mt-10 flex flex-1 flex-col items-center gap-3 px-4 pb-5 text-center">
        <div className="relative">
          <span className="grid size-20 place-items-center overflow-hidden rounded-2xl border-4 border-card bg-primary/10 text-2xl font-bold text-primary shadow-md">
            {member.profilePicture ? <img className="size-full object-cover" src={member.profilePicture} alt="" /> : member.fullName.charAt(0)}
          </span>
          {member.isOwner && (
            <span className="absolute -end-2 -bottom-2 grid size-7 place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow">
              <Crown className="size-3.5" />
            </span>
          )}
        </div>

        <div className="min-w-0 max-w-full">
          <strong className="block truncate text-base font-bold">{member.fullName}</strong>
          <small className="mt-0.5 block min-h-4 truncate text-xs font-semibold text-muted-foreground">{member.title}</small>
        </div>

        <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
          <Stethoscope className="size-3.5 shrink-0" />
          <span className="truncate">{member.medicalSpecialty}</span>
        </span>

        <div className="mt-auto pt-1">
          {member.isOwner ? (
            <Badge className="rounded-full border border-primary/20 bg-primary px-3 py-1 text-[10px] font-bold tracking-wider text-primary-foreground uppercase [&>svg]:size-3.5!">
              <BadgeCheck />
              {t('clinicDetails.owner')}
            </Badge>
          ) : (
            <Badge className="rounded-full border border-border bg-muted px-3 py-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              {t('clinicDetails.member')}
            </Badge>
          )}
        </div>
      </div>
    </div>
  ))}
</CardContent></Card>
              </div>

              <div className="min-w-0 grid gap-5">
                {isOwner && (
                  <Card className="min-w-0 gap-0 overflow-hidden rounded-2xl border border-primary/15 bg-card p-0">
                    <div className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-primary/15 via-primary/[0.05] to-transparent p-5">
                      <span className="pointer-events-none absolute -end-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" />
                      <div className="relative flex items-center gap-3.5">
                        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10">
                          <MailPlus className="size-6" />
                        </span>
                        <h3 className="min-w-0 flex-1 truncate font-sans text-xl font-bold">{t('clinicDetails.inviteTitle')}</h3>
                      </div>
                    </div>
                    <CardContent className="grid gap-4 p-5">
                      <p className="text-xs leading-5 font-bold text-muted-foreground">{t('clinicDetails.inviteDescription')}</p>
                      <form className="grid gap-3" onSubmit={submitInvitation}>
                        <FormField id="inviteDoctorEmail" label={t('clinicDetails.doctorEmail')} type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} maxLength={256} autoComplete="email" placeholder={t('clinicDetails.doctorEmailPlaceholder')} required />
                        <Button type="submit" className="h-11 rounded-xl bg-primary text-sm font-bold normal-case text-primary-foreground hover:bg-primary/90 cursor-pointer" disabled={sendInvitation.isPending}>
                          {sendInvitation.isPending ? <LoaderCircle className="animate-spin" /> : <MailPlus />}
                          {t('clinicDetails.sendInvitation')}
                        </Button>
                      </form>
                      <Link className="text-center text-sm font-semibold text-primary transition hover:text-primary/80" to="/doctor/invitations">{t('clinicDetails.viewInvitations')}</Link>
                    </CardContent>
                  </Card>
                )}

                <Card className="min-w-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0">
  <div className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-primary/15 via-primary/[0.05] to-transparent p-5">
    <span className="pointer-events-none absolute -end-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" />
    <div className="relative flex items-center gap-3.5">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10">
        <Phone className="size-6" />
      </span>
      <h3 className="min-w-0 flex-1 truncate font-sans text-xl font-bold">{t('clinicDetails.phones')}</h3>
      <Badge className="px-2.5 py-1 text-sm font-bold text-foreground">{details.data.phoneNumbers.length}/6</Badge>
    </div>
  </div>
<CardContent className="grid gap-3 p-5">
  {details.data.phoneNumbers.length ? details.data.phoneNumbers.map((phone) => (
    <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-border/60 bg-background/40 p-2 transition hover:-translate-y-0.5 has-[>a:hover]:border-primary/25 has-[>a:hover]:bg-primary/5" key={phone.id}>
      <a className="flex min-w-0 flex-1 items-center gap-3.5 rounded-xl px-2 py-2 text-sm font-bold" href={'tel:' + phone.phoneNumber}>
        <span className="hidden size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary sm:grid"><Phone className="size-4" /></span>
        <span className="truncate">{phone.phoneNumber}</span>
      </a>
{isOwner && (
  <Button
    type="button"
    variant="destructive"
    size="icon"
    className="size-9 shrink-0 cursor-pointer rounded-full border border-foreground/15 bg-foreground/10 text-foreground shadow-sm transition hover:border-[#c98a82]/50 hover:bg-[#f6e6e3] hover:text-[#b5645a] dark:hover:border-[#c98a82]/30 dark:hover:bg-[#c98a82]/15 dark:hover:text-[#d9968d]"
    aria-label={t('clinicDetails.deletePhone')}
    disabled={deletePhone.isPending}
    onClick={() => {
      deletePhone.reset()
      setSuccess('')
      setConfirmation({ type: 'delete-phone', phoneNumberId: phone.id, phoneNumber: phone.phoneNumber })
    }}
  >
    {deletePhone.isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
  </Button>
)}
    </div>
  )) : <p className="text-xs font-bold text-muted-foreground">{t('clinicDetails.noPhones')}</p>}
  {isOwner && details.data.phoneNumbers.length < 6 && (
    <form className="grid gap-3" onSubmit={submitPhone}>
      <FormField id="newClinicPhone" label={t('clinicDetails.addPhone')} type="tel" value={newPhone} onChange={(event) => setNewPhone(event.target.value)} pattern="01[0125][0-9]{8}" placeholder="01xxxxxxxxx" required />
      <Button type="submit" className="h-11 rounded-xl bg-primary text-sm font-bold normal-case text-primary-foreground hover:bg-primary/90 cursor-pointer" disabled={addPhone.isPending}>
        {addPhone.isPending ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <Plus />}
        {t('clinicDetails.savePhone')}
      </Button>
    </form>
  )}
</CardContent></Card>

{currentMember && <Card className="min-w-0 gap-0 overflow-hidden rounded-2xl border border-destructive/25 bg-card p-0">
  <div className="relative overflow-hidden border-b border-destructive/15 bg-gradient-to-br from-destructive/15 via-destructive/[0.05] to-transparent p-5">
    <span className="pointer-events-none absolute -end-8 -top-8 size-32 rounded-full bg-destructive/10 blur-2xl" />
    <div className="relative flex items-center gap-3.5">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-destructive/10 text-destructive shadow-lg ring-4 shadow-destructive/30 ring-destructive/10">
        <TriangleAlert className="size-6" />
      </span>
      <h3 className="min-w-0 flex-1 truncate font-sans text-xl font-bold">{t('clinicDetails.accessTitle')}</h3>
    </div>
  </div>
  <CardContent className="grid gap-4 p-5">
    <p className="text-xs leading-6 font-medium text-muted-foreground sm:text-sm">{isOwner ? t('clinicDetails.deleteDescription') : t('clinicDetails.leaveDescription')}</p>
    {isOwner ? (
      <Button
        type="button"
        variant="destructive"
        className="h-11 cursor-pointer rounded-xl border border-destructive/20 bg-destructive/10 text-sm font-bold normal-case text-destructive shadow-md shadow-destructive/25 transition-all hover:bg-destructive/15 hover:text-destructive hover:shadow-lg hover:shadow-destructive/30 disabled:cursor-not-allowed dark:shadow-none dark:hover:shadow-md dark:hover:shadow-destructive/25"
        disabled={deleteClinic.isPending}
        onClick={() => { deleteClinic.reset(); setConfirmation({ type: 'delete-clinic' }) }}
      >
        {deleteClinic.isPending ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <Trash2 />}
        {t('clinicDetails.deleteClinic')}
      </Button>
    ) : (
      <Button
        type="button"
        variant="outline"
        className="h-11 cursor-pointer rounded-xl border-destructive bg-destructive text-sm font-bold normal-case text-white shadow-md shadow-destructive/25 transition-all hover:bg-destructive/90 hover:text-white hover:shadow-lg hover:shadow-destructive/30 disabled:cursor-not-allowed dark:border-destructive/40 dark:bg-transparent dark:text-destructive dark:shadow-none dark:hover:border-destructive dark:hover:bg-destructive dark:hover:text-white dark:hover:shadow-md dark:hover:shadow-destructive/25"
        disabled={leaveClinic.isPending}
        onClick={() => { leaveClinic.reset(); setConfirmation({ type: 'leave-clinic' }) }}
      >
        {leaveClinic.isPending ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <ArrowLeft className="rtl:rotate-180" />}
        {t('clinicDetails.leaveClinic')}
      </Button>
    )}
  </CardContent>
</Card>}
              </div>
            </div>
          </div>
        )}
      </div>
      <ConfirmationDialog
        open={Boolean(confirmation)}
        title={confirmationCopy.title}
        description={confirmationCopy.description}
        confirmLabel={confirmationCopy.confirmLabel}
        cancelLabel={confirmationCopy.cancelLabel}
        destructive
        pending={confirmationMutation.isPending}
        error={confirmationMutation.error ? getErrorMessage(confirmationMutation.error) : undefined}
        onConfirm={executeConfirmedAction}
        onOpenChange={(open) => {
          if (!open && !confirmationMutation.isPending) {
            setConfirmation(null)
            confirmationMutation.reset()
          }
        }}
      />
    </DoctorWorkspaceShell>
  )
}
