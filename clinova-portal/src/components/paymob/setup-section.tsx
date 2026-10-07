import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export const paymobButtonClass = 'h-11 rounded-xl text-sm font-bold normal-case tracking-normal'

export function SetupSection({ id, title, description, icon: Icon, children }: {
  id: string; title: string; description: string; icon: LucideIcon; children: ReactNode
}) {
  return <section id={id} aria-labelledby={id + '-title'} className="scroll-mt-28 border-t border-border py-10 first:border-t-0">
    <div className="flex items-start gap-4">
      <span className="relative z-10 grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/25">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 pt-1">
        <h2 tabIndex={-1} id={id + '-title'} className="font-sans text-2xl font-bold leading-tight tracking-tight normal-case">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
    <div className="mt-7 ms-6 border-s-2 border-primary/10 ps-6 sm:ms-[3.25rem]">{children}</div>
  </section>
}
