import * as React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'

import { useAuth } from '@/features/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isSupabaseConfigured } from '@/lib/supabase'

export function LoginPage() {
  const { session, signInWithPassword } = useAuth()
  const location = useLocation()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)

  if (session) {
    const from = (location.state as { from?: string } | null)?.from ?? '/'
    return <Navigate to={from} replace />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const { error } = await signInWithPassword(email, password)
    setSubmitting(false)
    if (error) toast.error(error)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            MS
          </div>
          <CardTitle className="text-xl">Mindshift Internal</CardTitle>
          <CardDescription>Operations &amp; Administration Platform</CardDescription>
        </CardHeader>
        <CardContent>
          {!isSupabaseConfigured ? (
            <p className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning-foreground">
              Backend not connected yet. Set <code>VITE_SUPABASE_URL</code> and{' '}
              <code>VITE_SUPABASE_ANON_KEY</code> in <code>.env</code> to enable sign-in.
            </p>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@mindshift.com"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={submitting} className="mt-2">
                {submitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
