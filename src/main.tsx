import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import App from './App'
import { ConsentBar } from './ConsentBar'
import { initAnalytics, watchStartClicks } from './lib/analytics'
import { rescueAuthLanding } from './lib/authRescue'
import { maybeLoadVisitorTracker } from './lib/visitorTracking'
import { pageFor } from './pages'
import { tokensCss } from './theme'

// The router. Marketing pages are PRERENDERED to static HTML at build time
// (scripts/prerender.mjs), each with its own title, description and canonical
// from src/seo/routes.ts, and this renders the same page over it in the
// browser. vercel.json sends only the client-only paths to the app shell:
//   /start          → the setup wizard (App.tsx), never prerendered
//   /oauth/callback → Composio OAuth popup return, auto-closes (below)
//   anything else   → its prerendered page, or the static 404 page
//
// Marketing paths live in src/pages.tsx, matched exactly. Before 2026-09 every
// URL got index.html and the homepage's canonical, which is why /features was
// never indexed; see src/seo/routes.ts.
function route() {
  const p = window.location.pathname
  if (p.startsWith('/start')) return <App />
  return pageFor(p)
}

// ⚠ FIRST BRANCH, ABOVE EVERYTHING, AND THAT ORDER IS LOAD-BEARING TWICE.
// A Supabase invite whose `redirect_to` was not allowlisted lands HERE holding
// a live session in the fragment — GoTrue falls back to the Site URL rather
// than erroring, and since the 2026-09-15 swap that can be this site. See
// lib/authRescue for the whole mechanism. Forwarding first is what stops the
// invite being silently dead, AND what keeps the access token out of the
// analytics pageview: posthog builds $current_url from location.href, fragment
// included. `rescueAuthLanding` returns true only when it has navigated.
if (rescueAuthLanding()) {
  // Navigating away. Nothing else may run — rendering or counting a pageview
  // underneath a redirect is exactly what this branch exists to prevent.
}
// Composio OAuth callback — the channels step passes this URL as
// ``callbackUrl`` so the consent popup redirects here on success instead of
// parking on Composio's hosted success page. Auto-close returns the user to
// the wizard tab, where the poll loop picks up the new connection.
else if (window.location.pathname.startsWith('/oauth/callback')) {
  document.body.style.background = '#0a0910'
  document.body.innerHTML =
    '<div style="font: 14px \'Geist Variable\', system-ui, sans-serif; padding: 48px; text-align: center; color: #9a97ad">Connected. You can close this window.</div>'
  setTimeout(() => window.close(), 250)
} else {
  // ⚠ INSIDE the else, deliberately. The branch above is the Composio OAuth
  // popup: it belongs to an authenticated wizard session, auto-closes in
  // 250ms, and is not a page anybody visits. Counting it would inflate every
  // marketing figure with a window the visitor never sees, and it is the one
  // path here that carries a signed-in person's context.
  initAnalytics()
  watchStartClicks()
  // ⚠ Called here as well as from the consent bar's accept handler, and it is
  // a no-op in every state that has not earned it (see lib/visitorTracking).
  // A returning visitor who already said yes must not be asked again, so the
  // load cannot live only behind the bar.
  maybeLoadVisitorTracker()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <style>{tokensCss}</style>
      {route()}
      <ConsentBar />
    </StrictMode>,
  )
}
