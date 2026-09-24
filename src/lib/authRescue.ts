/**
 * Forward a misrouted Supabase auth landing to the app, before anything sees it.
 *
 * WHY THIS EXISTS
 *   A team invite is sent by the backend's `POST /company/invite`, which passes
 *   `redirect_to = https://app.occupella.com` to GoTrue. ⚠ GoTrue only honours
 *   that URL if it is in the project's Redirect-URL allowlist. When it is not,
 *   GoTrue does NOT error — it silently falls back to the project's Site URL.
 *
 *   The 2026-09-15 domain swap made `occupella.com` the marketing site, which
 *   is exactly the value somebody updating "our domain" in Supabase would type.
 *   So the invitee lands HERE, on a page with no auth client, holding a valid
 *   session in the fragment, and sees the landing page. The email sent, the
 *   link worked, and the invite is dead with nothing anywhere reporting it.
 *
 *   This is the fallback for that. It is NOT the fix — the allowlist still has
 *   to contain `https://app.occupella.com`. It is what stops the failure being
 *   silent and total in the window before somebody sets it.
 *
 * ⚠ IT MUST RUN BEFORE ANALYTICS, AND THAT IS NOT TIDINESS.
 *   posthog-js builds `$current_url` from `location.href`, which INCLUDES the
 *   fragment, and `mask_personal_data_properties` is off by default. So a
 *   pageview fired while an `access_token` sits in the hash ships that token to
 *   a third party. Forwarding first means the marketing page never fires an
 *   event on that URL at all. `main.tsx` calls this before `initAnalytics()`
 *   and a guard pins the order, because the two lines read as interchangeable.
 *
 * ⚠ THE DESTINATION IS A CONSTANT, NEVER READ FROM THE URL.
 *   Taking it from a query parameter would be an open redirect on a page that
 *   is handed a live credential — the one page where that matters most.
 */

/** Where the app lives. Hardcoded on purpose — see the note above. */
export const APP_ORIGIN = 'https://app.occupella.com'

/**
 * The auth flows this page can meaningfully forward.
 *
 * ⚠ DELIBERATELY IDENTICAL to the app's own parser
 * (`AgenticHelixis/frontend/src/services/authFlow.ts::parsePasswordFlow`).
 * Forwarding a fragment the app does not recognise would move the dead end
 * rather than remove it, so the two have to agree — and they are in separate
 * repositories, so nothing can check that automatically. Change one, change
 * the other.
 */
const AUTH_FLOW = /(?:^|[#&?])type=(invite|recovery)(?:&|$)/

/**
 * `'invite'` / `'recovery'` when this fragment is a Supabase auth landing,
 * `null` for an ordinary hash.
 *
 * An ordinary `#pricing` anchor must return null: this site has none today,
 * but a rescue that swallowed every fragment would break the first one added.
 */
export function authFlowInHash(hash: string): 'invite' | 'recovery' | null {
  const match = AUTH_FLOW.exec(hash || '')
  return match ? (match[1] as 'invite' | 'recovery') : null
}

/**
 * Send a misrouted auth landing to the app, preserving the fragment.
 *
 * Returns true when it navigated, so the caller can stop — rendering the
 * marketing page underneath a redirect would fire its analytics anyway.
 *
 * `replace`, not `assign`: the wrong URL must not sit in history where Back
 * returns the person to a page that cannot sign them in, with a token that may
 * by then be spent.
 */
export function rescueAuthLanding(loc: Location = window.location): boolean {
  if (!authFlowInHash(loc.hash)) return false
  loc.replace(APP_ORIGIN + '/' + loc.hash)
  return true
}
