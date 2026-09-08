import * as React from 'react'

import { RecordCard } from '@/components/dashboard/RecordCard'
import { StatCard } from '@/components/dashboard/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/features/auth/AuthProvider'
import { demoActivity, demoRecords, demoStats } from '@/lib/demoData'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

interface LiveStat {
  label: string
  value: number
}

interface ActivityItem {
  id: string | number
  text: string
  who: string
  when: string
}

interface RecordItem {
  id: string
  kind: string
  title: string
  subtitle?: string
  meta?: string
  status: string
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

const AUDIT_ACTION_LABEL: Record<string, string> = {
  insert: 'created a',
  update: 'updated a',
  delete: 'deleted a',
}

export function DashboardPage() {
  const { profile } = useAuth()
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  const [stats, setStats] = React.useState<LiveStat[]>(demoStats)
  const [activity, setActivity] = React.useState<ActivityItem[]>(demoActivity)
  const [records, setRecords] = React.useState<RecordItem[]>(demoRecords)
  const [loading, setLoading] = React.useState(isSupabaseConfigured)

  React.useEffect(() => {
    if (!isSupabaseConfigured || !profile) return

    async function load() {
      setLoading(true)
      const [staffRes, deptRes, formsRes, approvalsRes, tasksRes, submissionsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('departments').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('forms').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase
          .from('submission_approvals')
          .select('id', { count: 'exact', head: true })
          .eq('approver_id', profile!.id)
          .eq('status', 'pending'),
        supabase
          .from('tasks')
          .select('id', { count: 'exact', head: true })
          .eq('assigned_to', profile!.id)
          .in('status', ['open', 'in_progress']),
        supabase.from('form_submissions').select('id', { count: 'exact', head: true }),
      ])

      setStats([
        { label: 'Active Staff', value: staffRes.count ?? 0 },
        { label: 'Departments', value: deptRes.count ?? 0 },
        { label: 'Published Forms', value: formsRes.count ?? 0 },
        { label: 'My Approvals', value: approvalsRes.count ?? 0 },
        { label: 'My Open Tasks', value: tasksRes.count ?? 0 },
        { label: 'Total Submissions', value: submissionsRes.count ?? 0 },
      ])

      const [auditRes, submissionsListRes] = await Promise.all([
        supabase
          .from('audit_logs')
          .select('id, action, entity_type, created_at, actor:profiles(full_name)')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('form_submissions')
          .select('id, reference_code, status, created_at, form:forms(name), submitter:profiles(full_name)')
          .order('created_at', { ascending: false })
          .limit(4),
      ])

      const auditRows = (auditRes.data ?? []) as unknown as {
        id: string
        action: string
        entity_type: string
        created_at: string
        actor: { full_name: string } | null
      }[]
      setActivity(
        auditRows.map((row) => ({
          id: row.id,
          text: `${AUDIT_ACTION_LABEL[row.action] ?? row.action} ${row.entity_type.replace(/_/g, ' ')} record`,
          who: row.actor?.full_name ?? 'System',
          when: timeAgo(row.created_at),
        })),
      )

      const submissionRows = (submissionsListRes.data ?? []) as unknown as {
        id: string
        reference_code: string
        status: string
        created_at: string
        form: { name: string } | null
        submitter: { full_name: string } | null
      }[]
      setRecords(
        submissionRows.map((row) => ({
          id: row.reference_code,
          kind: row.form?.name ?? 'Submission',
          title: row.submitter?.full_name ?? 'Unknown',
          meta: timeAgo(row.created_at),
          status: row.status.replace(/_/g, ' '),
        })),
      )

      setLoading(false)
    }

    void load()
  }, [profile])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Welcome back, {firstName}</h2>
        <p className="text-sm text-muted-foreground">Here's what's happening across Mindshift today.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={loading ? '—' : stat.value} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-3 lg:col-span-2">
          <h3 className="text-sm font-semibold">Recent Records</h3>
          {records.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No submissions yet. They'll show up here as departments start using their forms.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {records.map((record) => (
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
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing recorded yet.</p>
            ) : (
              <ol className="flex flex-col gap-4">
                {activity.map((item, i) => (
                  <li key={item.id} className="relative pl-5">
                    {i !== activity.length - 1 && <span className="absolute top-2 left-[3px] h-full w-px bg-border" />}
                    <span className="absolute top-1.5 left-0 size-1.5 rounded-full bg-primary" />
                    <p className="text-sm">{item.text}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.who} · {item.when}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
