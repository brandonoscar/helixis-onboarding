/**
 * Marketing-site analytics — how many people land, and how many start setup.
 *
 * The APP (AgenticHelixis/frontend) has been thoroughly instrumented since it
 * shipped: `signup_started`, `signup_completed`, `connector connected`,
 * `api_key_added`, and eleven more. This file is the half that was missing.
 * Without it those events are counts with no denominator — you know people
 * signed up, and not what fraction of visitors that is, or whether the pricing
 * page is where they stop.
 *
 * ⚠ THIS DOES NOT JOIN TO THE APP'S EVENTS, AND THAT IS NOT AN OVERSIGHT.
 * The app inits PostHog with `persistence: 'localStorage'`, which is strictly
 * PER-ORIGIN. Since the 2026-09-15 domain swap the marketing site is
 * `occupella.com` and the app is `app.occupella.com` — two origins, so a
 * visitor gets one `distinct_id` here and a brand-new one there, and PostHog
 * counts them as two people. Joining them needs BOTH sites on a cookie with
 * `cross_subdomain_cookie: true`, which resets every existing `distinct_id`.
 * That is a deliberate decision with a real cost, not a line to add quietly —
 * so this file answers the question that IS answerable within one origin
 * ("how many land, how many click Start") and claims nothing about the other.
 * Do not add `identify()` here expecting it to reach the app.
 *
 * # Privacy posture, and why it is STRICTER than the app's
 *
 * The app records sessions and autocaptures, because it is an authenticated
 * product surface used by somebody who signed an agreement. A person reading
 * the landing page has agreed to nothing, so:
 *
 *   - `disable_session_recording` — recording a stranger's screen is the most
 *     invasive thing available here and buys the least.
 *   - `autocapture: false` — named events only. Autocapture on a public page
 *     captures every DOM interaction and leaves data that needs a selector
 *     archaeologist to read a year later.
 *   - `respect_dnt` — the standard courtesy for an anonymous public page. The
 *     app does not set it (a signed-in customer has a Settings toggle
 *     instead); a visitor has no other way to say no.
 *
 * Everything degrades to a no-op when `VITE_PUBLIC_POSTHOG_KEY` is unset, so a
 * local `npm run dev` and a preview deploy send nothing.
 */

import posthog from 'posthog-js'

const KEY = import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string | undefined
const HOST =
  (import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string | undefined) ||
  'https://us.i.posthog.com'

/** True when a key is configured and analytics can run at all. */
export const analyticsConfigured = Boolean(KEY)

/**
 * Where an opt-out is remembered.
 *
 * ⚠ Deliberately the SAME key name the app uses, so the two sites cannot
 * drift into disagreeing about what an opt-out is called — but note that
 * localStorage is per-origin, so a value written in the app's Settings is
 * NOT readable here. Somebody who opts out in the product is opted out of
 * the product; this site counts page loads and has no Settings screen of its
 * own. Stating that plainly beats shipping a control that reads as covering
 * more than it does.
 */
const OPT_OUT_KEY = 'occupella_analytics_opt_out'

function optedOut(): boolean {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === '1'
  } catch {
    // A browser blocking storage cannot record a preference either way. Read
    // that as "no preference" rather than as an opt-out — the same reading the
    // app documents, so the two sides answer this identically.
    return false
  }
}

/**
 * Start PostHog and record this page load.
 *
 * ⚠ ONE pageview per LOAD is complete coverage here, and that is a property of
 * the router rather than a shortcut. `main.tsx` routes on `window.location
 * .pathname` and every link on the site is a plain `<a href>` — there is no
 * `pushState` anywhere in `src/` (checked, not assumed). So a navigation IS a
 * page load. The day this site gains client-side routing, this stops being
 * true and a route-change hook is required; a test pins the absence so that
 * day is loud.
 */
export function initAnalytics(): void {
  if (!KEY) return

  posthog.init(KEY, {
    api_host: HOST,
    persistence: 'localStorage',
    opt_out_capturing_by_default: optedOut(),
    // See the privacy posture above — each of these three is a deliberate
    // divergence from the app's config, not a copy that drifted.
    disable_session_recording: true,
    autocapture: false,
    respect_dnt: true,
    // We emit the pageview ourselves below so it carries `page`, which is the
    // field every funnel question here is grouped by.
    capture_pageview: false,
  })

  posthog.capture('marketing_page_viewed', { page: pageName() })
}

/**
 * The page a visitor is on, as a STABLE NAME rather than a raw path.
 *
 * ⚠ A raw pathname would make `/pricing`, `/pricing/`, and a future
 * `/pricing?utm_source=x` three different rows in every breakdown, and the
 * funnel question ("does pricing lose people") then needs a regex at read
 * time — which is the sort of thing nobody writes and everybody guesses at.
 * Names are matched with the SAME prefix logic `main.tsx` routes with, so the
 * label and the page actually rendered cannot disagree.
 */
export function pageName(pathname: string = window.location.pathname): string {
  if (pathname.startsWith('/start')) return 'start'
  if (pathname.startsWith('/features')) return 'features'
  if (pathname.startsWith('/pricing')) return 'pricing'
  if (pathname.startsWith('/privacy')) return 'privacy'
  if (pathname.startsWith('/terms')) return 'terms'
  if (pathname.startsWith('/sms')) return 'sms'
  if (pathname === '/' || pathname === '') return 'landing'
  return 'not_found'
}

/**
 * Watch for clicks on the primary call to action, wherever it is.
 *
 * ⚠ A DELEGATED LISTENER, NOT A HANDLER PER LINK. There are six `/start`
 * links across five files today (Landing, Pricing, Site ×3, NotFound), and a
 * per-call-site `onClick` is the fan-out this codebase has been bitten by
 * repeatedly: the seventh link somebody adds is silently unmeasured and
 * nothing fails. One listener on the document catches every one of them,
 * including links that do not exist yet.
 *
 * `capture: true` is load-bearing — the event has to be seen during the
 * capture phase, because the click is about to navigate the page away and a
 * bubbling listener can lose the race on a slow send.
 */
export function watchStartClicks(): void {
  if (!KEY) return

  document.addEventListener(
    'click',
    (event) => {
      const target = event.target
      if (!(target instanceof Element)) return
      // `closest` rather than reading target directly: the CTA is a styled
      // anchor and the click usually lands on the text node inside it.
      const link = target.closest('a[href^="/start"]')
      if (!link) return
      posthog.capture('marketing_start_clicked', { page: pageName() })
    },
    true,
  )
}
