import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import App from './App'
import Landing from './Landing'
import { tokensCss } from './theme'

// Tiny pathname router — two surfaces, no dependency:
//   /       → landing page (the front door)
//   /start  → the setup wizard (previously lived at /; vercel.json
//             rewrites every path to index.html so deep links work)
const isWizard = window.location.pathname.startsWith('/start')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <style>{tokensCss}</style>
    {isWizard ? <App /> : <Landing />}
  </StrictMode>,
)
