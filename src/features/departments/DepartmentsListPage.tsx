import { Building2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { demoDepartments } from '@/lib/demoData'

export function DepartmentsListPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Departments</h2>
        <p className="text-sm text-muted-foreground">
          Every department is a self-contained workspace with its own forms, records and workflows.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {demoDepartments.map((dept) => (
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
    </div>
  )
}
