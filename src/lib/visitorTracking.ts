/**
 * Apollo website-visitor tracking — who is looking at the landing page.
 *
 * PostHog (lib/analytics.ts) counts ANONYMOUS traffic: how many landed, how
 * many clicked Start. This answers a different question — WHICH BUSINESS is
 * looking — by resolving the visitor's IP against Apollo's firmographic data.
 * A property-management company reading the pricing page twice is a lead;
 * PostHog can only ever tell you that somebody did.
 *
 * # Two modes, and the difference is legal rather than technical
 *
 * Apollo's tracker runs in one of two modes, set per-domain in Apollo's own
 * configuration and NOT in this file:
 *
 *   - COMPANY level — reverse-IP firmographics. "Someone at Acme Property
 *     Management viewed /pricing." No individual is identified. Needs
 *     DISCLOSURE (a privacy policy that says so) and an opt-out.
 *   - PERSON level  — cookies plus IP shared with third-party identity
 *     providers to name the individual. Enabling it in Apollo requires
 *     attesting that the site has "implemented appropriate cookie and data
 *     collection notices and obtained applicable consents for such tracking
 *     and data sharing". That attestation is only true with a real consent
 *     gate in front of the script.
 *
 * ⚠ THE MODE IS APOLLO-SIDE, SO IT CANNOT BE CHOSEN PER VISITOR. One script,
 * one mode, whatever Apollo's dashboard says at the time. That is the whole
 * reason this module exists as a gate rather than as a parameter: the only
 * lever available on our side is WHETHER THE SCRIPT RUNS AT ALL.
 *
 * `VITE_PUBLIC_APOLLO_CONSENT` selects which lever:
 *
 *   unset / "notice"  → the script runs unless the visitor has opted out.
 *                       Correct for COMPANY level: notice in the policy, one
 *                       click to decline in the footer.
 *   "consent"         → the script runs ONLY after an explicit accept.
 *                       Required before Apollo's person-level box is ticked,
 *                       because before a choice is made no consent exists and
 *                       "obtained applicable consents" would be false for
 *                       every visitor who never answered.
 *
 * Turning person-level on is therefore TWO deliberate acts that belong
 * together: set this variable to "consent", and tick the box in Apollo. Doing
 * either one alone is the defect — the box without the variable ships
 * unconsented identification, and the variable without the box shows people a
 * consent bar for tracking that is merely firmographic.
 *
 * # Do Not Track blocks BOTH modes, unconditionally
 *
 * Not a courtesy, a correctness requirement. The published privacy policy
 * says, of this site: "If your browser sends a Do Not Track signal, we collect
 * nothing." Apollo's script honours no such signal by default, so without this
 * check that sentence becomes false the moment the script ships — a false
 * statement on a legal page. Global Privacy Control is read the same way; it
 * is the signal with actual legal force under CPRA, and DNT is the one the
 * policy names.
 *
 * Everything degrades to a no-op when `VITE_PUBLIC_APOLLO_APP_ID` is unset, so
 * `npm run dev` and every preview deploy send nothing — the same posture
 * lib/analytics.ts takes with the PostHog key, and for the same reason: a
 * preview must not pollute the real tracker.
 */

/** Apollo's tracker id, public by construction — it ships in the page. */
const APP_ID = import.meta.env.VITE_PUBLIC_APOLLO_APP_ID as string | undefined

/**
 * The loader, transcribed from the snippet Apollo's own API returns.
 *
 * ⚠ TRANSCRIBED, NOT FETCHED, and that is a real caveat. Apollo's install
 * endpoint hands back a ready-made `<script>` and says not to hand-assemble
 * the url — but a snippet pasted into `index.html` cannot be gated on consent,
 * which is the one thing this module exists to do. So the loader is
 * reproduced here and the source is quoted verbatim below so a future reader
 * can diff it against a fresh `install_script` call:
 *
 *   function initApollo(){var n=Math.random().toString(36).substring(7),
 *   o=document.createElement("script");o.src="https://assets.apollo.io/micro/
 *   website-tracker/tracker.iife.js?nocache="+n,o.async=!0,o.defer=!0,
 *   o.onload=function(){window.trackingFunctions.onLoad({appId:"<id>"})},
 *   document.head.appendChild(o)}initApollo();
 *
 * The two load-bearing facts are the url and the `onLoad({appId})` call; both
 * are pinned by tests so a careless edit here fails rather than silently
 * loading nothing.
 */
const TRACKER_SRC = 'https://assets.apollo.io/micro/website-tracker/tracker.iife.js'

declare global {
  interface Window {
    trackingFunctions?: { onLoad?: (opts: { appId: string }) => void }
  }
  interface Navigator {
    globalPrivacyControl?: boolean
    msDoNotTrack?: string
  }
}

export type ConsentChoice = 'accepted' | 'declined'

/** Which lever is live. See the header — this decides gate vs opt-out. */
export const CONSENT_REQUIRED =
  (import.meta.env.VITE_PUBLIC_APOLLO_CONSENT as string | undefined) === 'consent'

/** True when a tracker id is configured and anything can run at all. */
export const visitorTrackingConfigured = Boolean(APP_ID)

/**
 * Where the visitor's choice is remembered.
 *
 * ⚠ Deliberately NOT the same key as `analytics.ts`'s opt-out. They govern
 * different things and a visitor may reasonably want one and not the other:
 * PostHog is our own anonymous page count, this is a third party being told
 * which company is reading. Collapsing them onto one key would mean declining
 * third-party identification silently switches off the page counter too, and
 * the reverse — neither of which anybody asked for.
 */
const CHOICE_KEY = 'occupella_visitor_tracking_consent'

/** The visitor's stored answer, or null if they have never been asked. */
export function storedChoice(): ConsentChoice | null {
  try {
    const raw = localStorage.getItem(CHOICE_KEY)
    return raw === 'accepted' || raw === 'declined' ? raw : null
  } catch {
    // A browser blocking storage cannot remember a choice. Read that as "not
    // asked" rather than as either answer: in notice mode the visitor still
    // gets the default and the footer link, and in consent mode they are
    // asked again, which is the safe direction for a consent gate.
    return null
  }
}

/** Remember the visitor's answer. Best-effort: a refusal to store is not an error. */
export function recordChoice(choice: ConsentChoice): void {
  try {
    localStorage.setItem(CHOICE_KEY, choice)
  } catch {
    // Storage blocked. The choice still governs THIS page load through the
    // caller, it simply will not survive a reload — and a visitor who has
    // blocked storage has already expressed the relevant preference.
  }
}

/**
 * Does the browser itself say no?
 *
 * ⚠ `=== '1'` and `=== true`, never a truthiness test. `doNotTrack` is
 * `'0'` when the user has explicitly turned the signal OFF, and `'0'` is a
 * non-empty string — so `if (navigator.doNotTrack)` reads "do not track me"
 * from somebody who said the opposite, and would block the tracker for
 * everyone who has ever opened that setting.
 */
export function browserRefusesTracking(): boolean {
  if (typeof navigator === 'undefined') return false
  if (navigator.globalPrivacyControl === true) return true
  if (navigator.doNotTrack === '1') return true
  if (navigator.msDoNotTrack === '1') return true
  if (typeof window !== 'undefined' && (window as { doNotTrack?: string }).doNotTrack === '1') {
    return true
  }
  return false
}

/**
 * Should the tracker run for this visitor, right now?
 *
 * The whole policy, in one place, so no caller can restate it wrongly.
 */
export function shouldLoadTracker(): boolean {
  if (!APP_ID) return false
  if (browserRefusesTracking()) return false

  const choice = storedChoice()
  if (choice === 'declined') return false
  if (CONSENT_REQUIRED) return choice === 'accepted'
  return true
}

/**
 * Should the visitor be SHOWN a consent bar?
 *
 * Only in consent mode, only when they have not already answered, and never
 * when the browser has answered for them — asking somebody who has already
 * sent Global Privacy Control is asking a question they have answered, and
 * the polite reading of that signal is to stop rather than to negotiate.
 */
export function needsConsentPrompt(): boolean {
  if (!APP_ID) return false
  if (!CONSENT_REQUIRED) return false
  if (browserRefusesTracking()) return false
  return storedChoice() === null
}

let loaded = false

/** Test seam — the module remembers whether it has injected the script. */
export function resetTrackerForTests(): void {
  loaded = false
}

/**
 * Inject Apollo's tracker if this visitor's state allows it.
 *
 * Safe to call more than once: the second call is a no-op. Apollo's placement
 * rules require exactly one injection per page load, and this is called from
 * both the initial mount and the consent bar's accept handler.
 */
export function maybeLoadVisitorTracker(): void {
  if (loaded) return
  if (!shouldLoadTracker()) return
  loaded = true

  const appId = APP_ID as string
  const nocache = Math.random().toString(36).substring(7)
  const el = document.createElement('script')
  el.src = `${TRACKER_SRC}?nocache=${nocache}`
  el.async = true
  el.defer = true
  el.onload = () => {
    window.trackingFunctions?.onLoad?.({ appId })
  }
  document.head.appendChild(el)
}
