import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Building2, CircleDollarSign, FileImage, LoaderCircle, MapPin, Minus, Phone, Plus, Save, Upload } from 'lucide-react'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import DoctorWorkspaceShell from '@/components/doctor-workspace-shell'
import FormField from '@/components/form-field'
import Notice from '@/components/notice'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useApi } from '@/hooks/use-api'
import { getErrorMessage } from '@/lib/api'
import type { LookupOption } from '@/types/auth'

const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/webp']
const maxImageSize = 5 * 1024 * 1024
const phonePattern = /^01[0125]\d{8}$/

export default function AddClinicPage() {
  const { t } = useTranslation()
  const api = useApi()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [governorateId, setGovernorateId] = useState<string | null>(null)
  const [regionId, setRegionId] = useState<string | null>(null)
  const [phoneNumbers, setPhoneNumbers] = useState([''])
  const [images, setImages] = useState<File[]>([])
  const [formError, setFormError] = useState('')

  const governorates = useQuery({ queryKey: ['lookups', 'governorates'], queryFn: () => api.request<LookupOption[]>('/api/lookups/governorates') })
  const regions = useQuery({
    queryKey: ['lookups', 'regions', governorateId],
    queryFn: () => api.request<LookupOption[]>(`/api/lookups/regions?governorateId=${governorateId}`),
    enabled: Boolean(governorateId),
  })
  const createClinic = useMutation({
    mutationFn: (body: FormData) => api.request<string>('/api/clinics', { method: 'POST', body }, { notifyOnError: false }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['doctor', 'clinics'] })
      navigate({ to: '/doctor/clinics' })
    },
  })

  function changeGovernorate(value: string | null) {
    setGovernorateId(value)
    setRegionId(null)
  }

  function updatePhone(index: number, value: string) {
    setPhoneNumbers((current) => current.map((phone, itemIndex) => itemIndex === index ? value : phone))
  }

  function handleImages(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? [])
    setFormError('')
    if (selected.length > 6) {
      setImages([])
      setFormError(t('clinicForm.imageCountError'))
      event.target.value = ''
      return
    }
    const invalid = selected.find((file) => !acceptedImageTypes.includes(file.type) || file.size > maxImageSize)
    if (invalid) {
      setImages([])
      setFormError(t(invalid.size > maxImageSize ? 'validation.imageSize' : 'validation.imageType'))
      event.target.value = ''
      return
    }
    setImages(selected)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    if (!regionId) return setFormError(t('clinicForm.regionRequired'))
    const phones = phoneNumbers.map((phone) => phone.trim()).filter(Boolean)
    if (phones.some((phone) => !phonePattern.test(phone))) return setFormError(t('clinicForm.phoneError'))
    if (new Set(phones).size !== phones.length) return setFormError(t('clinicForm.phoneDuplicate'))

    const body = new FormData(event.currentTarget)
    body.set('RegionId', regionId)
    body.delete('Images')
    body.delete('PhoneNumbers')
    images.forEach((image) => body.append('Images', image))
    phones.forEach((phone) => body.append('PhoneNumbers', phone))
    createClinic.mutate(body)
  }

  return (
    <DoctorWorkspaceShell active="clinics">
      <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-10">
        <Link className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground" to="/doctor/clinics"><ArrowLeft className="size-4 rtl:rotate-180" />{t('clinicForm.back')}</Link>
        <div className="mt-5">  <Badge className="rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
  {t('clinicForm.eyebrow')}
</Badge><h1 className="mt-2 font-heading text-3xl font-medium sm:text-4xl">{t('clinicForm.title')}</h1><p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground sm:text-sm">{t('clinicForm.description')}</p></div>

        <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
          {(formError || createClinic.error) && <Notice message={formError || getErrorMessage(createClinic.error)} />}

          <Card className="rounded-2xl border border-border bg-card">
            <CardHeader className="border-b border-border !pb-3"><CardTitle className="flex items-center gap-2 font-heading text-xl font-bold normal-case tracking-normal"><span className="grid size-10 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
  <Building2 className="size-7" />
</span>{t('clinicForm.identityTitle')}</CardTitle></CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <FormField className="sm:col-span-2" id="clinicName" name="Name" label={t('clinicForm.name')} maxLength={100} required placeholder={t('clinicForm.namePlaceholder')} />
              <FormField id="streetName" name="StreetName" label={t('clinicForm.street')} maxLength={150} required placeholder={t('clinicForm.streetPlaceholder')} />
              <FormField id="buildingNumber" name="BuildingNumber" label={t('clinicForm.building')} maxLength={10} required placeholder="12A" />
              <FormField id="landmark" name="Landmark" label={t('clinicForm.landmark')} maxLength={100} placeholder={t('clinicForm.landmarkPlaceholder')} />
              <FormField id="googleMapsUrl" name="GoogleMapsUrl" label={t('clinicForm.mapsUrl')} type="url" maxLength={500} placeholder="https://maps.google.com/..." />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card">
            <CardHeader className="border-b border-border !pb-3"><CardTitle className="flex items-center gap-2 font-heading text-xl font-bold normal-case tracking-normal"><span className="grid size-10 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
  <MapPin className="size-7" />
</span>{t('clinicForm.locationTitle')}</CardTitle></CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2"><Label className="text-xs font-semibold text-foreground/80">{t('clinicForm.governorate')}</Label><Select items={governorates.data?.map((item) => ({ value: String(item.id), label: item.name })) ?? []} value={governorateId} onValueChange={changeGovernorate} disabled={governorates.isLoading || governorates.isError}><SelectTrigger className="h-12 w-full rounded-xl border border-input bg-background/40 px-3"><SelectValue placeholder={governorates.isLoading ? t('clinicForm.loading') : t('clinicForm.chooseGovernorate')} /></SelectTrigger><SelectContent className="rounded-xl border border-border bg-popover">{governorates.data?.map((item) => <SelectItem className="rounded-lg" key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2"><Label className="text-xs font-semibold text-foreground/80">{t('clinicForm.region')}</Label><Select items={regions.data?.map((item) => ({ value: String(item.id), label: item.name })) ?? []} value={regionId} onValueChange={setRegionId} disabled={!governorateId || regions.isLoading || regions.isError}><SelectTrigger className="h-12 w-full rounded-xl border border-input bg-background/40 px-3"><SelectValue placeholder={regions.isLoading ? t('clinicForm.loading') : t('clinicForm.chooseRegion')} /></SelectTrigger><SelectContent className="rounded-xl border border-border bg-popover">{regions.data?.map((item) => <SelectItem className="rounded-lg" key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select></div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card">
            <CardHeader className="border-b border-border !pb-3"><CardTitle className="flex items-center gap-2 font-heading text-xl font-bold normal-case tracking-normal"><span className="grid size-10 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
  <CircleDollarSign className="size-7" />
</span>{t('clinicForm.billingTitle')}</CardTitle></CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2"><FormField id="consultationFee" name="ConsultationFee" label={t('clinicForm.consultationFee')} type="number" min={0} max={100000} step="0.01" required placeholder="500" /><FormField id="depositPercentage" name="DepositPercentage" label={t('clinicForm.depositPercentage')} type="number" min={1} max={100} step="0.01" required placeholder="25" /></CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card">
            <CardHeader className="border-b border-border !pb-3"><CardTitle className="flex items-center gap-2 font-heading text-xl font-bold normal-case tracking-normal"><span className="grid size-10 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
  <Phone className="size-7" />
</span>{t('clinicForm.phonesTitle')}</CardTitle><p className="text-xs text-muted-foreground">{t('clinicForm.phonesHint')}</p></CardHeader>
            <CardContent className="grid gap-3">
              {phoneNumbers.map((phone, index) => <div className="flex items-end gap-2" key={index}><FormField className="flex-1" id={`clinicPhone${index}`} label={t('clinicForm.phoneLabel', { number: index + 1 })} type="tel" value={phone} onChange={(event) => updatePhone(index, event.target.value)} pattern="01[0125][0-9]{8}" placeholder="01xxxxxxxxx" /><Button type="button" variant="outline" size="icon" className="mb-0.5 rounded-xl" aria-label={t('clinicForm.removePhone')} disabled={phoneNumbers.length === 1} onClick={() => setPhoneNumbers((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Minus /></Button></div>)}
              <Button type="button" variant="outline" className="h-11 w-fit rounded-xl text-sm font-bold normal-case" disabled={phoneNumbers.length >= 6} onClick={() => setPhoneNumbers((current) => [...current, ''])}><Plus />{t('clinicForm.addPhone')}</Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card">
            <CardHeader className="border-b border-border !pb-3"><CardTitle className="flex items-center gap-2 font-heading text-xl font-bold normal-case tracking-normal"><span className="grid size-10 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
  <FileImage className="size-7" />
</span>{t('clinicForm.imagesTitle')}</CardTitle><p className="text-xs text-muted-foreground">{t('clinicForm.imagesHint')}</p></CardHeader>
            <CardContent><Label className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/30 bg-primary/4 p-5 text-center transition hover:bg-primary/8" htmlFor="clinicImages"><Input className="sr-only" id="clinicImages" name="Images" type="file" multiple accept=".jpg,.jpeg,.png,.webp" onChange={handleImages} /><Upload className="size-5 text-primary" /><strong className="text-xs">{images.length ? t('clinicForm.imagesSelected', { count: images.length }) : t('clinicForm.chooseImages')}</strong><small className="text-[10px] font-normal text-muted-foreground">{images.length ? images.map((image) => image.name).join(', ') : t('clinicForm.imageRules')}</small></Label></CardContent>
          </Card>

          <div className="flex justify-end gap-2"><Button type="button" variant="outline" className="h-11 rounded-xl text-sm font-bold normal-case" render={<Link to="/doctor/clinics" />}>{t('clinicForm.cancel')}</Button><Button type="submit" className="h-11 rounded-xl bg-primary text-sm font-bold normal-case text-primary-foreground hover:bg-primary/90" disabled={createClinic.isPending || governorates.isError || regions.isError}>{createClinic.isPending ? <LoaderCircle className="animate-spin" /> : <Save />}{t('clinicForm.create')}</Button></div>
        </form>
      </div>
    </DoctorWorkspaceShell>
  )
}
