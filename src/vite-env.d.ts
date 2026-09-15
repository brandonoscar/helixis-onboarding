/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HELIXIS_SUPABASE_URL?: string
  readonly VITE_HELIXIS_SUPABASE_ANON_KEY?: string
  readonly VITE_API_URL?: string
  // Same PostHog project as the app, so one place holds the whole product's
  // events. ⚠ Same project does NOT mean same person — see the join caveat in
  // lib/analytics.ts; localStorage persistence is per-origin.
  readonly VITE_PUBLIC_POSTHOG_KEY?: string
  readonly VITE_PUBLIC_POSTHOG_HOST?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
