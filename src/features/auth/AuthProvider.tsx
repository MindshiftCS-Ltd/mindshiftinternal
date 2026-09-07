import type { Session } from '@supabase/supabase-js'
import * as React from 'react'

import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { DepartmentMember, Profile, Role } from '@/types/domain'

export interface DepartmentRoleAssignment extends DepartmentMember {
  role: Role
}

interface AuthContextValue {
  loading: boolean
  session: Session | null
  profile: Profile | null
  globalRoles: Role[]
  departmentRoles: DepartmentRoleAssignment[]
  isSuperAdmin: boolean
  isFlm: boolean
  isDepartmentHead: (departmentId: string) => boolean
  isDepartmentMember: (departmentId: string) => boolean
  hasDepartmentRole: (departmentId: string, slug: string) => boolean
  refreshProfile: () => Promise<void>
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = React.useState(true)
  const [session, setSession] = React.useState<Session | null>(null)
  const [profile, setProfile] = React.useState<Profile | null>(null)
  const [globalRoles, setGlobalRoles] = React.useState<Role[]>([])
  const [departmentRoles, setDepartmentRoles] = React.useState<DepartmentRoleAssignment[]>([])

  const loadUserContext = React.useCallback(async (userId: string) => {
    const [profileRes, globalRolesRes, deptRolesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('user_global_roles').select('role:roles(*)').eq('user_id', userId),
      supabase.from('department_members').select('*, role:roles(*)').eq('user_id', userId),
    ])

    setProfile((profileRes.data as Profile | null) ?? null)
    setGlobalRoles(((globalRolesRes.data ?? []) as unknown as { role: Role }[]).map((r) => r.role))
    setDepartmentRoles((deptRolesRes.data ?? []) as unknown as DepartmentRoleAssignment[])
  }, [])

  React.useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) {
        void loadUserContext(data.session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession) {
        void loadUserContext(nextSession.user.id)
      } else {
        setProfile(null)
        setGlobalRoles([])
        setDepartmentRoles([])
      }
    })

    return () => subscription.subscription.unsubscribe()
  }, [loadUserContext])

  // With no backend connected yet there is no auth session to derive roles
  // from; treat the session as a full-access demo admin so every screen
  // (including Administration) can be previewed end to end.
  const isSuperAdmin = !isSupabaseConfigured || globalRoles.some((r) => r.slug === 'super_admin')
  const isFlm = isSuperAdmin || globalRoles.some((r) => r.slug === 'flm')

  const isDepartmentHead = React.useCallback(
    (departmentId: string) =>
      isFlm || departmentRoles.some((dr) => dr.department_id === departmentId && dr.role.slug === 'department_head'),
    [isFlm, departmentRoles],
  )

  const isDepartmentMember = React.useCallback(
    (departmentId: string) => isFlm || departmentRoles.some((dr) => dr.department_id === departmentId),
    [isFlm, departmentRoles],
  )

  const hasDepartmentRole = React.useCallback(
    (departmentId: string, slug: string) =>
      departmentRoles.some((dr) => dr.department_id === departmentId && dr.role.slug === slug),
    [departmentRoles],
  )

  const refreshProfile = React.useCallback(async () => {
    if (session) await loadUserContext(session.user.id)
  }, [session, loadUserContext])

  const signInWithPassword = React.useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }, [])

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const value: AuthContextValue = {
    loading,
    session,
    profile,
    globalRoles,
    departmentRoles,
    isSuperAdmin,
    isFlm,
    isDepartmentHead,
    isDepartmentMember,
    hasDepartmentRole,
    refreshProfile,
    signInWithPassword,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
