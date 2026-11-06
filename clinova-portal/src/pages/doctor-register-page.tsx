import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowRight, BadgeCheck, Check, FileCheck2, KeyRound, LoaderCircle, Mail, Phone, ShieldCheck, Stethoscope, Upload, UserRound } from 'lucide-react'
import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import AuthShell from '@/components/auth-shell'
import FormField from '@/components/form-field'
import Notice from '@/components/notice'
import PasswordField from '@/components/password-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useApi } from '@/hooks/use-api'
import { getErrorMessage } from '@/lib/api'
import type { LookupOption, RegistrationResponse } from '@/types/auth'

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/webp']
const maxImageSize = 5 * 1024 * 1024

function FormSection({ number, icon, title, description, children }: { number: string; icon: ReactNode; title: string; description: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 rounded-2xl border border-border/60 bg-muted/30 p-4 sm:p-5">
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10 [&>svg]:size-4.5">{icon}</span>
        <div className="grid min-w-0 flex-1 gap-0.5">
          <h2 className="font-sans text-sm font-bold tracking-normal normal-case">{title}</h2>
          <p className="text-xs leading-5 text-muted-foreground">{description}</p>
        </div>
        <span className="rounded-full border border-primary/15 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-primary tabular-nums">{number}</span>
      </div>
      {children}
    </section>
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
    <Label
      className={`group flex min-w-0 cursor-pointer items-center gap-3.5 rounded-2xl border-2 border-dashed px-4 py-4 normal-case tracking-normal transition hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none ${fileName ? 'border-primary/50 bg-primary/[0.05]' : 'border-primary/30 bg-primary/[0.03] hover:border-primary/60 hover:bg-primary/[0.06]'}`}
      htmlFor={id}
    >
      <Input className="sr-only" id={id} name={name} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={onChange} required />
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:scale-105 group-hover:bg-primary/15 motion-reduce:transition-none">
        {fileName ? <FileCheck2 className="size-4.5" /> : <Upload className="size-4.5" />}
      </span>
      <span className="grid min-w-0 flex-1 gap-0.5">
        <strong className="truncate text-sm font-bold normal-case tracking-normal">{title}</strong>
        <small className="truncate text-xs font-semibold normal-case tracking-normal text-muted-foreground">{fileName || chooseImage}</small>
      </span>
      {fileName && <Check aria-hidden="true" className="size-5 shrink-0 text-primary" strokeWidth={3} />}
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
  const [passwordValue, setPasswordValue] = useState('')
  const [confirmValue, setConfirmValue] = useState('')

  const specialties = useQuery({
    queryKey: ['lookups', 'medical-specialties'],
    queryFn: () => api.request<LookupOption[]>('/api/lookups/medical-specialties', {}, { authenticated: false, notifyOnError: false }),
  })
  const register = useMutation({
    mutationFn: (body: FormData) => api.request<RegistrationResponse>('/api/auth/doctor-registration', { method: 'POST', body }, { authenticated: false, notifyOnError: false }),
    onSuccess: (response) => navigate({ to: '/auth/status', search: { reason: 'doctor-created', email: response.email } }),
  })

  // Live checklist: same rules as passwordPattern, shown as the doctor types.
  const rules = [
    { key: 'length', met: passwordValue.length >= 8, label: t('patientRegister.rules.length', { defaultValue: 'At least 8 characters' }) },
    { key: 'lower', met: /[a-z]/.test(passwordValue), label: t('patientRegister.rules.lower', { defaultValue: 'One lowercase letter' }) },
    { key: 'upper', met: /[A-Z]/.test(passwordValue), label: t('patientRegister.rules.upper', { defaultValue: 'One uppercase letter' }) },
    { key: 'number', met: /\d/.test(passwordValue), label: t('patientRegister.rules.number', { defaultValue: 'One number' }) },
    { key: 'symbol', met: /[@$!%*?&]/.test(passwordValue), label: t('patientRegister.rules.symbol', { defaultValue: 'One of @ $ ! % * ? &' }) },
  ]
  const passed = rules.filter((rule) => rule.met).length
  const strengthTone = passed <= 2 ? 'bg-destructive' : passed <= 4 ? 'bg-warm' : 'bg-primary'
  const mismatch = confirmValue.length > 0 && confirmValue !== passwordValue
  const matches = confirmValue.length > 0 && confirmValue === passwordValue

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
      <form className="grid gap-5" onSubmit={handleSubmit}>
        {(formError || register.error) && <Notice message={formError || getErrorMessage(register.error)} />}

        <FormSection number="01" icon={<UserRound />} title={t('doctorRegister.personalTitle')} description={t('doctorRegister.personalDescription')}>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="doctorFirstName" name="FirstName" label={t('fields.firstName')} placeholder="Mariam" icon={<UserRound size={18} />} maxLength={50} required />
            <FormField id="doctorLastName" name="LastName" label={t('fields.lastName')} placeholder="Khalil" icon={<UserRound size={18} />} maxLength={50} required />
            <FormField id="doctorEmail" name="Email" type="email" label={t('fields.professionalEmail')} placeholder="dr.mariam@example.com" icon={<Mail size={18} />} autoComplete="email" required />
            <FormField id="doctorPhone" name="PhoneNumber" type="tel" label={t('fields.phone')} placeholder="01xxxxxxxxx" icon={<Phone size={18} />} pattern="01[0125][0-9]{8}" required />
          </div>
        </FormSection>

        <FormSection number="02" icon={<Stethoscope />} title={t('doctorRegister.profileTitle')} description={t('doctorRegister.profileDescription')}>
          <div className="grid items-start gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label className="text-xs font-semibold text-foreground/80">{t('doctorRegister.specialty')}</Label>
              <Select
                items={specialties.data?.map((specialty) => ({ value: String(specialty.id), label: specialty.name })) ?? []}
                value={specialtyId}
                onValueChange={setSpecialtyId}
                disabled={specialties.isLoading || specialties.isError}
              >
                <SelectTrigger className="h-12 w-full rounded-xl border border-input bg-background/40 px-3 text-foreground data-[size=default]:h-12 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/10">
                  <Stethoscope className="size-[18px] text-primary/70" />
                  <SelectValue placeholder={specialties.isLoading ? t('doctorRegister.loadingSpecialties') : t('doctorRegister.chooseSpecialty')} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-border bg-popover text-popover-foreground">
                  {specialties.data?.map((specialty) => <SelectItem className="rounded-lg focus:bg-accent" key={specialty.id} value={String(specialty.id)}>{specialty.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {specialties.isError && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-3">
                  <p className="min-w-0 flex-1 text-xs leading-5 font-semibold text-destructive">{t('doctorRegister.specialtiesError')}</p>
                  <Button type="button" variant="ghost" className="h-10 cursor-pointer rounded-xl bg-foreground/5 px-4 text-[13px] font-bold tracking-normal normal-case hover:bg-foreground/10" disabled={specialties.isFetching} onClick={() => specialties.refetch()}>
                    {t('errors.tryAgain')}
                  </Button>
                </div>
              )}
            </div>
            <FormField id="syndicateNumber" name="SyndicateNumber" label={t('doctorRegister.syndicateNumber')} placeholder={t('doctorRegister.syndicatePlaceholder')} icon={<BadgeCheck size={18} />} maxLength={50} required />
          </div>
        </FormSection>

        <FormSection number="03" icon={<ShieldCheck />} title={t('doctorRegister.verificationTitle')} description={t('doctorRegister.verificationDescription')}>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <UploadField id="syndicateCard" name="SyndicateCard" title={t('doctorRegister.syndicateCard')} fileName={fileNames.SyndicateCard} chooseImage={t('doctorRegister.chooseImage')} onChange={trackFile} />
            <UploadField id="nationalId" name="NationalId" title={t('doctorRegister.nationalId')} fileName={fileNames.NationalId} chooseImage={t('doctorRegister.chooseImage')} onChange={trackFile} />
          </div>
        </FormSection>

        <FormSection number="04" icon={<KeyRound />} title={t('doctorRegister.securityTitle')} description={t('doctorRegister.securityDescription')}>
          <div className="grid gap-5 sm:grid-cols-2">
            <PasswordField id="doctorPassword" name="Password" label={t('fields.password')} placeholder={t('fields.strongPassword')} autoComplete="new-password" value={passwordValue} onChange={(event) => setPasswordValue(event.target.value)} required />
            <PasswordField id="doctorConfirmPassword" name="ConfirmPassword" label={t('fields.confirmPassword')} placeholder={t('fields.repeatPassword')} autoComplete="new-password" value={confirmValue} onChange={(event) => setConfirmValue(event.target.value)} required />
          </div>

          {passwordValue.length > 0 && (
            <div className="grid gap-3 rounded-xl border border-border/60 bg-background/60 p-3.5">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                {rules.map((rule, index) => (
                  <span key={rule.key} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 motion-reduce:transition-none ${index < passed ? strengthTone : 'bg-muted'}`} />
                ))}
              </div>
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {rules.map((rule) => (
                  <li key={rule.key} className={`flex items-center gap-2 text-xs font-semibold transition-colors duration-200 motion-reduce:transition-none ${rule.met ? 'text-primary' : 'text-muted-foreground'}`}>
                    <span className={`grid size-4 shrink-0 place-items-center rounded-full transition-colors duration-200 motion-reduce:transition-none ${rule.met ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      {rule.met && <Check className="size-3" strokeWidth={3} />}
                    </span>
                    {rule.label}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(matches || mismatch) && (
            <p className={`flex items-center gap-2 text-xs font-bold ${matches ? 'text-primary' : 'text-destructive'}`}>
              {matches && <Check className="size-4 shrink-0" strokeWidth={3} />}
              {matches ? t('patientRegister.passwordsMatch', { defaultValue: 'Passwords match' }) : t('validation.passwordMismatch')}
            </p>
          )}
        </FormSection>

        <Notice tone="info" message={t('doctorRegister.reviewNotice')} />
        <Button className="h-10 cursor-pointer rounded-xl bg-primary px-4 text-[13px] font-bold tracking-normal text-primary-foreground normal-case hover:bg-primary/90" type="submit" disabled={register.isPending || specialties.isError}>
          {register.isPending ? <LoaderCircle className="size-4 animate-spin" /> : <>{t('doctorRegister.submit')} <ArrowRight className="size-4 rtl:rotate-180" /></>}
        </Button>
        <p className="text-center text-sm font-semibold text-muted-foreground">{t('common.alreadyApplied')} <Link to="/login" search={{ redirect: undefined }} className="font-semibold text-primary hover:text-primary/75">{t('common.signIn')}</Link></p>
      </form>
    </AuthShell>
  )
}