import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowRight, BadgeCheck, FileCheck2, LoaderCircle, Mail, Phone, Stethoscope, Upload, UserRound } from 'lucide-react'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import AuthShell from '@/components/auth-shell'
import FormField from '@/components/form-field'
import Notice from '@/components/notice'
import PasswordField from '@/components/password-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useApi } from '@/hooks/use-api'
import { getErrorMessage } from '@/lib/api'
import type { LookupOption, RegistrationResponse } from '@/types/auth'

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/webp']
const maxImageSize = 5 * 1024 * 1024

function FormStep({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="grid w-full gap-3">
      <Badge className="grid size-8 place-items-center rounded-full bg-primary/10 p-0 text-primary">{number}</Badge>
      <div className="grid w-full gap-1">
        <strong className="text-base leading-6">{title}</strong>
        <small className="text-xs leading-5 text-muted-foreground">{description}</small>
      </div>
      <Separator className="w-full" />
    </div>
  )
}

interface UploadFieldProps {
  id: string
  name: string
  title: string
  fileName?: string
  chooseImage: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
}

function UploadField({ id, name, title, fileName, chooseImage, onChange }: UploadFieldProps) {
  return (
    <Label className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-primary/30 bg-background/25 p-4 text-center transition hover:-translate-y-0.5 hover:border-primary/55 hover:bg-primary/5" htmlFor={id}>
      <Input className="sr-only" id={id} name={name} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={onChange} required />
      <span className="text-primary">{fileName ? <FileCheck2 className="size-5" /> : <Upload className="size-5" />}</span>
      <strong className="text-xs">{title}</strong>
      <small className="max-w-full truncate text-[10px] font-normal text-muted-foreground">{fileName || chooseImage}</small>
    </Label>
  )
}

export default function DoctorRegisterPage() {
  const { t } = useTranslation()
  const api = useApi()
  const navigate = useNavigate()
  const [formError, setFormError] = useState('')
  const [fileNames, setFileNames] = useState<Record<string, string>>({})
  const [specialtyId, setSpecialtyId] = useState<string | null>(null)

  const specialties = useQuery({
    queryKey: ['lookups', 'medical-specialties'],
    queryFn: () => api.request<LookupOption[]>('/api/lookups/medical-specialties', {}, { authenticated: false }),
  })
  const register = useMutation({
    mutationFn: (body: FormData) => api.request<RegistrationResponse>('/api/auth/doctor-registration', { method: 'POST', body }, { authenticated: false }),
    onSuccess: (response) => navigate({ to: '/auth/status', search: { reason: 'doctor-created', email: response.email } }),
  })

  function trackFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    setFileNames((current) => ({ ...current, [event.target.name]: file?.name ?? '' }))
  }

  function validateFile(file: File | null) {
    if (!file) return t('validation.imagesRequired')
    if (!acceptedImageTypes.includes(file.type)) return t('validation.imageType')
    if (file.size > maxImageSize) return t('validation.imageSize')
    return null
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    const values = new FormData(event.currentTarget)
    const password = String(values.get('Password'))
    const confirmPassword = String(values.get('ConfirmPassword'))
    if (!specialtyId) return setFormError(t('validation.chooseSpecialty'))
    values.set('MedicalSpecialtyId', specialtyId)
    if (!passwordPattern.test(password)) return setFormError(t('validation.passwordRules'))
    if (password !== confirmPassword) return setFormError(t('validation.passwordMismatch'))
    const fileError = validateFile(values.get('SyndicateCard') as File | null) ?? validateFile(values.get('NationalId') as File | null)
    if (fileError) return setFormError(fileError)
    register.mutate(values)
  }

  return (
    <AuthShell eyebrow={t('doctorRegister.eyebrow')} title={t('doctorRegister.title')} description={t('doctorRegister.description')} wide>
      <form className="grid gap-6" onSubmit={handleSubmit}>
        {(formError || register.error) && <Notice message={formError || getErrorMessage(register.error)} />}
        <FormStep number="01" title={t('doctorRegister.personalTitle')} description={t('doctorRegister.personalDescription')} />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="doctorFirstName" name="FirstName" label={t('fields.firstName')} placeholder="Mariam" icon={<UserRound size={18} />} maxLength={50} required />
          <FormField id="doctorLastName" name="LastName" label={t('fields.lastName')} placeholder="Khalil" icon={<UserRound size={18} />} maxLength={50} required />
          <FormField id="doctorEmail" name="Email" type="email" label={t('fields.professionalEmail')} placeholder="dr.mariam@example.com" icon={<Mail size={18} />} autoComplete="email" required />
          <FormField id="doctorPhone" name="PhoneNumber" type="tel" label={t('fields.phone')} placeholder="01xxxxxxxxx" icon={<Phone size={18} />} pattern="01[0125][0-9]{8}" required />
        </div>

        <FormStep number="02" title={t('doctorRegister.profileTitle')} description={t('doctorRegister.profileDescription')} />
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label className="text-xs font-semibold text-foreground/80">{t('doctorRegister.specialty')}</Label>
            <Select value={specialtyId} onValueChange={setSpecialtyId} disabled={specialties.isLoading || specialties.isError}>
              <SelectTrigger className="h-12 w-full rounded-xl border border-input bg-background/40 px-3 text-foreground focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/10">
                <Stethoscope className="size-[18px] text-primary/70" />
                <SelectValue placeholder={specialties.isLoading ? t('doctorRegister.loadingSpecialties') : t('doctorRegister.chooseSpecialty')} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-border bg-popover text-popover-foreground">
                {specialties.data?.map((specialty) => <SelectItem className="rounded-lg focus:bg-accent" key={specialty.id} value={String(specialty.id)}>{specialty.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {specialties.isError && <small className="text-[11px] text-destructive">{t('doctorRegister.specialtiesError')}</small>}
          </div>
          <FormField id="syndicateNumber" name="SyndicateNumber" label={t('doctorRegister.syndicateNumber')} placeholder={t('doctorRegister.syndicatePlaceholder')} icon={<BadgeCheck size={18} />} maxLength={50} required />
        </div>

        <FormStep number="03" title={t('doctorRegister.verificationTitle')} description={t('doctorRegister.verificationDescription')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <UploadField id="syndicateCard" name="SyndicateCard" title={t('doctorRegister.syndicateCard')} fileName={fileNames.SyndicateCard} chooseImage={t('doctorRegister.chooseImage')} onChange={trackFile} />
          <UploadField id="nationalId" name="NationalId" title={t('doctorRegister.nationalId')} fileName={fileNames.NationalId} chooseImage={t('doctorRegister.chooseImage')} onChange={trackFile} />
        </div>

        <FormStep number="04" title={t('doctorRegister.securityTitle')} description={t('doctorRegister.securityDescription')} />
        <div className="grid gap-5 sm:grid-cols-2">
          <PasswordField id="doctorPassword" name="Password" label={t('fields.password')} placeholder={t('fields.strongPassword')} autoComplete="new-password" required />
          <PasswordField id="doctorConfirmPassword" name="ConfirmPassword" label={t('fields.confirmPassword')} placeholder={t('fields.repeatPassword')} autoComplete="new-password" required />
        </div>
        <Notice tone="info" message={t('doctorRegister.reviewNotice')} />
        <Button className="h-12 rounded-xl bg-primary text-sm font-bold tracking-normal text-primary-foreground normal-case hover:bg-primary/90" type="submit" disabled={register.isPending || specialties.isError}>
          {register.isPending ? <LoaderCircle className="size-4 animate-spin" /> : <>{t('doctorRegister.submit')} <ArrowRight className="size-4 rtl:rotate-180" /></>}
        </Button>
        <p className="text-center text-xs text-muted-foreground">{t('common.alreadyApplied')} <Link to="/login" search={{ redirect: undefined }} className="font-semibold text-primary hover:text-primary/75">{t('common.signIn')}</Link></p>
      </form>
    </AuthShell>
  )
}
