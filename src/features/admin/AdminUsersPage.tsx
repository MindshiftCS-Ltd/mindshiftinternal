import { UserPlus } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { demoStaff } from '@/lib/demoData'

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

export function AdminUsersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Users &amp; Roles</h2>
          <p className="text-sm text-muted-foreground">
            Every user has a role, and every role is scoped to a department: User → Role → Department → Permissions.
          </p>
        </div>
        <Button>
          <UserPlus /> Invite User
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoStaff.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8">
                        <AvatarFallback>{initials(staff.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{staff.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {staff.id} · {staff.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{staff.department}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{staff.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={staff.status === 'Active' ? 'success' : 'warning'}>{staff.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
