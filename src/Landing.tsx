import { useEffect, useRef, useState } from "react";
import Mark from "./Mark";
import { APP_URL } from "./lib/api";
import { loadWizard } from "./lib/persist";
import {
  type DesktopBuild,
  type OS,
  detectOS,
  fetchDesktopBuilds,
  formatSize,
} from "./lib/download";

// ─────────────────────────────────────────────────────────────────────
// LANDING — the front door.
//
// Built to a measured spec rather than a vibe (research pass 2026-08-19,
// against Linear / Vercel / Ramp / Cursor / Warp production frontends):
//
//   · Type — weight ceiling 600, negative tracking scaled to size
//     (-0.036em display → 0 at body), display line-height 1.05 against
//     body 1.5, POSITIVE tracking on the small caps eyebrow.
//   · Depth — surface ladder + 1px hairlines. One soft shadow, on the
//     product panel only. No glassmorphism, no gradient fills, one
//     chromatic accent (--iris) and nothing else.
//   · Motion — ONE choreographed entrance (4 elements, 200ms stagger,
//     translateY(-10px): content settles DOWN into place, it doesn't
//     fly up); the product panel tilts up once at threshold 0.4; below
//     the fold, 12px reveals on headers and cards only — never on
//     paragraphs, never re-triggered. Hover changes background or
//     hairline, never scale.
//   · Copy — sentence case, terminal period, ≤8-word headline, concrete
//     nouns, no adjectives.
//
// Everything shown ships today; the screenshots are captures of the real
// app, not mockups.
// ─────────────────────────────────────────────────────────────────────

const css = `
  .lp { position: relative; overflow-x: clip; }
  .lp-wrap { max-width: 1120px; margin: 0 auto; padding: 0 32px; }

  /* ── type scale ── */
  .lp-h1 {
    font-size: clamp(38px, 6.2vw, 76px);
    font-weight: 600;
    line-height: 1.05;
    letter-spacing: -0.036em;
    text-wrap: balance;
    max-width: 17ch;
    /* Luminance gradient, not a hue gradient — reads as light falling
       across the type rather than as decoration. */
    background: linear-gradient(to right bottom, var(--ink) 34%, rgba(14, 22, 32, 0.58));
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
  }

  .lp-h2 {
    font-size: clamp(28px, 3.4vw, 40px);
    font-weight: 600;
    line-height: 1.15;
    letter-spacing: -0.026em;
    color: var(--ink);
    text-wrap: balance;
    max-width: 20ch;
  }

  .lp-eyebrow {
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-faint);
  }

  /* ── rotating hero word ────────────────────────────────────────────
     Five things Occupella actually does, cycling under a fixed line.

     ⚠ It sits ALONE on its own line, and that is load-bearing. The words
     are different widths, so anything sharing the line would be shoved
     sideways every couple of seconds. Alone and left-aligned, the caret
     hugs the word and nothing else moves — which is also why there is no
     width-reservation hack here to go stale.

     ⚠ .lp-h1 paints a luminance gradient through background-clip: text
     with color: transparent, and that clipping covers descendants — so the
     word would render in the headline's grey ramp, not the brand blue.
     -webkit-text-fill-color is what overrides an inherited transparent
     fill; plain color alone does not.

     ⚠ No backticks anywhere in this block. These styles live inside a JS
     template literal, so one backtick in a comment ends the string and the
     file stops parsing several lines later, where nothing looks wrong. */
  /* The live word and an invisible copy of ALL five share one grid cell, so
     the block is always as tall as the tallest state and the height cannot
     move. Measured before adding it: at 390px "resident communication" wraps
     to two lines and the h1 went 120px -> 160px, shoving the lede and the
     buttons down and back on every rotation. Desktop never showed it.

     Height only, deliberately not width — the sizer is in its own grid so it
     contributes the max HEIGHT, while the live row keeps natural width and
     the caret keeps hugging the word. Reserving width instead would park the
     caret far to the right of "leasing".

     Nothing here is a magic number: change a word and the reservation
     re-measures itself. */
  .lp-rotor-line { display: grid; }
  .lp-rotor-line > * { grid-area: 1 / 1; }

  .lp-rotor-sizer { display: grid; visibility: hidden; }
  .lp-rotor-sizer > span { grid-area: 1 / 1; }

  .lp-rotor {
    display: inline-flex;
    align-items: baseline;
    gap: 0.14em;
    justify-self: start;
  }

  .lp-rotor-word {
    color: var(--iris);
    -webkit-text-fill-color: var(--iris);
    /* No entrance animation: the typing is the entrance, and anything keyed
       per render would re-fire on every single character. */
  }

  /* Solid while the letters are moving, blinking only on the pause — which is
     what a real cursor does, and what makes the hold read as deliberate
     rather than as a stall. */
  .lp-rotor-caret {
    width: 0.075em;
    height: 0.78em;
    border-radius: 1px;
    background: var(--iris);
    opacity: 0.85;
  }

  .lp-rotor-caret.is-idle {
    animation: lp-rotor-blink 1.05s steps(1, end) infinite;
  }

  @keyframes lp-rotor-blink {
    0%, 55%  { opacity: 0.85; }
    56%, 99% { opacity: 0; }
  }

  .lp-sr {
    position: absolute;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  .lp-lede {
    font-size: 18px;
    line-height: 1.55;
    letter-spacing: -0.006em;
    color: var(--ink-muted);
    max-width: 54ch;
  }

  .lp-body { font-size: 15.5px; line-height: 1.6; color: var(--ink-muted); max-width: 58ch; }

  /* ── nav ── */
  .lp-nav {
    position: sticky; top: 0; z-index: 20;
    height: 56px;
    display: flex; align-items: center; justify-content: space-between;
    background: rgba(255, 255, 255, 0.86);
    backdrop-filter: saturate(180%) blur(12px);
    border-bottom: 1px solid transparent;
    transition: border-color var(--dur-state) var(--ease-std);
  }
  .lp-nav[data-stuck="true"] { border-bottom-color: var(--line); }
  .lp-nav-inner {
    max-width: 1120px; margin: 0 auto; padding: 0 32px; width: 100%;
    display: flex; align-items: center; justify-content: space-between;
  }
  .lp-wordmark {
    display: inline-flex; align-items: center; gap: 9px;
    font-size: 15px; font-weight: 600; letter-spacing: -0.02em;
    color: var(--ink); text-decoration: none;
  }
  .lp-nav-right { display: flex; align-items: center; gap: 4px; }
  /* Below ~560px the four nav items no longer fit and "Start setup" clips off
     the right edge. Drop the "Desktop app" jump link first — the #get band it
     points at is a full section of the page anyway — and keep sign-in and the
     one CTA that matters. */
  @media (max-width: 560px) {
    .lp-nav-inner { padding: 0 20px; }
    .lp-nav-desktop-link { display: none; }
  }

  /* ── hero ── */
  .lp-hero { padding: clamp(56px, 9vw, 104px) 0 0; }
  .lp-hero-ctas { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
  .lp-textlink {
    font-size: 14.5px; font-weight: 500; color: var(--ink-muted);
    text-decoration: none; transition: color var(--dur-state) var(--ease-std);
  }
  .lp-textlink:hover { color: var(--ink); }
  .lp-note { font-size: 13px; color: var(--ink-subtle); }

  /* ── the entrance: 4 elements, 200ms apart, settling DOWN ── */
  .rise { opacity: 0; transform: translateY(-10px); animation: rise var(--dur-entrance) var(--ease-out) var(--d, 0ms) forwards; }
  @keyframes rise { to { opacity: 1; transform: none; } }

  /* ── product panel ── */
  .lp-stage { position: relative; perspective: 2000px; margin-top: clamp(40px, 6vw, 72px); }
  .lp-stage::before {
    content: ""; position: absolute; inset: 12% 8% 28%;
    background: radial-gradient(ellipse at 50% 40%, var(--iris) 0%, transparent 68%);
    filter: blur(120px); opacity: 0; z-index: 0;
    animation: glow 4100ms 600ms ease-out forwards;
  }
  @keyframes glow {
    0%   { opacity: 0; animation-timing-function: cubic-bezier(0.74, 0.25, 0.76, 1); }
    10%  { opacity: 0.5; animation-timing-function: cubic-bezier(0.12, 0.01, 0.08, 0.99); }
    100% { opacity: 0.16; }
  }
  .lp-panel {
    position: relative; z-index: 1;
    border-radius: var(--r-panel);
    border: 1px solid var(--card-edge);
    background: var(--canvas);
    overflow: hidden;
    box-shadow: 0 1px 2px rgba(14,22,32,0.04), 0 24px 64px -28px rgba(14,22,32,0.28);
    transform: rotateX(22deg);
  }
  .lp-panel[data-in="true"] { animation: tilt 1400ms var(--ease-out) forwards; }
  /* Hold at the tilt, dip, then land flat — the hold is what makes it read
     mechanical rather than floaty. */
  @keyframes tilt {
    0%   { transform: rotateX(22deg); }
    25%  { transform: rotateX(22deg) scale(0.94); }
    60%  { transform: none; }
    100% { transform: none; }
  }
  .lp-panel img { display: block; width: 100%; height: auto; }
  .lp-panel-bar {
    display: flex; align-items: center; gap: 7px;
    padding: 10px 14px; border-bottom: 1px solid var(--line); background: var(--canvas-1);
  }
  .lp-panel-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--line-strong); }
  .lp-panel-url {
    margin-left: 8px; font-family: var(--font-mono); font-size: 11.5px; color: var(--ink-faint);
  }
  .lp-caption { margin-top: 14px; font-size: 13px; color: var(--ink-subtle); text-align: center; }

  /* ── proof strip ── */
  .lp-proof {
    display: flex; flex-wrap: wrap; gap: 10px 28px; justify-content: center;
    padding: clamp(40px, 5vw, 64px) 0 0;
    font-size: 13px; color: var(--ink-subtle);
  }
  .lp-proof span { display: inline-flex; align-items: center; gap: 8px; }
  .lp-proof i { width: 3px; height: 3px; border-radius: 50%; background: var(--iris); opacity: 0.7; }

  /* ── sections ── */
  .lp-section { padding: clamp(64px, 9vw, 96px) 0 0; }
  .lp-section-head { display: flex; flex-direction: column; gap: 14px; }

  /* ── steps: a real sequence, so it's numbered and asymmetric ── */
  .lp-steps { display: grid; gap: 1px; margin-top: 36px; background: var(--line); border: 1px solid var(--line); border-radius: var(--r-lg); overflow: hidden; }
  @media (min-width: 860px) { .lp-steps { grid-template-columns: repeat(3, 1fr); } }
  .lp-step { background: var(--canvas); padding: 24px 22px 26px; }
  .lp-step-n {
    font-family: var(--font-mono); font-size: 11.5px; color: var(--iris);
    letter-spacing: 0.1em;
  }
  .lp-step-t { margin-top: 12px; font-size: 16px; font-weight: 600; letter-spacing: -0.012em; color: var(--ink); }
  .lp-step-b { margin-top: 7px; font-size: 14px; line-height: 1.55; color: var(--ink-muted); }

  /* ── alternating feature bands ── */
  .lp-band { display: grid; gap: clamp(28px, 4vw, 56px); align-items: center; margin-top: 36px; }
  @media (min-width: 900px) { .lp-band { grid-template-columns: 0.85fr 1.15fr; } .lp-band[data-flip="true"] > *:first-child { order: 2; } }
  .lp-shot {
    border-radius: var(--r-lg); border: 1px solid var(--card-edge); overflow: hidden;
    background: var(--canvas); box-shadow: 0 18px 44px -30px rgba(14,22,32,0.35);
  }
  .lp-shot img { display: block; width: 100%; height: auto; }

  /* ── trust ── */
  .lp-trust { display: grid; gap: 1px; margin-top: 32px; background: var(--line); border: 1px solid var(--line); border-radius: var(--r-lg); overflow: hidden; }
  @media (min-width: 760px) { .lp-trust { grid-template-columns: 1fr 1fr; } }
  .lp-trust-item { background: var(--canvas); padding: 18px 20px; display: flex; gap: 12px; align-items: flex-start; font-size: 14px; line-height: 1.5; color: var(--ink-secondary, var(--ink-muted)); }
  .lp-trust-item svg { flex: none; margin-top: 2px; color: var(--iris); }

  /* ── get-it band (web vs desktop) ── */
  .lp-get { display: grid; gap: 16px; margin-top: 36px; }
  @media (min-width: 820px) { .lp-get { grid-template-columns: 1fr 1fr; } }
  .lp-get-card {
    background: var(--canvas); border: 1px solid var(--card-edge); border-radius: var(--r-lg);
    padding: 26px 24px 24px; display: flex; flex-direction: column; gap: 10px;
    transition: border-color var(--dur-state) var(--ease-std), background var(--dur-state) var(--ease-std);
  }
  .lp-get-card:hover { border-color: var(--line-strong); background: var(--canvas-1); }
  .lp-get-k { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-faint); }
  .lp-get-t { font-size: 19px; font-weight: 600; letter-spacing: -0.018em; color: var(--ink); }
  .lp-get-b { font-size: 14px; line-height: 1.55; color: var(--ink-muted); flex: 1; }
  .lp-get-cta { margin-top: 8px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .lp-get-meta { font-size: 12.5px; color: var(--ink-subtle); }
  .lp-alt { font-size: 12.5px; color: var(--ink-subtle); }
  .lp-alt a { color: var(--ink-muted); text-decoration: none; border-bottom: 1px solid var(--line-strong); }
  .lp-alt a:hover { color: var(--ink); }

  /* ── closing band — the one polarity flip on the page ── */
  .lp-close { margin-top: clamp(72px, 10vw, 120px); background: var(--deep); }
  .lp-close-inner {
    max-width: 1120px; margin: 0 auto; padding: clamp(64px, 8vw, 96px) 32px;
    display: flex; flex-direction: column; align-items: flex-start; gap: 18px;
  }
  .lp-close h2 { font-size: clamp(28px, 3.6vw, 42px); font-weight: 600; line-height: 1.1; letter-spacing: -0.03em; color: var(--deep-ink); max-width: 18ch; }
  .lp-close p { font-size: 16px; line-height: 1.55; color: var(--deep-muted); max-width: 52ch; }
  .lp-close .btn-primary { background: var(--canvas); color: var(--deep); }
  .lp-close .btn-primary:hover { background: #E8F0F9; }

  /* ── footer ── */
  .lp-footer { background: var(--deep); border-top: 1px solid var(--deep-line); }
  .lp-footer-inner {
    max-width: 1120px; margin: 0 auto; padding: 40px 32px 56px;
    display: flex; flex-wrap: wrap; gap: 16px 28px; align-items: center;
    font-size: 12.5px; color: var(--deep-muted);
  }
  .lp-footer a { color: var(--deep-muted); text-decoration: none; }
  .lp-footer a:hover { color: var(--deep-ink); }

  /* ── scroll reveals: headers + cards only, 12px, once ── */
  .reveal { opacity: 0; transform: translateY(12px); transition: opacity var(--dur-reveal) var(--ease-out), transform var(--dur-reveal) var(--ease-out); }
  .reveal[data-in="true"] { opacity: 1; transform: none; }

  @media (prefers-reduced-motion: reduce) {
    /* The rotation still happens — the five words ARE the message, and a
       whole-word swap is not a vestibular trigger. What goes is the typing
       and the blink; RotatingWord drops the per-character animation itself,
       because it is driven by state rather than by CSS. */
    .lp-rotor-caret { animation: none !important; opacity: 0.85 !important; }
    .lp-panel { transform: none !important; animation: none !important; }
    .lp-stage::before { opacity: 0.16 !important; animation: none !important; }
  }
`;

// ── rotating hero word ───────────────────────────────────────────────
// "We help Buildium users with ___" — the blank cycling through five
// things the product actually does.
//
// The five are grounded in shipped capability, not aspiration: the
// delinquency + ledger surface, the work-order and task path, the
// email/text/call inbox with drafted replies, the leasing CRM, and the
// consent + confirmation guardrails. A rotator that names a feature the
// product does not have is a promise the first demo breaks.
const ROTATING = [
  "rent collection",
  "maintenance",
  "resident communication",
  "leasing",
  "compliance",
] as const;

//: Long enough to READ, which is the whole point — a rotator fast enough
//: to feel lively is one nobody finishes a word of.
//: Typing beats. Deleting is faster than typing because that is how real
//: typing behaves — same speed both ways reads as a machine, not a person.
const TYPE_MS = 55;
const DELETE_MS = 30;
//: Long enough to READ the finished word. This is the beat that matters: a
//: rotator nobody finishes a word of is decoration.
const HOLD_MS = 1500;
//: A short beat on empty before the next word, so the two do not run together.
const EMPTY_MS = 320;
//: Reduced motion does not type. It swaps whole words on a plain interval.
const REDUCED_SWAP_MS = 2400;

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  } catch {
    return false;
  }
}

function RotatingWord() {
  // `n` is how many characters of ROTATING[w] are on screen. `del` is which
  // direction the next tick moves it.
  const [w, setW] = useState(0);
  const [n, setN] = useState(0);
  const [del, setDel] = useState(false);
  const reduced = prefersReducedMotion();

  useEffect(() => {
    // ⚠ Typing character by character IS motion, so reduced motion gets the
    // whole word and a plain swap. This branch has to live in JS, not CSS:
    // the animation is driven by state here, and a CSS override would leave
    // the letters ticking underneath it.
    if (reduced) {
      const id = window.setInterval(
        () => setW((x) => (x + 1) % ROTATING.length),
        REDUCED_SWAP_MS,
      );
      return () => window.clearInterval(id);
    }

    const word = ROTATING[w];
    let delay: number;
    let step: () => void;

    if (!del && n < word.length) {
      delay = TYPE_MS;
      step = () => setN(n + 1);
    } else if (!del) {
      delay = HOLD_MS; // finished — let it be read
      step = () => setDel(true);
    } else if (n > 0) {
      delay = DELETE_MS;
      step = () => setN(n - 1);
    } else {
      delay = EMPTY_MS; // empty — beat, then the next word
      step = () => {
        setDel(false);
        setW((x) => (x + 1) % ROTATING.length);
      };
    }

    // ⚠ setTimeout re-scheduled per tick, not one setInterval: every phase
    // runs at a different speed, and an interval would need a counter to fake
    // that. It is also why StrictMode's double-mount is harmless — the effect
    // cleans up its own single pending timer.
    const id = window.setTimeout(step, delay);
    return () => window.clearTimeout(id);
  }, [w, n, del, reduced]);

  const shown = reduced ? ROTATING[w] : ROTATING[w].slice(0, n);
  // Solid while the letters move, blinking only when it is waiting — which is
  // what a real cursor does, and what makes the pause read as deliberate
  // rather than as a stall.
  const idle = reduced || (!del && n === ROTATING[w].length);

  return (
    <>
      <span className="lp-rotor-line">
        {/* Sizes the line to the tallest word so a wrap on a narrow screen
            cannot move everything below it. See .lp-rotor-line. */}
        <span className="lp-rotor-sizer" aria-hidden="true">
          {ROTATING.map((word) => (
            <span key={word}>{word}</span>
          ))}
        </span>
        <span className="lp-rotor" aria-hidden="true">
          {/* No `key` and no entrance animation — the typing IS the entrance,
              and a per-render fade would re-fire on every character. */}
          <span className="lp-rotor-word">{shown}</span>
          <span className={idle ? "lp-rotor-caret is-idle" : "lp-rotor-caret"} />
        </span>
      </span>
      {/* A word swapping every 2.4s is churn to a screen reader. The
          animated span is hidden from it and the whole list is read once,
          as the sentence it actually is. */}
      <span className="lp-sr">
        {ROTATING.slice(0, -1).join(", ")}, and {ROTATING[ROTATING.length - 1]}.
      </span>
    </>
  );
}

// ── scroll reveal ────────────────────────────────────────────────────
// threshold 0.25 + triggerOnce: the reveal fires once you have committed to
// looking at the element, and never re-fires. Applied to section heads and
// cards — never to body copy.
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === "undefined") return setSeen(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return (
    <div ref={ref} className="reveal" data-in={seen} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function Icon({ d, size = 15 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const CHECK = "M20 6L9 17l-5-5";
const LOCK = "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z M7 11V7a5 5 0 0 1 10 0v4";
const SHIELD = "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z";
const BELL = "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.7 21a2 2 0 0 1-3.4 0";

const STEPS = [
  {
    n: "01",
    t: "Connect Buildium.",
    b: "One API key, ten minutes. Occupella mirrors your properties, leases, work orders, and contacts — Buildium stays the system of record.",
  },
  {
    n: "02",
    t: "It reads every event.",
    b: "New work order, late payment, lease expiring, tenant email. Occupella pulls the history around it and tells you what it noticed.",
  },
  {
    n: "03",
    t: "You approve the work.",
    b: "It drafts the reply, the work order, the owner update — and holds. Nothing reaches a tenant, an owner, or Buildium until you say so.",
  },
];

const TRUST = [
  { icon: LOCK, text: "Credentials are encrypted at rest — keys are entered once and never shown again." },
  { icon: CHECK, text: "Every write to Buildium or Gmail passes a confirmation gate you can edit before approving." },
  { icon: SHIELD, text: "Company-scoped isolation across data, memory, and files." },
  { icon: BELL, text: "Nothing auto-sends. Drafts wait for a person." },
  { icon: CHECK, text: "Texting is consent-first — recipients opt in themselves, and STOP works instantly." },
  { icon: LOCK, text: "Sensitive identifiers are redacted before anything enters AI memory." },
];

export default function Landing() {
  const [hasProgress, setHasProgress] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [os, setOs] = useState<OS | null>(null);
  const [builds, setBuilds] = useState<Partial<Record<OS, DesktopBuild>>>({});
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelIn, setPanelIn] = useState(false);

  useEffect(() => {
    try {
      const w = loadWizard();
      setHasProgress(Boolean(w.completed && (w.completed as string[]).length > 0));
    } catch {
      /* fresh visitor */
    }
    setOs(detectOS());
    void fetchDesktopBuilds().then(setBuilds);
  }, []);

  // Nav hairline appears only once the page has moved.
  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Product panel tilts up once, at 40% visible.
  useEffect(() => {
    const el = panelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return setPanelIn(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setPanelIn(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const start = hasProgress ? "Resume setup" : "Start setup";
  const mine = os ? builds[os] : undefined;
  const anyBuild = Object.values(builds)[0];
  const others = (Object.keys(builds) as OS[]).filter((k) => k !== os);

  return (
    <div className="lp">
      <style>{css}</style>

      <nav className="lp-nav" data-stuck={stuck}>
        <div className="lp-nav-inner">
          <a className="lp-wordmark" href="/">
            <Mark size={20} />
            Occupella
          </a>
          <div className="lp-nav-right">
            <a className="btn btn-ghost lp-nav-desktop-link" href="#get">Desktop app</a>
            <a className="btn btn-ghost" href={APP_URL}>Sign in</a>
            <a className="btn btn-primary" href="/start" style={{ padding: "8px 16px", fontSize: 13.5 }}>
              {start}
            </a>
          </div>
        </div>
      </nav>

      <header className="lp-hero">
        <div className="lp-wrap">
          <div className="lp-eyebrow rise" style={{ "--d": "0ms" } as React.CSSProperties}>
            For teams running Buildium
          </div>
          <h1 className="lp-h1 rise" style={{ "--d": "200ms", marginTop: 18 } as React.CSSProperties}>
            We help Buildium users with
            <br />
            <RotatingWord />
          </h1>
          <p className="lp-lede rise" style={{ "--d": "400ms", marginTop: 20 } as React.CSSProperties}>
            Buildium keeps the records. Occupella does the work. It reads every Buildium
            event, pulls the history around it, and drafts what comes next — the reply, the
            work order, the owner update. Then it waits for you.
          </p>
          <div className="lp-hero-ctas rise" style={{ "--d": "600ms", marginTop: 30 } as React.CSSProperties}>
            <a className="btn btn-primary" href="/start" style={{ padding: "12px 24px", fontSize: 15 }}>
              {start} →
            </a>
            <a className="lp-textlink" href="#work">See it work</a>
          </div>
          <div className="lp-note rise" style={{ "--d": "600ms", marginTop: 16 } as React.CSSProperties}>
            Ten minutes to connect. Nothing sends without your approval.
          </div>

          <div className="lp-stage" ref={panelRef}>
            <div className="lp-panel" data-in={panelIn}>
              <div className="lp-panel-bar">
                <span className="lp-panel-dot" />
                <span className="lp-panel-dot" />
                <span className="lp-panel-dot" />
                <span className="lp-panel-url">occupella.com</span>
              </div>
              <img
                src="/shots/inbox.png"
                alt="Occupella's inbox: an AC work order triaged, with what Occupella noticed across the unit's history and a drafted tenant reply waiting for approval"
                width={2880}
                height={1800}
                fetchPriority="high"
              />
            </div>
            <div className="lp-caption">
              A real work order — context gathered, reply drafted, waiting on your approval.
            </div>
          </div>

          <div className="lp-proof">
            <span><i />Works on your live Buildium account</span>
            <span><i />No migration, no new system of record</span>
            <span><i />Nothing auto-sends</span>
          </div>
        </div>
      </header>

      <section className="lp-section" id="work">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-section-head">
              <div className="lp-eyebrow">How it works</div>
              <h2 className="lp-h2">From webhook to done, without the busywork.</h2>
            </div>
          </Reveal>
          <Reveal delay={60}>
            <div className="lp-steps">
              {STEPS.map((s) => (
                <div className="lp-step" key={s.n}>
                  <div className="lp-step-n">{s.n}</div>
                  <div className="lp-step-t">{s.t}</div>
                  <div className="lp-step-b">{s.b}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <div className="lp-band">
            <div>
              <Reveal>
                <div className="lp-section-head">
                  <div className="lp-eyebrow">Drafting</div>
                  <h2 className="lp-h2">It writes the email. You pick the tone.</h2>
                  <p className="lp-body">
                    When there is more than one sensible way to answer a tenant, Occupella
                    drafts each one and names the approach. Slide through, edit any word,
                    approve the one you want.
                  </p>
                </div>
              </Reveal>
            </div>
            <Reveal delay={60}>
              <div className="lp-shot">
                <img
                  src="/shots/drafts.png"
                  alt="Three composed reply drafts for a lease renewal, shown as numbered options a manager can slide through"
                  loading="lazy"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <div className="lp-band" data-flip="true">
            <div>
              <Reveal>
                <div className="lp-section-head">
                  <div className="lp-eyebrow">Owner reporting</div>
                  <h2 className="lp-h2">Ask in English. Get the numbers.</h2>
                  <p className="lp-body">
                    Collections, NOI, work-order age, delinquency — pulled from your ledger and
                    rendered, not pasted into a paragraph. Every figure traces back to Buildium.
                  </p>
                </div>
              </Reveal>
            </div>
            <Reveal delay={60}>
              <div className="lp-shot">
                <img
                  src="/shots/report.png"
                  alt="A monthly owner report in Occupella: an NOI trend chart and a portfolio summary card"
                  loading="lazy"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-section-head">
              <div className="lp-eyebrow">Trust</div>
              <h2 className="lp-h2">Careful by construction.</h2>
              <p className="lp-body">
                Occupella acts on your systems, so the defaults are conservative.
              </p>
            </div>
          </Reveal>
          <Reveal delay={60}>
            <div className="lp-trust">
              {TRUST.map((t) => (
                <div className="lp-trust-item" key={t.text}>
                  <Icon d={t.icon} />
                  <span>{t.text}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="lp-section" id="get">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-section-head">
              <div className="lp-eyebrow">Get Occupella</div>
              <h2 className="lp-h2">In your browser, or on your desktop.</h2>
              <p className="lp-body">
                Same account either way. Start in the browser in ten minutes; add the desktop
                app when you want Occupella docked beside the tabs you already work in.
              </p>
            </div>
          </Reveal>
          <Reveal delay={60}>
            <div className="lp-get">
              <div className="lp-get-card">
                <div className="lp-get-k">Web app</div>
                <div className="lp-get-t">Start in the browser</div>
                <div className="lp-get-b">
                  Nothing to install. Connect Buildium, invite your team, and Occupella is
                  working on your account the same afternoon.
                </div>
                <div className="lp-get-cta">
                  <a className="btn btn-primary" href="/start" style={{ padding: "11px 22px" }}>
                    {start} →
                  </a>
                  <span className="lp-get-meta">Free during early access</span>
                </div>
              </div>

              <div className="lp-get-card">
                <div className="lp-get-k">Desktop app</div>
                <div className="lp-get-t">
                  {mine ? `Download for ${mine.os}` : "The Occupella browser"}
                </div>
                <div className="lp-get-b">
                  A browser with Occupella docked beside it — Buildium in one pane, the
                  assistant in the other, on the same page you are already looking at.
                </div>
                <div className="lp-get-cta">
                  {mine ? (
                    <>
                      <a
                        className="btn btn-secondary"
                        href={mine.url}
                        download
                        style={{ padding: "11px 22px" }}
                      >
                        Download for {mine.os}
                      </a>
                      <span className="lp-get-meta">
                        {mine.version && `v${mine.version}`}
                        {mine.size ? ` · ${formatSize(mine.size)}` : ""}
                      </span>
                    </>
                  ) : anyBuild ? (
                    <>
                      <a
                        className="btn btn-secondary"
                        href={anyBuild.url}
                        download
                        style={{ padding: "11px 22px" }}
                      >
                        Download for {anyBuild.os}
                      </a>
                      <span className="lp-get-meta">
                        {anyBuild.version && `v${anyBuild.version}`}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="btn btn-secondary" aria-disabled="true" style={{ padding: "11px 22px", opacity: 0.55, cursor: "default" }}>
                        Desktop app — coming soon
                      </span>
                      <span className="lp-get-meta">Start in the browser today</span>
                    </>
                  )}
                </div>
                {others.length > 0 && (
                  <div className="lp-alt">
                    Also for{" "}
                    {others.map((o, i) => (
                      <span key={o}>
                        {i > 0 && " and "}
                        <a href={builds[o]!.url} download>
                          {o}
                        </a>
                      </span>
                    ))}
                    .
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="lp-close">
        <div className="lp-close-inner">
          <Reveal>
            <h2>Set up in about ten minutes.</h2>
          </Reveal>
          <Reveal delay={60}>
            <p>
              Connect Buildium, watch it triage your first real work order, and decide from
              there. Free during early access.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <a className="btn btn-primary" href="/start" style={{ padding: "13px 28px", fontSize: 15 }}>
              {start} →
            </a>
          </Reveal>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="mailto:team@occupella.com">team@occupella.com</a>
          <span style={{ marginLeft: "auto" }}>Occupella is operated by Oscar Ventures LLC.</span>
        </div>
      </footer>
    </div>
  );
}
