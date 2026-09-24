import { createRootRouteWithContext, createRoute, createRouter, lazyRouteComponent, redirect } from '@tanstack/react-router'
import LoadingScreen from '@/components/loading-screen'
import RootLayout from '@/components/root-layout'
import type { AuthContextValue } from '@/providers/auth-context'
import LandingPage from '@/pages/landing-page'
import NotFoundPage from '@/pages/not-found-page'
import RouteErrorPage from '@/pages/route-error-page'

interface RouterContext {
  auth: AuthContextValue
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
  pendingComponent: LoadingScreen,
  errorComponent: RouteErrorPage,
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
const notificationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/notifications',
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) throw redirect({ to: '/login', search: { redirect: '/notifications' } })
  },
  component: lazyRouteComponent(() => import('@/pages/notifications-page')),
})
const doctorProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/doctor/profile',
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login', search: { redirect: '/doctor/profile' } })
    }

    if (!context.auth.user?.roles.some((role) => role.toLowerCase() === 'doctor')) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: lazyRouteComponent(() => import('@/pages/doctor-profile-page')),
})
const doctorInvitationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/doctor/invitations',
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login', search: { redirect: '/doctor/invitations' } })
    }

    if (!context.auth.user?.roles.some((role) => role.toLowerCase() === 'doctor')) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: lazyRouteComponent(() => import('@/pages/doctor-invitations-page')),
})
function requireDoctor(context: RouterContext) {
  if (!context.auth.isAuthenticated) {
    throw redirect({ to: '/login', search: { redirect: '/doctor/clinics' } })
  }
  if (!context.auth.user?.roles.some((role) => role.toLowerCase() === 'doctor')) {
    throw redirect({ to: '/dashboard' })
  }
}
const doctorWorkingHoursRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/doctor/working-hours',
  beforeLoad: ({ context }) => requireDoctor(context),
  validateSearch: (search: Record<string, unknown>) => {
    const clinicId = Number(search.clinicId)
    return { clinicId: Number.isInteger(clinicId) && clinicId > 0 ? clinicId : undefined }
  },
  component: lazyRouteComponent(() => import('@/pages/working-hours-page')),
})
const doctorClinicsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/doctor/clinics',
  beforeLoad: ({ context }) => requireDoctor(context),
  component: lazyRouteComponent(() => import('@/pages/doctor-clinics-page')),
})
const addDoctorClinicRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/doctor/clinics/new',
  beforeLoad: ({ context }) => requireDoctor(context),
  component: lazyRouteComponent(() => import('@/pages/add-clinic-page')),
})
const doctorClinicDetailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/doctor/clinics/$clinicId',
  beforeLoad: ({ context }) => requireDoctor(context),
  component: lazyRouteComponent(() => import('@/pages/clinic-details-page')),
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
  notificationsRoute,
  doctorProfileRoute,
  doctorInvitationsRoute,
  doctorWorkingHoursRoute,
  doctorClinicsRoute,
  addDoctorClinicRoute,
  doctorClinicDetailsRoute,
])

export const router = createRouter({
  routeTree,
  context: { auth: undefined! },
  defaultPreload: 'intent',
  defaultPendingComponent: LoadingScreen,
  defaultErrorComponent: RouteErrorPage,
  defaultPendingMs: 120,
  defaultPendingMinMs: 300,
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
