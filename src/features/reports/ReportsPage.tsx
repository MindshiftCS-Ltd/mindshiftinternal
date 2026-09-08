import { Loader2 } from 'lucide-react'
import * as React from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useDepartments } from '@/hooks/useDepartments'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

interface DeptCount {
  departmentId: string | null
  total: number
  approved: number
  pending: number
  rejected: number
}

export function ReportsPage() {
  const { departments } = useDepartments()
  const [rows, setRows] = React.useState<DeptCount[]>([])
  const [loading, setLoading] = React.useState(isSupabaseConfigured)

  React.useEffect(() => {
    if (!isSupabaseConfigured) return
    supabase
      .from('form_submissions')
      .select('department_id, status')
      .then(({ data }) => {
        const byDept = new Map<string | null, DeptCount>()
        for (const row of data ?? []) {
          const key = row.department_id
          const entry = byDept.get(key) ?? { departmentId: key, total: 0, approved: 0, pending: 0, rejected: 0 }
          entry.total += 1
          if (row.status === 'approved') entry.approved += 1
          else if (row.status === 'rejected') entry.rejected += 1
          else if (row.status === 'submitted' || row.status === 'in_review') entry.pending += 1
          byDept.set(key, entry)
        }
        setRows([...byDept.values()].sort((a, b) => b.total - a.total))
        setLoading(false)
      })
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Reports</h2>
        <p className="text-sm text-muted-foreground">Submissions by department, across every form and workflow.</p>
      </div>

      {!isSupabaseConfigured ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Connect Supabase (see README) to see reports.
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Submissions by department</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {rows.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">No submissions recorded yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead>Approved</TableHead>
                    <TableHead>Rejected</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.departmentId ?? 'org-wide'}>
                      <TableCell className="font-medium">
                        {departments.find((d) => d.id === row.departmentId)?.name ?? 'Organisation-wide'}
                      </TableCell>
                      <TableCell>{row.total}</TableCell>
                      <TableCell>{row.pending}</TableCell>
                      <TableCell>{row.approved}</TableCell>
                      <TableCell>{row.rejected}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
