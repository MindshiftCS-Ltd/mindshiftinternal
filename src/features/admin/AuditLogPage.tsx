import { Loader2 } from 'lucide-react'
import * as React from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

interface AuditRow {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  created_at: string
  actor: { full_name: string } | null
}

const ACTION_STYLE: Record<string, string> = {
  insert: 'bg-success/15 text-success',
  update: 'bg-warning/20 text-warning-foreground',
  delete: 'bg-destructive/15 text-destructive',
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
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No activity recorded yet.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <Card key={row.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${ACTION_STYLE[row.action] ?? 'bg-secondary text-muted-foreground'}`}
                  >
                    {row.action}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {row.actor?.full_name ?? 'System'}{' '}
                      <span className="font-normal text-muted-foreground capitalize">
                        {row.entity_type.replace(/_/g, ' ')}
                        {row.entity_id ? ` · ${row.entity_id.slice(0, 8)}` : ''}
                      </span>
                    </p>
                  </div>
                </div>
                <p className="shrink-0 text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
