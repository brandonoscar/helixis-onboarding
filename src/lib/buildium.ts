/**
 * What the Buildium step says when the connection test fails.
 *
 * ⚠ THE FAILURE ARRIVES AS A 200, NOT AS AN HTTP ERROR. `POST
 * /api/v1/buildium/test` answers `{ ok: false, error }` when Buildium refuses,
 * and `error` is built in two places in AgenticHelixis:
 *
 *   api/routes/buildium.py  f"Buildium rejected the request: {exc}"
 *   buildium/errors.py      f"Buildium {status} {path}: {message}"
 *
 * so a refused key reached the screen as "Buildium rejected the request:
 * Buildium 401 /rentals: {...}", a vendor's raw response to somebody pasting
 * keys for the first time. Buildium's own status is only available inside that
 * sentence, so it is read from there.
 *
 * ⚠ This is a second copy of the backend's wording, and the two repos cannot
 * test each other. If the prefix changes there, `buildiumRefusalStatus`
 * returns null and the step falls back to showing the backend's text as
 * written: the readable sentence is lost, nothing is hidden.
 */

const REFUSAL = /^Buildium rejected the request: Buildium (\d{3}) /

/** Buildium's own HTTP status inside a failed test's `error`, or null. */
export function buildiumRefusalStatus(error: unknown): number | null {
  if (typeof error !== 'string') return null
  const match = REFUSAL.exec(error.trim())
  return match ? Number(match[1]) : null
}

/**
 * What a 401 or 403 means to the person holding the keys.
 *
 * Both causes named are ones they can check themselves: a pasted value with a
 * character missing, or an account whose Buildium plan has no API access.
 * ⚠ No plan name and no price: which plans include the API is not verified.
 */
export const BUILDIUM_KEYS_REFUSED =
  'Buildium refused those keys. Check that the Client ID and Client Secret were each copied whole, ' +
  'with nothing cut off, and that your Buildium plan includes API access.'

/** The sentence the Buildium step shows for a failed `{ ok: false }` test. */
export function buildiumTestFailure(error: unknown): string {
  const status = buildiumRefusalStatus(error)
  if (status === 401 || status === 403) return BUILDIUM_KEYS_REFUSED
  // Everything else is shown as the backend wrote it: "already connected to a
  // different Occupella workspace" is a sentence for the customer, and an
  // unrecognised shape is better shown than swallowed.
  if (typeof error === 'string' && error.trim()) return error.trim()
  return "Buildium didn't accept those keys."
}
