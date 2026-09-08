import * as React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'

import { LogoMark, LogoWordmark } from '@/components/brand/Logo'
import { useAuth } from '@/features/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isSupabaseConfigured } from '@/lib/supabase'

export function LoginPage() {
  const { session, signInWithPassword, signUpWithPassword } = useAuth()
  const location = useLocation()
  const [mode, setMode] = React.useState<'sign-in' | 'sign-up'>('sign-in')
  const [fullName, setFullName] = React.useState('')
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
    const { error } =
      mode === 'sign-in' ? await signInWithPassword(email, password) : await signUpWithPassword(email, password, fullName)
    setSubmitting(false)
    if (error) {
      toast.error(error)
      return
    }
    if (mode === 'sign-up') {
      toast.success('Account created. Check your email to confirm, then sign in.')
      setMode('sign-in')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-3 flex size-16 items-center justify-center rounded-2xl border border-border bg-white p-2.5 shadow-sm">
            <LogoMark className="size-full" />
          </div>
          <LogoWordmark className="items-center" />
          <CardDescription className="mt-1">Operations &amp; Administration Platform</CardDescription>
        </CardHeader>
        <CardContent>
          {!isSupabaseConfigured ? (
            <p className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning-foreground">
              Backend not connected yet. Set <code>VITE_SUPABASE_URL</code> and{' '}
              <code>VITE_SUPABASE_ANON_KEY</code> in <code>.env</code> to enable sign-in.
            </p>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              {mode === 'sign-up' && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="full-name">Full name</Label>
                  <Input id="full-name" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ada Nwosu" />
                </div>
              )}
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
                  autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={submitting} className="mt-2">
                {submitting ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
              </Button>
              <button
                type="button"
                className="text-center text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
              >
                {mode === 'sign-in' ? "First time here? Create an account" : 'Already have an account? Sign in'}
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
