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

/** Where supabase-js keeps this client's session (its default key). */
export const SESSION_STORAGE_KEY = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`

/**
 * Let go of the session after handing it to the app, WITHOUT ending it.
 *
 * ⚠ The hand-off gives app.occupella.com this session's refresh token, and
 * Supabase rotates refresh tokens: whichever side refreshes first spends it,
 * and when the other side later tries the spent one, Supabase treats it as
 * reuse and revokes the whole session. The app then gets a 400 on its next
 * refresh and its user is signed out mid-task (founder report, 2026-09-29).
 * So once the app has the tokens, this origin must never refresh them again.
 *
 * ⚠ NOT `supabase.auth.signOut()`, even with `scope: 'local'`: that calls
 * Supabase's logout endpoint for this session, which is the same session the
 * app now holds. Removing the stored copy and stopping the refresh loop keeps
 * it alive for the app and inert here.
 */
export function releaseSessionForHandOff(): void {
  void supabase.auth.stopAutoRefresh().catch(() => undefined)
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY)
    localStorage.removeItem(`${SESSION_STORAGE_KEY}-user`)
  } catch {
    // Blocked storage: nothing was persisted, so nothing is left to refresh.
  }
}
