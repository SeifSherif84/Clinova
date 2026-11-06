import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowRight, Check, KeyRound, LoaderCircle, Mail, Phone, UserRound } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import AuthShell from '@/components/auth-shell'
import FormField from '@/components/form-field'
import Notice from '@/components/notice'
import PasswordField from '@/components/password-field'
import { Button } from '@/components/ui/button'
import { useApi } from '@/hooks/use-api'
import { getErrorMessage } from '@/lib/api'
import type { PatientRegistrationRequest, RegistrationResponse } from '@/types/auth'

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

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

export default function PatientRegisterPage() {
  const { t } = useTranslation()
  const api = useApi()
  const navigate = useNavigate()
  const [formError, setFormError] = useState('')
  const [passwordValue, setPasswordValue] = useState('')
  const [confirmValue, setConfirmValue] = useState('')
  const register = useMutation({
    mutationFn: (request: PatientRegistrationRequest) => api.request<RegistrationResponse>('/api/auth/patient-registration', { method: 'POST', body: JSON.stringify(request) }, { authenticated: false, notifyOnError: false }),
    onSuccess: (response) => navigate({ to: '/auth/status', search: { reason: 'check-email', email: response.email } }),
  })

  // Live checklist: same rules as passwordPattern, shown as the patient types.
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password'))
    const confirmPassword = String(form.get('confirmPassword'))
    if (!passwordPattern.test(password)) return setFormError(t('validation.passwordRules'))
    if (password !== confirmPassword) return setFormError(t('validation.passwordMismatch'))
    register.mutate({ firstName: String(form.get('firstName')), lastName: String(form.get('lastName')), email: String(form.get('email')), phoneNumber: String(form.get('phoneNumber')), password, confirmPassword })
  }

  return (
    <AuthShell eyebrow={t('patientRegister.eyebrow')} title={t('patientRegister.title')} description={t('patientRegister.description')} wide>
      <form className="grid gap-5" onSubmit={handleSubmit}>
        {(formError || register.error) && <Notice message={formError || getErrorMessage(register.error)} />}

        <FormSection icon={<UserRound />} title={t('patientRegister.sections.personal', { defaultValue: 'Personal details' })}>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="firstName" name="firstName" label={t('fields.firstName')} placeholder="Nour" icon={<UserRound size={18} />} autoComplete="given-name" maxLength={50} required />
            <FormField id="lastName" name="lastName" label={t('fields.lastName')} placeholder="Hassan" icon={<UserRound size={18} />} autoComplete="family-name" maxLength={50} required />
          </div>
          <FormField id="email" name="email" type="email" label={t('fields.email')} placeholder="nour@example.com" icon={<Mail size={18} />} autoComplete="email" required />
          <FormField id="phoneNumber" name="phoneNumber" type="tel" label={t('fields.phone')} placeholder="01xxxxxxxxx" icon={<Phone size={18} />} pattern="01[0125][0-9]{8}" autoComplete="tel" hint={t('fields.phoneHint')} required />
        </FormSection>

        <FormSection icon={<KeyRound />} title={t('patientRegister.sections.security', { defaultValue: 'Create your password' })}>
          <div className="grid gap-5 sm:grid-cols-2">
            <PasswordField id="patientPassword" name="password" label={t('fields.password')} placeholder={t('fields.strongPassword')} autoComplete="new-password" value={passwordValue} onChange={(event) => setPasswordValue(event.target.value)} required />
            <PasswordField id="patientConfirmPassword" name="confirmPassword" label={t('fields.confirmPassword')} placeholder={t('fields.repeatPassword')} autoComplete="new-password" value={confirmValue} onChange={(event) => setConfirmValue(event.target.value)} required />
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

        <p className="text-xs leading-5 text-muted-foreground">{t('patientRegister.terms')}</p>
        <Button className="h-10 cursor-pointer rounded-xl bg-primary px-4 text-[13px] font-bold tracking-normal text-primary-foreground normal-case hover:bg-primary/90" type="submit" disabled={register.isPending}>
          {register.isPending ? <LoaderCircle className="size-4 animate-spin" /> : <>{t('patientRegister.submit')} <ArrowRight className="size-4 rtl:rotate-180" /></>}
        </Button>
        <p className="text-center text-sm font-semibold text-muted-foreground">{t('common.alreadyRegistered')} <Link to="/login" search={{ redirect: undefined }} className="font-semibold text-primary hover:text-primary/75">{t('common.signIn')}</Link></p>
      </form>
    </AuthShell>
  )
}