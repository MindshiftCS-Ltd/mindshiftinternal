import { createClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database.generated'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
)

// A second, non-persisting client used only for admin-created sign-ups.
// auth.signUp() on the shared client would replace the signed-in admin's
// session with the new user's session — this client never touches
// localStorage or the app's session, so it can sign a new user up without
// signing the admin out.
export const supabaseAdminAuth = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  { auth: { persistSession: false, autoRefreshToken: false, storageKey: 'mindshift-admin-signup' } },
)
