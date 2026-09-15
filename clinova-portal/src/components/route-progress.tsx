import { useRouterState } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

export default function RouteProgress() {
  const { t } = useTranslation()
  const isPending = useRouterState({ select: (state) => state.status === 'pending' })

  return (
    <div className={`pointer-events-none fixed inset-x-0 top-0 z-[240] h-1 overflow-hidden bg-primary/10 transition-opacity ${isPending ? 'opacity-100' : 'opacity-0'}`} role="status" aria-label={t('common.routeLoading')} aria-hidden={!isPending}>
      <span className="block h-full w-1/3 animate-[route-progress_1s_ease-in-out_infinite] rounded-full bg-primary" />
    </div>
  )
}
