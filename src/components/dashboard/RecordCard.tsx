import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'

type StatusVariant = 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline'

function statusVariant(status: string): StatusVariant {
  const s = status.toLowerCase()
  if (s.includes('pending') || s.includes('review')) return 'warning'
  if (s.includes('reject') || s.includes('cancel')) return 'destructive'
  if (s.includes('active') || s.includes('approved') || s.includes('qualified') || s.includes('done')) return 'success'
  return 'secondary'
}

export interface RecordCardProps {
  id: string
  kind: string
  title: string
  subtitle?: string
  meta?: string
  status: string
  onView?: () => void
}

export function RecordCard({ id, kind, title, subtitle, meta, status, onView }: RecordCardProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {kind} · {id}
          </p>
          <p className="mt-1 text-sm font-semibold">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <Badge variant={statusVariant(status)} dot>
          {status}
        </Badge>
      </CardHeader>
      <CardContent>{meta && <p className="text-sm text-muted-foreground">{meta}</p>}</CardContent>
      <CardFooter className="gap-2">
        <Button size="sm" variant="outline" onClick={onView}>
          View
        </Button>
      </CardFooter>
    </Card>
  )
}
