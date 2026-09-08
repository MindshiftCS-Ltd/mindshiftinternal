import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function StatCard({ label, value, className }: { label: string; value: number | string; className?: string }) {
  return (
    <Card className={cn(className)}>
      <CardContent className="py-5">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
        <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{value}</p>
      </CardContent>
    </Card>
  )
}
