import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '@/features/auth/AuthProvider'
import { isSupabaseConfigured } from '@/lib/supabase'

export function ProtectedRoute() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (!isSupabaseConfigured) return <Outlet />

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading Mindshift Internal…
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

export function AdminRoute({ allow }: { allow: boolean }) {
  if (!allow) return <Navigate to="/" replace />
  return <Outlet />
}
