/**
 * Step 2's way out for somebody whose system is not Buildium or Rentvine.
 *
 * It used to be a dead end: two tiles and "Skip for now", and the one thing
 * worth knowing about that visitor (which system they are on, and how big
 * they are) was lost. The answer now goes to the backend's feedback route,
 * the same one the app's "Request an integration" dialog uses.
 *
 * ⚠ THE CONTRACT IS AgenticHelixis `api/routes/feedback.py` (ADR 0003: the
 * backend is the authority). Checked against origin/main on 2026-10-23:
 *
 *   POST /api/v1/feedback        signed in (bearer JWT), member of a company
 *   category  "bug" | "idea" | "other"   anything else is a 400
 *   message   3 to 5000 characters       outside that is a 422
 *   view      at most 40 characters      free text: the triage tag
 *   session_id, app_version, user_agent  optional, not sent from here
 *
 * `idea` + a `view` tag is exactly how the app files a connector request
 * (SettingsPage's preset, view "connectors"): `helixis_feedback.category` has
 * a CHECK constraint, so a fourth category would be refused by the database.
 * This sends its own tag so triage can tell a signup from a customer.
 *
 * ⚠ The thank-you promises nothing about adding support, and the message
 * says nothing that reads as a waitlist. Nobody has decided to build any of
 * these, and the backend stores the row; it does not reply.
 */

/** The systems offered, in the order a property manager would look for theirs. */
export const NOT_LISTED_SYSTEMS = ['AppFolio', 'Yardi', 'Rent Manager', 'Propertyware', 'DoorLoop', 'Other'] as const

export type NotListedSystem = (typeof NOT_LISTED_SYSTEMS)[number]

export const FEEDBACK_PATH = '/api/v1/feedback'

/** The triage tag. At most 40 characters (the server's `view` bound). */
export const NOT_LISTED_VIEW = 'start_pms_not_listed'

/** The server's message bounds (feedback.py `FeedbackIn.message`). */
export const MESSAGE_MIN_CHARS = 3
export const MESSAGE_MAX_CHARS = 5000

/** Caps on the two free-text fields, so the composed message always fits. */
export const OTHER_MAX_CHARS = 80
export const NOTE_MAX_CHARS = 2000

export interface NotListedAnswer {
  /** '' until the person picks one. */
  system: NotListedSystem | ''
  /** Only read when `system` is 'Other'. */
  otherName: string
  note: string
  /** The "Doors under management" range from step 1, '' when not given. */
  doors: string
}

/** Whether the form can be sent: a system picked, and named when it is Other. */
export function notListedReady(a: NotListedAnswer): boolean {
  if (!a.system) return false
  if (a.system === 'Other') return a.otherName.trim().length > 0
  return true
}

/** The system as it goes in the message. */
function systemLine(a: NotListedAnswer): string {
  if (a.system !== 'Other') return a.system
  return `Other: ${a.otherName.trim().slice(0, OTHER_MAX_CHARS)}`
}

/**
 * The request body for `POST /api/v1/feedback`.
 *
 * ⚠ Unknown is written as "not given", never left blank: a blank doors line
 * reads as zero doors to whoever triages it.
 */
export function notListedBody(a: NotListedAnswer): { category: 'idea'; message: string; view: string } {
  const note = a.note.trim().slice(0, NOTE_MAX_CHARS)
  const message = [
    'Signup wizard: their property management system is not listed.',
    `System: ${systemLine(a)}`,
    `Doors under management: ${a.doors.trim() || 'not given'}`,
    `Note: ${note || 'none'}`,
  ]
    .join('\n')
    .slice(0, MESSAGE_MAX_CHARS)
  return { category: 'idea', message, view: NOT_LISTED_VIEW }
}
