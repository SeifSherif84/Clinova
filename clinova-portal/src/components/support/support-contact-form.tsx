import { LoaderCircle, Send } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import Notice from '@/components/notice'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateTicket, useSupportCategories } from '@/hooks/use-support-tickets'
import { getErrorMessage } from '@/lib/api'
import { humanize } from '@/lib/patient-appointments'

const minLength = 10
const maxLength = 3000

export default function SupportContactForm() {
  const { t } = useTranslation()
  const tr = (key: string, defaultValue: string, options?: Record<string, string | number>) => t('patientPortal.help.' + key, { defaultValue, ...options })
  const categories = useSupportCategories()
  const create = useCreateTicket()
  const [category, setCategory] = useState('')
  const [message, setMessage] = useState('')
  const [touched, setTouched] = useState(false)
  const [success, setSuccess] = useState('')

  const trimmed = message.trim()
  const categoryError = !category ? tr('categoryRequired', 'Please choose a subject.') : ''
  const messageError = trimmed.length < minLength ? tr('messageShort', 'Please write at least {{count}} characters.', { count: minLength }) : trimmed.length > maxLength ? tr('messageLong', 'Your message can’t be longer than {{count}} characters.', { count: maxLength }) : ''
  const items = (categories.data ?? []).map((item) => ({ value: String(item.id), label: tr('categories.' + item.name, humanize(item.name)) }))

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (create.isPending) return
    setTouched(true); setSuccess('')
    if (categoryError || messageError) return
    create.mutate({ category: Number(category), originalMessage: trimmed }, {
      onSuccess: (response) => { setSuccess(response); setMessage(''); setCategory(''); setTouched(false) },
    })
  }

  return <form noValidate onSubmit={submit} className="grid gap-5">
    {success && <Notice tone="success" message={success} />}
    {create.error && <Notice message={getErrorMessage(create.error)} />}
    {categories.isError && <Notice message={getErrorMessage(categories.error)} />}

    <div className="grid gap-2">
      <Label className="text-xs font-semibold text-foreground/80">{tr('category', 'What do you need help with?')}</Label>
      <Select items={items} value={category || null} onValueChange={(value) => { setCategory(value ?? ''); setSuccess('') }} disabled={categories.isLoading || categories.isError || create.isPending}>
        <SelectTrigger aria-invalid={touched && Boolean(categoryError)} className="h-12 w-full cursor-pointer rounded-xl border border-input bg-background/40 px-3 text-foreground aria-invalid:border-destructive/70 disabled:cursor-not-allowed">
          <SelectValue placeholder={categories.isLoading ? tr('loadingCategories', 'Loading subjects…') : tr('categoryPlaceholder', 'Choose a subject')} />
        </SelectTrigger>
        <SelectContent className="rounded-xl border border-border bg-popover">
          {items.map((item) => <SelectItem className="cursor-pointer rounded-lg" key={item.value} value={item.value}>{item.label}</SelectItem>)}
        </SelectContent>
      </Select>
      {touched && categoryError && <small className="text-xs font-semibold text-destructive">{categoryError}</small>}
    </div>

    <div className="grid gap-2">
      <Label htmlFor="supportMessage" className="text-xs font-semibold text-foreground/80">{tr('message', 'Your message')}</Label>
      <textarea id="supportMessage" value={message} rows={6} maxLength={maxLength} disabled={create.isPending} aria-invalid={touched && Boolean(messageError)} onChange={(event) => { setMessage(event.target.value); setSuccess('') }} placeholder={tr('messagePlaceholder', 'Tell us what happened so we can help you faster.')} className="w-full resize-y rounded-xl border border-input bg-background/40 px-3 py-2.5 text-base leading-7 font-medium outline-none transition placeholder:text-sm placeholder:font-medium focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/10 aria-invalid:border-destructive/70 disabled:opacity-60" />
      <div className="flex flex-wrap justify-between gap-2 text-[13px] font-semibold">
        <span className="text-destructive">{touched ? messageError : ''}</span>
        <span dir="ltr" className="ms-auto tabular-nums text-muted-foreground">{message.length}/{maxLength}</span>
      </div>
    </div>

    <Button type="submit" className="h-10 w-fit cursor-pointer rounded-xl px-5 text-[13px] font-bold normal-case tracking-normal" disabled={create.isPending}>
      {create.isPending ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <Send className="size-4 rtl:-scale-x-100" />}
      {create.isPending ? tr('submitting', 'Submitting…') : tr('submit', 'Submit Request')}
    </Button>
  </form>
}