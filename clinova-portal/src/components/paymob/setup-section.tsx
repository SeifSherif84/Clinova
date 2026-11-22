import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export const paymobButtonClass = 'h-10 rounded-xl px-4 text-[13px] font-bold normal-case tracking-normal'

export function SetupSection({ id, title, description, icon: Icon, children }: {
  id: string; title: string; description: string; icon: LucideIcon; children: ReactNode
}) {
  return <section id={id} aria-labelledby={id + '-title'} className="scroll-mt-28 border-t border-border py-7 first:border-t-0 sm:py-10">
    <div className="flex items-start gap-3 sm:gap-4">
      <span className="relative z-10 grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/25 sm:size-12">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 pt-1">
        <h2 tabIndex={-1} id={id + '-title'} className="font-sans text-xl font-bold leading-tight tracking-tight normal-case sm:text-2xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 font-medium text-foreground/75">{description}</p>
      </div>
    </div>
    <div className="mt-5 ms-5 border-s-2 border-primary/10 ps-4 sm:mt-7 sm:ms-[3.25rem] sm:ps-6">{children}</div>
  </section>
}
