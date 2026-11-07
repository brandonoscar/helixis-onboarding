import { useCallback, useEffect, useRef, useState } from "react";
import { releaseSessionForHandOff, supabase } from "./lib/supabase";
import { apiFetch, apiJson, APP_URL } from "./lib/api";
import { clearWizard, loadWizard, saveWizard } from "./lib/persist";
import { firstUnmet, meetsRequirements, requirements } from "./lib/passwordStrength";
import { DraftCrop, WorkOrderCard, cropCss } from "./crops";
import { resumeAction } from "./lib/resume";
import { captureWizard } from "./lib/analytics";
import { Wordmark } from "./Site";

// ─────────────────────────────────────────────────────────
// SETUP WIZARD — the account, then the hand-off into the app:
//   Account  identify  — email code, company, doors, then a password; the
//                        company is made by /auth/bootstrap
//   Open     finish    — the hand-off into the app, signed in
// Since 2026-11-07 (founder; AgenticHelixis docs/decisions/ADR-one-product.md,
// decision 5) the wizard stops at the account: the PMS connection, live
// updates, the first scan and Gmail are gone with the connectors leaving the
// release, and the rest of setup happens in the app's Getting started
// checklist. Team invites live there too.
// ─────────────────────────────────────────────────────────

type Step = "identify" | "finish";

interface WorkspaceData {
  name: string;
  slug: string;
  id?: string;
}

// Versioned ToS/Privacy acceptance recorded at signup (the wizard is the
// one front door — keep in sync with the app's TERMS_VERSION).
/**
 * The password rules, ticked as they are met.
 *
 * ⚠ **Visible from the FIRST keystroke**, not revealed as errors after a
 * failed submit. Somebody who can see the bar clears it on the first try.
 * The strength meter that used to sit above it (three bars and a "Strong"
 * label) is gone at the founder's call (2026-09-29): it disagreed with the
 * checklist on purpose, and two verdicts on one field read as noise. The
 * reasoning for the rules is in `lib/passwordStrength.ts`.
 */
function PasswordRules({ password }: { password: string }) {
  return (
    <ul className="ob-rules" aria-live="polite">
      {requirements(password).map((r) => (
        <li key={r.id} className={r.met ? "met" : undefined}>
          <span className="ob-rule-icon" aria-hidden="true">
            {r.met ? <CheckIcon /> : null}
          </span>
          {r.label}
          <span className="ob-sr">{r.met ? " (done)" : " (not yet)"}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * GoTrue's "New password should be different from the old password".
 *
 * ⚠ **In THIS flow that error means the step already succeeded.** The user
 * just verified a one-time code and is choosing a password; if the account
 * already has the one they typed, the state they asked for holds and the only
 * thing left is the workspace bootstrap. Treating it as a failure strands
 * them — the account exists, the password is right, and the wizard demands a
 * *different* password before it will move on (founder report, 2026-09-09).
 *
 * ⚠ Matched on `code` FIRST and the message only as a fallback: the code is
 * the stable contract and the sentence is user-facing copy Supabase is free to
 * reword. Anchored on "different from" rather than the whole sentence for the
 * same reason.
 */
function isSamePasswordError(e: { code?: string; message?: string }): boolean {
  if (e.code === "same_password") return true;
  return /different from the old password/i.test(e.message || "");
}

const TOS_VERSION = "2026-07-05";
// Legal pages are served by THIS app (main.tsx routes /terms + /privacy
// → Legal.tsx). app.occupella.com is the main app — an SPA that renders the
// login for any path, so absolute links there showed the login screen
// (founder-reported 2026-08-20; the host was the apex until the 2026-09-15
// swap moved this site to occupella.com and the app to app.occupella.com —
// the defect moved with the app, it did not go away). Same-origin paths
// always resolve, which is why this is a path and not a URL.
const TERMS_URL = "/terms";
const PRIVACY_URL = "/privacy";

// ⚠ Not stored on the company: bootstrap and the company PATCH carry the
// name alone (checked 2026-09-29). Since 2026-10-23 the chosen label travels
// as TEXT in two places: inside a "my system isn't listed" message
// (lib/notListed.ts), and as the `doors` property of wizard_account_created
// (lib/analytics.ts). No backend parses it, so the labels can still change
// without a backend change; a renamed label only splits the analytics
// breakdown at the date it changed.
const DOORS_OPTIONS = ["1–50", "51–200", "201–500", "501–2,000", "2,000+"];

// ─────────────────────────────────────────────────────────
// WIZARD-SPECIFIC STYLES (tokens + primitives live in theme.ts)
// ─────────────────────────────────────────────────────────

const css = `
  /* ── site tokens, scoped to the wizard (the marketing pages use .lp) ──
     NO BACKTICKS ANYWHERE IN THIS BLOCK: the stylesheet is one template
     literal and a backtick in a comment ends it. */
  .ob {
    --iris: #1957A0;
    --iris-hover: #144A8A;
    --iris-press: #0F3B70;
    --iris-soft: rgba(25, 87, 160, 0.10);
    --iris-ring: rgba(25, 87, 160, 0.35);
    --band: #E3EDF9;
    --line: #DCE3EC;
    --line-strong: #C5D0DD;
    --card-edge: #DCE3EC;
    --line-focus: rgba(25, 87, 160, 0.55);
    --font-display: 'Fraunces Variable', Georgia, 'Times New Roman', serif;
    --font-sans: 'IBM Plex Sans Variable', 'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
    --font-mono: var(--font-sans);
    min-height: 100vh; display: flex; flex-direction: column;
    background: var(--canvas); color: var(--ink);
    font-family: var(--font-sans); font-size: 16px; line-height: 1.55;
    font-variant-numeric: normal;
  }
  .ob a { color: var(--iris); }

  /* ── header: the site's bar ── */
  .ob-head {
    height: 64px; flex: none; display: flex; align-items: center; justify-content: space-between; gap: 16px;
    padding: 0 32px; background: var(--canvas); border-bottom: 1px solid var(--line);
  }
  .ob .ob-word {
    font-family: var(--font-display); font-optical-sizing: auto;
    font-size: 25px; font-weight: 600; letter-spacing: -0.015em; line-height: 1;
    color: var(--ink); text-decoration: none;
  }
  .ob-who { font-size: 14px; color: var(--ink-muted); text-align: right; }
  .ob-who b { color: var(--ink); font-weight: 600; }

  /* ── progress: four named steps ── */
  .ob-prog { border-bottom: 1px solid var(--line); background: var(--canvas); }
  .ob-prog ol { list-style: none; margin: 0; padding: 0 32px; display: flex; gap: 28px; height: 52px; align-items: center; }
  .ob-prog li { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; color: var(--ink-subtle); white-space: nowrap; }
  .ob-prog li .n {
    width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center;
    border: 1px solid var(--line-strong); font-size: 12px; font-weight: 600; color: var(--ink-subtle);
  }
  .ob-prog li[data-state="current"] { color: var(--iris); font-weight: 600; }
  .ob-prog li[data-state="current"] .n { border-color: var(--iris); background: var(--iris); color: #fff; }
  .ob-prog li[data-state="done"] { color: var(--ink); }
  .ob-prog li[data-state="done"] .n { border-color: var(--iris); color: var(--iris); }

  /* ── body: the form, and the pale blue panel on desktop ── */
  .ob-main { flex: 1; display: grid; grid-template-columns: minmax(0, 1fr); }
  @media (min-width: 960px) { .ob-main { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } }
  .ob-form { padding: 56px 32px 64px; display: flex; justify-content: center; }
  @media (min-width: 960px) { .ob-form { justify-content: flex-end; padding-right: 64px; } }
  .panel { width: 100%; max-width: 440px; animation: fadeUp 0.3s var(--ease-out) both; }
  .ob-side { display: none; background: var(--band); }
  @media (min-width: 960px) {
    .ob-side { display: flex; align-items: center; padding: 56px 64px; }
  }
  .ob-side-in { width: 100%; max-width: 440px; }
  .ob-side-next { margin-top: 20px; font-size: 16px; line-height: 1.55; color: var(--ink); max-width: 38ch; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { .panel { animation: none; } }

  /* ── step heading, with Back beside it ── */
  .panel-header { margin-bottom: 28px; }
  .ob-title-row { display: flex; align-items: center; gap: 12px; }
  .ob .ob-back {
    flex: none; display: inline-flex; align-items: center; justify-content: center;
    width: 32px; height: 32px; border-radius: 6px; border: 1px solid var(--line-strong);
    background: var(--canvas); color: var(--ink-muted); cursor: pointer; padding: 0;
  }
  .ob .ob-back:hover { color: var(--ink); border-color: var(--ink-subtle); }
  .ob .ob-back:focus-visible { outline: 2px solid var(--iris); outline-offset: 2px; }
  .panel-title {
    font-family: var(--font-display); font-optical-sizing: auto;
    font-size: 32px; font-weight: 560; line-height: 1.15; letter-spacing: -0.015em;
    color: var(--ink); text-wrap: balance;
  }
  .panel-desc { margin-top: 10px; font-size: 16px; line-height: 1.55; color: var(--ink-muted); }
  .panel-desc b { color: var(--ink); font-weight: 600; }
  .ob-sub { margin-top: 10px; font-size: 16px; color: var(--ink-muted); }

  /* ── fields: real labels above, sentence case ── */
  .ob .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 18px; }
  .ob label { font-size: 15px; font-weight: 600; color: var(--ink); letter-spacing: 0; }
  .ob input, .ob select { height: 44px; font-size: 16px; padding: 0 14px; }
  .ob .hint { font-size: 14px; line-height: 1.5; color: var(--ink-muted); margin-top: 2px; }
  .ob-pw { position: relative; }
  .ob-pw input { padding-right: 72px; }
  .ob .ob-pw-toggle {
    position: absolute; right: 6px; top: 6px; height: 32px; padding: 0 10px;
    border: 0; background: none; cursor: pointer; border-radius: 4px;
    font: inherit; font-size: 14px; font-weight: 600; color: var(--iris);
  }
  .ob .ob-pw-toggle:focus-visible { outline: 2px solid var(--iris); outline-offset: 1px; }

  /* ── buttons: the site's ── */
  .ob .btn { height: 40px; padding: 0 18px; border-radius: 6px; font-family: var(--font-sans); font-size: 15px; font-weight: 600; box-shadow: none; }
  .ob .btn-primary, .ob .btn-primary:hover { color: #fff; }
  .ob .btn-primary:disabled, .ob .btn-secondary:disabled {
    background: #E6EAF0; border-color: #E6EAF0; color: #8A94A3; opacity: 1; cursor: not-allowed;
  }
  .ob .btn-secondary { background: var(--canvas); border-color: var(--line-strong); color: var(--ink); }
  .ob .btn-secondary:hover:not(:disabled) { background: var(--canvas); border-color: var(--ink-subtle); }
  .ob .btn.wide { width: 100%; margin-top: 8px; }
  .ob .btn .spinner { margin-right: 4px; }

  /* ── the one secondary-action style: small grey text links ── */
  .ob-alts { margin-top: 14px; display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
  .ob .ob-alt {
    background: none; border: 0; padding: 0; cursor: pointer; text-align: left;
    font: inherit; font-size: 14px; color: var(--ink-muted); text-decoration: underline;
    text-decoration-color: var(--line-strong); text-underline-offset: 3px;
  }
  .ob a.ob-alt { color: var(--ink-muted); }
  .ob .ob-alt:hover:not(:disabled) { color: var(--ink); }
  .ob .ob-alt:disabled { cursor: default; text-decoration: none; opacity: 0.8; }
  .ob-alt-line { margin-top: 18px; font-size: 14px; color: var(--ink-muted); }
  .ob-alt-line .ob-alt { font-size: 14px; }

  /* ── password rules ── */
  .ob-rules { list-style: none; margin: 12px 0 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
  .ob-rules li { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--ink-muted); }
  .ob-rules li.met { color: var(--ink); }
  .ob-rule-icon {
    width: 18px; height: 18px; flex: none; border-radius: 50%; display: grid; place-items: center;
    border: 1px solid var(--line-strong); color: #fff;
  }
  .ob-rules li.met .ob-rule-icon { background: var(--positive); border-color: var(--positive); }
  .ob-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

  /* ── six code boxes ── */
  .otp-row { display: flex; gap: 8px; margin: 4px 0 18px; }
  .ob .otp-box {
    width: 52px; height: 58px; padding: 0; text-align: center;
    font-size: 24px; font-weight: 600; font-variant-numeric: tabular-nums;
    border-radius: 6px; border: 1px solid var(--line-strong); background: var(--canvas); color: var(--ink);
  }
  .ob .otp-box:focus { border-color: var(--iris); box-shadow: 0 0 0 3px var(--iris-soft); }
  @media (max-width: 420px) { .ob .otp-box { width: 44px; height: 52px; font-size: 22px; } .otp-row { gap: 6px; } }

  /* ── messages ── */
  .test-result { margin: 4px 0 14px; padding: 10px 12px; border-radius: 6px; font-size: 14px; line-height: 1.5; display: flex; gap: 8px; align-items: flex-start; }
  .test-result.error { background: var(--danger-soft); color: var(--danger); }
  .test-result.success { background: var(--positive-soft); color: var(--positive); }
  .test-result.info { background: var(--canvas-1); color: var(--ink-muted); }

  /* ── system tiles ── */
  .ob-tiles { display: grid; gap: 12px; }
  @media (min-width: 520px) { .ob-tiles { grid-template-columns: 1fr 1fr; } }
  .ob .ob-tile {
    display: flex; flex-direction: column; align-items: flex-start; gap: 14px; text-align: left;
    min-height: 148px; padding: 20px; border-radius: 8px; border: 1px solid var(--line-strong);
    background: var(--canvas); cursor: pointer; font: inherit; color: var(--ink);
  }
  .ob .ob-tile:hover:not(:disabled) { border-color: var(--iris); }
  .ob .ob-tile:focus-visible { outline: 2px solid var(--iris); outline-offset: 2px; }
  .ob .ob-tile:disabled { cursor: not-allowed; background: var(--canvas-1); color: var(--ink-subtle); }
  .ob-tile-reads { font-size: 14px; line-height: 1.5; color: var(--ink-muted); }
  .ob .ob-tile-other { grid-column: 1 / -1; min-height: 0; gap: 6px; }
  .ob .ob-tile[aria-expanded="true"] { border-color: var(--iris); }
  .ob-tile-name { font-size: 17px; font-weight: 600; color: var(--ink); }
  .ob-notlisted { margin-top: 20px; }
  .ob textarea {
    width: 100%; min-height: 88px; padding: 10px 14px; resize: vertical;
    font-family: var(--font-sans); font-size: 16px; line-height: 1.5; color: var(--ink);
    background: var(--canvas); border: 1px solid var(--line); border-radius: var(--r-sm); outline: none;
  }
  .ob textarea:focus { border-color: var(--iris); box-shadow: 0 0 0 3px var(--iris-soft); }
  .ob-mark { display: inline-flex; align-items: center; }
  .ob-mark img { display: block; height: 28px; width: auto; }
  .ob-mark-text { font-size: 22px; font-weight: 700; letter-spacing: -0.01em; color: var(--ink); }
  .ob-title-mark { display: inline-flex; margin-bottom: 12px; }

  /* ── numbered setup steps ── */
  .ob-steps { list-style: none; margin: 0 0 24px; padding: 0; counter-reset: ob; display: flex; flex-direction: column; gap: 12px; }
  .ob-steps li { counter-increment: ob; display: grid; grid-template-columns: 28px 1fr; gap: 10px; font-size: 15px; line-height: 1.5; color: var(--ink); }
  .ob-steps li::before {
    content: counter(ob); width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center;
    border: 1px solid var(--line-strong); font-size: 13px; font-weight: 600; color: var(--iris);
  }
  .ob-steps b { font-weight: 600; }
  .ob-shot { display: block; width: 100%; margin: 0 0 24px; border: 1px solid var(--line); border-radius: 6px; }
  .keys-clip { display: block; width: 100%; margin: 0 0 24px; border: 1px solid var(--line); border-radius: 6px; }

  /* ── admin handoff, sample, copy field ── */
  .handoff { margin: 16px 0 4px; padding: 16px 0 0; border-top: 1px solid var(--line); }
  .handoff-title { font-size: 16px; font-weight: 600; color: var(--ink); }
  .handoff-body { margin: 6px 0 12px; font-size: 14px; line-height: 1.55; color: var(--ink-muted); }
  .btn-row { display: flex; gap: 8px; }
  .sample { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--line); }
  .sample-label { font-size: 14px; font-weight: 600; color: var(--ink); margin-bottom: 8px; }
  .sample ul { margin: 0 0 8px 18px; padding: 0; display: flex; flex-direction: column; gap: 4px; }
  .sample li { font-size: 14px; color: var(--ink-muted); }
  .sample-cta { font-size: 14px; color: var(--ink-muted); }
  .copy-field { display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 6px 0 14px; border: 1px solid var(--line-strong); border-radius: 6px; background: var(--canvas-1); }
  .copy-value { flex: 1; min-width: 0; font-size: 14px; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; user-select: all; }
  .ob .copy-btn { height: 32px; padding: 0 10px; border: 0; background: none; cursor: pointer; border-radius: 4px; font: inherit; font-size: 14px; font-weight: 600; color: var(--iris); }
  .ob-radio { display: flex; gap: 20px; margin-bottom: 18px; }
  .ob-radio label { display: flex; align-items: center; gap: 8px; font-weight: 500; cursor: pointer; }
  .ob .ob-radio input { -webkit-appearance: radio; appearance: auto; width: 18px; height: 18px; padding: 0; margin: 0; border: 0; box-shadow: none; accent-color: var(--iris); }

  /* ── scan progress ── */
  .ob-scan { list-style: none; margin: 0 0 20px; padding: 0; border-top: 1px solid var(--line); }
  .ob-scan li { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--line); font-size: 16px; }
  .ob-scan .v { margin-left: auto; font-weight: 600; font-variant-numeric: tabular-nums; }
  .ob-scan .v.wait { color: var(--ink-subtle); font-weight: 400; }
  .ob-scan .ic { width: 20px; height: 20px; flex: none; display: grid; place-items: center; }
  .ob-done { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; font-size: 16px; font-weight: 600; color: var(--positive); }
  .ob-done .dot { width: 24px; height: 24px; border-radius: 50%; background: var(--positive); color: #fff; display: grid; place-items: center; }
  .scan-cards { display: flex; flex-direction: column; gap: 0; margin: 0 0 20px; border-top: 1px solid var(--line); }
  .scan-card { display: grid; grid-template-columns: 72px 1fr; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--line); }
  .scan-num { font-size: 18px; font-weight: 600; color: var(--iris); font-variant-numeric: tabular-nums; }
  .scan-label { font-size: 15px; font-weight: 600; color: var(--ink); }
  .scan-sub { font-size: 14px; color: var(--ink-muted); }

  /* ── Google row ── */
  .ob-google { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
  .ob-google b { display: block; font-size: 16px; font-weight: 600; }
  .ob-google span { font-size: 14px; color: var(--ink-muted); }
  .ob-connected { margin-left: auto; font-size: 14px; font-weight: 600; color: var(--positive); display: inline-flex; align-items: center; gap: 6px; }
  .ob-facts { list-style: none; margin: 0 0 20px; padding: 0; display: flex; flex-direction: column; gap: 8px; }
  .ob-facts li { font-size: 15px; line-height: 1.55; color: var(--ink-muted); }

  /* ── terms checkbox (the global input rule erases native checkboxes) ── */
  .ob .tos-row { display: flex; align-items: flex-start; gap: 10px; margin: 4px 0 18px; font-size: 14px; line-height: 1.55; color: var(--ink-muted); cursor: pointer; font-weight: 400; }
  .ob .tos-row input[type="checkbox"] {
    appearance: auto; -webkit-appearance: auto; width: 16px; height: 16px; flex: none;
    margin-top: 3px; padding: 0; border: none; border-radius: 0; box-shadow: none; accent-color: var(--iris); cursor: pointer;
  }
  .ob .tos-row input[type="checkbox"]:focus-visible { outline: 2px solid var(--iris); outline-offset: 2px; }
  .tos-row a { color: var(--ink); text-decoration: underline; text-underline-offset: 2px; }
  .ob-works { margin: -4px 0 18px; font-size: 14px; color: var(--ink-muted); }

  /* ── footer line ── */
  .ob-foot { border-top: 1px solid var(--line); padding: 18px 32px; display: flex; flex-wrap: wrap; gap: 6px 20px; font-size: 14px; color: var(--ink-muted); }
  .ob-foot a { color: var(--ink-muted); }
  .ob-foot a:hover { color: var(--ink); }

  @media (max-width: 640px) {
    .ob-head { height: auto; min-height: 64px; padding-top: 10px; padding-bottom: 10px; flex-wrap: wrap; }
    .ob-who { font-size: 13px; text-align: left; }
    .ob-head, .ob-foot { padding-left: 20px; padding-right: 20px; }
    .ob-prog ol { padding: 0 20px; gap: 14px; overflow-x: auto; }
    .ob-prog li .t { display: none; }
    .ob-prog li[data-state="current"] .t { display: inline; }
    .ob-form { padding: 36px 20px 48px; }
    .panel-title { font-size: 28px; }
  }
`;

// ─────────────────────────────────────────────────────────
// UTILITY COMPONENTS
// ─────────────────────────────────────────────────────────

function CheckIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

/** The step heading, with Back beside it rather than floating in a corner. */
function StepTitle({ title, onBack, children }: { title: string; onBack?: () => void; children?: React.ReactNode }) {
  return (
    <div className="panel-header">
      {children}
      <div className="ob-title-row">
        {onBack ? (
          <button type="button" className="ob-back" onClick={onBack} aria-label="Back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        ) : null}
        <h1 className="panel-title">{title}</h1>
      </div>
    </div>
  );
}

/** A masked field with a Show/Hide toggle. */
function SecretInput({
  id,
  value,
  onChange,
  autoComplete,
  autoFocus,
  onEnter,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  autoFocus?: boolean;
  onEnter?: () => void;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="ob-pw">
      <input
        id={id}
        type={shown ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        spellCheck={false}
        onKeyDown={onEnter ? (e) => { if (e.key === "Enter") onEnter(); } : undefined}
      />
      <button
        type="button"
        className="ob-pw-toggle"
        onClick={() => setShown((v) => !v)}
        aria-controls={id}
        aria-pressed={shown}
      >
        {shown ? "Hide" : "Show"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 1: SECURE ACCOUNT (email + OTP + company + segmentation)
// ─────────────────────────────────────────────────────────

interface Profile {
  email: string;
  name: string;
  doors: string;
}

function StepIdentify({
  initial,
  onProfile,
  onVerified,
  resumedSession = false,
}: {
  initial: Profile;
  onProfile: (p: Profile) => void;
  // ⚠ Returns a promise and THROWS on failure. It used to swallow the error
  // into an `alert()`, which left this step with no way to tell that the
  // workspace half had failed while the password half had succeeded.
  //
  // ⚠ The token is OPTIONAL because the magic-link door has no `verifyOtp`
  // result to hand over — it arrives already signed in. `bootstrapWorkspace`
  // has always accepted `undefined` and fallen back to the persisted session
  // (that is how the old resume path called it), so this widens a signature
  // rather than adding a code path.
  onVerified: (email: string, accessToken: string | undefined) => Promise<void>;
  /**
   * This browser came back from the emailed LINK rather than typing the code,
   * so it is already signed in and has never been asked for a password.
   *
   * ⚠ Without this, the link door skipped the password screen entirely and
   * produced an account that could not sign in at app.occupella.com — the app is
   * password-only. Supabase's OTP email carries both a code and a link, so
   * this is not an edge case; it is half the people who read the email.
   */
  resumedSession?: boolean;
}) {
  const [email, setEmail] = useState(initial.email);
  const [name, setName] = useState(initial.name);
  const [doors, setDoors] = useState(initial.doors);
  const [sent, setSent] = useState(false);
  // ToS acceptance — REQUIRED here now: the wizard is the ONE front door
  // (founder decision 2026-08-20; the app's signup + its checkbox are
  // gone). Recorded on the new user via signInWithOtp options.data.
  const [agreed, setAgreed] = useState(false);
  // After the code verifies, the user SETS A PASSWORD before continuing —
  // OTP-created users are otherwise passwordless and could never sign in
  // at app.occupella.com (password-only). Same decision, same date.
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null);
  /**
   * ⚠ ONE name for "show the password screen", because there are TWO ways to
   * earn it and the defect was that only one of them counted. A freshly
   * verified code gives a token; the emailed link gives a live session and no
   * token at all. Every place that used to test `verifiedToken` — the heading,
   * the render branch, the submit guard — reads this instead, so a future
   * fourth door cannot satisfy some of them and not others.
   */
  const needsPassword = Boolean(verifiedToken) || resumedSession;
  const [password, setPassword] = useState("");
  // ⚠ Remembers that `updateUser` already landed, so a retry after a FAILED
  // workspace bootstrap does not re-send the password and collect GoTrue's
  // "must be different from the old password". Survives only this render —
  // `isSamePasswordError` is the half that covers a page reload.
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Resend: Supabase rate-limits OTP sends (~60s), so gate resends behind a
  // cooldown countdown to avoid a rejected-for-spamming error.
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMsg, setResendMsg] = useState("");

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const ready = email.includes("@") && name.trim().length > 0 && agreed;

  const sendCode = async () => {
    if (!ready) return;
    // Persist the profile BEFORE the OTP round-trip so a magic-link
    // redirect (full SPA reload) resumes with the company name intact.
    onProfile({ email, name: name.trim(), doors });
    setLoading(true);
    setError("");
    const { error: e } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + "/start",
        // Versioned ToS acceptance trail, recorded at account creation
        // (mirrors what the app's old signup checkbox recorded).
        data: { tos_version: TOS_VERSION, tos_accepted_at: new Date().toISOString() },
      },
    });
    setLoading(false);
    if (e) { setError(e.message); return; }
    setSent(true);
    setResendCooldown(45);
  };

  const resendCode = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    setError("");
    setResendMsg("");
    const { error: e } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + "/start",
        data: { tos_version: TOS_VERSION, tos_accepted_at: new Date().toISOString() },
      },
    });
    setLoading(false);
    if (e) { setError(e.message); return; }
    setResendMsg("A new code is on its way. Check your spam folder too.");
    setResendCooldown(45);
  };

  const handleOtpChange = (i: number, val: string) => {
    // ⚠ Several digits at once is a paste or the phone's one-time-code
    // autofill landing in one box: spread them across the row instead of
    // keeping the last digit, which is what the single-box rule did.
    const digits = val.replace(/\D/g, "");
    if (digits.length > 1) {
      fillOtp(digits, i);
      return;
    }
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) {
      document.getElementById(`otp-${i + 1}`)?.focus();
    }
  };

  const fillOtp = (digits: string, from = 0) => {
    const next = [...otp];
    for (let k = 0; k < digits.length && from + k < 6; k++) next[from + k] = digits[k];
    setOtp(next);
    const last = Math.min(from + digits.length, 6) - 1;
    document.getElementById(`otp-${Math.min(last + 1, 5)}`)?.focus();
  };

  const verifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== 6) return;
    setLoading(true);
    setError("");
    const { data, error: e } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    setLoading(false);
    if (e || !data.session) { setError("That code didn't match. Check it, or resend a new one."); return; }
    setVerifiedToken(data.session.access_token);
  };

  const savePassword = async () => {
    // ⚠ **`meetsRequirements`, not `password.length < 8`, and the Enter key is
    // why.** The field's `onKeyDown` calls this directly, so the disabled
    // button gates nothing for anybody who types their password and presses
    // Enter — which is most people. Left as a length check, the new checklist
    // would sit on screen with two boxes unticked while the submit went
    // through anyway: a bar that is shown and not enforced, which is worse
    // than no bar because it is a promise the product breaks in front of you.
    if (!needsPassword || loading) return;
    // ⚠ **A refusal nobody can perceive is indistinguishable from a send.**
    // The button is disabled, but the field's onKeyDown calls this directly,
    // so anyone who types a password and presses Enter — most people — hit a
    // bare `return` and got nothing: no error, no movement, no clue which of
    // the three rules was unmet. Say it (gotcha 44's rule, one repo over).
    const blocker = firstUnmet(password);
    if (blocker) { setError(blocker); return; }
    setLoading(true);
    setError("");

    // ⚠ **Setting the password and building the workspace are TWO operations,
    // and only the second one can fail retryably.** The founder hit this on
    // 2026-09-09: `updateUser` succeeded, `onVerified` → `bootstrapWorkspace`
    // then failed ("Failed to fetch"), the screen stayed on this step, and the
    // retry re-submitted the SAME password — which GoTrue refuses with "New
    // password should be different from the old password". The account existed,
    // the password was set, and the only way forward was to invent a different
    // password. A retry must not re-run a step that already succeeded.
    if (!passwordSaved) {
      const { error: e } = await supabase.auth.updateUser({ password });
      if (e && !isSamePasswordError(e)) {
        setLoading(false);
        setError(e.message);
        return;
      }
      // ⚠ `same_password` is treated as SUCCESS, and that is the whole fix
      // for a reloaded page: the flag above is gone after a refresh, but the
      // account still has this password. The user asked for their password to
      // be X and it is X — the end state they wanted already holds, so
      // reporting it as an error blocks them on a step that is done.
      setPasswordSaved(true);
    }

    try {
      await onVerified(email, verifiedToken ?? undefined);
    } catch (err) {
      // ⚠ Inline, not `alert()`. This panel already renders errors, and the
      // step is now RESUMABLE — saying so is the difference between "try
      // again" and "your account is broken". The password is not re-sent.
      setError(err instanceof Error ? err.message : "Could not finish setting up your workspace.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel" key="identify">
      {/* ⚠ Only the CODE step keeps a description, and it carries a FACT the
          screen does not otherwise have: which address the code went to. The
          account screen's line is the offer (founder brief, 2026-09-29). */}
      <StepTitle
        title={needsPassword ? "Create your password" : sent ? "Check your email" : "Create your account"}
        onBack={sent && !needsPassword ? () => { setSent(false); setResendMsg(""); setOtp(["", "", "", "", "", ""]); } : undefined}
      />
      {!sent && !needsPassword ? <p className="ob-sub" style={{ marginTop: -18, marginBottom: 28 }}>14 days free, no card.</p> : null}
      {sent && !needsPassword ? (
        <p className="panel-desc" style={{ marginTop: -18, marginBottom: 24 }}>
          We sent a 6-digit code to <b>{email}</b>.
        </p>
      ) : null}

      {needsPassword ? (
        <>
          <div className="field">
            <label htmlFor="ob-password">Password</label>
            <SecretInput
              id="ob-password"
              value={password}
              onChange={(v) => { setPassword(v); setError(""); }}
              autoComplete="new-password"
              autoFocus
              onEnter={savePassword}
            />
            <PasswordRules password={password} />
          </div>
          {error && <div className="test-result error" role="alert">{error}</div>}
          {/* ⚠ `meetsRequirements`, not `length < 8`. The checklist is the bar
              somebody can SEE, so the button gates on the same predicate.
              `savePassword` keeps its own floor: a disabled button is the
              explanation, never the enforcement. */}
          <button className="btn btn-primary wide" onClick={savePassword} disabled={!meetsRequirements(password) || loading}>
            {loading ? <><span className="spinner" /> Saving</> : "Continue"}
          </button>
        </>
      ) : !sent ? (
        <>
          <div className="field">
            <label htmlFor="ob-email">Work email</label>
            <input
              id="ob-email"
              type="email"
              placeholder="you@yourcompany.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              autoComplete="email"
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="ob-company">Company name</label>
            <input
              id="ob-company"
              type="text"
              placeholder="Acme Property Management"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="organization"
            />
          </div>
          <div className="field">
            <label htmlFor="ob-doors">Doors under management</label>
            <select id="ob-doors" value={doors} onChange={(e) => setDoors(e.target.value)}>
              <option value="">Choose a range</option>
              {DOORS_OPTIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <label className="tos-row">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              aria-label="Agree to the Terms of Service and Privacy Policy"
            />
            <span>
              I agree to the <a href={TERMS_URL} target="_blank" rel="noreferrer">Terms of Service</a> and{" "}
              <a href={PRIVACY_URL} target="_blank" rel="noreferrer">Privacy Policy</a>.
            </span>
          </label>
          {error && <div className="test-result error" role="alert">{error}</div>}
          <button className="btn btn-primary wide" onClick={sendCode} disabled={!ready || loading}>
            {loading ? <><span className="spinner" /> Sending</> : "Send code"}
          </button>
          <div className="ob-alts">
            <a className="ob-alt" href={APP_URL}>Already have an account? Sign in</a>
          </div>
        </>
      ) : (
        <>
          <div className="otp-row" role="group" aria-label="6-digit code">
            {otp.map((d, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                className="otp-box"
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                aria-label={`Digit ${i + 1}`}
                value={d}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onPaste={(e) => {
                  const digits = e.clipboardData.getData("text").replace(/\D/g, "");
                  if (!digits) return;
                  e.preventDefault();
                  fillOtp(digits, 0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !d && i > 0) {
                    document.getElementById(`otp-${i - 1}`)?.focus();
                  }
                  if (e.key === "Enter") verifyOtp();
                }}
                autoFocus={i === 0}
              />
            ))}
          </div>
          {error && <div className="test-result error" role="alert">{error}</div>}
          {resendMsg && !error && <div className="test-result success" role="status">{resendMsg}</div>}
          <button className="btn btn-primary wide" onClick={verifyOtp} disabled={otp.join("").length !== 6 || loading}>
            {loading ? <><span className="spinner" /> Checking</> : "Continue"}
          </button>
          <div className="ob-alts">
            <button type="button" className="ob-alt" onClick={resendCode} disabled={resendCooldown > 0 || loading}>
              {resendCooldown > 0 ? `Resend the code in ${resendCooldown}s` : "Resend the code"}
            </button>
            <button type="button" className="ob-alt" onClick={() => { setSent(false); setResendMsg(""); }}>
              Use a different email
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// FINISH: INTO THE APP, SIGNED IN
// ─────────────────────────────────────────────────────────

function StepFinish({ workspace }: { workspace: WorkspaceData }) {
  const [appHref, setAppHref] = useState(APP_URL);

  // Setup is done — hand the user to the app SIGNED IN, not at its login
  // form. The app is a different origin, so its Supabase client can't see
  // the wizard's session; it is, however, created with
  // ``detectSessionInUrl: true``, so an implicit-grant-shaped URL fragment
  // signs the user straight in (the exact mechanism its own Google OAuth
  // return uses) and supabase-js scrubs the tokens from the URL on load.
  // Fragments never reach any server. Short delay so the screen registers;
  // the primary button remains for anyone who clicks first.
  useEffect(() => {
    let cancelled = false;
    let t: number | undefined;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      let url = APP_URL;
      if (session?.access_token && session.refresh_token) {
        const frag = new URLSearchParams({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_in: String(session.expires_in ?? 3600),
          token_type: session.token_type || "bearer",
        });
        if (session.expires_at) frag.set("expires_at", String(session.expires_at));
        url = `${APP_URL}/#${frag.toString()}`;
      }
      setAppHref(url);
      t = window.setTimeout(() => {
        releaseSessionForHandOff();
        window.location.assign(url);
      }, 6000);
    });
    return () => {
      cancelled = true;
      if (t) clearTimeout(t);
    };
  }, []);

  return (
    <div className="panel" key="finish">
      <StepTitle title={`${workspace.name || "Your workspace"} is ready`} />
      <p className="panel-desc" style={{ marginTop: -18, marginBottom: 24 }}>
        Opening Occupella. The Getting started checklist there walks you through the rest: your first
        question, Gmail and inviting your team.
      </p>
      <a className="btn btn-primary wide" href={appHref} onClick={() => releaseSessionForHandOff()}>
        Open Occupella
      </a>
      <div className="ob-alts">
        <a className="ob-alt" href="mailto:team@occupella.com?subject=15-minute%20setup%20help">Book 15 minutes of setup help</a>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SHELL: HEADER, PROGRESS, SIDE PANEL, FOOTER
// ─────────────────────────────────────────────────────────

/** The steps a visitor sees, and which internal step each covers. */
const PROGRESS: { label: string; steps: Step[] }[] = [
  { label: "Account", steps: ["identify"] },
  { label: "Open Occupella", steps: ["finish"] },
];

function Progress({ step, completed }: { step: Step; completed: Set<Step> }) {
  const current = PROGRESS.findIndex((g) => g.steps.includes(step));
  return (
    <nav className="ob-prog" aria-label="Setup progress">
      <ol>
        {PROGRESS.map((g, i) => {
          const done = g.steps.every((st) => completed.has(st));
          const state = i === current ? "current" : done ? "done" : "todo";
          return (
            <li key={g.label} data-state={state} aria-current={i === current ? "step" : undefined}>
              <span className="n">{state === "done" ? <CheckIcon size={11} /> : i + 1}</span>
              <span className="t">{g.label}</span>
              {state === "done" ? <span className="ob-sr"> (done)</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** The pale blue panel: one product crop per step and what happens next. */
const SIDE: Record<Step, { crop: () => React.ReactElement; next: string }> = {
  identify: {
    crop: () => <WorkOrderCard />,
    next: "Next, Occupella opens with a Getting started checklist for the rest of your setup.",
  },
  finish: {
    crop: () => <DraftCrop />,
    next: "In the app, each event comes with a drafted next step you can edit.",
  },
};

function SidePanel({ step }: { step: Step }) {
  const side = SIDE[step];
  return (
    <aside className="ob-side" aria-label="What happens next">
      <div className="ob-side-in">
        {side.crop()}
        <p className="ob-side-next">{side.next}</p>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────

export default function App() {
  // ⚠ Only the in-flight profile is hydrated (see persist.ts). Step and
  // completion ALWAYS start fresh: the flow is five minutes long, so restoring
  // a half-finished one buys nothing and costs anyone making a second account
  // on the same device a wizard pre-filled from the first.
  const [persisted] = useState(loadWizard);
  const [step, setStep] = useState<Step>("identify");
  const [completed, setCompleted] = useState<Set<Step>>(new Set());
  const [workspace, setWorkspace] = useState<WorkspaceData>(
    persisted.workspace || { name: "", slug: "" },
  );
  const [userEmail, setUserEmail] = useState(persisted.userEmail || "");
  const [doors, setDoors] = useState(persisted.doors || "");
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const didResume = useRef(false);
  // See persist.ts: true only between "send me a code" and step 1 completing.
  const [awaitingLink, setAwaitingLink] = useState(Boolean(persisted.awaitingLink));
  // ⚠ Set ONLY by the magic-link continuation, and deliberately NOT persisted:
  // it describes this page load, not the attempt. Written to storage it would
  // survive a sign-out and open a password screen for a session that no longer
  // exists — `updateUser` would then fail with something about auth, on a
  // screen that says nothing about signing in.
  const [awaitingPassword, setAwaitingPassword] = useState(false);
  // ⚠ A session was found and this is NOT the magic-link continuation, so the
  // wizard STOPS and asks instead of silently carrying somebody back into the
  // account they already made. Holds the email so the question can name it.
  const [returningAs, setReturningAs] = useState<string | null>(null);
  // ⚠ Whether Supabase holds a session, which is what "Signed in as" means.
  // `userEmail` is set the moment the account form is sent, BEFORE the code
  // is verified, so it cannot be the test (the old sidebar used it and said
  // "Signed in" on the code screen).
  const [signedIn, setSignedIn] = useState(false);

  const complete = (s: Step) => setCompleted((prev) => new Set([...prev, s]));

  // One wizard_step_viewed per step shown. The ref keeps StrictMode's
  // double-run effect (dev only) and any re-render from counting twice.
  const lastViewed = useRef<Step | null>(null);
  useEffect(() => {
    if (lastViewed.current === step) return;
    lastViewed.current = step;
    captureWizard("wizard_step_viewed", { step });
  }, [step]);

  // ⚠ The in-flight profile only, so the magic-link reload can finish the
  // attempt it interrupted. Progress is deliberately NOT written — see
  // persist.ts for why a five-minute flow should not be resumable.
  useEffect(() => {
    saveWizard({ workspace, userEmail, doors, awaitingLink });
  }, [workspace, userEmail, doors, awaitingLink]);

  // Idempotently create the company + apply the workspace name. Shared by the
  // inline-OTP path (explicit token) and the magic-link resume path
  // (persisted session, no token needed). /auth/bootstrap is idempotent.
  const bootstrapWorkspace = useCallback(
    async (token: string | undefined, name: string): Promise<string> => {
      const data = await apiJson<{ company_id: string }>("/api/v1/auth/bootstrap", {
        method: "POST",
        ...(token ? { token } : {}),
      });
      if (name.trim()) {
        await apiFetch("/api/v1/company", {
          method: "PATCH",
          ...(token ? { token } : {}),
          body: JSON.stringify({ name: name.trim() }),
        });
      }
      return data.company_id;
    },
    [],
  );

  /**
   * Finish step 1 against a session belonging to an ESTABLISHED account.
   *
   * ⚠ **This used to be shared with the magic-link continuation, and that is
   * exactly what the password bug was.** The old docstring said "two callers,
   * one definition, so the automatic path and the chosen path cannot drift" —
   * true of everything except the one thing that mattered. A magic-link
   * arrival is an account created MINUTES AGO that has never been asked for a
   * password; this caller is somebody coming back to an account they already
   * finished. Running one code path for both meant the new account skipped the
   * password step and could not then sign in at app.occupella.com.
   *
   * So the split is the fix, not a regression of the old comment's intent: the
   * continuation goes to `collect-password` and reaches `handleVerified` — the
   * SAME tail the code path uses — while this stays the returning-visitor
   * answer to the gate below.
   *
   * ⚠ Residual, stated rather than papered over: an account created through
   * the link BEFORE this fix is still passwordless, and "Continue with this
   * account" carries it forward without asking. Demanding a password here
   * would charge every returning visitor for that small cohort — and anyone
   * who already has one would have to type it exactly, or silently change it.
   * They recover through the app's "Forgot password", which works.
   */
  const resumeInto = useCallback(
    async (email: string) => {
      setUserEmail(email);
      setReturningAs(null);
      setCreatingWorkspace(true);
      try {
        const companyId = await bootstrapWorkspace(undefined, workspace.name);
        setAwaitingLink(false);
        complete("identify");
        setWorkspace((prev) => ({ ...prev, id: companyId }));
        complete("finish");
        setStep("finish");
      } catch (e: any) {
        alert(e.message || "Failed to restore your workspace session");
      } finally {
        setCreatingWorkspace(false);
      }
    },
    // Reads the mount snapshot of `workspace.name` deliberately — this is a
    // one-shot resume, not a live subscription to the name field.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bootstrapWorkspace],
  );

  // Recover an existing session on load (e.g. after a magic-link redirect,
  // which reloads the SPA). The inline-OTP path runs handleVerified itself
  // and marks 'identify' done; this effect decides what a session found on
  // load means — see `lib/resume.ts`, which owns the decision.
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active || !session?.user) return;
      setSignedIn(true);
      setUserEmail(session.user.email || "");

      // ⚠ **A live session is not permission to continue, and it is not proof
      // of a password either.** This effect used to bootstrap on ANY session,
      // so clicking "Start setup" a week later ran the same code path as
      // coming back from a magic link (founder report, 2026-09-09) — which the
      // `awaitingLink` marker fixed. What the marker did NOT fix: the
      // continuation then skipped step 1's password screen entirely, because
      // it went straight to bootstrap. Both questions are answered in one
      // place now, so a third caller cannot answer either differently.
      const action = resumeAction({
        hasSession: true,
        alreadyResumed: didResume.current,
        identifyComplete: completed.has("identify"),
        awaitingLink,
      });
      if (action === "ignore") return;
      didResume.current = true;

      if (action === "ask-which-account") {
        setReturningAs(session.user.email || "your account");
        return;
      }

      // A magic-link continuation. Hand it to the SAME screen the emailed code
      // reaches instead of bootstrapping here: `savePassword` runs
      // `updateUser({ password })` against this live session and then calls
      // `handleVerified`, which is the one place step 1 is marked complete.
      setAwaitingPassword(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.user));
      if (session?.user) setUserEmail(session.user.email || "");
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
    // Reads the hydrated mount snapshot intentionally; resume is a one-shot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Sign out, forget the in-flight profile, and start from a blank wizard.
   *
   * ⚠ **A hard reload, not a state reset.** The Supabase client caches the
   * session in memory as well as in storage, the resume effect is a one-shot
   * guarded by a ref, and half a dozen step components hold their own state —
   * so clearing React state would leave a signed-out wizard still holding the
   * previous account's session object. Reloading is the only version of this
   * that is obviously correct, and it costs one page load on an action
   * somebody takes at most once.
   */
  const startOver = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Already signed out, or offline. The local clear below is what matters.
    }
    // ⚠ clearWizard() drops the marker with the profile. Left behind, the
    // fresh wizard would read "a magic link is coming" and auto-resume the
    // account the person just signed out of.
    clearWizard();
    window.location.assign("/start");
  }, []);

  const handleProfile = (p: { email: string; name: string; doors: string }) => {
    // ⚠ Called by `sendCode` immediately before the code goes out — the exact
    // moment an attempt begins, and the only point at which "a magic link is
    // coming back to this browser" becomes true.
    setAwaitingLink(true);
    setUserEmail(p.email);
    setDoors(p.doors);
    setWorkspace((prev) => ({
      ...prev,
      name: p.name,
      slug: p.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    }));
  };

  // ⚠ THROWS rather than alerting. `StepIdentify` renders the failure inline
  // and — crucially — keeps its `passwordSaved` flag, so the retry re-runs
  // only the half that failed. Swallowing this into an `alert()` is what made
  // a transient backend blip look like a broken account (2026-09-09).
  const handleVerified = async (email: string, accessToken: string | undefined) => {
    setUserEmail(email);
    // Token passed explicitly — right after verifyOtp the persisted session
    // may not be readable yet.
    setCreatingWorkspace(true);
    try {
      const companyId = await bootstrapWorkspace(accessToken, workspace.name);
      // ⚠ The attempt is FINISHED. Leaving this true is what would make the
      // next visit auto-resume again — the marker has to close the window it
      // opened, or it is just the old always-resume behaviour with a flag.
      setAwaitingLink(false);
      complete("identify");
      // The range label only (DOORS_OPTIONS), never the email or the name.
      captureWizard("wizard_account_created", { doors: doors || "not_given" });
      setWorkspace((prev) => ({ ...prev, id: companyId }));
      // Straight into the app: the rest of setup is its Getting started checklist.
      complete("finish");
      setStep("finish");
    } finally {
      setCreatingWorkspace(false);
    }
  };

  const sideStep: Step = returningAs || creatingWorkspace ? "identify" : step;

  return (
    <div className="ob">
      <style>{css}</style>
      <style>{cropCss}</style>
      <header className="ob-head">
        <Wordmark className="ob-word" />
        {/* ⚠ The ONE thing that lets somebody set up a second account on the
            same machine: the Supabase session persists, so without this a
            returning visitor is carried back into the account they already
            made with nothing to click (founder report, 2026-09-09). Shown
            only when a session actually exists. */}
        {signedIn && userEmail ? (
          <span className="ob-who">
            Signed in as <b>{userEmail}</b> ·{" "}
            <button type="button" className="ob-alt" onClick={startOver}>Use a different account</button>
          </span>
        ) : null}
      </header>
      <Progress step={step} completed={completed} />

      <main className="ob-main">
          <section className="ob-form">
            {/* ⚠ Stands IN FRONT of step 1 whenever a session was found that
                is not a magic-link continuation: two states used to run the
                same code silently, so now they are two buttons. */}
            {returningAs && !creatingWorkspace ? (
              <div className="panel" key="returning">
                <StepTitle title="You're already signed in" />
                {/* The address goes in the description, not the heading: an
                    email is long and unbreakable at display size. */}
                <p className="panel-desc" style={{ marginTop: -18, marginBottom: 24 }}>
                  This browser is signed in as <b>{returningAs}</b>. Carry on with that account, or sign
                  out and set up a different one.
                </p>
                <button className="btn btn-primary wide" onClick={() => resumeInto(returningAs)}>
                  Continue with this account
                </button>
                <div className="ob-alts">
                  <button type="button" className="ob-alt" onClick={startOver}>Set up a different account</button>
                </div>
              </div>
            ) : step === "identify" && !creatingWorkspace ? (
              <StepIdentify
                // ⚠ Keyed on the resumed email so a magic-link arrival
                // REMOUNTS with the address the session actually carries; the
                // component reads `initial` once, at mount.
                key={awaitingPassword ? `resumed:${userEmail}` : "fresh"}
                initial={{ email: userEmail, name: workspace.name, doors }}
                onProfile={handleProfile}
                onVerified={handleVerified}
                resumedSession={awaitingPassword}
              />
            ) : null}
            {creatingWorkspace && (
              <div className="panel">
                <StepTitle title="Setting up your workspace" />
                <p className="panel-desc" style={{ marginTop: -18 }}>
                  <span className="spinner accent" /> Creating {workspace.name || "your workspace"}.
                </p>
              </div>
            )}
            {step === "finish" && <StepFinish workspace={workspace} />}
          </section>
          <SidePanel step={sideStep} />
        </main>

      <footer className="ob-foot">
        <span>
          <a href={TERMS_URL} target="_blank" rel="noreferrer">Terms</a> ·{" "}
          <a href={PRIVACY_URL} target="_blank" rel="noreferrer">Privacy</a>
        </span>
        {/* Legal-entity attribution (A2P/Twilio verification crawls read it). */}
        <span>Operated by Oscar Ventures LLC.</span>
        <span>
          Stuck on a step? Email <a href="mailto:team@occupella.com">team@occupella.com</a>.
        </span>
      </footer>
    </div>
  );
}
