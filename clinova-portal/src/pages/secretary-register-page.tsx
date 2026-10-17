import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { ArrowRight, FileCheck2, LinkIcon, LoaderCircle, LogIn, Mail, Phone, Upload, UserRound } from 'lucide-react'
import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
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

const buttonClass = 'h-12 rounded-xl bg-primary text-sm font-bold tracking-normal text-primary-foreground normal-case hover:bg-primary/90'

export default function SecretaryRegisterPage() {
  const { t } = useTranslation()
  const api = useApi()
  const navigate = useNavigate()
  const linkEmail = useSearch({ from: '/register/secretary', select: (search) => search.email ?? '' })
  const link = useMemo(() => checkInvitationLink(linkEmail), [linkEmail])
  const [formError, setFormError] = useState('')
  const [nationalIdName, setNationalIdName] = useState('')

  const register = useMutation({
    mutationFn: (body: FormData) => api.request<RegistrationResponse>('/api/auth/secretary-registration', { method: 'POST', body }, { authenticated: false, notifyOnError: false }),
    onSuccess: (response) => {
      try { sessionStorage.removeItem(invitationEmailKey) } catch { /* ignore */ }
      navigate({ to: '/auth/status', search: { reason: 'check-email', email: response.email } })
    },
  })

  if (link === 'invalid') {
    return (
      <AuthShell eyebrow={t('secretary.register.eyebrow')} title={t('secretary.register.invalidTitle')} description={t('secretary.register.invalidDescription')}>
        <Notice message={t('secretary.register.invalidLink')} />
        <div className="grid justify-items-center gap-4 rounded-3xl border border-dashed border-destructive/25 bg-destructive/5 p-6 text-center">
          <span className="grid size-16 place-items-center rounded-3xl bg-destructive/10 text-destructive shadow-inner"><LinkIcon className="size-7" /></span>
          <p className="max-w-sm text-xs leading-6 text-muted-foreground sm:text-sm">{t('secretary.register.invalidHint')}</p>
          <Button className={buttonClass + ' px-5'} render={<Link to="/login" search={{ redirect: undefined }} />}><LogIn className="size-4" />{t('common.signIn')}</Button>
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
      <form className="grid gap-6" onSubmit={handleSubmit}>
        {(formError || register.error) && <Notice message={formError || getErrorMessage(register.error)} />}
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="secretaryFirstName" name="FirstName" label={t('fields.firstName')} placeholder="Nour" icon={<UserRound size={18} />} maxLength={50} required />
          <FormField id="secretaryLastName" name="LastName" label={t('fields.lastName')} placeholder="Hassan" icon={<UserRound size={18} />} maxLength={50} required />
          <FormField id="secretaryEmail" name="Email" type="email" label={t('fields.email')} placeholder="nour@example.com" icon={<Mail size={18} />} autoComplete="email" maxLength={256}
            defaultValue={invited ? linkEmail.trim() : undefined} readOnly={invited} hint={invited ? t('secretary.register.emailFromInvitation') : undefined} required />
          <FormField id="secretaryPhone" name="PhoneNumber" type="tel" label={t('fields.phone')} placeholder="01xxxxxxxxx" icon={<Phone size={18} />} pattern="01[0125][0-9]{8}" hint={t('fields.phoneHint')} required />
        </div>
        <Label className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-primary/30 bg-primary/4 p-4 text-center transition hover:bg-primary/8" htmlFor="secretaryNationalId">
          <Input className="sr-only" id="secretaryNationalId" name="NationalId" type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(event: ChangeEvent<HTMLInputElement>) => setNationalIdName(event.target.files?.[0]?.name ?? '')} required />
          <span className="text-primary">{nationalIdName ? <FileCheck2 className="size-5" /> : <Upload className="size-5" />}</span>
          <strong className="text-xs">{t('secretary.register.nationalId')}</strong>
          <small className="max-w-full truncate text-[10px] font-normal text-muted-foreground">{nationalIdName || t('doctorRegister.chooseImage')}</small>
        </Label>
        <div className="grid gap-5 sm:grid-cols-2">
          <PasswordField id="secretaryPassword" name="Password" label={t('fields.password')} placeholder={t('fields.strongPassword')} autoComplete="new-password" required />
          <PasswordField id="secretaryConfirmPassword" name="ConfirmPassword" label={t('fields.confirmPassword')} placeholder={t('fields.repeatPassword')} autoComplete="new-password" required />
        </div>
        <Button className={buttonClass} type="submit" disabled={register.isPending}>
          {register.isPending ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <>{t('secretary.register.submit')} <ArrowRight className="size-4 rtl:rotate-180" /></>}
        </Button>
        <p className="text-center text-xs text-muted-foreground">{t('registerChoice.alreadyAccount')} <Link to="/login" search={{ redirect: undefined }} className="font-semibold text-primary hover:text-primary/75">{t('common.signIn')}</Link></p>
      </form>
    </AuthShell>
  )
}
