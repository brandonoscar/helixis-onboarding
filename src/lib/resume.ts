/**
 * What should the wizard do with a session it finds on load?
 *
 * The magic-link continuation and a returning visitor arrive IDENTICALLY —
 * same origin, same live Supabase session, same stored profile — and the only
 * thing separating them is the `awaitingLink` marker (see `persist.ts`). That
 * much was already true and already handled.
 *
 * ⚠ **What was NOT handled: the emailed code and the emailed LINK are two
 * doors into step 1, and only one of them collected a password.**
 * `signInWithOtp` with `emailRedirectTo` sends both a 6-digit code and a
 * clickable link. Typing the code renders "Create your password" and calls
 * `updateUser({ password })`; clicking the link reloaded the SPA, found a live
 * session, bootstrapped the workspace and jumped straight to step 2 — so the
 * password step never rendered at all.
 *
 * `StepIdentify`'s own comment says why that matters, in the code that shipped:
 *
 *     "the user SETS A PASSWORD before continuing — OTP-created users are
 *      otherwise passwordless and could never sign in at occupella.com
 *      (password-only)."
 *
 * The requirement was written down and enforced on ONE of the two paths. So
 * somebody who did the most natural thing with an email containing a link
 * finished onboarding with an account that has no password, and discovered it
 * at the sign-in screen with no idea why their new account rejects them. The
 * app's "Forgot password" recovery does get them in — it is not a permanent
 * lockout — but needing it for an account created four minutes ago, having
 * never been asked to choose a password, reads exactly like a broken product.
 *
 * This module is the decision, alone and pure, because the defect was never in
 * any single branch — it was that two entry points answered the same question
 * differently and nothing compared them. One function, three outcomes, and a
 * test that names each.
 */

/** A live session was found on load. What does the wizard do about it? */
export type ResumeAction =
  /** Not a continuation and not a fresh start — ask which the person meant. */
  | 'ask-which-account'
  /**
   * A magic-link continuation. The session is real and step 1 is NOT finished,
   * so finish it the same way the code path does: collect a password, then
   * bootstrap. ⚠ Deliberately NOT "bootstrap and move on" — that was the bug.
   */
  | 'collect-password'
  /** Nothing to do: no session, already resumed once, or step 1 already done. */
  | 'ignore';

export interface ResumeState {
  /** Is there a live Supabase session in this browser? */
  hasSession: boolean;
  /** Has this load already run its one-shot resume? */
  alreadyResumed: boolean;
  /** Is step 1 already marked complete in this render? */
  identifyComplete: boolean;
  /**
   * Did this browser send a code and is it waiting to come back signed in?
   * The one fact that separates a continuation from a returning visitor.
   */
  awaitingLink: boolean;
}

/**
 * ⚠ **Order is the whole contract, and each guard is load-bearing.**
 *
 * `hasSession` first: with no session there is nothing to decide. Then the
 * one-shot guards — resuming twice re-enters a flow that is already running,
 * and a completed step 1 means whichever door was used has already done its
 * job (this is what makes clicking a stale link after finishing a no-op).
 * `awaitingLink` LAST, because by then it is the only remaining question:
 * a continuation finishes the attempt, anything else has to be asked.
 */
export function resumeAction(state: ResumeState): ResumeAction {
  if (!state.hasSession) return 'ignore';
  if (state.alreadyResumed || state.identifyComplete) return 'ignore';
  return state.awaitingLink ? 'collect-password' : 'ask-which-account';
}
