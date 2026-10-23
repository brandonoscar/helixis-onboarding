/**
 * Site and wizard analytics — how many people land, how many start setup, and
 * where inside the setup wizard they stop.
 *
 * The APP (AgenticHelixis/frontend) instruments its own product events
 * (`connector connected`, `api_key_added`, task events and more).
 *
 * ⚠ THIS LINE USED TO SAY THE APP SENDS `signup_started` AND
 * `signup_completed`, AND NOTHING SENDS EITHER. The app defines
 * `captureSignupStarted` / `captureSignupCompleted` (frontend/src/services/
 * analytics.ts) and the backend defines `capture_signup_*`
 * (analytics/posthog_client.py), and none of the four has a caller (checked on
 * AgenticHelixis origin/main, 2026-10-23). So signup itself was invisible:
 * the site counted clicks on Start, and nothing counted what happened after.
 * The `wizard_*` events below (`captureWizard`) are that funnel now. Do not
 * build a dashboard on the two app event names expecting rows.
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
 * The app autocaptures, because it is an authenticated product surface used by
 * somebody who signed an agreement. A person reading the landing page has
 * agreed to nothing, so:
 *
 *   - `disable_session_recording` — recording a stranger's screen is the most
 *     invasive thing available here and buys the least.
 *
 *     ⚠ THIS LINE SAID "the app records sessions" UNTIL 2026-09-15 AND THE
 *     APP DID NOT. Nothing anywhere records: the PostHog project has session
 *     replay disabled, and the app now sets `disable_session_recording: true`
 *     as well, so the difference between the two surfaces on this point is
 *     the *reason* rather than the setting — a stranger could never be
 *     recorded, a customer could have been by a dashboard click. Written down
 *     because a comment asserting a behaviour the product does not have is
 *     what stops the next reader checking (gotcha 48), and this one was mine,
 *     two hours old.
 *   - `autocapture: false` — named events only. Autocapture on a public page
 *     captures every DOM interaction and leaves data that needs a selector
 *     archaeologist to read a year later.
 *   - `respect_dnt` — the standard courtesy for an anonymous public page. The
 *     app does not set it (a signed-in customer has a Settings toggle
 *     instead); a visitor has no other way to say no.
 *   - NO URL QUERY AND NO URL FRAGMENT LEAVES THE BROWSER (`before_send:
 *     scrubCapturedUrls`, plus `disable_capture_url_hashes`). posthog-js
 *     builds `$current_url` from `location.href`, fragment included, and the
 *     emailed sign-in link returns to `/start#access_token=...&refresh_token=
 *     ...`. `lib/authRescue` forwards only invite and recovery landings, so on
 *     that return the pageview below, and any wizard event fired before
 *     supabase-js clears the hash, could carry a live session to a third
 *     party. The hook cuts `?` and `#` off every absolute URL in an event's
 *     properties, `$set` and `$set_once`, whichever key it sits under.
 *   - NO PERSON DATA IN EVENTS, and no `identify()`. Every `wizard_*`
 *     property is an enum, a doors range picked from a list, or a status
 *     number (see `WizardEvents`). Never an email, a company name or a key.
 *
 * Everything degrades to a no-op when `VITE_PUBLIC_POSTHOG_KEY` is unset, so a
 * local `npm run dev` and a preview deploy send nothing.
 */

import type { CaptureResult, PostHog } from 'posthog-js'
import { routeFor } from '../seo/routes'
import type { NotListedSystem } from './notListed'
import type { Pms } from './pms'

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
export function initAnalytics(): Promise<void> {
  if (!KEY) return Promise.resolve()
  const key = KEY

  started ??= client().then((posthog) => {
    posthog.init(key, {
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
      // No query string or fragment reaches PostHog (privacy posture above).
      // Both, because the option covers only the URLs posthog-js builds and
      // the hook covers every property, including any added later.
      disable_capture_url_hashes: true,
      before_send: scrubCapturedUrls,
    })

    posthog.capture('marketing_page_viewed', { page: pageName() })
    return posthog
  })
  return started.then(() => undefined)
}

/**
 * Resolves once PostHog is loaded AND initialised; null until `initAnalytics`
 * runs. The wizard's events wait on this rather than on the bare import, so
 * none of them can reach a client that has not been told the privacy posture.
 */
let started: Promise<PostHog> | null = null

const ABSOLUTE_URL = /^https?:\/\//i

/**
 * `url` without its query string or fragment; anything that is not an
 * absolute http(s) URL comes back unchanged.
 *
 * ⚠ Cut by position, not parsed with `new URL`, so a malformed URL that still
 * carries `#access_token=` is cut as well instead of throwing and going out
 * untouched.
 */
export function withoutQueryOrHash(value: string): string {
  if (!ABSOLUTE_URL.test(value)) return value
  const cut = value.search(/[?#]/)
  return cut === -1 ? value : value.slice(0, cut)
}

function scrub(value: unknown, depth: number): unknown {
  if (typeof value === 'string') return withoutQueryOrHash(value)
  // Event properties are shallow; the cap is only there so a cyclic object
  // can never hang the send.
  if (depth >= 5 || !value || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map((v) => scrub(v, depth + 1))
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value)) out[k] = scrub(v, depth + 1)
  return out
}

/**
 * The `before_send` hook: every absolute URL in the event loses its `?...`
 * and `#...`, wherever it sits (`$current_url`, `$referrer`,
 * `$initial_current_url` under `$set_once`, or a key nobody has added yet).
 *
 * ⚠ The whole URL is cut rather than only known token names, because the
 * question "which parameters are secret" has a different answer for every
 * auth flow, and a pathname is all any breakdown here reads. UTM values are
 * not lost: posthog-js records them as their own properties.
 */
export function scrubCapturedUrls(event: CaptureResult | null): CaptureResult | null {
  if (!event) return event
  const out: CaptureResult = { ...event, properties: scrub(event.properties, 0) as CaptureResult['properties'] }
  if (event.$set) out.$set = scrub(event.$set, 0) as CaptureResult['properties']
  if (event.$set_once) out.$set_once = scrub(event.$set_once, 0) as CaptureResult['properties']
  return out
}

/**
 * PostHog, loaded on first use rather than with the page.
 *
 * ⚠ IT WAS PART OF EVERY PAGE'S BUNDLE, about 300 KB of source that a
 * visitor downloaded before the home page could run, to send one pageview.
 * Now the page renders first and PostHog follows. `loaded` is set the moment
 * it arrives, so a click after that captures synchronously, inside the click
 * handler, before the navigation it starts (see watchStartClicks).
 */
let pending: Promise<PostHog> | null = null
let loaded: PostHog | null = null

function client(): Promise<PostHog> {
  pending ??= import('posthog-js').then((m) => {
    loaded = m.default
    return m.default
  })
  return pending
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
  // Resolved exactly as the router resolves it (src/pages.tsx), so the label
  // and the page on screen cannot disagree: `/pricing/anything` renders the
  // 404 page and is counted as one.
  return routeFor(pathname)?.name ?? 'not_found'
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
  void client()

  document.addEventListener(
    'click',
    (event) => {
      const target = event.target
      if (!(target instanceof Element)) return
      // `closest` rather than reading target directly: the CTA is a styled
      // anchor and the click usually lands on the text node inside it.
      const link = target.closest('a[href^="/start"]')
      if (!link) return
      const props = { page: pageName() }
      // Loaded: capture now, inside the handler, before the page leaves.
      // Not loaded yet (a click in the first moment): send it when it lands,
      // which may lose the race against the navigation; that is the price
      // of not making every visitor download PostHog up front.
      if (loaded) loaded.capture('marketing_start_clicked', props)
      else void client().then((posthog) => posthog.capture('marketing_start_clicked', props))
    },
    true,
  )
}

// ── The setup wizard's funnel ───────────────────────────────────────

/** The wizard's internal steps, as App.tsx names them. */
export type WizardStep = 'identify' | 'pms' | 'live' | 'scan' | 'channels' | 'finish'

/** Where a person left the connect step without connecting anything. */
export type PmsSkippedFrom = 'pms' | 'buildium' | 'rentvine' | 'not_listed'

/**
 * Every wizard event and the ONLY properties each may carry.
 *
 * ⚠ The types are the privacy rule. Each property is a fixed set of values
 * or a number, except `doors`, which is a range label the person picked from
 * a list (DOORS_OPTIONS in App.tsx). A property that can hold free text, an
 * email, a company name or a key does not belong here, and widening one of
 * these to `string` is how it would get in.
 */
export interface WizardEvents {
  /** A step came on screen. */
  wizard_step_viewed: { step: WizardStep }
  /** Step 1 finished: password set and the workspace bootstrapped. */
  wizard_account_created: { doors: string }
  /** A system tile was picked. */
  wizard_pms_chosen: { pms: Pms }
  /** The connect step was left without connecting, and from which screen. */
  wizard_pms_skipped: { step: PmsSkippedFrom }
  /** A "my system isn't listed" answer was received by the backend. The
   *  system only: an "Other" name is the person's own words and stays in
   *  the feedback row. */
  wizard_pms_not_listed: { system: NotListedSystem }
  /**
   * A connection attempt failed. `status` is the vendor's HTTP status when
   * the vendor refused the keys (read from the test's error, Buildium only),
   * else the Occupella API's status for a request that failed (0 = it never
   * reached a server), else null when neither is known. Null is "unknown",
   * never "fine".
   */
  wizard_connect_failed: { pms: Pms; status: number | null }
  /** The keys passed the test. */
  wizard_pms_connected: { pms: Pms }
  /** "Send these steps to my admin" was opened. */
  wizard_handoff_started: Record<string, never>
}

/**
 * Record one wizard event.
 *
 * Same posture as everything above, by construction rather than by copy:
 *   - no key configured: nothing at all;
 *   - sent through the ONE client `initAnalytics` started, so the opt-out,
 *     Do Not Track, autocapture-off and URL scrubbing it was given apply
 *     here unchanged; before `initAnalytics` has run there is no such client
 *     and nothing is sent;
 *   - never `identify()`: the wizard knows the person's email, and this is
 *     the line that keeps it out of a third party.
 *
 * Fire-and-forget: a wizard step never waits on analytics.
 */
export function captureWizard<E extends keyof WizardEvents>(event: E, props: WizardEvents[E]): void {
  if (!KEY || !started) return
  const properties = { ...props }
  void started.then((posthog) => posthog.capture(event, properties)).catch(() => undefined)
}
