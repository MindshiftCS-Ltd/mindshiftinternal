import { Loader2 } from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/features/auth/AuthProvider'
import { useDepartments } from '@/hooks/useDepartments'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

export function ProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const { departments } = useDepartments()
  const [fullName, setFullName] = React.useState(profile?.full_name ?? '')
  const [phone, setPhone] = React.useState(profile?.phone ?? '')
  const [jobTitle, setJobTitle] = React.useState(profile?.job_title ?? '')
  const [saving, setSaving] = React.useState(false)
  const [hasConfidentialRecord, setHasConfidentialRecord] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    setFullName(profile?.full_name ?? '')
    setPhone(profile?.phone ?? '')
    setJobTitle(profile?.job_title ?? '')
  }, [profile])

  React.useEffect(() => {
    if (!isSupabaseConfigured || !profile) return
    supabase
      .from('staff_confidential')
      .select('profile_id')
      .eq('profile_id', profile.id)
      .maybeSingle()
      .then(({ data }) => setHasConfidentialRecord(Boolean(data)))
  }, [profile])

  if (!isSupabaseConfigured || !profile) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Connect Supabase and sign in to see your profile.
        </CardContent>
      </Card>
    )
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone: phone || null, job_title: jobTitle || null })
      .eq('id', profile!.id)
    setSaving(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Profile updated')
    await refreshProfile()
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">My Profile</h2>
        <p className="text-sm text-muted-foreground">Your personal details and staff record.</p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <Avatar className="size-12">
            <AvatarFallback>{initials(profile.full_name)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{profile.full_name}</CardTitle>
            <CardDescription>
              {profile.staff_number ?? 'No staff number yet'} ·{' '}
              {departments.find((d) => d.id === profile.primary_department_id)?.name ?? 'No department'}
            </CardDescription>
          </div>
          <Badge variant={profile.status === 'active' ? 'success' : 'warning'} className="ml-auto capitalize">
            {profile.status}
          </Badge>
        </CardHeader>
        <CardContent>
          <form className="grid max-w-md gap-4" onSubmit={handleSave}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="profile-name">Full name</Label>
              <Input id="profile-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="profile-email">Email</Label>
              <Input id="profile-email" value={profile.email} disabled />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="profile-phone">Phone</Label>
              <Input id="profile-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234…" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="profile-job">Job title</Label>
              <Input id="profile-job" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Project Officer" />
            </div>
            <Button type="submit" disabled={saving} className="self-start">
              {saving ? <Loader2 className="size-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Confidential record</CardTitle>
          <CardDescription>NIN, BVN, bank and payroll details — visible only to you, HR and Super Admin.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {hasConfidentialRecord === null
              ? 'Checking…'
              : hasConfidentialRecord
                ? 'On file. Contact HR to update it.'
                : 'No confidential record on file yet. HR adds this during onboarding.'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
