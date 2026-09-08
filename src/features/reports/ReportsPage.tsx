import { Loader2 } from 'lucide-react'
import * as React from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { useDepartments } from '@/hooks/useDepartments'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

interface DeptCount {
  departmentId: string | null
  total: number
  approved: number
  pending: number
  rejected: number
}

function Metric({ label, value, tone }: { label: string; value: number; tone: 'default' | 'warning' | 'success' | 'destructive' }) {
  const toneClass = {
    default: 'text-foreground',
    warning: 'text-warning-foreground',
    success: 'text-success',
    destructive: 'text-destructive',
  }[tone]
  return (
    <div className="rounded-xl bg-secondary/50 px-3 py-2.5">
      <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className={`text-xl font-bold ${toneClass}`}>{value}</p>
    </div>
  )
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
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No submissions recorded yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <Card key={row.departmentId ?? 'org-wide'}>
              <CardContent className="flex flex-col gap-4 pt-6">
                <div>
                  <p className="font-semibold">{departments.find((d) => d.id === row.departmentId)?.name ?? 'Organisation-wide'}</p>
                  <p className="text-xs text-muted-foreground">{row.total} total submission{row.total === 1 ? '' : 's'}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Metric label="Pending" value={row.pending} tone="warning" />
                  <Metric label="Approved" value={row.approved} tone="success" />
                  <Metric label="Rejected" value={row.rejected} tone="destructive" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
