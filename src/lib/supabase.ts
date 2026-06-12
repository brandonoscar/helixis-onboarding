import { createClient } from '@supabase/supabase-js'

// MUST be the Supabase project the AgenticHelixis backend verifies JWTs
// against (helixis-test, per ADR 0003) — a token minted by any other
// project is rejected with 401 on every API call.
//
// The values are baked in as defaults (the anon key is public by design;
// RLS enforces access) and the env vars are deliberately named
// VITE_HELIXIS_* — the Vercel project still carries stale VITE_SUPABASE_*
// values pointing at the retired onboarding project, and renaming makes
// those inert instead of silently winning at build time.
const DEFAULT_SUPABASE_URL = 'https://shwwcxkeewpotnigwvqp.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNod3djeGtlZXdwb3RuaWd3dnFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NjMwOTMsImV4cCI6MjA5MTUzOTA5M30.2BDeNEljl-EdTlQv1bWm10GHT_I9-t1gR_9uOnoBfo8'

export const supabaseUrl =
  import.meta.env.VITE_HELIXIS_SUPABASE_URL || DEFAULT_SUPABASE_URL
export const supabaseAnonKey =
  import.meta.env.VITE_HELIXIS_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
