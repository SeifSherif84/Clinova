import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowRight, LoaderCircle, Mail, Phone, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
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

export default function PatientRegisterPage() {
  const { t } = useTranslation()
  const api = useApi()
  const navigate = useNavigate()
  const [formError, setFormError] = useState('')
  const register = useMutation({
    mutationFn: (request: PatientRegistrationRequest) => api.request<RegistrationResponse>('/api/auth/patient-registration', { method: 'POST', body: JSON.stringify(request) }, { authenticated: false }),
    onSuccess: (response) => navigate({ to: '/auth/status', search: { reason: 'check-email', email: response.email } }),
  })

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
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="firstName" name="firstName" label={t('fields.firstName')} placeholder="Nour" icon={<UserRound size={18} />} autoComplete="given-name" maxLength={50} required />
          <FormField id="lastName" name="lastName" label={t('fields.lastName')} placeholder="Hassan" icon={<UserRound size={18} />} autoComplete="family-name" maxLength={50} required />
        </div>
        <FormField id="email" name="email" type="email" label={t('fields.email')} placeholder="nour@example.com" icon={<Mail size={18} />} autoComplete="email" required />
        <FormField id="phoneNumber" name="phoneNumber" type="tel" label={t('fields.phone')} placeholder="01xxxxxxxxx" icon={<Phone size={18} />} pattern="01[0125][0-9]{8}" autoComplete="tel" hint={t('fields.phoneHint')} required />
        <div className="grid gap-5 sm:grid-cols-2">
          <PasswordField id="patientPassword" name="password" label={t('fields.password')} placeholder={t('fields.strongPassword')} autoComplete="new-password" required />
          <PasswordField id="patientConfirmPassword" name="confirmPassword" label={t('fields.confirmPassword')} placeholder={t('fields.repeatPassword')} autoComplete="new-password" required />
        </div>
        <p className="text-[11px] leading-5 text-muted-foreground">{t('patientRegister.terms')}</p>
        <Button className="h-12 rounded-xl bg-primary text-sm font-bold tracking-normal text-primary-foreground normal-case hover:bg-primary/90" type="submit" disabled={register.isPending}>
          {register.isPending ? <LoaderCircle className="size-4 animate-spin" /> : <>{t('patientRegister.submit')} <ArrowRight className="size-4 rtl:rotate-180" /></>}
        </Button>
        <p className="text-center text-xs text-muted-foreground">{t('common.alreadyRegistered')} <Link to="/login" search={{ redirect: undefined }} className="font-semibold text-primary hover:text-primary/75">{t('common.signIn')}</Link></p>
      </form>
    </AuthShell>
  )
}
