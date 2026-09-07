import { RecordCard } from '@/components/dashboard/RecordCard'
import { StatCard } from '@/components/dashboard/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/features/auth/AuthProvider'
import { demoActivity, demoRecords, demoStats } from '@/lib/demoData'

export function DashboardPage() {
  const { profile } = useAuth()
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Welcome back, {firstName}</h2>
        <p className="text-sm text-muted-foreground">Here's what's happening across Mindshift today.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {demoStats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-3 lg:col-span-2">
          <h3 className="text-sm font-semibold">Recent Records</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {demoRecords.map((record) => (
              <RecordCard
                key={record.id}
                id={record.id}
                kind={record.kind}
                title={record.title}
                subtitle={record.subtitle}
                meta={record.meta}
                status={record.status}
              />
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-4">
              {demoActivity.map((item, i) => (
                <li key={item.id} className="relative pl-5">
                  {i !== demoActivity.length - 1 && (
                    <span className="absolute top-2 left-[3px] h-full w-px bg-border" />
                  )}
                  <span className="absolute top-1.5 left-0 size-1.5 rounded-full bg-primary" />
                  <p className="text-sm">{item.text}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.who} · {item.when}
                  </p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
