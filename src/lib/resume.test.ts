/**
 * The emailed code and the emailed LINK are two doors into step 1, and only
 * one of them used to collect a password.
 *
 * `signInWithOtp` sends both. Type the code and the wizard renders "Create
 * your password" and calls `updateUser({ password })`. Click the link and the
 * SPA reloaded, found a live session, bootstrapped the workspace and jumped to
 * step 2 — so an account created through the most natural thing to do with an
 * email had no password, and the person found out at a sign-in screen that
 * rejects them for reasons it cannot explain.
 *
 * These pin the decision itself rather than either branch, because the defect
 * was never inside a branch: it was that two entry points answered one
 * question differently and nothing compared them.
 */

import { describe, expect, it } from 'vitest';

import { resumeAction, type ResumeState } from './resume';

/** No session, nothing done, nothing in flight. Each test names its own delta. */
const base: ResumeState = {
  hasSession: false,
  alreadyResumed: false,
  identifyComplete: false,
  awaitingLink: false,
};

describe('resumeAction', () => {
  it('finishes a magic-link continuation by COLLECTING A PASSWORD', () => {
    // ⚠ The whole fix. This used to bootstrap the workspace and jump to step
    // 2, which is why the account ended up passwordless.
    expect(resumeAction({ ...base, hasSession: true, awaitingLink: true })).toBe(
      'collect-password',
    );
  });

  it('asks a returning visitor which account they meant', () => {
    // Same origin, same live session, same stored profile — only the marker
    // separates this from the case above, so both directions need a test or
    // the marker is decorative.
    expect(resumeAction({ ...base, hasSession: true, awaitingLink: false })).toBe(
      'ask-which-account',
    );
  });

  it('does nothing without a session', () => {
    expect(resumeAction(base)).toBe('ignore');
    // And a marker alone is not a session: a browser that sent a code and
    // never came back signed in must not be treated as though it had.
    expect(resumeAction({ ...base, awaitingLink: true })).toBe('ignore');
  });

  it('is one-shot — a second run of the same load decides nothing', () => {
    expect(
      resumeAction({
        ...base,
        hasSession: true,
        awaitingLink: true,
        alreadyResumed: true,
      }),
    ).toBe('ignore');
  });

  it('ignores a stale link clicked after step 1 already finished', () => {
    // Someone who typed the code, set a password and moved on, then opened the
    // same email again. The attempt is over; re-entering it would throw them
    // back to a password screen for an account that already has one.
    expect(
      resumeAction({
        ...base,
        hasSession: true,
        awaitingLink: true,
        identifyComplete: true,
      }),
    ).toBe('ignore');
  });

  it('cannot reach step 2 on its own — every non-ignore outcome asks the person something', () => {
    // ⚠ Stated as a property over EVERY input, because the defect was an
    // outcome that existed rather than a branch that was wrong: a fourth
    // answer, "bootstrap the workspace and move on", which no amount of
    // testing the other three would have found.
    const values = [false, true];
    const seen = new Set<string>();
    for (const hasSession of values)
      for (const alreadyResumed of values)
        for (const identifyComplete of values)
          for (const awaitingLink of values)
            seen.add(
              resumeAction({ hasSession, alreadyResumed, identifyComplete, awaitingLink }),
            );

    // Exactly the three, and no input reaches anything else. A new outcome
    // that carries the wizard forward unattended fails here rather than in
    // somebody's inbox.
    expect([...seen].sort()).toEqual(['ask-which-account', 'collect-password', 'ignore']);
  });
});

/**
 * ⚠ **A test of the decision cannot see a caller that ignores it**, and that
 * is precisely how this defect survived: the password requirement was written
 * down in `StepIdentify` and enforced on one of the two doors. So the
 * structural half is pinned separately — step 1 may be marked complete from
 * exactly ONE place, the one that has just saved a password.
 *
 * Source-level rather than behavioural because a behavioural test would need
 * to drive a 2,000-line component with a live Supabase client, and would still
 * pass against a SECOND completion site added elsewhere in the file.
 * `import.meta.glob` rather than `node:fs`: this is a browser tsconfig with no
 * node types, so the fs version runs green under vitest and turns `tsc -b` red.
 */
describe('the wizard completes step 1 from one place', () => {
  const sources = import.meta.glob('../App.tsx', { query: '?raw', import: 'default', eager: true });
  const app = Object.values(sources)[0] as string;

  it('reads App.tsx at all', () => {
    // A corpus scan that finds nothing is a claim to check, not a result.
    expect(app).toBeTruthy();
    expect(app).toContain('resumeAction');
  });

  it('does not bootstrap a magic-link arrival — it sends it to the password screen', () => {
    // ⚠ MY FIRST VERSION OF THIS ASSERTED THE WRONG PROPERTY and the guard
    // caught it: "step 1 is completed from exactly one place" is false and
    // should be. `resumeInto` legitimately completes it for somebody RETURNING
    // to an account they already finished — that person has a password
    // already, and demanding one would either charge every returning visitor
    // for a small pre-fix cohort or silently change the password of anyone who
    // typed a different string.
    //
    // The property that actually distinguishes the fix from the defect is
    // narrower: the CONTINUATION must not reach the bootstrap. So `resumeInto`
    // has exactly one call site, the returning-visitor button, and the resume
    // effect answers `collect-password` by opening the password screen.
    const callSites = app.match(/(?<!const )\bresumeInto\(/g) ?? [];
    expect(
      callSites.length,
      'resumeInto gained a caller — if that is the magic-link branch, the ' +
        'password step is being skipped again',
    ).toBe(1);

    // And the one caller is the button, not the effect.
    const effect = app.slice(app.indexOf('supabase.auth.getSession()'), app.indexOf('onAuthStateChange'));
    expect(effect).not.toContain('resumeInto(');
    expect(
      effect,
      'the continuation branch no longer opens the password screen',
    ).toContain('setAwaitingPassword(true)');
  });

  it('gates the password screen on ONE predicate, not on the code path alone', () => {
    // `verifiedToken` is what the emailed CODE produces; the emailed LINK
    // produces a live session and no token. Every gate reading the token
    // directly is a gate the link door fails — which is the shape of the
    // original defect, and the reason these all read `needsPassword`.
    // Both inputs, named on the one line that defines the gate. A version
    // reading only the token is the original defect exactly; one reading only
    // the session would demand a password from the code path twice.
    const definition = app.match(/const needsPassword = .*/)?.[0] ?? '';
    expect(definition, 'needsPassword is not defined at all').toBeTruthy();
    expect(definition).toContain('verifiedToken');
    expect(
      definition,
      'the password screen no longer opens for a magic-link arrival',
    ).toContain('resumedSession');

    const stray = app.match(/\{verifiedToken \?/g) ?? [];
    expect(
      stray.length,
      'a render gate still tests verifiedToken directly, so the magic-link ' +
        'door does not see the password screen',
    ).toBe(0);
    expect(app).not.toContain('if (!verifiedToken || loading) return;');
  });
});
