import { Card, CardContent } from '@/components/ui/card'

export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Card>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          This module is scaffolded in the data model and navigation — build it out here next.
        </CardContent>
      </Card>
    </div>
  )
}
