import { Loader2 } from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/features/auth/AuthProvider'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { FormDef, OrgSettings } from '@/types/domain'

function publicLogoUrl(path: string | null) {
  if (!path) return null
  return supabase.storage.from('branding').getPublicUrl(path).data.publicUrl
}

export function SystemSettingsPage() {
  const { profile, isFlm } = useAuth()
  const [settings, setSettings] = React.useState<OrgSettings | null>(null)
  const [name, setName] = React.useState('')
  const [forms, setForms] = React.useState<FormDef[]>([])
  const [loading, setLoading] = React.useState(isSupabaseConfigured)
  const [saving, setSaving] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (!isSupabaseConfigured) return
    Promise.all([
      supabase.from('org_settings').select('*').eq('id', true).single(),
      supabase.from('forms').select('*').eq('status', 'published').order('name'),
    ]).then(([settingsRes, formsRes]) => {
      if (settingsRes.data) {
        setSettings(settingsRes.data)
        setName(settingsRes.data.name)
      }
      setForms(formsRes.data ?? [])
      setLoading(false)
    })
  }, [])

  async function handleSave() {
    setSaving(true)
    const { data, error } = await supabase
      .from('org_settings')
      .update({ name, updated_by: profile?.id ?? null, updated_at: new Date().toISOString() })
      .eq('id', true)
      .select()
      .single()
    setSaving(false)
    if (error || !data) {
      toast.error(error?.message ?? 'Could not save settings')
      return
    }
    setSettings(data)
    toast.success('Organisation settings saved')
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    const path = `logo-${Date.now()}.${file.name.split('.').pop()}`
    const { error: uploadError } = await supabase.storage.from('branding').upload(path, file, { upsert: true })
    if (uploadError) {
      setUploading(false)
      toast.error(uploadError.message)
      return
    }
    const { data, error } = await supabase
      .from('org_settings')
      .update({ logo_path: path, updated_by: profile?.id ?? null, updated_at: new Date().toISOString() })
      .eq('id', true)
      .select()
      .single()
    setUploading(false)
    if (error || !data) {
      toast.error(error?.message ?? 'Logo uploaded, but could not save the reference')
      return
    }
    setSettings(data)
    toast.success('Logo updated')
  }

  if (!isSupabaseConfigured) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Connect Supabase (see README) to manage system settings.
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading…
      </div>
    )
  }

  const logoUrl = publicLogoUrl(settings?.logo_path ?? null)

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
            <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} disabled={!isFlm} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Logo</Label>
            <div className="flex items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary/60 text-xs text-muted-foreground shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_-2px_rgba(16,24,40,0.06)]">
                {logoUrl ? <img src={logoUrl} alt="Organisation logo" className="size-full object-contain" /> : 'Logo'}
              </div>
              {isFlm && (
                <>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                  <Button variant="outline" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                    {uploading ? <Loader2 className="size-4 animate-spin" /> : 'Upload'}
                  </Button>
                </>
              )}
            </div>
          </div>
          {isFlm ? (
            <Button className="self-start" disabled={saving || name.trim() === settings?.name} onClick={handleSave}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : 'Save Changes'}
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">Only Super Admin / FLM can change organisation settings.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Numbering Conventions</CardTitle>
          <CardDescription>Reference code prefixes used when a record is created, per published form.</CardDescription>
        </CardHeader>
        <CardContent>
          {forms.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No published forms yet — prefixes appear here once a form is published in Form Builder.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {forms.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-2.5 text-sm"
                >
                  <span className="text-muted-foreground">{f.name}</span>
                  <span className="font-mono font-semibold">{f.reference_prefix}-0001</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
