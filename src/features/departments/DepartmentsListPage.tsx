import { Building2, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDepartments } from '@/hooks/useDepartments'

export function DepartmentsListPage() {
  const { departments, loading, error } = useDepartments()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Departments</h2>
        <p className="text-sm text-muted-foreground">
          Every department is a self-contained workspace with its own forms, records and workflows.
        </p>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          Couldn't load departments: {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading departments…
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <Link key={dept.id} to={`/departments/${dept.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      <Building2 className="size-4" />
                    </div>
                    <CardTitle className="text-sm">{dept.name}</CardTitle>
                  </div>
                  <Badge variant="outline">{dept.code}</Badge>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <p className="text-xs text-muted-foreground">{dept.description}</p>
                  <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground">
                    <span>{dept.memberCount} members</span>
                    <span>{dept.openRecords} open records</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
