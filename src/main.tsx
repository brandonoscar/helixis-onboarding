import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import App from './App'
import Landing from './Landing'
import Features from './Features'
import Pricing from './Pricing'
import NotFound from './NotFound'
import { Privacy, Sms, Terms } from './Legal'
import { tokensCss } from './theme'

// Tiny pathname router — no dependency. vercel.json rewrites every path to
// index.html so deep links work:
//   /               → landing page (the front door)
//   /features       → what the product does
//   /pricing        → the plans, compared, plus the FAQ
//   /start          → the setup wizard (previously lived at /)
//   /privacy        → privacy policy
//   /terms          → terms of service
//   /sms            → SMS program & consent (the A2P campaign's public CTA URL)
//   /oauth/callback → Composio OAuth popup return — auto-closes (below)
//   anything else  → 404
//
// ⚠ ORDER MATTERS AND `/start` MUST STAY FIRST. These are prefix matches, so
// a future route that is a prefix of another shadows it. Nothing here is
// currently ambiguous; the rule is written down so the next addition is
// checked rather than appended.
function route() {
  const p = window.location.pathname
  if (p.startsWith('/start')) return <App />
  if (p.startsWith('/features')) return <Features />
  if (p.startsWith('/pricing')) return <Pricing />
  if (p.startsWith('/privacy')) return <Privacy />
  if (p.startsWith('/terms')) return <Terms />
  if (p.startsWith('/sms')) return <Sms />
  // The root is the landing page; ANYTHING ELSE is a wrong turn and says so.
  // Falling through to <Landing /> served the front door at 200 for every
  // mistyped URL — a soft 404, which tells the visitor nothing and shows a
  // crawler unlimited duplicates of one page. See NotFound.tsx for why the
  // STATUS code is still 200 and what it would take to change that.
  if (p === '/' || p === '') return <Landing />
  return <NotFound />
}

// Composio OAuth callback — the channels step passes this URL as
// ``callbackUrl`` so the consent popup redirects here on success instead of
// parking on Composio's hosted success page. Auto-close returns the user to
// the wizard tab, where the poll loop picks up the new connection.
if (window.location.pathname.startsWith('/oauth/callback')) {
  document.body.style.background = '#0a0910'
  document.body.innerHTML =
    '<div style="font: 14px \'Geist Variable\', system-ui, sans-serif; padding: 48px; text-align: center; color: #9a97ad">Connected. You can close this window.</div>'
  setTimeout(() => window.close(), 250)
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <style>{tokensCss}</style>
      {route()}
    </StrictMode>,
  )
}
