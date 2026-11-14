/**
 * The owner and tenant invite, as it reaches this site and leaves it for the app.
 *
 * Staff of a property manager invite an owner or a tenant from their books, the PMS inside
 * Occupella. The books email a link to this site's /invited page, the invite's token in the
 * FRAGMENT, so no server (Vercel's included) ever receives it:
 *
 *   https://occupella.com/invited#<token>
 *
 * (AgenticHelixis `src/helixis/books.py` INVITE_URL; the PMS adds exactly `#` and the bare token,
 * `secrets.token_urlsafe(32)`, 43 URL-safe characters.) The page proves the email with an emailed
 * code and hands the person to the app signed in, with the fragment /start already uses and the
 * invite beside it:
 *
 *   https://app.occupella.com/#access_token=…&refresh_token=…&expires_in=3600&token_type=bearer&books_invite=<token>
 *
 * The app reads `books_invite` before supabase-js reads and clears the fragment, and opens the
 * person's portal with it (AgenticHelixis `frontend/src/services/booksInvite.ts`).
 *
 * ⚠ KEEP THIS FILE FREE OF IMPORTS. main.tsx calls `takeInviteFromUrl` before analytics start,
 * on every load of /invited, and must not pull the Supabase client in to do it.
 *
 * ⚠ THE KEY AND THE TOKEN'S SHAPE ARE SHARED WITH THE APP, another repository, so no test can
 * read both. Change one, change the other: `HAND_OFF_KEY` and `INVITE_TOKEN` there are the same.
 * The shape is the PMS's own bound for an invite (20 to 100 characters).
 *
 * The token is kept in memory only: never localStorage, sessionStorage, a cookie, a query string
 * or a log. It leaves this page in the hand-off fragment alone.
 */

/** Where the invite page answers. */
export const INVITED_PATH = '/invited'

/** The hand-off fragment's key for the invite (the app reads the same). */
export const HAND_OFF_KEY = 'books_invite'

/** An invite token as the PMS makes and accepts one: URL-safe base64, 20 to 100 characters. */
export const INVITE_TOKEN = /^[A-Za-z0-9_-]{20,100}$/

/** What the address held when the page loaded. */
export type Arrival =
  /** The invite's token, now only in memory. */
  | { kind: 'invite'; token: string }
  /** The emailed sign-in LINK was clicked instead of the code: a session, and no invite. */
  | { kind: 'sign-in-link' }
  /** Nothing usable: no fragment, or one that isn't a token. */
  | { kind: 'broken' }

/** True on /invited and anything under it. */
export function isInvitedPath(pathname: string): boolean {
  return pathname === INVITED_PATH || pathname.startsWith(`${INVITED_PATH}/`)
}

/** Read the fragment as the invite page sees it. Pure, for the tests. */
export function readArrival(hash: string): Arrival {
  const raw = (hash || '').replace(/^#/, '')
  if (/(?:^|&)(?:access_token|refresh_token|error_description)=/.test(raw)) return { kind: 'sign-in-link' }
  return INVITE_TOKEN.test(raw) ? { kind: 'invite', token: raw } : { kind: 'broken' }
}

/**
 * Take whatever the fragment holds out of the address, at once, and say what it was.
 *
 * ⚠ CALLED BEFORE ANALYTICS. posthog-js builds `$current_url` from `location.href`, fragment
 * included; `lib/analytics` cuts fragments too, but the token must not depend on that. The
 * address is rewritten to the bare path whatever the fragment held, a session from the emailed
 * link included, so nothing after this line can read it from the URL.
 */
export function takeInviteFromUrl(
  loc: Pick<Location, 'hash' | 'pathname'> = window.location,
  hist: Pick<History, 'replaceState'> = window.history,
): Arrival {
  const arrival = readArrival(loc.hash)
  if (loc.hash) {
    try {
      hist.replaceState(null, '', INVITED_PATH)
    } catch {
      // An address that can't be rewritten: the token still goes nowhere else.
    }
  }
  return arrival
}

/** The session supabase-js holds after the code is checked, as the hand-off needs it. */
export interface HandOffSession {
  access_token: string
  refresh_token: string
  expires_in?: number | null
  expires_at?: number | null
  token_type?: string | null
}

/**
 * The app's address with the session and the invite in its fragment: the /start hand-off
 * (App.tsx StepFinish) and `books_invite`. Values are URL-encoded; the token is URL-safe already.
 */
export function handOffUrl(appUrl: string, session: HandOffSession, token: string): string {
  const frag = new URLSearchParams({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: String(session.expires_in ?? 3600),
    token_type: session.token_type || 'bearer',
  })
  if (session.expires_at) frag.set('expires_at', String(session.expires_at))
  frag.set(HAND_OFF_KEY, token)
  return `${appUrl.replace(/\/+$/, '')}/#${frag.toString()}`
}

/** The user_metadata the invite page puts on an account it makes: the portal marker. */
export const PORTAL_METADATA = { occupella_portal: true } as const
