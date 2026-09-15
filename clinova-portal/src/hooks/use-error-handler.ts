import { useContext } from 'react'
import { ErrorContext } from '@/providers/error-context'

export function useErrorHandler() {
  const context = useContext(ErrorContext)
  if (!context) throw new Error('useErrorHandler must be used inside ErrorProvider.')
  return context
}
