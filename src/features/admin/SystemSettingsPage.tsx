import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function SystemSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">System Settings</h2>
        <p className="text-sm text-muted-foreground">Organisation-wide configuration.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organisation</CardTitle>
          <CardDescription>Name and branding shown across the platform.</CardDescription>
        </CardHeader>
        <CardContent className="flex max-w-md flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="org-name">Organisation name</Label>
            <Input id="org-name" defaultValue="Mindshift" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Logo</Label>
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                Logo
              </div>
              <Button variant="outline" size="sm">
                Upload
              </Button>
            </div>
          </div>
          <Button className="self-start">Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Numbering Conventions</CardTitle>
          <CardDescription>Reference code prefixes used when a record is created.</CardDescription>
        </CardHeader>
        <CardContent className="grid max-w-md grid-cols-2 gap-3 text-sm">
          <span className="text-muted-foreground">Staff</span>
          <span className="font-mono">MS-STAFF-0001</span>
          <span className="text-muted-foreground">Leave Request</span>
          <span className="font-mono">LR-0001</span>
          <span className="text-muted-foreground">Lead</span>
          <span className="font-mono">LD-0001</span>
        </CardContent>
      </Card>
    </div>
  )
}
