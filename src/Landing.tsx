import { useEffect, useState } from "react";
import { Blocks, Checks, CloseBand, Reveal, SectionHead, SiteFooter, SiteNav, siteCss, useStartLabel, type Block } from "./Site";

// ─────────────────────────────────────────────────────────────────────
// LANDING — the front door.
//
// Built to a measured spec rather than a vibe (research pass 2026-08-19,
// against Linear / Vercel / Ramp / Cursor / Warp production frontends):
//
//   · Type — weight ceiling 600, negative tracking scaled to size
//     (-0.036em display → 0 at body), display line-height 1.05 against
//     body 1.5, POSITIVE tracking on the small caps eyebrow.
//   · Depth — surface ladder + 1px hairlines. No glassmorphism, no gradient
//     fills, one chromatic accent (--iris) and nothing else.
//   · Motion — ONE choreographed entrance (4 elements, 200ms stagger,
//     translateY(-10px): content settles DOWN into place, it doesn't
//     fly up); below the fold, 12px reveals on headers and cards only —
//     never on paragraphs, never re-triggered. Hover changes background or
//     hairline, never scale.
//   · Copy — sentence case, terminal period, ≤8-word headline, concrete
//     nouns, no adjectives.
//
// ⚠ WHAT OCCUPELLA IS NOW (founder, 2026-11-13; AgenticHelixis
// docs/decisions/ADR-one-product.md): property management software, the
// "books", built on the free PMS (Occupella-PMS, its CLAUDE.md is the list of
// what is built). It is free to use. Occupella earns a small fee on each
// online rent payment once those arrive, and the AI assistant is a paid
// add-on. Every line here is true of the books today, or marked Coming:
// online rent payments (bank first, then card), owner and tenant sign-in on
// app.occupella.com, and the assistant reading the books.
//
// ⚠ NEVER IMPLIED, because none is offered: a tenant-screening partner,
// texting, listing syndication, HOA management, bank feeds, 1099 e-filing,
// mailing, renters-insurance sales, credit reporting, SOC 2. claims.test.ts
// reads every page for the worst of these.
//
// ⚠ NO PRODUCT PICTURES, for now. The walkthrough video and the crops this
// page carried (src/crops.tsx, removed) showed the Buildium assistant, which
// left the product. Pictures of the books come back once there are honest
// ones to show; until then the page says it in words.
// ─────────────────────────────────────────────────────────────────────

const css = `
  /* ── type scale ── */
  .lp-h1 {
    font-family: var(--font-display);
    font-optical-sizing: auto;
    font-size: clamp(44px, 6.4vw, 72px);
    font-weight: 560;
    line-height: 1.02;
    letter-spacing: -0.02em;
    text-wrap: balance;
    max-width: 17ch;
    /* Solid ink. It used to paint a grey fade through background-clip:
       text, which the redesign removed. */
    color: var(--ink);
  }

  /* ── rotating hero word ────────────────────────────────────────────
     Five things Occupella actually does, cycling under a fixed line.

     ⚠ It sits ALONE on its own line, and that is load-bearing. The words
     are different widths, so anything sharing the line would be shoved
     sideways every couple of seconds. Alone and left-aligned, the caret
     hugs the word and nothing else moves — which is also why there is no
     width-reservation hack here to go stale.

     The word sets -webkit-text-fill-color as well as color, so it stays
     blue even if a text fill is ever put back on .lp-h1.

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

  /* ── how it works: three numbered steps under a thin rule. They are a
     real sequence, so they keep their numbers. ── */
  .lp-steps { display: grid; gap: 36px 48px; margin-top: 48px; }
  @media (min-width: 860px) { .lp-steps { grid-template-columns: repeat(3, 1fr); } }
  .lp-step { border-top: 1px solid var(--line); padding-top: 20px; }
  .lp .lp-step-n {
    display: inline-grid; place-items: center; width: 26px; height: 26px; border-radius: 50%;
    background: var(--iris); color: #fff; font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums;
  }
  .lp-step-t { margin-top: 10px; font-size: 18px; font-weight: 600; color: var(--ink); }
  .lp-step-b { margin-top: 8px; font-size: 16px; line-height: 1.6; color: var(--ink-muted); }

  /* ── the page's one pale-blue band: trust accounting ── */
  .lp-band-bg { margin-top: clamp(80px, 10vw, 128px); padding: clamp(64px, 8vw, 104px) 0; background: var(--band); }
  .lp-band-bg .lp-list-item { border-top-color: rgba(14, 22, 32, 0.12); }
  .lp-split { display: grid; gap: 40px; align-items: start; }
  @media (min-width: 1024px) { .lp-split { grid-template-columns: 5fr 6fr; gap: 72px; } }
  .lp-split .lp-list { margin-top: 0; }

  /* Free tools: plain links in a row of three, one line each. They are the
     site's most linkable pages, and a link from the home page is what tells a
     crawler they matter. */
  .lp-tools { margin-top: 32px; display: grid; gap: 0 32px; border-top: 1px solid var(--line); }
  @media (min-width: 820px) { .lp-tools { grid-template-columns: repeat(3, 1fr); border-top: 0; } }
  .lp .lp-tool { display: block; padding: 18px 0; border-bottom: 1px solid var(--line); text-decoration: none; }
  @media (min-width: 820px) { .lp .lp-tool { border-bottom: 0; border-top: 1px solid var(--line); } }
  .lp-tool-t { display: block; font-size: 17px; font-weight: 600; color: var(--iris); }
  .lp-tool-b { display: block; margin-top: 6px; font-size: 15px; line-height: 1.55; color: var(--ink-muted); }

  @media (prefers-reduced-motion: reduce) {
    /* The word still TYPES — letters appearing where they will stay move
       nothing, and the setting is about movement. What goes is the blink:
       a looping opacity animation carrying no content, which is exactly
       what this query is for. */
    .lp-rotor-caret { animation: none !important; opacity: 0.85 !important; }
  }
`;

// ── rotating hero word ───────────────────────────────────────────────
// "Free property management for ___" — the blank cycling through what the
// books do today. A rotator that names something the product does not do is
// a promise the first demo breaks, so nothing coming is in this list.
const ROTATING = [
  "trust accounting",
  "the rent roll",
  "owner statements",
  "bank reconciliation",
  "maintenance",
  "leasing",
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
    n: "1",
    t: "Start free.",
    b: "Make your company's account. There is no card to enter, and nothing to pay for the books.",
  },
  {
    n: "2",
    t: "Bring your records over.",
    b: "The switching tool reads CSV files of your owners, properties, units, tenants, leases, open charges and unpaid bills, then opens each trust bank account with what it held on your cutover day.",
  },
  {
    n: "3",
    t: "Let the books run.",
    b: "Rent, monthly charges and late fees post by themselves every night. You record payments, pay bills, pay owners and close the month.",
  },
];

/** Each line is enforced by the PMS's own database, not by a page. */
const TRUST = [
  "Security deposits sit in their own trust bank account, apart from operating money.",
  "Every posting is checked: a trust bank account's cash must equal what it holds for owners, tenants, vendors and you.",
  "Nothing in the ledger is edited or deleted. A mistake is fixed with a reversing entry.",
  "Every change is logged with the staff member who made it.",
  "Month-end takes two people: one prepares the reconciliation and another approves it.",
  "Your earned fees are listed with the last day to take them out of trust.",
];

// ⚠ SIX here, the full list on /features. The front door makes the promise;
// the features page is where somebody who wants to check it goes.
const MONTH: Block[] = [
  {
    t: "The rent roll",
    b: "Every lease, current, upcoming, ended or owing, with days left, rent, deposits and balance. Receive a payment from the row.",
  },
  {
    t: "Leases and e-signing",
    b: "Draft a lease on your own PDF or a template, and each signer signs on Occupella's own signing page. Every signed lease keeps a signing certificate.",
  },
  {
    t: "Rent and late fees, by themselves",
    b: "Each night Occupella charges rent and monthly fees, prorated by the day, and adds the late fee when a grace period ends, under each property's terms.",
  },
  {
    t: "Bills and owner approvals",
    b: "Enter a vendor's bill against the owner's account. A bill over the owner's approval limit waits for their approval before it is paid.",
  },
  {
    t: "Owner draws by ACH file or check",
    b: "Pay owners what is above their reserve and unpaid bills. Occupella writes the NACHA file for your bank, or checks to print on your stock.",
  },
  {
    t: "Month-end and owner statements",
    b: "Import the bank statement, match it and approve the reconciliation. Owner statements, the year-end and the 1099 summary come from the same books.",
  },
];

const COMING: Block[] = [
  {
    t: "Online rent payments",
    coming: true,
    b: "Tenants pay rent online through our payments provider, by bank first and by card after. Occupella earns a small fee on each payment, shown before anyone pays.",
  },
  {
    t: "Owner and tenant sign-in",
    coming: true,
    b: "Owners and tenants sign in to their portals at app.occupella.com: statements, bills to approve, repair requests and lease documents.",
  },
  {
    t: "The assistant reads your books",
    coming: true,
    b: "Ask about rent, balances and work orders in plain English, and get drafts your staff approve. The assistant can't move money.",
  },
];

const TOOLS = [
  {
    href: "/tools/deposit-deadline",
    t: "Deposit return deadline calculator",
    b: "Pick a state and a move-out date to get the day the deposit is due back, with the statute.",
  },
  {
    href: "/tools/notice-period",
    t: "Notice period calculator",
    b: "The last day of a pay-or-quit notice, and the earliest a month-to-month tenancy can end.",
  },
  {
    href: "/state-laws",
    t: "Landlord rules by state",
    b: "Deposit caps, late fees, notice periods and screening rules for all 50 states and DC.",
  },
];

export default function Landing() {
  const start = useStartLabel();

  return (
    <div className="lp">
      <style>{siteCss}</style>
      <style>{css}</style>

      <SiteNav active="home" />

      <header className="lp-hero">
        <div className="lp-wrap">
          <h1 className="lp-h1 rise" style={{ "--d": "0ms" } as React.CSSProperties}>
            Free property management for
            <br />
            <RotatingWord />
          </h1>
          <p className="lp-lede rise" style={{ "--d": "400ms", marginTop: 20 } as React.CSSProperties}>
            Occupella is property management software with trust accounting built in: the rent
            roll, leases and e-signing, bills, owner draws, month-end and owner statements. It is
            free to use.
          </p>
          <div className="lp-hero-ctas rise" style={{ "--d": "600ms", marginTop: 30 } as React.CSSProperties}>
            {/* ⚠ ONE action. The "See it work" text link that sat here was
                REMOVED by explicit founder instruction (2026-09-04), and the
                hero is one primary action, which is what a hero should be. Do
                not quietly reintroduce a secondary link here. "Book a demo"
                lives in the header (Site.tsx). */}
            <a className="btn btn-primary" href="/start" style={{ padding: "12px 24px", fontSize: 15 }}>
              {start} →
            </a>
          </div>
          <div className="lp-note rise" style={{ "--d": "600ms", marginTop: 16 } as React.CSSProperties}>
            No card to start. Switching from Buildium?{" "}
            <a href="/integrations/buildium">See what comes over</a>.
          </div>
        </div>
      </header>

      <section className="lp-section" id="how">
        <div className="lp-wrap">
          <SectionHead title="From sign-up to a running set of books." />
          <Reveal delay={60}>
            <div className="lp-steps">
              {STEPS.map((s) => (
                <div className="lp-step" key={s.n}>
                  <div className="lp-step-n">{s.n}</div>
                  <h3 className="lp-step-t">{s.t}</h3>
                  <p className="lp-step-b">{s.b}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="lp-band-bg" id="trust">
        <div className="lp-wrap">
          <div className="lp-split">
            <SectionHead title="Trust accounting that ties out.">
              Every trust bank account is checked on every posting, so the books can&rsquo;t drift
              from the bank. These are rules the database keeps, not settings.
            </SectionHead>
            <Checks items={TRUST} />
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <SectionHead title="The month's work, in one place." />
          <Blocks items={MONTH} cols={3} />
          <a className="lp-textlink" href="/features" style={{ display: "inline-block", marginTop: 32 }}>
            Everything Occupella does →
          </a>
        </div>
      </section>

      <section className="lp-section" id="coming">
        <div className="lp-wrap">
          <SectionHead title="Coming next.">
            Built or being built, and not on app.occupella.com yet. Each is marked the same way
            wherever this site mentions it.
          </SectionHead>
          <Blocks items={COMING} cols={3} />
        </div>
      </section>

      <section className="lp-section" id="switching">
        <div className="lp-wrap">
          <SectionHead title="Switching from Buildium?">
            Export your records from Buildium as CSV files and bring them in with the switching
            tool. Your opening balances are checked against the old system&rsquo;s book cash, and
            its past ledger lines come along as history. Nothing needs an API key.
          </SectionHead>
          <a className="lp-textlink" href="/integrations/buildium" style={{ display: "inline-block", marginTop: 24 }}>
            How switching from Buildium works →
          </a>
        </div>
      </section>

      <section className="lp-section" id="free-tools">
        <div className="lp-wrap">
          <SectionHead title="Free tools for property managers">
            Built from Occupella&rsquo;s state-by-state rules data. No sign-up.
          </SectionHead>
          <div className="lp-tools">
            {TOOLS.map((t) => (
              <a className="lp-tool" href={t.href} key={t.href}>
                <span className="lp-tool-t">{t.t}</span>
                <span className="lp-tool-b">{t.b}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ⚠ A SUMMARY, not the pricing page. The AI add-on's plans and the
          questions live on /pricing; the cheapest add-on price is the one
          figure repeated here. */}
      <section className="lp-section">
        <div className="lp-wrap">
          <SectionHead title="Free to use.">
            The books cost nothing. Once online rent payments arrive, Occupella earns a small fee
            on each one, set just above what it costs us. The AI assistant is a paid add-on, from
            $50 a month.
          </SectionHead>
          <Reveal delay={60}>
            <div className="lp-hero-ctas" style={{ marginTop: 26 }}>
              <a className="btn btn-secondary" href="/pricing">
                See pricing
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
