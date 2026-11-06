import { AlertTriangle, Check, LoaderCircle, X } from 'lucide-react'
import Notice from '@/components/notice'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ConfirmationDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel: string
  pending?: boolean
  error?: string
  destructive?: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}

export default function ConfirmationDialog({ open, title, description, confirmLabel, cancelLabel, pending = false, error, destructive = false, onConfirm, onOpenChange }: ConfirmationDialogProps) {
  return <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="max-w-md rounded-3xl border-border bg-card p-6 text-card-foreground shadow-lg sm:p-7">
      <AlertDialogHeader className="place-items-start text-start">
        <AlertDialogMedia className={`mb-1 size-12 rounded-2xl ${destructive ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}><AlertTriangle className="size-6" /></AlertDialogMedia>
        <AlertDialogTitle className="font-sans text-xl font-bold tracking-normal normal-case">{title}</AlertDialogTitle>
        <AlertDialogDescription className="text-start text-xs leading-6 sm:text-sm">{description}</AlertDialogDescription>
      </AlertDialogHeader>
      {error && <Notice message={error} />}
      <AlertDialogFooter>
        <AlertDialogCancel className="h-10 cursor-pointer rounded-xl border-transparent bg-foreground/5 px-4 text-[13px] font-bold normal-case tracking-normal text-foreground shadow-none hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-transparent dark:bg-foreground/5 dark:hover:bg-foreground/10" disabled={pending}><X className="size-4" />{cancelLabel}</AlertDialogCancel>
        <AlertDialogAction type="button" variant={destructive ? 'destructive' : 'default'} className="h-10 cursor-pointer rounded-xl px-4 text-[13px] font-bold normal-case tracking-normal" disabled={pending} onClick={onConfirm}>{pending ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : destructive ? <AlertTriangle className="size-4" /> : <Check className="size-4" />}{confirmLabel}</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
}
