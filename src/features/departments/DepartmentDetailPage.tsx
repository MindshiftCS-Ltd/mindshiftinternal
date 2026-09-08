import { FileText, Loader2, Plus, Workflow as WorkflowIcon } from 'lucide-react'
import * as React from 'react'
import { Navigate, useParams } from 'react-router-dom'

import { RecordCard } from '@/components/dashboard/RecordCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDepartments } from '@/hooks/useDepartments'
import { demoRecords } from '@/lib/demoData'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { FormDef } from '@/types/domain'

function DepartmentForms({ departmentId, departmentName }: { departmentId: string; departmentName: string }) {
  const [forms, setForms] = React.useState<FormDef[] | null>(null)

  React.useEffect(() => {
    if (!isSupabaseConfigured) return
    supabase
      .from('forms')
      .select('*')
      .eq('department_id', departmentId)
      .order('name')
      .then(({ data }) => setForms(data ?? []))
  }, [departmentId])

  if (!isSupabaseConfigured) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_-2px_rgba(16,24,40,0.06)]">
        <FileText className="size-4 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Leave Request</p>
          <p className="text-xs text-muted-foreground">Requires approval · 4 fields</p>
        </div>
      </div>
    )
  }

  if (forms === null) {
    return (
      <div className="col-span-full flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading forms…
      </div>
    )
  }

  if (forms.length === 0) {
    return (
      <p className="col-span-full text-sm text-muted-foreground">
        No forms published to {departmentName} yet. Build one in Administration → Form Builder.
      </p>
    )
  }

  return (
    <>
      {forms.map((form) => (
        <div
          key={form.id}
          className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_-2px_rgba(16,24,40,0.06)]"
        >
          <FileText className="size-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{form.name}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {form.status} · {form.requires_approval ? 'Requires approval' : 'No approval required'}
            </p>
          </div>
        </div>
      ))}
    </>
  )
}

export function DepartmentDetailPage() {
  const { departmentId } = useParams()
  const { departments, loading } = useDepartments()
  const department = departments.find((d) => d.id === departmentId)

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading department…
      </div>
    )
  }

  if (!department) return <Navigate to="/departments" replace />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{department.name}</h2>
            <Badge variant="outline">{department.code}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{department.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Plus /> New Record
          </Button>
        </div>
      </div>

      <Tabs defaultValue="forms">
        <TabsList>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="forms" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Forms published to {department.name}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <DepartmentForms departmentId={department.id} departmentName={department.name} />
              <p className="col-span-full text-sm text-muted-foreground">
                Department admins build these in Administration → Form Builder — no code changes needed.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="mt-4 grid gap-3 sm:grid-cols-2">
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
        </TabsContent>

        <TabsContent value="workflows" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Approval workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="secondary" className="gap-1.5">
                  <WorkflowIcon className="size-3" /> Submitted
                </Badge>
                <span className="text-muted-foreground">→</span>
                <Badge variant="secondary">Reporting Manager</Badge>
                <span className="text-muted-foreground">→</span>
                <Badge variant="secondary">Department Review</Badge>
                <span className="text-muted-foreground">→</span>
                <Badge variant="success">Approved</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Department reports will summarise submissions, approvals and turnaround time here.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
