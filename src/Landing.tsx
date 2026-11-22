import { Blocks, Checks, CloseBand, Coming, SectionHead, SiteFooter, SiteNav, siteCss, useStartLabel, type Block } from "./Site";
import { BOOKS_LIVE, PORTALS_LIVE } from "./lib/releaseState";
import { GITHUB_URL, INSTALL_GUIDE_URL } from "./lib/urls";

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
// what is built). It is free to use and open source (Apache-2.0), and the AI
// assistant is a paid add-on.
//
// ⚠ THE COPY IS THE FOUNDER'S OF 2026-11-22 (reports/Phase 2 site copy
// draft.md). Only what runs today is said as working. What isn't ready sits in
// one labelled section, "Not available yet" (online rent payments, the
// assistant reading the books). Lines that turn true later read a flag in
// src/lib/releaseState.ts and show a true fallback until it flips: the
// hosted books running (BOOKS_LIVE) and the owner and tenant portals
// (PORTALS_LIVE, the tour's Coming chips).
//
// ⚠ NEVER IMPLIED, because none is offered: a tenant-screening partner,
// texting, listing syndication, HOA management, bank feeds, 1099 e-filing,
// mailing, renters-insurance sales, credit reporting, SOC 2. claims.test.ts
// reads every page for the worst of these.
//
// ⚠ PICTURES (founder, 2026-11-15): the books themselves, captured from the
// PMS's own demo company (python -m pms.demo, its made-up names given
// realistic made-up ones), in public/shots/books/, and public-domain New York
// photographs, each credited on the page and in public/shots/photos/CREDITS.md.
// No picture shows anything the books don't do today. The owner and tenant
// portals are built; until signing in to them on app.occupella.com works
// (PORTALS_LIVE), their rows carry the Coming chip.
// ─────────────────────────────────────────────────────────────────────

const css = `
  /* ── type scale ── */
  .lp-h1 {
    font-family: var(--font-display);
    font-optical-sizing: auto;
    font-size: clamp(40px, 4.8vw, 62px);
    font-weight: 560;
    line-height: 1.04;
    letter-spacing: -0.02em;
    text-wrap: balance;
    max-width: 13ch;
    /* Solid ink. It used to paint a grey fade through background-clip:
       text, which the redesign removed. */
    color: var(--ink);
  }

  /* ── hero: the words on the left; on the right a New York stoop with the
     rent roll laid over it, as the sign-up page pairs its form with a photo ── */
  .lp-hero { padding: clamp(48px, 7vw, 88px) 0 0; }
  .lp-hero-grid { display: grid; gap: 48px; align-items: center; }
  @media (min-width: 1024px) { .lp-hero-grid { grid-template-columns: 5fr 7fr; gap: 56px; } }
  .lp-stage { position: relative; min-width: 0; padding-bottom: 28px; }
  .lp-stage-photo {
    display: block; width: 72%; height: auto; margin-left: auto; aspect-ratio: 4 / 5; max-height: 540px;
    object-fit: cover; object-position: 50% 35%; border-radius: 14px;
    filter: saturate(0.85) contrast(0.95);
  }
  .lp-stage .lp-shot { position: absolute; left: 0; bottom: 0; width: 92%; }
  .lp-credit { margin-top: 10px; font-size: 12px; line-height: 1.4; color: var(--ink-muted); }
  .lp-stage .lp-credit { position: absolute; right: 0; bottom: -26px; margin: 0; }
  @media (max-width: 1023px) {
    .lp-stage { padding-bottom: 0; }
    .lp-stage-photo { width: 100%; aspect-ratio: 3 / 2; max-height: 360px; }
    .lp-stage .lp-shot { position: relative; width: 94%; margin: -96px auto 0; }
    .lp-stage .lp-credit { position: static; margin-top: 10px; }
  }

  /* ── a screen of the books: the capture itself, a hairline and a soft
     shadow. No pretend browser chrome. ── */
  .lp-shot {
    margin: 0; border: 1px solid var(--line-strong); border-radius: 10px; overflow: hidden;
    background: #fff; box-shadow: 0 1px 2px rgba(14, 22, 32, 0.06), 0 18px 40px -18px rgba(14, 22, 32, 0.28);
  }
  .lp-shot img { display: block; width: 100%; height: auto; }

  /* ── the tour: one screen per row, words beside it, alternating sides ── */
  .lp-tour { display: grid; gap: clamp(64px, 9vw, 112px); margin-top: 56px; }
  .lp-row { display: grid; gap: 28px; align-items: center; }
  @media (min-width: 960px) {
    .lp-row { grid-template-columns: 4fr 7fr; gap: 64px; }
    .lp-row.is-flip { grid-template-columns: 7fr 4fr; }
    .lp-row.is-flip .lp-row-text { order: 2; }
  }
  .lp-row-text { min-width: 0; }
  .lp-row-who {
    display: flex; align-items: center; gap: 10px; font-size: 12px; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase; color: var(--iris);
  }
  .lp-row-t {
    margin-top: 12px; font-family: var(--font-display); font-optical-sizing: auto;
    font-size: clamp(26px, 3vw, 34px); font-weight: 560; line-height: 1.12; letter-spacing: -0.015em;
    color: var(--ink); text-wrap: balance;
  }
  .lp-row-b { margin-top: 14px; font-size: 17px; line-height: 1.6; color: var(--ink-muted); max-width: 46ch; }

  /* ── trust accounting beside Soho's fire escapes ── */
  .lp-trust-photo {
    display: block; width: 100%; height: auto; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 14px;
    filter: saturate(0.85);
  }
  .lp-trust-photo-wrap { margin-top: 32px; }
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

`;

const STEPS = [
  {
    n: "1",
    t: "Start free.",
    b: "Make your company's account. There is no card to enter, and nothing to pay for the books.",
  },
  {
    n: "2",
    t: "Bring your records over.",
    b: "The switching tool reads CSV files of your owners, properties, units, tenants, leases, open charges and unpaid bills, then opens each trust bank account with what it held on your cutover day. It reads files you export; it doesn't connect to your old system.",
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
  "On every posting, a trust bank account's book cash must equal what it holds for owners, tenants, vendors and you, or the posting is refused.",
  "Each month, you import the bank statement and match it. One person prepares the reconciliation and another approves it.",
  "Nothing in the ledger is edited or deleted. A mistake is fixed with a reversing entry.",
  "Every change is logged with when it happened and what changed. Staff changes name the staff member.",
  "Your earned fees are listed with the last day to take them out of trust.",
];

// The photographs, each public domain, credited where it shows and in
// public/shots/photos/CREDITS.md (sidePhoto.test.ts checks both).
export const PHOTOS = {
  stoop: {
    src: "/shots/photos/upper-east-side-brownstone.jpg",
    width: 960,
    height: 1259,
    credit: "Photo: Carol M. Highsmith, Library of Congress",
  },
  soho: {
    src: "/shots/photos/soho-fire-escapes.jpg",
    width: 1400,
    height: 1104,
    credit: "Fire escapes in Soho. Photo: Carol M. Highsmith, Library of Congress",
  },
} as const;

// Screens of the books, 1600 x 1000, from the PMS's demo company. Every name
// in them is made up.
export const SHOT = { width: 1600, height: 1000 } as const;

type Row = { src: string; alt: string; who: string; t: string; b: string; coming?: boolean };

// ⚠ Each row is a screen that exists in the books today, said in the words
// the screen uses. The full list is on /features.
export const TOUR: Row[] = [
  {
    src: "/shots/books/month-end.jpg",
    alt: "A trust bank account's month-end in Occupella: the bank balance, outstanding withdrawals and book cash, a difference of $0.00 and the badge Ties out, prepared by one person and waiting for another to approve.",
    who: "Month-end",
    t: "The bank and the books, side by side.",
    b: "Import the bank statement and match it. Occupella lays out the adjusted bank balance against the trust journal to the cent. One person prepares the month and another approves it.",
  },
  {
    src: "/shots/books/owner-overview.jpg",
    alt: "An owner's page in Occupella: what each of their three properties holds in trust, and their bills from the roofer: one paid, one they approved, and one short of funds, saying how much to send.",
    who: "Owner portal",
    t: "Owners approve their own bills.",
    b: "A bill over the owner's approval limit waits for them. They see what each property holds before and after, then approve or decline it. Statements, the year-end and repairs are on the same page.",
    coming: !PORTALS_LIVE,
  },
  {
    src: "/shots/books/tenant-overview.jpg",
    alt: "A tenant's page in Occupella: their lease, rent and due day, the security deposit held, a balance of $0.00, the next charge and a note that rent goes up on December 1.",
    who: "Tenant portal",
    t: "Tenants see what they owe, and why.",
    b: "The lease, the balance, the next charge and any rent change coming, with every payment's receipt. They file repair requests and write to your staff from the same page.",
    coming: !PORTALS_LIVE,
  },
];

function Shot({ src, alt, eager = false }: { src: string; alt: string; eager?: boolean }) {
  return (
    <figure className="lp-shot">
      <img
        src={src}
        alt={alt}
        width={SHOT.width}
        height={SHOT.height}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
      />
    </figure>
  );
}

/** Not on app.occupella.com yet. Listed here, and nowhere said as working. */
const NOT_YET: Block[] = [
  {
    t: "Online rent payments",
    b: "Tenants pay rent online by bank or card through our payments provider. Occupella will earn a small fee on each payment, shown before anyone pays.",
  },
  {
    t: "Occupella's assistant reading your books",
    b: "Today it works with your Gmail, Calendar, Drive, documents and the web. Connecting it to your books is next.",
  },
];

/** Any AI, through the books' own API (Occupella-PMS ADR 0011). */
export const CONNECT_AI =
  "An admin makes an API key in Settings. Software with that key can read your books and propose an email, a notice, a work order or a note. Nothing happens until someone on your staff approves it. The key's database role can't record a payment, a charge, a bill or a draw. There is an MCP server for AI tools that speak it, and a feed of events with signed webhooks.";

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
    b: "Deposit caps, late fees, notice periods and source-of-income protection for all 50 states and DC.",
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
        <div className="lp-wrap lp-hero-grid">
          <div>
            <h1 className="lp-h1 rise" style={{ "--d": "0ms" } as React.CSSProperties}>
              Free, open-source property management software.
            </h1>
            <p className="lp-lede rise" style={{ "--d": "200ms", marginTop: 20 } as React.CSSProperties}>
              The books for a property management company: trust accounting, the rent roll, leases
              and e-signing, bills, owner draws, month-end and owner statements. Every trust bank
              account balances on every posting, or the posting doesn&rsquo;t go through.
            </p>
            <div className="lp-hero-ctas rise" style={{ "--d": "400ms", marginTop: 30 } as React.CSSProperties}>
              {/* The founder, 2026-11-15: the first button leads to the open-source repository,
                  where people read the code, run it and star it; the hosted sign-up sits beside
                  it. (This replaces the 2026-09-04 rule of one action in the hero.) */}
              <a className="btn btn-primary" href={GITHUB_URL} style={{ padding: "12px 24px", fontSize: 15 }}>
                Read the code on GitHub →
              </a>
              <a className="btn btn-secondary" href="/start" style={{ padding: "12px 24px", fontSize: 15 }}>
                {start}
              </a>
            </div>
            <div className="lp-note rise" style={{ "--d": "400ms", marginTop: 16 } as React.CSSProperties}>
              {BOOKS_LIVE
                ? "Apache-2.0. Run it on your own server with one Docker command, or use ours at no cost."
                : "Apache-2.0. Run it on your own server with one Docker command."}
            </div>
          </div>
          <div className="lp-stage">
            <img
              className="lp-stage-photo"
              src={PHOTOS.stoop.src}
              width={PHOTOS.stoop.width}
              height={PHOTOS.stoop.height}
              alt=""
              fetchPriority="high"
              decoding="async"
            />
            <Shot
              src="/shots/books/rent-roll.jpg"
              alt="Occupella's rent roll: each lease with its property, unit, tenants, start and end, rent, market rent, deposit and balance."
              eager
            />
            <p className="lp-credit">{PHOTOS.stoop.credit}</p>
          </div>
        </div>
      </header>

      <section className="lp-section" id="how">
        <div className="lp-wrap">
          <SectionHead title="From sign-up to a running set of books." />
          <div className="lp-steps">
            {STEPS.map((s) => (
              <div className="lp-step" key={s.n}>
                <div className="lp-step-n">{s.n}</div>
                <h3 className="lp-step-t">{s.t}</h3>
                <p className="lp-step-b">{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section" id="tour">
        <div className="lp-wrap">
          <div className="lp-tour">
            {TOUR.map((r, i) => (
              <div className={i % 2 ? "lp-row is-flip" : "lp-row"} key={r.src}>
                <div className="lp-row-text">
                  <div className="lp-row-who">
                    {r.who}
                    {r.coming ? <Coming /> : null}
                  </div>
                  <h2 className="lp-row-t">{r.t}</h2>
                  <p className="lp-row-b">{r.b}</p>
                  {r.coming ? (
                    <p className="lp-row-b" style={{ fontSize: 15 }}>
                      Built, and signing in to it on app.occupella.com is coming.
                    </p>
                  ) : null}
                </div>
                <Shot src={r.src} alt={r.alt} />
              </div>
            ))}
          </div>
          <a className="lp-textlink" href="/features" style={{ display: "inline-block", marginTop: 56 }}>
            Everything Occupella does →
          </a>
        </div>
      </section>

      <section className="lp-band-bg" id="trust">
        <div className="lp-wrap">
          <div className="lp-split">
            <div>
              <SectionHead title="Trust accounting the database enforces.">
                These are rules the database keeps on every posting, whoever makes it. They
                aren&rsquo;t settings anyone can turn off.
              </SectionHead>
              <div className="lp-trust-photo-wrap">
                <img
                  className="lp-trust-photo"
                  src={PHOTOS.soho.src}
                  width={PHOTOS.soho.width}
                  height={PHOTOS.soho.height}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
                <p className="lp-credit">{PHOTOS.soho.credit}</p>
              </div>
            </div>
            <Checks items={TRUST} />
          </div>
        </div>
      </section>

      <section className="lp-section" id="open-source">
        <div className="lp-wrap">
          <SectionHead title="Open source, so you can check it.">
            The books are on GitHub under Apache-2.0: the code, the database rules, every test and
            the decisions behind them. Run your own copy with Docker and a daily backup.
            {BOOKS_LIVE ? " Or use ours, which runs the same code." : ""} If you leave, an admin
            downloads every record, document and signed lease in one zip.
          </SectionHead>
          <div className="lp-hero-ctas" style={{ marginTop: 24 }}>
            <a className="lp-textlink" href={GITHUB_URL}>
              Read the code →
            </a>
            <a className="lp-textlink" href={INSTALL_GUIDE_URL}>
              Install guide →
            </a>
          </div>
        </div>
      </section>

      {BOOKS_LIVE ? (
        <section className="lp-section" id="connect-ai">
          <div className="lp-wrap">
            <SectionHead title="Connect the AI you already use.">{CONNECT_AI}</SectionHead>
          </div>
        </section>
      ) : null}

      <section className="lp-section" id="not-yet" data-not-yet>
        <div className="lp-wrap">
          <SectionHead title="Not available yet">
            These aren&rsquo;t on app.occupella.com yet. We&rsquo;ll say so here when they are.
          </SectionHead>
          <Blocks items={NOT_YET} />
        </div>
      </section>

      <section className="lp-section" id="switching">
        <div className="lp-wrap">
          <SectionHead title="Switching from Buildium?">
            Export your records from Buildium as CSV files and bring them in with the switching
            tool. Your opening balances are checked against Buildium&rsquo;s book cash, and its
            past ledger lines come along as history. There is no connection to Buildium&rsquo;s
            systems and no API key. Occupella is not affiliated with Buildium.
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

      {/* ⚠ A SUMMARY, not the pricing page: the add-on's prices and the online
          payment fee are on /pricing, beside the note that billing isn't on yet. */}
      <CloseBand
        github
        body="The books cost nothing, with no card to start. The AI assistant is a separate paid add-on."
      />

      <SiteFooter />
    </div>
  );
}
