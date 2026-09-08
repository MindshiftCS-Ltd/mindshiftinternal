import { Loader2 } from 'lucide-react'
import * as React from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

interface AuditRow {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  created_at: string
  actor: { full_name: string } | null
}

export function AuditLogPage() {
  const [rows, setRows] = React.useState<AuditRow[]>([])
  const [loading, setLoading] = React.useState(isSupabaseConfigured)

  React.useEffect(() => {
    if (!isSupabaseConfigured) return
    supabase
      .from('audit_logs')
      .select('id, action, entity_type, entity_id, created_at, actor:profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setRows((data ?? []) as unknown as AuditRow[])
        setLoading(false)
      })
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Audit Log</h2>
        <p className="text-sm text-muted-foreground">
          Every sensitive action is recorded: who, what, when, and which record.
        </p>
      </div>

      {!isSupabaseConfigured ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Connect Supabase (see README) to see the audit log.
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            {rows.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-muted-foreground">No activity recorded yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.actor?.full_name ?? 'System'}</TableCell>
                      <TableCell className="capitalize">{row.action}</TableCell>
                      <TableCell className="text-muted-foreground capitalize">
                        {row.entity_type.replace(/_/g, ' ')}
                        {row.entity_id ? ` · ${row.entity_id.slice(0, 8)}` : ''}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{new Date(row.created_at).toLocaleString()}</TableCell>
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
