import { useContext } from 'react'
import { ApiContext } from '@/providers/api-context'

export function useApi() {
  const context = useContext(ApiContext)

  if (!context) throw new Error('useApi must be used inside ApiProvider.')
  return context
}

