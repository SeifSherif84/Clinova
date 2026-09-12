import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import ApiProvider from '@/providers/api-provider'
import AuthProvider from '@/providers/auth-provider'
import ThemeProvider from '@/providers/theme-provider'

export default function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: { retry: false },
        },
      }),
  )

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ApiProvider>
          <AuthProvider>{children}</AuthProvider>
        </ApiProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
