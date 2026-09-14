import { Outlet } from '@tanstack/react-router'
import RouteProgress from '@/components/route-progress'

export default function RootLayout() {
  return <><RouteProgress /><Outlet /></>
}
