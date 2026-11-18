import type { ReactNode } from 'react'

export const pageContainerClass = 'mx-auto w-full min-w-0 max-w-screen-2xl p-4 sm:p-6 lg:p-10'

export default function PageContainer({ children }: { children: ReactNode }) {
  return <div className={pageContainerClass}>{children}</div>
}