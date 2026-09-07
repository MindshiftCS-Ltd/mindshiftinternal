import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { demoAuditLog } from '@/lib/demoData'

export function AuditLogPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Audit Log</h2>
        <p className="text-sm text-muted-foreground">
          Every sensitive action is recorded: who, what, when, and the before/after state.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Before → After</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoAuditLog.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.actor}</TableCell>
                  <TableCell>{entry.action}</TableCell>
                  <TableCell className="text-muted-foreground">{entry.entity}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.before && entry.after ? `${entry.before} → ${entry.after}` : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{entry.when}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
