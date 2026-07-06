import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import App from './App'
import Landing from './Landing'
import { Privacy, Terms } from './Legal'
import { tokensCss } from './theme'

// Tiny pathname router — no dependency. vercel.json rewrites every path to
// index.html so deep links work:
//   /         → landing page (the front door)
//   /start    → the setup wizard (previously lived at /)
//   /privacy  → privacy policy
//   /terms    → terms of service
function route() {
  const p = window.location.pathname
  if (p.startsWith('/start')) return <App />
  if (p.startsWith('/privacy')) return <Privacy />
  if (p.startsWith('/terms')) return <Terms />
  return <Landing />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <style>{tokensCss}</style>
    {route()}
  </StrictMode>,
)
