import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export const paymobButtonClass = 'h-11 rounded-xl text-sm font-bold normal-case tracking-normal'

export function SetupSection({ id, title, description, icon: Icon, children }: {
  id: string; title: string; description: string; icon: LucideIcon; children: ReactNode
}) {
  return <section id={id} aria-labelledby={id + '-title'} className="scroll-mt-28 border-t border-border py-8 first:border-t-0">
    <div className="flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"><Icon className="size-7" aria-hidden="true" /></span>
      <div className="min-w-0">
        <h2 tabIndex={-1} id={id + '-title'} className="font-sans text-xl font-bold normal-case tracking-normal">{title}</h2>
        <p className="mt-2 max-w-3xl text-xs leading-6 text-muted-foreground sm:text-sm">{description}</p>
      </div>
    </div>
    <div className="mt-6">{children}</div>
  </section>
}
