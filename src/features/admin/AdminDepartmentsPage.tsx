import { Loader2, Pencil } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CreateDepartmentDialog } from '@/features/admin/CreateDepartmentDialog'
import { useDepartments } from '@/hooks/useDepartments'

export function AdminDepartmentsPage() {
  const { departments, loading, refresh } = useDepartments()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Departments</h2>
          <p className="text-sm text-muted-foreground">
            Configuration, not code. Add a department and it's immediately usable across the platform.
          </p>
        </div>
        <CreateDepartmentDialog onCreated={refresh} />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading departments…
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {departments.map((dept) => (
            <Card key={dept.id} className="h-52">
              <CardContent className="flex h-full flex-col gap-3 pt-6">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline">{dept.code}</Badge>
                  <div className="flex items-center gap-1">
                    <Badge variant="success" dot>
                      Active
                    </Badge>
                    <Button variant="ghost" size="icon" className="size-7">
                      <Pencil className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="line-clamp-2 min-h-10 font-semibold">{dept.name}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{dept.description}</p>
                </div>
                <div className="mt-auto flex items-center gap-4 text-sm">
                  <span>
                    <strong>{dept.memberCount}</strong> <span className="text-muted-foreground">members</span>
                  </span>
                  <span>
                    <strong>{dept.openRecords}</strong> <span className="text-muted-foreground">open</span>
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
