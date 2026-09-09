/**
 * The three fields that have to survive ONE page reload. Not a saved session.
 *
 * ⚠ **This used to persist the whole wizard — step, completed-set, every
 * connector flag — and that was the wrong shape for a five-minute flow**
 * (founder call, 2026-09-09). Two things it caused:
 *
 *  - The marketing pages offered **"Resume setup"** off the persisted
 *    `completed` set, which read as a saved draft and behaved like one until
 *    the live Supabase session underneath it took the visitor straight into
 *    the app instead.
 *  - Making a SECOND account on the same device meant fighting a wizard
 *    pre-filled from the first — the shape a short flow should never have.
 *
 * What genuinely needs to outlive a reload is narrower: the magic-link path
 * **fully reloads the SPA** between "send me a code" and coming back signed
 * in, and `bootstrapWorkspace` needs the company name the person typed before
 * they left. That is a single attempt continuing, not progress being restored,
 * so only those fields are kept. Step and completion are derived on load from
 * whether a session exists (`App.tsx`'s resume effect) — a fact about the
 * world rather than a claim this file makes about it.
 *
 * SECURITY unchanged: never stores secrets. Buildium client_id/secret and the
 * webhook signing secret live in step-local component state and never reach
 * this module. The email is already in the JWT.
 */

const KEY = "helixis_onboarding_v1";

export interface PersistedWizard {
  /** Only `name`/`slug` are written; `id` is read back for an in-flight reload. */
  workspace?: { name: string; slug: string; id?: string };
  userEmail?: string;
  /** Segmentation collected in step 1 (research: 2 early questions max). */
  doors?: string;
}

/**
 * ⚠ Keys this app WROTE before 2026-09-09 and no longer reads. They are
 * stripped on load rather than left in place: a returning visitor's stored
 * `completed: ["identify","buildium"]` would otherwise sit in localStorage
 * forever, and the next person to reintroduce a `loadWizard().completed` read
 * would find it populated and working — which is how a deleted feature comes
 * back by accident.
 */
const RETIRED_KEYS = [
  "step",
  "completed",
  "members",
  "webhooksConfigured",
  "buildiumCount",
  "buildiumConnected",
  "googleConnected",
  "goal",
] as const;

export function loadWizard(): PersistedWizard {
  try {
    const raw = localStorage.getItem(KEY);
    const state = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    for (const key of RETIRED_KEYS) delete state[key];
    return state as PersistedWizard;
  } catch {
    // Corrupt JSON, private-mode storage block, etc. — start fresh.
    return {};
  }
}

export function saveWizard(state: PersistedWizard): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Quota / private mode — non-fatal; the wizard just won't persist.
  }
}

export function clearWizard(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
