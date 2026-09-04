import { CHECK, Icon, LOCK, Reveal, SHIELD, BELL, SitePageShell } from "./Site";

// ─────────────────────────────────────────────────────────────────────
// /features — what Occupella actually does.
//
// ⚠ EVERY LINE ON THIS PAGE IS A CLAIM SOMEBODY WILL TEST WITHIN TEN MINUTES
// OF READING IT. The landing page's header comment sets the rule — "everything
// shown ships today" — and this page is where that rule is hardest to keep,
// because a features page is a list and a list invites padding.
//
// The bar used here: a capability is listed only if a customer on a paid plan
// can reach it in production today. Behind a default-false flag does not
// count. Built but unreachable does not count.
//
// DELIBERATELY ABSENT, so nobody "adds the missing ones" later:
//   · Gmail → Inbox email ingest. Switched OFF in production 2026-09-04: it
//     resolves its known-contact list from ONE Buildium account and gates every
//     connected user's mail against it, which is wrong the moment there are two
//     customers.
//   · Autonomous Buildium notes (notes/runner.py) — flag defaults false.
//   · Code execution / the analysis sandbox — flag defaults false.
//   · Lease renewal writes — the endpoint is probed, the tool is dark because a
//     renewal has no clean undo.
//   · Reopening a work order — Buildium latches it Completed; no API can.
//   · Nearby-places search — the keyless geocoder has no Places equivalent, so
//     it returns nothing.
// Each of those is a real thing in the codebase. None of them is a feature yet.
// ─────────────────────────────────────────────────────────────────────

const css = `
  /* Feature cards — same 1px-gap grid as the trust list and the pricing
     cards, so a visitor moving between pages sees one system rather than
     three designs. */
  .ft-cards { margin-top: 36px; }
  @media (min-width: 720px) { .ft-cards { grid-template-columns: 1fr 1fr; } }
  @media (min-width: 1020px) { .ft-cards[data-cols="3"] { grid-template-columns: repeat(3, 1fr); } }
  .ft-card { padding: 24px 22px 26px; display: flex; flex-direction: column; gap: 9px; }
  .ft-card-t { font-size: 15.5px; font-weight: 600; letter-spacing: -0.012em; color: var(--ink); }
  .ft-card-b { font-size: 14px; line-height: 1.55; color: var(--ink-muted); }

  /* A plain list of verbs. Used for the Buildium write surface, where the
     honest presentation is an enumeration rather than prose — a manager
     wants to scan for the one they care about. */
  .ft-list { margin-top: 28px; display: grid; gap: 10px 28px; }
  @media (min-width: 720px) { .ft-list { grid-template-columns: 1fr 1fr; } }
  .ft-list-item { display: flex; gap: 10px; align-items: flex-start; font-size: 14.5px; line-height: 1.5; color: var(--ink-secondary, var(--ink-muted)); }
  .ft-list-item svg { flex: none; margin-top: 3px; color: var(--iris); }

  /* A caveat that is part of the offer rather than a warning about it —
     hairline and muted, never a coloured alert box. A yellow panel on a
     marketing page reads as an apology. */
  .ft-note {
    margin-top: 22px; padding: 14px 16px;
    border: 1px solid var(--line); border-radius: var(--r-sm);
    background: var(--canvas-1);
    font-size: 13.5px; line-height: 1.55; color: var(--ink-muted);
    max-width: 62ch;
  }
  .ft-note strong { color: var(--ink); font-weight: 600; }

  .ft-shot {
    margin-top: 36px;
    border-radius: var(--r-lg); border: 1px solid var(--card-edge); overflow: hidden;
    background: var(--canvas); box-shadow: 0 18px 44px -30px rgba(14,22,32,0.35);
  }
  .ft-shot img { display: block; width: 100%; height: auto; }
  .ft-caption { margin-top: 14px; font-size: 13px; color: var(--ink-subtle); }
`;

/** Cards, not prose, where the content is genuinely a set of parallel things. */
const READS = [
  {
    t: "Every Buildium event, as it happens.",
    b: "Work orders, tasks, leases, applicants, bills, payments and property changes arrive by webhook. Occupella mirrors your account so it can answer without waiting on an API call.",
  },
  {
    t: "The history around the event.",
    b: "Before it drafts anything it pulls what happened at that unit before — prior work orders at the same address, the tenant's ledger, how similar requests were handled.",
  },
  {
    t: "What it noticed, in writing.",
    b: "Each card opens with the signals it found and where they came from. If a figure is on the card, it came out of Buildium, and you can check it.",
  },
  {
    t: "A drafted next step.",
    b: "The tenant reply, the work order, the note, the owner update. More than one draft when there is more than one sensible way to answer, each with its approach named.",
  },
];

const ASKS = [
  {
    t: "Money.",
    b: "Who is behind on rent and by how much, which leases expire in the next 90 days, what is unpaid and to whom, what a property brought in against what it spent.",
  },
  {
    t: "Maintenance.",
    b: "What is open and how long it has been open, which property is costing the most in repairs, which vendor has the work, what happened at a unit before.",
  },
  {
    t: "People and records.",
    b: "Who lives where, which lease is current and which has ended, a vendor's contact and history, the documents attached to a property.",
  },
  {
    t: "Answers with the numbers rendered.",
    b: "Tables, charts, detail cards and checklists — not a paragraph with figures pasted into it. Every figure traces back to the Buildium record it came from.",
  },
];

/** ⚠ Live, registered, confirm-gated write tools only. See the file header
 *  for the ones deliberately missing. */
const WRITES = [
  "Create a work order and assign a vendor",
  "Reassign a work order to a different vendor",
  "Change a task's status, priority or due date",
  "Close a work order",
  "Add a note to a task, a work order or a vendor",
  "Post a charge to a lease ledger",
  "Record a payment against a lease",
  "Record a move-out — and undo it",
];

const DOCS = [
  {
    t: "Read a lease or an invoice.",
    b: "Upload a document and ask about it. Occupella pulls the text out — including from scans with no text layer — and answers from what is actually in the file.",
  },
  {
    t: "Your company's own files.",
    b: "Connect Google Drive and it can find and read the documents you already keep there: SOPs, templates, vendor agreements.",
  },
  {
    t: "The public web, when the answer is not in your books.",
    b: "Supplier prices, code requirements, a vendor's licence status. It searches and reads pages, and it tells you where the answer came from.",
  },
  {
    t: "What it learns about your company.",
    b: "A standing profile of how you work, built from your own activity and refreshed daily. Sensitive identifiers are stripped before anything is remembered.",
  },
];

const TRUST = [
  {
    icon: BELL,
    text: "Nothing auto-sends. Every message and every write to Buildium stops at a confirmation card you can edit before approving.",
  },
  {
    icon: CHECK,
    text: "The riskiest writes — a payment, a charge, closing a work order — additionally require a manager or an admin, and refuse outright if the role cannot be verified.",
  },
  {
    icon: SHIELD,
    text: "One company's data never reaches another's. Every query is scoped to your company, and that scoping is enforced by a test that reads every query in the codebase.",
  },
  {
    icon: LOCK,
    text: "Your Buildium keys are encrypted at rest, entered once and never shown again. Disconnect and the mirror of your data is deleted.",
  },
  {
    icon: CHECK,
    text: "Occupella declines questions that would steer on a protected class, and will not substitute a proxy for one when asked a different way.",
  },
  {
    icon: LOCK,
    text: "Sensitive identifiers are redacted before anything enters AI memory, and account numbers are kept out of tenant-facing drafts.",
  },
];

const CONNECTS = [
  { t: "Buildium", b: "The system of record. One API key. Occupella reads and, with your approval, writes." },
  { t: "Gmail", b: "Read a thread for context and send an approved reply from your own address." },
  { t: "Google Calendar", b: "Check availability and put approved appointments on the calendar." },
  { t: "Google Drive", b: "Find and read the documents your company already keeps." },
];

export default function Features() {
  return (
    <SitePageShell
      active="features"
      eyebrow="Features"
      title="It does the work between the event and the reply."
      lede={
        <>
          Buildium records what happened. Occupella reads every event, gathers the history
          around it, drafts what comes next, and waits for you to approve it. Everything on this
          page ships today.
        </>
      }
      css={css}
      close={{
        title: "See it on your own portfolio.",
        body: "Connect Buildium and watch it triage a real work order from your account. Fourteen days, no card.",
      }}
    >
      <section className="lp-section">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-section-head">
              <div className="lp-eyebrow">The loop</div>
              <h2 className="lp-h2">Every event, read and answered.</h2>
              <p className="lp-body">
                This is the part of the day that Buildium leaves to you: something happens, you
                go and find out what else is true, and then you write to somebody about it.
              </p>
            </div>
          </Reveal>
          <Reveal delay={60}>
            <div className="lp-grid ft-cards">
              {READS.map((c) => (
                <div className="ft-card" key={c.t}>
                  <div className="ft-card-t">{c.t}</div>
                  <div className="ft-card-b">{c.b}</div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="ft-shot">
              <img
                src="/shots/inbox.png"
                alt="An AC work order in Occupella's inbox: what it noticed across the unit's history, and a drafted tenant reply waiting for approval"
                loading="lazy"
              />
            </div>
          </Reveal>
          <div className="ft-caption">
            A real work order — context gathered, reply drafted, waiting on approval.
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-section-head">
              <div className="lp-eyebrow">Ask it anything</div>
              <h2 className="lp-h2">Questions you would otherwise run a report for.</h2>
              <p className="lp-body">
                Ask in plain English. Occupella answers from your Buildium account, and shows
                the figures rather than describing them.
              </p>
            </div>
          </Reveal>
          <Reveal delay={60}>
            <div className="lp-grid ft-cards">
              {ASKS.map((c) => (
                <div className="ft-card" key={c.t}>
                  <div className="ft-card-t">{c.t}</div>
                  <div className="ft-card-b">{c.b}</div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="ft-shot">
              <img
                src="/shots/report.png"
                alt="A monthly owner report in Occupella: an NOI trend chart and a portfolio summary card"
                loading="lazy"
              />
            </div>
          </Reveal>
          <div className="ft-caption">
            An owner report, pulled from the ledger and rendered — every figure traces to Buildium.
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-section-head">
              <div className="lp-eyebrow">Writing back</div>
              <h2 className="lp-h2">It can change Buildium. It asks first.</h2>
              <p className="lp-body">
                Reading is only half the job. Occupella writes to your Buildium account too —
                behind a confirmation card that shows the exact record and the exact change
                before anything happens.
              </p>
            </div>
          </Reveal>
          <Reveal delay={60}>
            <div className="ft-list">
              {WRITES.map((w) => (
                <div className="ft-list-item" key={w}>
                  <Icon d={CHECK} size={14} />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="ft-note">
              <strong>Two things it will not do.</strong> It will not renew a lease — a renewal
              creates a real term with no clean undo, so that one stays with you in Buildium. And
              it cannot reopen a work order once it is closed: Buildium latches that, and no
              integration can change it. Closing one asks twice for the same reason.
            </div>
          </Reveal>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-section-head">
              <div className="lp-eyebrow">Leasing</div>
              <h2 className="lp-h2">Leads, from the first text to the signed application.</h2>
              <p className="lp-body">
                A lead texts your number and lands in a pipeline with a drafted reply. Move them
                through stages, call them from the browser, and track the application — on a
                number that belongs to your company, not a shared one.
              </p>
            </div>
          </Reveal>
          <Reveal delay={60}>
            <div className="lp-grid ft-cards" data-cols="3">
              <div className="ft-card">
                <div className="ft-card-t">Your own number.</div>
                <div className="ft-card-b">
                  Occupella registers a dedicated number for your business and handles the
                  carrier paperwork. Texts and calls come from you.
                </div>
              </div>
              <div className="ft-card">
                <div className="ft-card-t">A pipeline, not an inbox.</div>
                <div className="ft-card-b">
                  New, contacted, scheduled, applied, leased. Leads that have gone quiet for a
                  few days are flagged so they do not sit.
                </div>
              </div>
              <div className="ft-card">
                <div className="ft-card-t">Consent, handled.</div>
                <div className="ft-card-b">
                  STOP is honoured the moment it arrives, across every number you own, and
                  texting stops outside the hours the recipient&rsquo;s own state allows.
                </div>
              </div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="ft-note">
              <strong>Texting starts after carrier approval.</strong> US carriers vet every
              business that sends application-to-person messages, and that review takes about
              ten to fifteen days. Occupella files it for you on the day you sign up, and the
              rest of the product works throughout — but nobody, on any plan, can text a lead
              before the carriers clear it. Leasing is included on Pro and Scale.
            </div>
          </Reveal>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-section-head">
              <div className="lp-eyebrow">Documents and context</div>
              <h2 className="lp-h2">It reads the things your answer depends on.</h2>
            </div>
          </Reveal>
          <Reveal delay={60}>
            <div className="lp-grid ft-cards">
              {DOCS.map((c) => (
                <div className="ft-card" key={c.t}>
                  <div className="ft-card-t">{c.t}</div>
                  <div className="ft-card-b">{c.b}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-section-head">
              <div className="lp-eyebrow">Connects to</div>
              <h2 className="lp-h2">The accounts you already use.</h2>
            </div>
          </Reveal>
          <Reveal delay={60}>
            {/* ⚠ Two columns, not three: there are FOUR of these, and a
                three-column grid leaves a dead cell that shows the divider
                colour and reads as a missing card. Add a fifth integration
                and this wants data-cols="3" again — count them before you
                pick. */}
            <div className="lp-grid ft-cards">
              {CONNECTS.map((c) => (
                <div className="ft-card" key={c.t}>
                  <div className="ft-card-t">{c.t}</div>
                  <div className="ft-card-b">{c.b}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-section-head">
              <div className="lp-eyebrow">Control</div>
              <h2 className="lp-h2">It asks before it acts.</h2>
              <p className="lp-body">
                Occupella writes to Buildium, sends email, and texts residents. So the default
                everywhere is that it stops and shows you first.
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
    </SitePageShell>
  );
}
