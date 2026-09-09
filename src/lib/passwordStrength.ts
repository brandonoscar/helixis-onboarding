/**
 * Password strength, scored honestly.
 *
 * The point of a meter is to change what someone types. A meter that calls
 * `Password1!` "Strong" — because it ticks upper, lower, digit and symbol —
 * teaches the opposite of the truth: that password is in every cracking
 * wordlist and falls in seconds, while `correct horse battery staple` scores
 * badly on the same rules and is genuinely hard. So this scores what actually
 * costs an attacker time (LENGTH, then how much of the character space is in
 * play) and then SUBTRACTS for the shapes that make a long password cheap:
 * a dictionary word, a keyboard run, a repeated character, a trailing year.
 *
 * Deliberately dependency-free. zxcvbn is the better estimator and it is
 * ~400 KB of dictionaries on the login route of an app whose users are
 * property managers on office wifi. This is a nudge, not a security control —
 * the real floor is `MIN_LENGTH`, enforced on submit, and Supabase's own
 * policy behind that.
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

export type StrengthLabel = 'Too short' | 'Weak' | 'Fair' | 'Good' | 'Strong';

export interface Strength {
  /** 0-4. 0 is unusable, 4 is the top band. */
  score: number;
  label: StrengthLabel;
  /** The single most useful next thing to change, or null when there isn't one. */
  hint: string | null;
}

export interface Requirement {
  id: string;
  label: string;
  met: boolean;
}

/**
 * Shown BEFORE the field is touched, not revealed as errors after a failed
 * submit — "minimum requirements shown up front". Someone who can see the bar
 * clears it on the first try; someone who can't types a password, gets
 * rejected, and blames the product.
 *
 * ⚠ These are the ENFORCED FLOOR; `strength()` below is the honest estimate,
 * and the two deliberately disagree. Composition rules — one capital, one
 * number — are what produce `Password1`, and NIST has recommended against
 * them for years precisely because they push people toward that shape. They
 * are here as a founder decision (2026-09-08): a visible checklist makes the
 * account *feel* protected, and feeling protected is why somebody bothers.
 *
 * The resolution is that the checklist gates submission and the METER still
 * tells the truth — `Password1!` clears every box and is still ranked below a
 * four-word phrase. A product that only did the first half would be teaching
 * the wrong lesson; one that only did the second is a bar nobody can see.
 */
export function requirements(password: string): Requirement[] {
  return [
    {
      id: 'length',
      label: `At least ${MIN_LENGTH} characters`,
      met: password.length >= MIN_LENGTH,
    },
    {
      id: 'capital',
      label: 'One capital letter',
      met: /[A-Z]/.test(password),
    },
    {
      id: 'number',
      label: 'One number',
      met: /[0-9]/.test(password),
    },
  ];
}

/** Every box ticked. The submit gate — see the note on `requirements`. */
export function meetsRequirements(password: string): boolean {
  return requirements(password).every((r) => r.met);
}

/**
 * The first unmet requirement, phrased as an instruction, or null.
 *
 * ⚠ ONE at a time. Listing three failures at once reads as a telling-off, and
 * the checklist beside the field is already showing all of them — this is for
 * the single line under the button that says why it is disabled.
 */
export function firstUnmet(password: string): string | null {
  const missing = requirements(password).find((r) => !r.met);
  if (!missing) return null;
  return missing.id === 'length'
    ? `Use at least ${MIN_LENGTH} characters.`
    : `Add ${missing.label.toLowerCase()}.`;
}

/** Substrings that make a password cheap regardless of how long it is. */
const COMMON = [
  'password',
  'passw0rd',
  'qwerty',
  'asdf',
  'zxcv',
  '1234',
  'abcd',
  'letmein',
  'welcome',
  'admin',
  'iloveyou',
  'monkey',
  'dragon',
  'sunshine',
  'princess',
  'football',
  'baseball',
  'occupella',
  'buildium',
  'property',
  'manager',
];

/**
 * The size of the alphabet the password draws from. This is what makes a
 * brute force expensive, and it is why "add a symbol" is real advice while
 * "add another lowercase letter" is nearly free.
 */
function alphabetSize(password: string): number {
  let size = 0;
  if (/[a-z]/.test(password)) size += 26;
  if (/[A-Z]/.test(password)) size += 26;
  if (/[0-9]/.test(password)) size += 10;
  if (/[^a-zA-Z0-9]/.test(password)) size += 32;
  return size;
}

/**
 * The shape an attacker gets for free: one run of letters, then a few digits,
 * then maybe a symbol. `Basketball1`, `Summer2026`, `Dragon99!`.
 *
 * ⚠ **This exists because enumerating words is unwinnable, and COMMON proved
 * it.** That list holds `football` and `baseball` and not `basketball`, so
 * `Basketball1` — a wordlist entry with the single most predictable suffix in
 * use — scored **4/Strong**, the same band as a 12-character random string
 * (measured 2026-09-09). Adding `basketball` fixes one password; the next
 * sport is still missing. A shape covers the whole class at once.
 *
 * The letter run is capped at 3-12 characters on purpose: English words are
 * almost all inside that, and a longer run is far more likely to be several
 * words jammed together (`brandonoscarbasketball`), which no wordlist carries
 * and which genuinely earns its length. Guessing high there would tell someone
 * their good password is weak, which is the direction that gets a meter
 * ignored.
 */
const SINGLE_WORD_SHAPE = /^([A-Za-z]{3,12})([0-9]{0,4})([!@#$%^&*.?_-]{0,2})$/;

/**
 * log2 of a cracking wordlist. ~200k entries is a normal English list, and
 * the capitalisation variants an attacker also tries (all-lower, Capitalised,
 * ALL-CAPS) are worth about 2 bits on top — not the ~4.7 per letter the
 * textbook formula would hand out.
 */
const WORDLIST_BITS = 17.6;
const CAPITALISATION_BITS = 2;

/**
 * Rough bits of entropy, then penalties. `log2(alphabet) * length` is the
 * textbook figure and it is an OVER-estimate for anything a human typed, so
 * every penalty below is subtracting back toward the truth rather than
 * punishing the user for style.
 */
function bits(password: string): number {
  const size = alphabetSize(password);
  if (size === 0) return 0;
  let value = Math.log2(size) * password.length;

  const lower = password.toLowerCase();

  // The whole password is word-then-digits. Price it as the attack that
  // actually breaks it — walk a wordlist, try each suffix — rather than as
  // its length. This REPLACES the length estimate instead of discounting it,
  // because the length is not what an attacker pays for here.
  const shaped = SINGLE_WORD_SHAPE.exec(password);
  if (shaped) {
    const [, , digits, symbols] = shaped;
    value = Math.min(
      value,
      WORDLIST_BITS +
        CAPITALISATION_BITS +
        Math.log2(10) * digits.length +
        Math.log2(32) * symbols.length,
    );
  }

  // A known word anywhere in it means an attacker starts from that word, not
  // from the empty string — so most of the length above is not real.
  for (const word of COMMON) {
    if (lower.includes(word)) {
      value -= Math.log2(size) * word.length * 0.8;
      break;
    }
  }

  // "aaaaaaaa" has the length of eight characters and the entropy of about
  // two. Same for a run of the same character anywhere inside.
  const repeats = lower.match(/(.)\1{2,}/g) ?? [];
  for (const run of repeats) value -= Math.log2(size) * (run.length - 1) * 0.7;

  // A trailing year or a trailing "1!" is the single most predictable way
  // people satisfy a complexity rule. It adds almost nothing.
  if (/(19|20)\d{2}$/.test(password)) value -= Math.log2(size) * 2.5;
  else if (/\d{1,2}[!@#$]?$/.test(password)) value -= Math.log2(size) * 0.8;

  return Math.max(0, value);
}

export function strength(password: string): Strength {
  if (!password) return { score: 0, label: 'Too short', hint: null };
  if (password.length < MIN_LENGTH) {
    return {
      score: 0,
      label: 'Too short',
      hint: `${MIN_LENGTH - password.length} more character${
        MIN_LENGTH - password.length === 1 ? '' : 's'
      } to go.`,
    };
  }

  const value = bits(password);
  // Bands chosen against the penalised figure above, not against raw entropy:
  // 28 bits of *penalised* estimate is already a password with no dictionary
  // word and some variety in it.
  const score = value >= 70 ? 4 : value >= 58 ? 3 : value >= 46 ? 2 : 1;

  const label: StrengthLabel =
    score === 4 ? 'Strong' : score === 3 ? 'Good' : score === 2 ? 'Fair' : 'Weak';

  return { score, label, hint: hintFor(password, score) };
}

/**
 * ONE hint, the most valuable one — a list of five suggestions is read as
 * nagging and acted on by nobody. Length leads because it is the term with
 * the biggest exponent.
 */
function hintFor(password: string, score: number): string | null {
  if (score >= 4) return null;

  const lower = password.toLowerCase();
  for (const word of COMMON) {
    if (lower.includes(word)) return `Avoid common words like "${word}".`;
  }
  if (/(.)\1{2,}/.test(password)) return 'Avoid repeated characters.';
  if (password.length < 14) return 'Longer is stronger — try a short phrase.';
  if (!/[^a-zA-Z0-9]/.test(password)) return 'Add a symbol.';
  if (!/[0-9]/.test(password)) return 'Add a number.';
  return 'Add a little more variety.';
}
