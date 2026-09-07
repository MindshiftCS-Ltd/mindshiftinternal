import { Pencil } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CreateDepartmentDialog } from '@/features/admin/CreateDepartmentDialog'
import { demoDepartments } from '@/lib/demoData'

export function AdminDepartmentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Departments</h2>
          <p className="text-sm text-muted-foreground">
            Configuration, not code. Add a department and it's immediately usable across the platform.
          </p>
        </div>
        <CreateDepartmentDialog />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Open Records</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoDepartments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell>
                    <p className="font-medium">{dept.name}</p>
                    <p className="text-xs text-muted-foreground">{dept.description}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{dept.code}</Badge>
                  </TableCell>
                  <TableCell>{dept.memberCount}</TableCell>
                  <TableCell>{dept.openRecords}</TableCell>
                  <TableCell>
                    <Badge variant="success">Active</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <Pencil className="size-4" />
                    </Button>
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
