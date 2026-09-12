import { createRootRouteWithContext, createRoute, createRouter, lazyRouteComponent, Outlet, redirect } from '@tanstack/react-router'
import LoadingScreen from '@/components/loading-screen'
import type { AuthContextValue } from '@/providers/auth-context'
import LandingPage from '@/pages/landing-page'
import NotFoundPage from '@/pages/not-found-page'

interface RouterContext {
  auth: AuthContextValue
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
  notFoundComponent: NotFoundPage,
  pendingComponent: LoadingScreen,
})

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: LandingPage })
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: lazyRouteComponent(() => import('@/pages/login-page')),
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
})
const registerRoute = createRoute({ getParentRoute: () => rootRoute, path: '/register', component: lazyRouteComponent(() => import('@/pages/register-choice-page')) })
const patientRegisterRoute = createRoute({ getParentRoute: () => rootRoute, path: '/register/patient', component: lazyRouteComponent(() => import('@/pages/patient-register-page')) })
const doctorRegisterRoute = createRoute({ getParentRoute: () => rootRoute, path: '/register/doctor', component: lazyRouteComponent(() => import('@/pages/doctor-register-page')) })
const forgotPasswordRoute = createRoute({ getParentRoute: () => rootRoute, path: '/forgot-password', component: lazyRouteComponent(() => import('@/pages/forgot-password-page')) })
const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reset-password',
  component: lazyRouteComponent(() => import('@/pages/reset-password-page')),
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === 'string' ? search.email : '',
    token: typeof search.token === 'string' ? search.token : '',
  }),
})
const confirmEmailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/confirm-email',
  component: lazyRouteComponent(() => import('@/pages/confirm-email-page')),
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === 'string' ? search.email : '',
    token: typeof search.token === 'string' ? search.token : '',
  }),
})
const authStatusRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/status',
  component: lazyRouteComponent(() => import('@/pages/auth-status-page')),
  validateSearch: (search: Record<string, unknown>) => ({
    reason: typeof search.reason === 'string' ? search.reason : 'check-email',
    email: typeof search.email === 'string' ? search.email : '',
  }),
})
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login', search: { redirect: '/dashboard' } })
    }
  },
  component: lazyRouteComponent(() => import('@/pages/dashboard-page')),
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  patientRegisterRoute,
  doctorRegisterRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  confirmEmailRoute,
  authStatusRoute,
  dashboardRoute,
])

export const router = createRouter({
  routeTree,
  context: { auth: undefined! },
  defaultPreload: 'intent',
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
