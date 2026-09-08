import { Loader2, Plus, X } from 'lucide-react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useDepartments } from '@/hooks/useDepartments'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
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
      <div>
        <h2 className="text-lg font-semibold">Users &amp; Roles</h2>
        <p className="text-sm text-muted-foreground">
          Every user has a role, and every role is scoped to a department: User → Role → Department → Permissions.
          People sign up from the login screen; you grant the role here.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading…
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-8">
                          <AvatarFallback>{initials(p.full_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{p.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.staff_number ?? '—'} · {p.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{departments.find((d) => d.id === p.primary_department_id)?.name ?? '—'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
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
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.status === 'active' ? 'success' : 'warning'} className="capitalize">
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <AssignRoleDialog profile={p} roles={roles} departments={departments} onAssigned={load} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
