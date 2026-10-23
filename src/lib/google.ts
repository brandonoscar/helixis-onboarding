/**
 * The wizard's email step: whether Gmail is connected.
 *
 * ⚠ GMAIL ONLY, AND THAT IS THE BACKEND'S SHAPE, NOT A SIMPLIFICATION. The
 * step calls `POST /api/v1/connectors/gmail/connect`, which starts ONE
 * Composio grant. Google Calendar and Google Drive are separate grants with
 * their own connect calls (AgenticHelixis `api/routes/connectors.py`). This
 * step used to promise "Gmail, Calendar and Drive" and showed Connected when
 * ANY of the three was, so a workspace with only Calendar connected was told
 * its Gmail was done, and one that connected Gmail here was told it had
 * Calendar and Drive as well.
 */

/** The connector id this step connects, and the only one it reads back. */
export const GMAIL_CONNECTOR_ID = 'gmail'

/**
 * Read `GET /api/v1/connectors/` and answer for Gmail alone.
 *
 * Anything that is not a clear `isConnected: true` on the gmail row is "not
 * connected", which only ever shows the Connect button again. It never claims
 * a connection the backend did not report (a `stateUnknown` row carries
 * `isConnected: false`, so it lands here too).
 */
export function gmailConnected(connectors: unknown): boolean {
  if (!Array.isArray(connectors)) return false
  return connectors.some(
    (c) =>
      Boolean(c) &&
      typeof c === 'object' &&
      (c as { id?: unknown }).id === GMAIL_CONNECTOR_ID &&
      (c as { isConnected?: unknown }).isConnected === true,
  )
}
