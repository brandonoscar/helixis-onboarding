/**
 * Password strength — the ordinary three-band kind.
 *
 * ⚠ **This was rewritten DOWN on 2026-09-09.** The previous version scored
 * entropy, penalised dictionary words, keyboard runs, repeated characters and
 * trailing years, priced a "word + digits" shape as a wordlist walk, and
 * reported five bands plus a rotating one-line hint. Every part of it was
 * defensible and the whole was wrong for the job: it argued with people about
 * passwords that are fine, on the signup screen of a property-management app.
 * The founder's words were "too much... I really just want like a standard
 * UI, not the CIA database one."
 *
 * So: length and character variety, three bands, no advice. That is what
 * every signup form ships and what people already know how to read.
 *
 * The REAL floor is `requirements()` below, which gates the submit button.
 * The meter is decoration on top of it and is deliberately not consulted
 * anywhere that decides anything.
 */

/*
 * ⚠ **A VERBATIM COPY of `frontend/src/lib/passwordStrength.ts` in the
 * AgenticHelixis repo.** The wizard is a separate deployable with its own
 * package.json and no shared module, so the choice was a second copy or a
 * second, worse implementation — and the second implementation is how the
 * wizard ends up calling a password strong that the app it hands you off to
 * calls weak, on consecutive screens.
 *
 * ⚠ **`MIN_LENGTH` is the one value here that is NOT merely cosmetic.** The
 * wizard sets the password through Supabase, the app validates against the
 * same floor, and a wizard that accepted seven characters would create an
 * account whose owner is refused by the change-password screen the first time
 * they use it. If it changes there, change it here the same day — nothing
 * mechanical holds the two together across repositories.
 */

export const MIN_LENGTH = 8;

export type StrengthLabel = 'Weak' | 'Medium' | 'Strong';

export interface Strength {
  /** 1-3, or 0 for an empty field. The meter renders this and nothing else. */
  score: number;
  label: StrengthLabel;
}

export interface Requirement {
  id: string;
  label: string;
  met: boolean;
}

/**
 * The enforced floor, shown BEFORE the field is touched rather than revealed
 * as errors after a failed submit. Someone who can see the bar clears it on
 * the first try; someone who can't types a password, gets rejected, and blames
 * the product.
 */
export function requirements(password: string): Requirement[] {
  return [
    {
      id: 'length',
      label: `At least ${MIN_LENGTH} characters`,
      met: password.length >= MIN_LENGTH,
    },
    { id: 'capital', label: 'One capital letter', met: /[A-Z]/.test(password) },
    { id: 'number', label: 'One number', met: /[0-9]/.test(password) },
  ];
}

/** Every box ticked. This — not `strength()` — is the submit gate. */
export function meetsRequirements(password: string): boolean {
  return requirements(password).every((r) => r.met);
}

/**
 * The first unmet requirement, phrased as an instruction, or null.
 *
 * ⚠ ONE at a time. Listing three failures at once reads as a telling-off, and
 * the checklist beside the field is already showing all of them.
 */
export function firstUnmet(password: string): string | null {
  const missing = requirements(password).find((r) => !r.met);
  if (!missing) return null;
  return missing.id === 'length'
    ? `Use at least ${MIN_LENGTH} characters.`
    : `Add ${missing.label.toLowerCase()}.`;
}

/** Lower, upper, digit, symbol — how many kinds of character are in play. */
function variety(password: string): number {
  return [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((re) => re.test(password)).length;
}

/**
 * Length and variety. Nothing else.
 *
 * ⚠ **Tuned so a password that clears the checklist never reads Weak.** The
 * checklist demands 8 characters, a capital and a number — which is 8 chars
 * with variety 3 — so the bands are placed to call that Medium. A form that
 * tells you your password is bad *after* you satisfied the rules it printed
 * is picking a fight it does not need; that mismatch is what "too much"
 * actually described.
 */
export function strength(password: string): Strength {
  if (!password) return { score: 0, label: 'Weak' };

  const long = password.length >= 12;
  const varied = variety(password) >= 3;

  // Strong needs BOTH: 12+ characters and three kinds of character.
  if (long && varied) return { score: 3, label: 'Strong' };
  // Medium is either one of them — which the checklist's own floor satisfies.
  if (password.length >= MIN_LENGTH && (long || varied)) return { score: 2, label: 'Medium' };
  return { score: 1, label: 'Weak' };
}
