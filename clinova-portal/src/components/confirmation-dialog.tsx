import Notice from '@/components/notice'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
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
    <AlertDialogContent className="max-w-md gap-0 rounded-3xl border-border bg-card p-6 text-card-foreground shadow-xl sm:p-8">
      <AlertDialogHeader className="grid place-items-start gap-3 text-start">
        <AlertDialogTitle className="font-sans text-xl font-bold tracking-normal normal-case">{title}</AlertDialogTitle>
        <AlertDialogDescription className="text-start text-[15px] leading-7 font-medium text-foreground/75">{description}</AlertDialogDescription>
      </AlertDialogHeader>
      {error && <div className="mt-4"><Notice message={error} /></div>}
      <AlertDialogFooter className="mt-8 gap-2.5">
        <AlertDialogCancel className="h-10 cursor-pointer rounded-xl border-transparent bg-foreground/5 px-4 text-[13px] font-bold normal-case tracking-normal text-foreground shadow-none hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-transparent dark:bg-foreground/5 dark:hover:bg-foreground/10" disabled={pending}>{cancelLabel}</AlertDialogCancel>
        <AlertDialogAction type="button" variant="default" className={`h-10 cursor-pointer gap-2 rounded-xl px-4 text-[13px] font-bold normal-case tracking-normal ${destructive ? 'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/30' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`} disabled={pending} onClick={onConfirm}>
          {pending && <span aria-hidden="true" className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" />}
          {confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
}
