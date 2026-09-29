import { useEffect, useRef, useState } from "react";
import { CHECK, DemoPanel, Icon, MINUS, Reveal, SitePageShell } from "./Site";
import {
  ApprovalCrop,
  DelinquencyCrop,
  DraftCrop,
  HistoryCrop,
  NoticedCrop,
  WorkOrderCard,
  cropCss,
} from "./crops";

// ─────────────────────────────────────────────────────────────────────
// /features — what Occupella actually does, in detail.
//
// ⚠ EVERY LINE ON THIS PAGE IS A CLAIM SOMEBODY WILL TEST WITHIN TEN MINUTES
// OF READING IT. The landing page's header comment sets the rule — "everything
// shown ships today" — and this page is where that rule is hardest to keep,
// because a features page is a list and a list invites padding.
//
// The bar used here: a capability is listed as AVAILABLE only if a customer on
// a paid plan can reach it in production today. Behind a default-false flag
// does not count. Built but unreachable does not count. Anything that is real
// code and not yet reachable goes in the Leasing section, under a status line
// that says so in the first sentence.
//
// ⚠ THE SPECIFICS ARE THE POINT (founder direction, 2026-09-04: "get nitty
// gritty"). A property manager evaluating this has read twenty pages of
// "AI-powered insights" and cannot tell any of them apart. Numbers, field
// names, the actual list of writes, and the actual limits are what separate a
// page written from the codebase from a page written from a template. When you
// edit this file, replace a specific with a better specific — never with an
// adjective.
//
// DELIBERATELY ABSENT, so nobody "adds the missing ones" later. Each is real
// code in the repo and none of them is a feature yet:
//   · Gmail → Inbox email ingest, and lead capture from Zillow/Apartments.com
//     by watching Gmail. Both default OFF; the worker has never logged the CRM
//     ingest line on any boot.
//   · Texting or calling anyone. Every SMS/voice path is behind carrier
//     approval; the consent ledger and message log hold zero rows across the
//     whole deployment.
//   · Chart, checklist, schedule and form cards, and CSV export. All built and
//     wired end to end; none has ever been produced by a real question.
//   · Browser automation and Outlook. Registered specialists with zero
//     production calls; Outlook has no connect path at all.
//   · "Find a plumber near this property" — the keyless geocoder we run has no
//     place data, so it returns nothing. Named in the routing prose; does not
//     work.
//   · Photo assessment from the chat composer, and follow-up questions about a
//     document you just attached — the extraction renders client-side and the
//     next turn cannot see it.
//   · Vendor payment history. The mirror carries unpaid bills only.
//   · Code execution / the analysis sandbox — flag defaults false.
//   · Lease renewal writes, creating a vendor bill, and approving or rejecting
//     an application. All three implemented, all three deliberately
//     unregistered.
//   · Reopening a work order — Buildium latches it Completed; no API can.
//
// ⚠ NO FULL-APP SCREENSHOTS BELOW THE VIDEO. The visuals are crops rebuilt
// in HTML (src/crops.tsx) at a readable size. Of the old images: inbox.png
// showed Leasing rows in its Today strip while this page says Leasing is in
// carrier review; report.png says "Demo mode" and shows a chart card no real
// question has produced; cockpit.png offers "Draft renewal", which is dark.
// Do not bring them back.
//
// ⚠ The section ids (the-loop, ask-it-anything, writing-back, fair-housing)
// are link targets for the site menu. Renaming one breaks the menu.
// ─────────────────────────────────────────────────────────────────────

const css = `
  .ft-anchor { scroll-margin-top: 88px; }

  /* ── two columns at desktop, stacked below 1024px. data-flip puts the
     visual on the left, so the page alternates rather than repeating one
     shape section after section. */
  .ft-split { display: grid; gap: 40px; margin-top: 48px; }
  @media (min-width: 1024px) {
    .ft-split { grid-template-columns: 5fr 6fr; gap: 72px; align-items: start; }
    .ft-split[data-flip="true"] { grid-template-columns: 6fr 5fr; }
    .ft-split[data-flip="true"] > :first-child { order: 2; }
  }

  /* ── the loop: text blocks on the left, a sticky crop on the right that
     follows the block in view. Below 1024px each block carries its own
     crop inline instead, and the sticky column is not rendered. */
  .ft-steps { display: flex; flex-direction: column; }
  .ft-step { border-top: 1px solid var(--line); padding: 24px 0 40px; }
  @media (min-width: 1024px) { .ft-step { min-height: 44vh; } .ft-step:last-child { min-height: 0; } }
  .ft-step-t { font-size: 20px; font-weight: 600; line-height: 1.35; color: var(--ink); }
  .ft-step-b { margin-top: 10px; font-size: 17px; line-height: 1.6; color: var(--ink-muted); max-width: 52ch; }
  .ft-step-crop { margin-top: 24px; }
  @media (min-width: 1024px) { .ft-step-crop { display: none; } }

  .ft-sticky { display: none; }
  @media (min-width: 1024px) {
    .ft-sticky { display: grid; position: sticky; top: 112px; }
    .ft-sticky > * {
      grid-area: 1 / 1; align-self: start;
      opacity: 0; transform: translateY(8px);
      transition: opacity 200ms var(--ease-out), transform 200ms var(--ease-out);
      pointer-events: none;
    }
    .ft-sticky > [data-on="true"] { opacity: 1; transform: none; }
  }

  /* ── plain text blocks under a thin rule. No box around them. ── */
  .ft-blocks { display: grid; gap: 36px 56px; margin-top: 48px; }
  @media (min-width: 760px) { .ft-blocks { grid-template-columns: 1fr 1fr; } }
  @media (min-width: 1024px) { .ft-blocks[data-cols="3"] { grid-template-columns: repeat(3, 1fr); } }
  .ft-block { border-top: 1px solid var(--line); padding-top: 20px; }
  .ft-block-t { font-size: 18px; font-weight: 600; line-height: 1.4; color: var(--ink); }
  .ft-block-b { margin-top: 8px; font-size: 16px; line-height: 1.6; color: var(--ink-muted); }

  /* The questions list: question over answer, a rule between rows. */
  .ft-qa { display: flex; flex-direction: column; }
  .ft-qa-row { border-top: 1px solid rgba(14, 22, 32, 0.12); padding: 18px 0; }
  .ft-qa-q { font-size: 17px; font-weight: 600; color: var(--ink); }
  .ft-qa-a { margin-top: 6px; font-size: 16px; line-height: 1.6; color: var(--ink-muted); }

  /* A plain list of verbs, for the Buildium write actions and the fair
     housing rules: a manager scans for the one they care about. */
  .ft-list { display: flex; flex-direction: column; margin-top: 8px; }
  .ft-list-item {
    display: flex; gap: 12px; align-items: flex-start;
    padding: 12px 0; border-top: 1px solid var(--line);
    font-size: 17px; line-height: 1.5; color: var(--ink);
  }
  .ft-list-item svg { flex: none; margin-top: 4px; color: var(--ink-muted); }

  /* The page's one pale-blue band. */
  .ft-band { margin-top: clamp(80px, 10vw, 128px); padding: clamp(64px, 8vw, 104px) 0; background: var(--band); }
  .ft-band .ft-qa-row { border-top-color: rgba(14, 22, 32, 0.12); }

  @media (min-width: 1024px) { .ft-sticky-crop { position: sticky; top: 112px; } }
  .ft-caption { margin-top: 12px; font-size: 14px; color: var(--ink-muted); }

  /* The status on a section that is real code and not yet reachable.
     ⚠ Monochrome on purpose: spending the one colour on "not ready yet"
     would make the unfinished thing the loudest element on the page. */
  .ft-status {
    align-self: flex-start;
    display: inline-flex; align-items: center; gap: 7px;
    padding: 4px 12px; border: 1px solid var(--line-strong); border-radius: 999px;
    font-size: 14px; font-weight: 500; color: var(--ink-muted); background: var(--canvas);
  }
`;

type Block = { t: string; b: string };

/** The loop, one block per step, each with the crop it shows. */
const READS: (Block & { crop: () => React.ReactElement })[] = [
  {
    t: "The card appears before the AI runs",
    b: "A signed Buildium webhook arrives, is verified against your account and queued. Within seconds you have a readable row built from the record itself: title, address and unit, who reported it and who it is assigned to. The written summary follows a moment later.",
    crop: () => <WorkOrderCard />,
  },
  {
    t: "It pulls the history first",
    b: "The full task, its unit, its property by name, the active lease and its tenants, and ninety days of prior tickets at that address, fetched in parallel. If one lookup fails, the card loses that one field, not the whole card.",
    crop: () => <HistoryCrop />,
  },
  {
    t: "What it noticed, checked against the record",
    b: "The lease owes $1,240. No rent has posted this month. The lease ends in 41 days. Three other tasks are overdue at this property. Any number the model writes is checked against the record before it is shown, and dropped if it doesn't match.",
    crop: () => <NoticedCrop />,
  },
  {
    t: "A drafted next step you can edit",
    b: "The tenant reply, the follow-up task or the note, written out with why it was suggested and the fact it was based on. You can change every word before it goes.",
    crop: () => <DraftCrop />,
  },
];

/**
 * ⚠ Every row here is a real registered tool with production call volume
 * behind it. Do NOT add a row for something that merely exists: the whole
 * point of this section is that the answer is specific enough to be
 * falsified in one question.
 */
const ASKS = [
  {
    q: "Who is behind on rent?",
    a: "Every lease with a balance: tenant, property and unit, the amount, 31–60 / 61–90 / 90+ aging, and the count of open maintenance at that address on the same row. “Check whether they have open work before I send a late notice” is answered by the same question.",
  },
  {
    q: "What do we owe vendors?",
    a: "Every unpaid bill with vendor, amount, due date with overdue flagged, and which properties its lines charge. Amounts are summed from the line items, because production Buildium sends no total on the bill itself.",
  },
  {
    q: "What expires soon?",
    a: "Leases ending inside 90 days, with the tenant, the current rent, the outstanding balance and open maintenance already on the row.",
  },
  {
    q: "What is overdue?",
    a: "Open tasks (new, in progress and deferred) with title, priority, property, assignee and due date, overdue first.",
  },
  {
    q: "Brief me on everything",
    a: "Occupancy and vacancies, delinquency, unpaid bills, open work orders and tasks, and expiring leases. One request, all five run at once.",
  },
  {
    q: "Who is Marcus Whitfield?",
    a: "Resolved across tenants, owners and vendors, with the property and whether the tenancy is current. A lease that has ended is marked FORMER on the row, so you don't have to work it out.",
  },
  {
    q: "Which vendor cost us the most this year?",
    a: "No fixed report covers this, so Occupella writes the query. It runs inside a read-only Postgres transaction against views scoped to your company, and anything that is not a single clean SELECT is refused before it runs.",
  },
];

/** ⚠ Live, registered, confirm-gated write tools only. See the file header
 *  for the ones deliberately missing. */
const WRITES = [
  "Create a to-do task",
  "Create a work order and assign a vendor",
  "Reassign a work order to a different vendor",
  "Change a task's status, priority or due date",
  "Close a work order",
  "Add a note to a task, a work order or a vendor",
  "Post a charge to a lease ledger",
  "Record a payment against a lease",
  "Record a move-out, and undo it",
  "Share a file with a tenant or an owner",
];

/**
 * ⚠ The Fair Housing section is its own thing on this page rather than a
 * bullet in the safeguards (founder direction, 2026-09-04). It is the one
 * guardrail a property manager already loses sleep over, and the
 * no-proxy-after-declining rule is uncommon.
 */
const FAIR_HOUSING = [
  "It won't research or report who lives in an area by race, religion, national origin, familial status, disability, or any proxy for them.",
  "It won't help write a screening rule that turns on a protected class, including source of income where that is protected.",
  "Occupella doesn't make or draft decisions on housing applications.",
  "After it declines, it won't offer school ratings or crime statistics as a substitute. Those are the common workaround, and they steer just the same.",
  "Every message drafted for a resident is screened against the same rules before you see it.",
];

const PLACE: Block[] = [
  {
    t: "Is this address in a flood zone?",
    b: "Answered from FEMA's National Flood Hazard Layer at the property's own coordinates: the zone letter, whether it sits in a Special Flood Hazard Area, and what that means for insurance. It doesn't guess from the ZIP code.",
  },
  {
    t: "How does this rent compare with HUD's?",
    b: "HUD publishes a fair market rent per area per bedroom count. Occupella pulls the figure for the property's ZIP and puts your rent next to it, by unit mix, so you compare against the right column.",
  },
  {
    t: "Which of my properties are within 150 miles of here?",
    b: "A radius search over your portfolio, with the distance to each property.",
  },
  {
    t: "Every property is placed once",
    b: "Addresses are geocoded against the US Census geocoder and stored, so the questions above don't look anything up again. Maps are drawn from OpenStreetMap tiles.",
  },
];

const LAW: Block[] = [
  {
    t: "Deposit deadlines and caps",
    b: "Ask when a deposit has to go back after a move-out and it answers with the deadline for that property's state and the cap on what may be withheld, with the statute named.",
  },
  {
    t: "The date, computed",
    b: "It gives the actual calendar date, counted from the move-out on the lease, instead of “within 30 days.”",
  },
  {
    t: "Notice periods and late-fee rules",
    b: "The same treatment for the other state-level numbers a manager has to get right, cited the same way.",
  },
  {
    t: "It shows its source",
    b: "When the answer comes from the public web rather than your books, it links to what it read. Every one of these answers also tells you to check with your lawyer.",
  },
];

const HONESTY: Block[] = [
  {
    t: "A cut-off list is never evidence of absence",
    b: "When a list is cut short, the answer says how many it showed, out of how many, and what it searched. It is not allowed to conclude that the thing you asked about doesn't exist.",
  },
  {
    t: "A failed lookup reads as a failed lookup",
    b: "If Buildium refuses the connection, the answer says the connection is broken. It does not say you have no work orders. The same rule covers a document search that timed out and a specialist that ran out of turns.",
  },
  {
    t: "Every answer has an as-of line",
    b: "Answers come from a synced copy of your account, so each one says when that copy was last refreshed. A core table more than 26 hours stale gets a named warning in the answer itself.",
  },
  {
    t: "It says when it ran out of time",
    b: "A long question stops at a soft deadline and writes up what it had already gathered, labelled as partial and naming what it didn't get to.",
  },
];

const CONTEXT: Block[] = [
  {
    t: "Tell it something once",
    b: "“Sarah Chen prefers email only.” “We use Redbud for anything electrical.” It keeps that per company and brings it back on a later question, and identifiers are stripped before anything is stored.",
  },
  {
    t: "It builds on what it already flagged",
    b: "Before it looks anything up, it checks what it has already noticed about your portfolio: a payment a tenant promised in an email, the reminders it raised about missed rent and expiring leases. “Where do we stand on 4B” picks up from last week.",
  },
  {
    t: "Ask a follow-up on the card itself",
    b: "“Has this unit done this before?” “Who did we use last time?” Typed into the card and answered in the card, with that event's property, unit and task already in context.",
  },
  {
    t: "Outside text is treated as data",
    b: "A resident's work-order description, an email body, a file from Drive, a web snippet: each is fenced off before the model sees it, so text written by someone else can't give Occupella instructions.",
  },
];

// TODO(brandon): confirm autonomous notes flag is off. The first safeguard
// used to read "Nothing auto-sends. Every message and every write to
// Buildium stops at a card showing the exact outbound payload, which you can
// edit before approving." It comes back when the flag is confirmed off.
const SAFEGUARDS: Block[] = [
  {
    t: "Role checks on money and closures",
    b: "A payment, a charge and closing a work order also require a manager or an admin, and are refused outright if the role can't be verified. Buildium can't undo any of the three.",
  },
  {
    t: "No double charges",
    b: "Each approved action takes a lock before the Buildium call, so a double-click, a retry or a restart can't fire the same charge twice. A write that might have half-landed is flagged for review and never retried automatically.",
  },
  {
    t: "Your data stays in your company",
    b: "Every query is scoped to your company, and a test reads every query in the codebase to keep it that way.",
  },
  {
    t: "Encrypted keys, deleted on disconnect",
    b: "Your Buildium keys are encrypted at rest, entered once and never shown again. Disconnect and the copy of your data is deleted. There is no option to keep it.",
  },
  {
    t: "Identifiers kept off the screen",
    b: "Buildium record numbers, tenant emails and phone numbers are stripped from the reply as it is written, so an identifier never reaches the screen, even briefly.",
  },
];

const CONNECTS: Block[] = [
  {
    // TODO(brandon): confirm autonomous notes flag is off; this line ended
    // "and writes back only with your approval" until then.
    t: "Buildium",
    b: "The system of record. One API key, entered once. Occupella keeps a synced copy of your account so it can answer without waiting on the API.",
  },
  {
    t: "Gmail",
    b: "Reads a thread for context and sends an approved reply from your own address.",
  },
  {
    t: "Google Calendar",
    b: "Checks availability and puts approved appointments on the calendar.",
  },
  {
    t: "Google Drive",
    b: "Finds and reads the documents your company already keeps, such as SOPs, templates and vendor agreements. Docs and Sheets included.",
  },
];

function Blocks({ items, cols }: { items: Block[]; cols?: 3 }) {
  return (
    <div className="ft-blocks" data-cols={cols}>
      {items.map((c) => (
        <div className="ft-block" key={c.t}>
          <h3 className="ft-block-t">{c.t}</h3>
          <p className="ft-block-b">{c.b}</p>
        </div>
      ))}
    </div>
  );
}

function Head({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <Reveal>
      <div className="lp-section-head">
        <h2 className="lp-h2">{title}</h2>
        {children ? <p className="lp-body">{children}</p> : null}
      </div>
    </Reveal>
  );
}

/**
 * The loop: which step is in view decides which crop the sticky column
 * shows. The band is the middle of the viewport, so a step takes over when
 * it reaches the reader's eye line, not when its first pixel appears.
 * Starts on step one, which is also what the prerendered HTML shows.
 */
function Loop() {
  const [on, setOn] = useState(0);
  const steps = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setOn(Number((e.target as HTMLElement).dataset.i));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    for (const el of steps.current) if (el) io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div className="ft-split">
      <div className="ft-steps">
        {READS.map((c, i) => (
          <div
            className="ft-step"
            key={c.t}
            data-i={i}
            ref={(el) => {
              steps.current[i] = el;
            }}
          >
            <h3 className="ft-step-t">{c.t}</h3>
            <p className="ft-step-b">{c.b}</p>
            <div className="ft-step-crop">{c.crop()}</div>
          </div>
        ))}
      </div>
      <div className="ft-sticky" aria-hidden="true">
        {READS.map((c, i) => (
          <div key={c.t} data-on={i === on}>
            {c.crop()}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Features() {
  return (
    <SitePageShell
      active="features"
      title="What Occupella does, in detail"
      lede={
        <>
          {/* TODO(brandon): confirm autonomous notes flag is off. This lede
              ended "and waits for you to approve it"; restore it then. */}
          Occupella reads your Buildium events as they arrive, gathers the history around each
          one and drafts what comes next. This page lists what it does, with the limits named
          where they exist.
        </>
      }
      css={css + cropCss}
      close={{
        title: "See it on your own portfolio",
        body: "Connect Buildium and watch it handle a real work order from your account. 14 days, no card.",
      }}
    >
      {/* The page's one full-width visual. Somebody who lands on /features
          from the nav has not seen the product at all.
          TODO(brandon): the tour shows the Leasing board, and Leasing is in
          carrier review. Re-cut it without Leasing, or confirm it can stay. */}
      <section className="lp-section" style={{ paddingTop: 56 }}>
        <div className="lp-wrap">
          <DemoPanel
            src="/demo/product-tour.mp4"
            poster="/demo/product-tour-poster.jpg"
            caption="The Inbox and Operations pages, in under twenty seconds."
            width={1440}
            height={900}
          />
        </div>
      </section>

      <section className="lp-section ft-anchor" id="the-loop">
        <div className="lp-wrap">
          <Head title="How an event is handled">
            When something happens in Buildium, Occupella looks up the history around it and
            drafts the reply or the next task. The examples below follow one work order.
          </Head>
          <Loop />
        </div>
      </section>

      <section className="ft-band ft-anchor" id="ask-it-anything">
        <div className="lp-wrap">
          <div className="ft-split" data-flip="true" style={{ marginTop: 0 }}>
            <div>
              <Head title="Reports from your Buildium data">
                Ask in plain English. The answer comes from a synced copy of your Buildium
                account, so it doesn&rsquo;t crawl the API record by record, and it comes back
                as a table you can sort.
              </Head>
              <div className="ft-qa" style={{ marginTop: 32 }}>
                {ASKS.map((r) => (
                  <div className="ft-qa-row" key={r.q}>
                    <h3 className="ft-qa-q">{r.q}</h3>
                    <p className="ft-qa-a">{r.a}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="ft-sticky-crop">
              <DelinquencyCrop />
              <p className="ft-caption">The answer to &ldquo;who is behind on rent?&rdquo;, with example data.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section ft-anchor" id="writing-back">
        <div className="lp-wrap">
          <div className="ft-split" style={{ marginTop: 0 }}>
            <div>
              {/* TODO(brandon): confirm autonomous notes flag is off. This
                  paragraph said every change goes "behind a card that shows
                  the exact record and the exact change before anything
                  leaves"; restore it then. */}
              <Head title="Changes it can make in Buildium">
                Occupella can also write to your Buildium account. These are the changes it can
                make.
              </Head>
              <div className="ft-list" style={{ marginTop: 28 }}>
                {WRITES.map((w) => (
                  <div className="ft-list-item" key={w}>
                    <Icon d={CHECK} size={15} />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="ft-sticky-crop">
              <div className="cr-stack">
                <WorkOrderCard />
                <ApprovalCrop />
              </div>
              <p className="ft-caption">The approval card for a new work order, with example data.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section ft-anchor" id="fair-housing">
        <div className="lp-wrap">
          <div className="ft-split" style={{ marginTop: 0 }}>
            <Head title="Fair housing guardrails">
              Occupella declines a defined set of questions outright, and it doesn&rsquo;t offer
              a workaround after it declines.
            </Head>
            <div className="ft-list">
              {FAIR_HOUSING.map((f) => (
                <div className="ft-list-item" key={f}>
                  <Icon d={MINUS} size={15} />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <Head title="Where your properties are">
            Buildium stores an address as text. Occupella turns it into a point on the map, which
            lets it answer flood exposure, how a rent compares with the federal benchmark, and
            which properties are near which.
          </Head>
          <Blocks items={PLACE} />
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <Head title="State rules for deposits and fees">
            A deposit deadline in Colorado is not a deposit deadline in Texas, and the one that
            applies is where the property sits. Occupella looks it up for that property and does
            the arithmetic.
          </Head>
          <Blocks items={LAW} />
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <Head title="When it doesn't know">
            The costly failure is a confident &ldquo;nothing found&rdquo; when the lookup broke,
            or a list of five when there were forty. Occupella says so in both cases.
          </Head>
          <Blocks items={HONESTY} />
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <Head title="What it remembers" />
          <Blocks items={CONTEXT} />
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-section-head">
              <span className="ft-status">
                <Icon d={MINUS} size={12} />
                In carrier review
              </span>
              <h2 className="lp-h2">Leasing, once carriers approve you</h2>
              {/* ⚠ THE STATUS SENTENCE LEADS. Leasing is code-complete and
                  reachable by nobody: no company on the deployment has a
                  provisioned number, and no A2P registration has completed.
                  Describing the pipeline first and disclosing at the bottom
                  would be selling a section a new customer cannot open.
                  TODO(brandon): the two "Working today" blocks also need
                  HELIXIS_CRM__ENABLED on in Render. Confirm it, or say
                  they open later too. */}
              <p className="lp-body">
                US carriers vet every business that sends application-to-person texts, and the
                review takes about ten to fifteen days. Nobody on any plan can text a lead before
                it clears. Here is what works today and what opens at approval.
              </p>
            </div>
          </Reveal>
          <Blocks
            cols={3}
            items={[
              {
                t: "Working today: the paperwork",
                b: "You fill in your legal business name, whether you have an EIN, your address, an authorised contact and one consent checkbox. Occupella writes the campaign description, the opt-in language, the sample messages and the public privacy and terms pages the carrier checks. Those four are what registrations get rejected over.",
              },
              {
                t: "Working today: the compliance rails",
                b: "A consent ledger you manage yourself, with revocations recorded rather than deleted. STOP honoured across every number you own. Quiet hours computed from the recipient's own state, including the four that are stricter than federal.",
              },
              {
                t: "At approval: the pipeline opens",
                b: "A number that belongs to your company, not a shared one, bought and set up the day carriers clear you. Leads arrive by text into a stage board with a drafted first reply, quiet leads flagged, and click-to-call from the browser.",
              },
            ]}
          />
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <Head title="Works with" />
          <Blocks items={CONNECTS} />
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <Head title="Safeguards on changes and data">
            Occupella changes records in your Buildium account and sends email from your address.
            These are the controls around that.
          </Head>
          <Blocks items={SAFEGUARDS} />
        </div>
      </section>
    </SitePageShell>
  );
}
