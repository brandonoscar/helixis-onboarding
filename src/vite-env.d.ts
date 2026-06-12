/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HELIXIS_SUPABASE_URL?: string
  readonly VITE_HELIXIS_SUPABASE_ANON_KEY?: string
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
