import { Check, Copy, Loader2, Plus, UserPlus, X } from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDepartments } from '@/hooks/useDepartments'
import { isSupabaseConfigured, supabase, supabaseAdminAuth } from '@/lib/supabase'
import type { Profile, Role } from '@/types/domain'

const GLOBAL_ROLE_SLUGS = ['super_admin', 'flm']

interface RoleBadge {
  key: string
  label: string
  onRemove: () => void
}

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

function generateTempPassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%'
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

function AddStaffDialog({
  roles,
  departments,
  onCreated,
}: {
  roles: Role[]
  departments: { id: string; name: string }[]
  onCreated: () => void
}) {
  const [open, setOpen] = React.useState(false)
  const [fullName, setFullName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const departmentRoles = roles.filter((r) => !GLOBAL_ROLE_SLUGS.includes(r.slug))
  const [departmentId, setDepartmentId] = React.useState(departments[0]?.id ?? '')
  const [roleId, setRoleId] = React.useState(departmentRoles[0]?.id ?? '')
  const [submitting, setSubmitting] = React.useState(false)
  const [result, setResult] = React.useState<{ email: string; password: string } | null>(null)
  const [copied, setCopied] = React.useState(false)

  function reset() {
    setFullName('')
    setEmail('')
    setResult(null)
    setCopied(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const password = generateTempPassword()

    const { data, error } = await supabaseAdminAuth.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    if (error || !data.user) {
      setSubmitting(false)
      toast.error(error?.message ?? 'Could not create the account')
      return
    }

    if (departmentId && roleId) {
      const { error: memberError } = await supabase
        .from('department_members')
        .insert({ user_id: data.user.id, department_id: departmentId, role_id: roleId })
      if (memberError) toast.error(`Account created, but role assignment failed: ${memberError.message}`)
    }

    setSubmitting(false)
    setResult({ email, password })
    onCreated()
  }

  async function copyPassword() {
    if (!result) return
    await navigator.clipboard.writeText(result.password)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus /> Add Staff
        </Button>
      </DialogTrigger>
      <DialogContent>
        {result ? (
          <>
            <DialogHeader>
              <DialogTitle>Account created</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3 text-sm">
              <p className="text-muted-foreground">
                Share this temporary password with <strong>{result.email}</strong> directly — it's shown only once.
                They'll need to confirm their email before they can sign in, and should change this password on
                first login.
              </p>
              <div className="flex items-center justify-between gap-2 rounded-xl bg-secondary/60 px-3 py-2">
                <code className="text-sm font-semibold tracking-wide">{result.password}</code>
                <Button type="button" variant="ghost" size="icon" onClick={copyPassword}>
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                onClick={() => {
                  setOpen(false)
                  reset()
                }}
              >
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Add a staff member</DialogTitle>
            </DialogHeader>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="staff-name">Full name</Label>
                <Input id="staff-name" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ada Nwosu" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="staff-email">Work email</Label>
                <Input
                  id="staff-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ada@mindshift.com"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label>Department</Label>
                  <Select value={departmentId} onValueChange={setDepartmentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Role</Label>
                  <Select value={roleId} onValueChange={setRoleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentRoles.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                A temporary password is generated automatically — you'll get one chance to copy it after the account
                is created.
              </p>
              <DialogFooter>
                <Button type="submit" disabled={submitting || !fullName.trim() || !email.trim()}>
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : 'Create account'}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function AssignRoleDialog({
  profile,
  roles,
  departments,
  onAssigned,
}: {
  profile: Profile
  roles: Role[]
  departments: { id: string; name: string }[]
  onAssigned: () => void
}) {
  const [open, setOpen] = React.useState(false)
  const [scope, setScope] = React.useState<'global' | 'department'>('department')
  const globalRoles = roles.filter((r) => GLOBAL_ROLE_SLUGS.includes(r.slug))
  const departmentRoles = roles.filter((r) => !GLOBAL_ROLE_SLUGS.includes(r.slug))
  const [roleId, setRoleId] = React.useState(departmentRoles[0]?.id ?? '')
  const [departmentId, setDepartmentId] = React.useState(departments[0]?.id ?? '')

  React.useEffect(() => {
    if (scope === 'global' && globalRoles[0]) setRoleId(globalRoles[0].id)
    if (scope === 'department' && departmentRoles[0]) setRoleId(departmentRoles[0].id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (scope === 'global') {
      const { error } = await supabase.from('user_global_roles').insert({ user_id: profile.id, role_id: roleId })
      if (error) {
        toast.error(error.message)
        return
      }
    } else {
      const { error } = await supabase
        .from('department_members')
        .insert({ user_id: profile.id, role_id: roleId, department_id: departmentId })
      if (error) {
        toast.error(error.message)
        return
      }
    }
    toast.success('Role assigned')
    setOpen(false)
    onAssigned()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Plus /> Assign role
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign role to {profile.full_name}</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Select value={scope} onValueChange={(v) => setScope(v as 'global' | 'department')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="department">Department-scoped role</SelectItem>
              <SelectItem value="global">Organisation-wide role</SelectItem>
            </SelectContent>
          </Select>

          {scope === 'department' && (
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={roleId} onValueChange={setRoleId}>
            <SelectTrigger>
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              {(scope === 'global' ? globalRoles : departmentRoles).map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DialogFooter>
            <Button type="submit" disabled={!roleId || (scope === 'department' && !departmentId)}>
              Assign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function AdminUsersPage() {
  const { departments } = useDepartments()
  const [profiles, setProfiles] = React.useState<Profile[]>([])
  const [roles, setRoles] = React.useState<Role[]>([])
  const [globalAssignments, setGlobalAssignments] = React.useState<{ id: string; user_id: string; role_id: string }[]>([])
  const [deptAssignments, setDeptAssignments] = React.useState<
    { id: string; user_id: string; role_id: string; department_id: string }[]
  >([])
  const [loading, setLoading] = React.useState(isSupabaseConfigured)

  const load = React.useCallback(async () => {
    if (!isSupabaseConfigured) return
    setLoading(true)
    const [profilesRes, rolesRes, globalRes, deptRes] = await Promise.all([
      supabase.from('profiles').select('*').order('full_name'),
      supabase.from('roles').select('*').order('name'),
      supabase.from('user_global_roles').select('id, user_id, role_id'),
      supabase.from('department_members').select('id, user_id, role_id, department_id'),
    ])
    setProfiles(profilesRes.data ?? [])
    setRoles(rolesRes.data ?? [])
    setGlobalAssignments(globalRes.data ?? [])
    setDeptAssignments(deptRes.data ?? [])
    setLoading(false)
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  async function removeGlobalRole(id: string) {
    const { error } = await supabase.from('user_global_roles').delete().eq('id', id)
    if (error) toast.error(error.message)
    else void load()
  }

  async function removeDeptRole(id: string) {
    const { error } = await supabase.from('department_members').delete().eq('id', id)
    if (error) toast.error(error.message)
    else void load()
  }

  function badgesFor(profile: Profile): RoleBadge[] {
    const g = globalAssignments
      .filter((a) => a.user_id === profile.id)
      .map((a) => ({
        key: `g-${a.id}`,
        label: roles.find((r) => r.id === a.role_id)?.name ?? 'Role',
        onRemove: () => removeGlobalRole(a.id),
      }))
    const d = deptAssignments
      .filter((a) => a.user_id === profile.id)
      .map((a) => {
        const roleName = roles.find((r) => r.id === a.role_id)?.name ?? 'Role'
        const deptCode = departments.find((dep) => dep.id === a.department_id)?.code ?? ''
        return {
          key: `d-${a.id}`,
          label: `${roleName} · ${deptCode}`,
          onRemove: () => removeDeptRole(a.id),
        }
      })
    return [...g, ...d]
  }

  if (!isSupabaseConfigured) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Connect Supabase (see README) to manage users and roles.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Users &amp; Roles</h2>
          <p className="text-sm text-muted-foreground">
            Every user has a role, and every role is scoped to a department: User → Role → Department → Permissions.
          </p>
        </div>
        <AddStaffDialog roles={roles} departments={departments} onCreated={load} />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      ) : profiles.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">No staff yet.</CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {profiles.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex flex-wrap items-center gap-4 py-4">
                <Avatar className="size-10 shrink-0">
                  <AvatarFallback>{initials(p.full_name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{p.full_name}</p>
                    <Badge variant={p.status === 'active' ? 'success' : 'warning'} dot className="capitalize">
                      {p.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {p.staff_number ?? '—'} · {p.email} ·{' '}
                    {departments.find((d) => d.id === p.primary_department_id)?.name ?? 'No department'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {badgesFor(p).map((b) => (
                      <Badge key={b.key} variant="secondary" className="gap-1">
                        {b.label}
                        <button onClick={b.onRemove} className="hover:text-destructive">
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                    {badgesFor(p).length === 0 && <span className="text-xs text-muted-foreground">No roles yet</span>}
                  </div>
                </div>
                <AssignRoleDialog profile={p} roles={roles} departments={departments} onAssigned={load} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
