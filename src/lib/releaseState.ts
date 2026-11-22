/**
 * What is live on app.occupella.com, in one place.
 *
 * The site copy the founder approved on 2026-11-22 has lines that are only
 * true once a piece of work is finished. Each such line reads one of the
 * constants below, and while the constant is false the page shows a fallback
 * that is true today. Flipping a constant is the whole change:
 * src/releaseState.test.tsx renders the pages with each one on and off and
 * checks what a visitor reads either way.
 *
 * ⚠ Flip one only once its "true when" holds, checked on the hosted app, not
 * from a doc or a merged PR.
 */

/**
 * [after A] The hosted books are running: app.occupella.com/books/health
 * answers 200 (on 2026-11-22 it answers 503).
 *
 * On: the home hero adds "or use ours at no cost", the Open source section
 * adds "Or use ours, which runs the same code", and the "Connect the AI you
 * already use" section appears on the home page and /features (with the
 * pointer to it from /features' Not available yet list).
 */
export const BOOKS_LIVE: boolean = false;

/**
 * [after A, and the hosted email sender is set] The hosted books are running
 * AND they send email: PMS_EMAIL_SENDER is set on the hosted app and an
 * email the books wrote has arrived. Leave it false while BOOKS_LIVE is.
 *
 * On: /features shows "Emails the books send by themselves".
 */
export const BOOKS_EMAIL_LIVE: boolean = false;

/**
 * [after B] Owner and tenant portals: Supabase migration 0114 is applied and
 * an owner and a tenant have each signed in once on app.occupella.com.
 *
 * On: the Coming chips come off the owner and tenant portals (home page
 * tour, /features, /solutions/owner-reporting) and tenant requests (/features,
 * /solutions/maintenance), with the "once sign-in arrives" sentences.
 */
export const PORTALS_LIVE: boolean = false;

/**
 * [after G] The chat can't change records: the Buildium and Rentvine write
 * tools are gone from the hosted chat.
 *
 * On: /security's "The assistant can't move money" loses its Coming chip and
 * takes the new wording, and /features' AI section says "It can't change your
 * records", with reading the books and drafts listed under Not available yet
 * only.
 */
export const CHAT_READS_ONLY: boolean = false;
