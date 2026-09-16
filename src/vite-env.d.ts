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
  // Apollo's website-visitor tracker id. Public by construction — it ships in
  // the page source. Unset means the tracker never loads, which is what keeps
  // previews and local dev out of the real account.
  readonly VITE_PUBLIC_APOLLO_APP_ID?: string
  // "consent" gates the tracker behind an explicit accept; anything else lets
  // it run unless the visitor declines. ⚠ Must be set to "consent" BEFORE
  // person-level identification is enabled in Apollo — see lib/visitorTracking.
  readonly VITE_PUBLIC_APOLLO_CONSENT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
