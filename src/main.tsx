import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import App from './App'
import Landing from './Landing'
import { Privacy, Sms, Terms } from './Legal'
import { tokensCss } from './theme'

// Tiny pathname router — no dependency. vercel.json rewrites every path to
// index.html so deep links work:
//   /               → landing page (the front door)
//   /start          → the setup wizard (previously lived at /)
//   /privacy        → privacy policy
//   /terms          → terms of service
//   /sms            → SMS program & consent (the A2P campaign's public CTA URL)
//   /oauth/callback → Composio OAuth popup return — auto-closes (below)
function route() {
  const p = window.location.pathname
  if (p.startsWith('/start')) return <App />
  if (p.startsWith('/privacy')) return <Privacy />
  if (p.startsWith('/terms')) return <Terms />
  if (p.startsWith('/sms')) return <Sms />
  return <Landing />
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
