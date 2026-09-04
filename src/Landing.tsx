import { useEffect, useRef, useState } from "react";
import {
  CHECK,
  CloseBand,
  Icon,
  LOCK,
  BELL,
  Reveal,
  SHIELD,
  useStartLabel,
  SiteFooter,
  SiteNav,
  siteCss,
} from "./Site";

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

  /* ── hero ── */
  .lp-hero { padding: clamp(56px, 9vw, 104px) 0 0; }
  .lp-hero-ctas { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
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

  @media (prefers-reduced-motion: reduce) {
    /* The word still TYPES — letters appearing where they will stay move
       nothing, and the setting is about movement. What goes is the blink:
       a looping opacity animation carrying no content, which is exactly
       what this query is for. */
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
// ⚠ This types under prefers-reduced-motion TOO, and that is deliberate.
//
// The first cut dropped the typing and swapped whole words instead. It was
// over-cautious and it cost the feature outright for anyone with the setting
// on — measured: 60 partial-word frames without it, 0 with. Reduced motion
// exists for vestibular triggers: movement across the screen, parallax,
// zoom, spin. Letters appearing where they will stay move nothing; the
// guidance's own recommended substitute for a transition is a cross-fade,
// which is a strictly larger visual change than one character arriving. And
// the fallback was not gentler in any case — twenty-two characters landing
// at once is a bigger jump than one.
//
// What DOES go is the caret blink: a looping opacity animation with no
// content in it, which is the part the setting is actually about.
function RotatingWord() {
  // `n` is how many characters of ROTATING[w] are on screen. `del` is which
  // direction the next tick moves it.
  const [w, setW] = useState(0);
  const [n, setN] = useState(0);
  const [del, setDel] = useState(false);

  useEffect(() => {
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
  }, [w, n, del]);

  const shown = ROTATING[w].slice(0, n);
  // Solid while the letters move, blinking only when it is waiting — which is
  // what a real cursor does, and what makes the pause read as deliberate
  // rather than as a stall.
  const idle = !del && n === ROTATING[w].length;

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

const STEPS = [
  {
    n: "01",
    t: "Connect Buildium.",
    b: "One API key, ten minutes. Occupella mirrors your properties, leases, work orders, and contacts — Buildium stays the system of record.",
  },
  {
    n: "02",
    t: "It reads every event.",
    b: "New work order, late payment, lease expiring. Occupella pulls the history around it and tells you what it noticed.",
  },
  {
    n: "03",
    t: "You approve the work.",
    b: "It drafts the reply, the work order, the owner update — and holds. Nothing reaches a tenant, an owner, or Buildium until you say so.",
  },
];

// ⚠ FOUR here, six on /features. The front door makes the promise; the
// features page is where somebody who wants to check it goes. Repeating the
// full list on both is how a landing page swallows the site it is supposed to
// be the door to.
const TRUST = [
  { icon: BELL, text: "Nothing auto-sends. Every draft waits for a person." },
  { icon: CHECK, text: "Every write to Buildium or Gmail passes a confirmation card you can edit before approving." },
  { icon: SHIELD, text: "One company's data never reaches another's — not in files, not in what it remembers." },
  { icon: LOCK, text: "Credentials are encrypted at rest, entered once and never shown again." },
];

export default function Landing() {
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelIn, setPanelIn] = useState(false);
  const start = useStartLabel();

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

  return (
    <div className="lp">
      <style>{siteCss}</style>
      <style>{css}</style>

      <SiteNav active="home" />

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
            {/* ⚠ The "See it work" text link that sat here was REMOVED by
                explicit founder instruction (2026-09-04), and nothing replaces
                it. The thing it scrolled to is directly below the fold anyway,
                and the nav now carries Features and Pricing as real pages — so
                the hero is one primary action, which is what a hero should be.
                Do not quietly reintroduce a secondary link here. */}
            <a className="btn btn-primary" href="/start" style={{ padding: "12px 24px", fontSize: 15 }}>
              {start} →
            </a>
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
              <h2 className="lp-h2">The part between the event and the reply.</h2>
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
                  <h2 className="lp-h2">Ask it what you'd ask your bookkeeper.</h2>
                  <p className="lp-body">
                    Occupancy, rent roll, what is open and what is owed — read from a synced copy
                    of your account, not pasted into a paragraph. Every figure traces to Buildium.
                  </p>
                </div>
              </Reveal>
            </div>
            {/* ⚠ NOT report.png — see the long note at the same swap in
                Features.tsx. Short version: that image has "Demo mode — no
                email sent." readable in it, shows a chart card that has never
                rendered in production, and leads on NOI, which is implemented
                nowhere. The copy above dropped "NOI" for the same reason. */}
            <Reveal delay={60}>
              <div className="lp-shot">
                <img
                  src="/shots/property.png"
                  alt="A property in Occupella: occupancy, rent roll, open work order count and delinquent balance, above the list of open work orders with their priority and status"
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
              <h2 className="lp-h2">It asks before it acts.</h2>
              <p className="lp-body">
                {/* ⚠ Do NOT put "and texts residents" back. Every SMS path in
                    the product is behind carrier approval that no company has
                    cleared yet, so it is a capability the reader cannot have
                    on the day they read this. Email and the Buildium writes
                    are both live and are enough to make the point. */}
                Occupella changes records in your Buildium account and sends email from your
                address. So the default everywhere is that it stops and shows you first.
              </p>
            </div>
          </Reveal>
          <Reveal delay={60}>
            <div className="lp-grid lp-trust">
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

      {/* ⚠ A SUMMARY, not the pricing table. The four cards, the comparison
          and the FAQ live on /pricing now. Two copies of a price is the
          hand-copied-figure problem that billing/plans.py's own test exists to
          catch, and the landing page is the copy that would go stale. What
          stays here is the shape of the offer and the cheapest number, which
          is what a visitor needs before deciding to look properly. */}
      <section className="lp-section">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-section-head">
              <div className="lp-eyebrow">Pricing</div>
              <h2 className="lp-h2">Start free for two weeks.</h2>
              <p className="lp-body">
                No card to begin. Plans start at $50 a month, and nothing is charged when the
                trial ends — you pick one then, or you do not.
              </p>
            </div>
          </Reveal>
          <Reveal delay={60}>
            <div className="lp-hero-ctas" style={{ marginTop: 26 }}>
              <a className="btn btn-secondary" href="/pricing">
                See the plans
              </a>
              <a className="lp-textlink" href="/features">
                Everything it does →
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <CloseBand />

      <SiteFooter />
    </div>
  );
}
