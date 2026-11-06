import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { ArrowRight, Check, FileCheck2, KeyRound, LinkIcon, LoaderCircle, LogIn, Mail, Phone, ShieldCheck, Upload, UserRound } from 'lucide-react'
import { useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import AuthShell from '@/components/auth-shell'
import FormField from '@/components/form-field'
import Notice from '@/components/notice'
import PasswordField from '@/components/password-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApi } from '@/hooks/use-api'
import { getErrorMessage } from '@/lib/api'
import type { RegistrationResponse } from '@/types/auth'

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/webp']
const maxImageSize = 5 * 1024 * 1024
const invitationEmailKey = 'clinova.secretaryInvitationEmail'

// The first invitation email seen in this tab is pinned; a different or removed ?email= means the link was altered.
function checkInvitationLink(email: string): 'none' | 'valid' | 'invalid' {
  const normalized = email.trim().toLowerCase()
  let pinned: string | null = null
  try { pinned = sessionStorage.getItem(invitationEmailKey) } catch { /* storage unavailable: validate the format only */ }
  if (!normalized) return pinned ? 'invalid' : 'none'
  if (normalized.length > 256 || !emailPattern.test(normalized)) return 'invalid'
  if (!pinned) {
    try { sessionStorage.setItem(invitationEmailKey, normalized) } catch { /* ignore */ }
    return 'valid'
  }
  return pinned === normalized ? 'valid' : 'invalid'
}

const buttonClass = 'h-10 cursor-pointer rounded-xl bg-primary px-4 text-[13px] font-bold tracking-normal text-primary-foreground normal-case hover:bg-primary/90'

function FormSection({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 rounded-2xl border border-border/60 bg-muted/30 p-4 sm:p-5">
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10 [&>svg]:size-4.5">{icon}</span>
        <h2 className="font-sans text-sm font-bold tracking-normal normal-case">{title}</h2>
      </div>
      {children}
    </section>
  )
}

export default function SecretaryRegisterPage() {
  const { t } = useTranslation()
  const api = useApi()
  const navigate = useNavigate()
  const linkEmail = useSearch({ from: '/register/secretary', select: (search) => search.email ?? '' })
  const link = useMemo(() => checkInvitationLink(linkEmail), [linkEmail])
  const [formError, setFormError] = useState('')
  const [nationalIdName, setNationalIdName] = useState('')
  const [passwordValue, setPasswordValue] = useState('')
  const [confirmValue, setConfirmValue] = useState('')

  const register = useMutation({
    mutationFn: (body: FormData) => api.request<RegistrationResponse>('/api/auth/secretary-registration', { method: 'POST', body }, { authenticated: false, notifyOnError: false }),
    onSuccess: (response) => {
      try { sessionStorage.removeItem(invitationEmailKey) } catch { /* ignore */ }
      navigate({ to: '/auth/status', search: { reason: 'check-email', email: response.email } })
    },
  })

  // Live checklist: same rules as passwordPattern, shown as the secretary types.
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

  if (link === 'invalid') {
    return (
      <AuthShell eyebrow={t('secretary.register.eyebrow')} title={t('secretary.register.invalidTitle')} description={t('secretary.register.invalidDescription')}>
        <Notice message={t('secretary.register.invalidLink')} />
        <div className="grid justify-items-center gap-4 rounded-3xl border border-dashed border-destructive/25 bg-destructive/5 p-6 text-center">
          <span className="grid size-16 place-items-center rounded-3xl bg-destructive/10 text-destructive shadow-inner"><LinkIcon className="size-7" /></span>
          <p className="max-w-sm text-xs leading-6 text-muted-foreground sm:text-sm">{t('secretary.register.invalidHint')}</p>
          <Button className={buttonClass} render={<Link to="/login" search={{ redirect: undefined }} />}><LogIn className="size-4" />{t('common.signIn')}</Button>
        </div>
      </AuthShell>
    )
  }

  const invited = link === 'valid'

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    const values = new FormData(event.currentTarget)
    if (invited) values.set('Email', linkEmail.trim())
    const password = String(values.get('Password'))
    if (!passwordPattern.test(password)) return setFormError(t('validation.passwordRules'))
    if (password !== String(values.get('ConfirmPassword'))) return setFormError(t('validation.passwordMismatch'))
    const file = values.get('NationalId') as File | null
    if (!file || !file.size) return setFormError(t('secretary.register.nationalIdRequired'))
    if (!acceptedImageTypes.includes(file.type)) return setFormError(t('validation.imageType'))
    if (file.size > maxImageSize) return setFormError(t('validation.imageSize'))
    register.mutate(values)
  }

  return (
    <AuthShell eyebrow={t('secretary.register.eyebrow')} title={t('secretary.register.title')} description={t(invited ? 'secretary.register.invitedDescription' : 'secretary.register.description')} wide>
      <form className="grid gap-5" onSubmit={handleSubmit}>
        {(formError || register.error) && <Notice message={formError || getErrorMessage(register.error)} />}

        <FormSection icon={<UserRound />} title={t('patientRegister.sections.personal', { defaultValue: 'Personal details' })}>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="secretaryFirstName" name="FirstName" label={t('fields.firstName')} placeholder="Nour" icon={<UserRound size={18} />} autoComplete="given-name" maxLength={50} required />
            <FormField id="secretaryLastName" name="LastName" label={t('fields.lastName')} placeholder="Hassan" icon={<UserRound size={18} />} autoComplete="family-name" maxLength={50} required />
          </div>
          <FormField id="secretaryEmail" name="Email" type="email" label={t('fields.email')} placeholder="nour@example.com" icon={<Mail size={18} />} autoComplete="email" maxLength={256}
            defaultValue={invited ? linkEmail.trim() : undefined} readOnly={invited} hint={invited ? t('secretary.register.emailFromInvitation') : undefined} required />
          <FormField id="secretaryPhone" name="PhoneNumber" type="tel" label={t('fields.phone')} placeholder="01xxxxxxxxx" icon={<Phone size={18} />} pattern="01[0125][0-9]{8}" autoComplete="tel" hint={t('fields.phoneHint')} required />
        </FormSection>

        <FormSection icon={<ShieldCheck />} title={t('secretary.register.nationalId')}>
          <Label
            className={`group flex min-w-0 cursor-pointer items-center gap-3.5 rounded-2xl border-2 border-dashed px-4 py-4 normal-case tracking-normal transition hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none ${nationalIdName ? 'border-primary/50 bg-primary/[0.05]' : 'border-primary/30 bg-primary/[0.03] hover:border-primary/60 hover:bg-primary/[0.06]'}`}
            htmlFor="secretaryNationalId"
          >
            <Input className="sr-only" id="secretaryNationalId" name="NationalId" type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(event: ChangeEvent<HTMLInputElement>) => setNationalIdName(event.target.files?.[0]?.name ?? '')} required />
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:scale-105 group-hover:bg-primary/15 motion-reduce:transition-none">
              {nationalIdName ? <FileCheck2 className="size-4.5" /> : <Upload className="size-4.5" />}
            </span>
            <span className="grid min-w-0 flex-1 gap-0.5">
              <strong className="truncate text-sm font-bold normal-case tracking-normal">{t('secretary.register.nationalId')}</strong>
              <small className="truncate text-xs font-semibold normal-case tracking-normal text-muted-foreground">{nationalIdName || t('doctorRegister.chooseImage')}</small>
            </span>
            {nationalIdName && <Check aria-hidden="true" className="size-5 shrink-0 text-primary" strokeWidth={3} />}
          </Label>
        </FormSection>

        <FormSection icon={<KeyRound />} title={t('patientRegister.sections.security', { defaultValue: 'Create your password' })}>
          <div className="grid gap-5 sm:grid-cols-2">
            <PasswordField id="secretaryPassword" name="Password" label={t('fields.password')} placeholder={t('fields.strongPassword')} autoComplete="new-password" value={passwordValue} onChange={(event) => setPasswordValue(event.target.value)} required />
            <PasswordField id="secretaryConfirmPassword" name="ConfirmPassword" label={t('fields.confirmPassword')} placeholder={t('fields.repeatPassword')} autoComplete="new-password" value={confirmValue} onChange={(event) => setConfirmValue(event.target.value)} required />
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

        <Button className={buttonClass} type="submit" disabled={register.isPending}>
          {register.isPending ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <>{t('secretary.register.submit')} <ArrowRight className="size-4 rtl:rotate-180" /></>}
        </Button>
        <p className="text-center text-sm font-semibold text-muted-foreground">{t('registerChoice.alreadyAccount')} <Link to="/login" search={{ redirect: undefined }} className="font-semibold text-primary hover:text-primary/75">{t('common.signIn')}</Link></p>
      </form>
    </AuthShell>
  )
}