import { Component, type ReactNode } from 'react'
import { Home, RefreshCw, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Brand from '@/components/brand'
import { Button } from '@/components/ui/button'
import { useErrorHandler } from '@/hooks/use-error-handler'

interface BoundaryProps {
  children: ReactNode
  onError: (error: unknown) => void
  copy: { title: string; description: string; reload: string; home: string }
}

class ErrorBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: Error) { this.props.onError(error) }

  render() {
    if (!this.state.failed) return this.props.children
    return <main className="grid min-h-svh place-content-center justify-items-center gap-5 bg-background p-8 text-center text-foreground"><Brand /><span className="mt-5 grid size-16 place-items-center rounded-2xl bg-destructive/10 text-destructive"><TriangleAlert className="size-7" /></span><h1 className="font-heading text-2xl font-medium">{this.props.copy.title}</h1><p className="max-w-lg text-sm leading-6 text-muted-foreground">{this.props.copy.description}</p><div className="flex flex-wrap justify-center gap-2"><Button className="h-10 cursor-pointer rounded-xl bg-primary px-4 text-[13px] font-bold normal-case tracking-normal text-primary-foreground hover:bg-primary/90" onClick={() => window.location.reload()}><RefreshCw />{this.props.copy.reload}</Button><Button variant="ghost" className="h-10 cursor-pointer rounded-xl bg-foreground/5 px-4 text-[13px] font-bold normal-case tracking-normal hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-primary/30" render={<a href="/" />}><Home />{this.props.copy.home}</Button></div></main>
  }
}

export default function GlobalErrorBoundary({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const { reportError } = useErrorHandler()
  return <ErrorBoundary onError={reportError} copy={{ title: t('errors.appTitle'), description: t('errors.appMessage'), reload: t('errors.reload'), home: t('common.returnHome') }}>{children}</ErrorBoundary>
}
