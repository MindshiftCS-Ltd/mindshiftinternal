import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '@/features/auth/AuthProvider'
import { isSupabaseConfigured } from '@/lib/supabase'

export function ProtectedRoute() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (!isSupabaseConfigured) return <Outlet />

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
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
