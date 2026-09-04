import { CHECK, Icon, LOCK, Reveal, SHIELD, BELL, MINUS, SitePageShell } from "./Site";

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

  /* The status chip on a section that is real code and not yet reachable.
     ⚠ Monochrome on purpose — the ONE chromatic accent on this site is
     --iris, and spending it on "not ready yet" would make the unfinished
     thing the loudest element on the page. */
  .ft-status {
    /* ⚠ align-self, not just inline-flex. This sits inside .lp-section-head,
       which is a COLUMN flex container, so its children stretch to the full
       width by default — inline-flex does not stop that and the chip renders
       as a 1000px pill. Measured, not guessed. */
    align-self: flex-start;
    display: inline-flex; align-items: center; gap: 7px;
    padding: 4px 10px; border: 1px solid var(--line); border-radius: 999px;
    font-family: var(--font-mono); font-size: 11px; font-weight: 500;
    letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-subtle);
    background: var(--canvas-1);
  }
  .ft-status svg { color: var(--ink-subtle); }

  /* A two-column "what you ask" / "what comes back" table. This is the
     nitty-gritty section and a card grid would flatten it back into
     marketing — the value is in the exact fields on the exact row. */
  .ft-qa { margin-top: 32px; display: grid; gap: 1px; background: var(--line); border: 1px solid var(--line); border-radius: var(--r-lg); overflow: hidden; }
  .ft-qa-row { background: var(--canvas); padding: 20px 22px; display: grid; gap: 8px; }
  @media (min-width: 820px) { .ft-qa-row { grid-template-columns: 22ch 1fr; gap: 24px; align-items: baseline; } }
  .ft-qa-q { font-size: 14.5px; font-weight: 600; letter-spacing: -0.01em; color: var(--ink); }
  .ft-qa-a { font-size: 14px; line-height: 1.55; color: var(--ink-muted); }

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
    t: "The card lands before the AI runs.",
    b: "A signed Buildium webhook arrives, is verified against your account and queued. Within seconds you have a readable row — title, address and unit, who reported it, who it is assigned to — built from the record itself. The written summary catches up a moment later.",
  },
  {
    t: "It pulls the history first.",
    b: "The full task, its unit, its property by name, the active lease and its tenants, and ninety days of prior tickets at that address — fetched in parallel. A sub-fetch that fails costs one field, not the card.",
  },
  {
    t: "What it noticed, and it has to be checkable.",
    b: "The lease owes $1,240. No rent has posted this month. The lease ends in 41 days. Three other tasks are overdue at this property. A numeric claim the model writes is checked against the record before it is shown, and dropped if it does not hold.",
  },
  {
    t: "A drafted next step you edit.",
    b: "The tenant reply, the follow-up task, the note — written out, with the reason it was suggested and the fact it was based on. You send your words; the draft is a starting point, not an outbox.",
  },
];

/**
 * ⚠ Every row here is a real registered tool with production call volume
 * behind it. Do NOT add a row for something that merely exists — the whole
 * point of this section is that the second column is specific enough to be
 * falsified in one question.
 */
const ASKS = [
  {
    q: "Who is behind on rent?",
    a: "Every lease with a balance: tenant, property and unit, the amount, 31–60 / 61–90 / 90+ aging, and the count of open maintenance at that address on the same row — so “check whether they have open work before I send a late notice” is the same question, not the next one.",
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
    a: "Open tasks — new, in progress and deferred — with title, priority, property, assignee and due date, overdue first.",
  },
  {
    q: "Brief me on everything.",
    a: "Occupancy and vacancies, delinquency, unpaid bills, open work orders and tasks, and expiring leases. One request, all five run at once.",
  },
  {
    q: "Who is Marcus Whitfield?",
    a: "Resolved across tenants, owners and vendors, with the property and whether the tenancy is current. A lease that has ended is marked FORMER on the row rather than left for you to infer.",
  },
  {
    q: "Which vendor cost us the most this year?",
    a: "No fixed report covers this, so Occupella writes the query. It runs inside a read-only Postgres transaction against views scoped to your company, and anything that is not a single clean SELECT is refused before it executes.",
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
  "Record a move-out — and undo it",
  "Share a file with a tenant or an owner",
];

const HONESTY = [
  {
    t: "A truncated list is never evidence of absence.",
    b: "When a list is cut short, the answer says how many it showed, out of how many, and what it searched — and it is forbidden from concluding that the thing you asked about does not exist.",
  },
  {
    t: "A failed lookup reads as a failed lookup.",
    b: "If Buildium refuses the connection, the answer says the connection is broken. It does not say you have no work orders. The same rule covers a document search that timed out and a specialist that ran out of turns.",
  },
  {
    t: "Every answer carries an as-of line.",
    b: "Answers come from a synced copy of your account, so each one says when that copy was last refreshed. A core table more than 26 hours stale gets a named warning in the answer itself.",
  },
  {
    t: "It says when it ran out of time.",
    b: "A question that runs long stops at a soft deadline and writes up what it had already gathered, labelled as partial and naming what it did not get to. A blank screen is the failure this exists to avoid.",
  },
];

/**
 * ⚠ The Fair Housing section is its own thing on this page rather than a
 * bullet in the trust list (founder direction, 2026-09-04). It is the one
 * guardrail a property manager already loses sleep over, and the
 * decline-then-offer-a-proxy rule below is genuinely uncommon — most products
 * refuse the direct question and then hand over school ratings.
 */
const FAIR_HOUSING = [
  "It will not research or report who lives in an area — race, religion, national origin, familial status, disability, or any proxy for them.",
  "It will not help write a screening rule that turns on a protected class, including source of income where that is protected.",
  "It will not make or draft a decision on a housing application. That tool exists in the codebase and is deliberately switched off.",
  "After it declines, it will not offer school ratings or crime statistics as a substitute — the workaround most systems fall into, and steering either way.",
  "Every outbound message drafted for a resident is screened against the same rules before it reaches the approval card.",
];

const CONTEXT = [
  {
    t: "Tell it something once.",
    b: "“Sarah Chen prefers email only.” “We use Redbud for anything electrical.” It holds that per company and brings it back on a later question, and identifiers are stripped before anything is stored.",
  },
  {
    t: "It builds on what it already flagged.",
    b: "Before it looks anything up it checks what it has noticed about your portfolio — a payment a tenant promised in an email, the reminders it raised about missed rent and expiring leases. “Where do we stand on 4B” continues last week rather than starting over.",
  },
  {
    t: "Ask a follow-up on the card itself.",
    b: "“Has this unit done this before?” “Who did we use last time?” Typed into the card, answered in the card, with that event's property, unit and task already in context.",
  },
  {
    t: "Anything from outside is data, not instruction.",
    b: "A resident's typed work-order description, an email body, a file from Drive, a web snippet — all fenced before the model sees them, so text written by somebody else cannot tell Occupella what to do.",
  },
];

const TRUST = [
  {
    icon: BELL,
    text: "Nothing auto-sends. Every message and every write to Buildium stops at a card showing the exact outbound payload — not a summary of it — which you can edit before approving.",
  },
  {
    icon: CHECK,
    text: "A payment, a charge and closing a work order additionally require a manager or an admin, and refuse outright if the role cannot be verified. Buildium cannot undo any of the three.",
  },
  {
    icon: CHECK,
    text: "Each approved action claims a lock before the Buildium call, so a double-click, a retry or a restart cannot fire the same charge twice. A write that might have half-landed is flagged for review and never retried automatically.",
  },
  {
    icon: SHIELD,
    text: "One company's data never reaches another's. Every query is scoped to your company, and a test reads every query in the codebase to keep it that way.",
  },
  {
    icon: LOCK,
    text: "Your Buildium keys are encrypted at rest, entered once and never shown again. Disconnect and the copy of your data is deleted — there is no keep-my-data mode.",
  },
  {
    icon: LOCK,
    text: "Buildium record numbers, tenant emails and phone numbers are stripped out of the reply as it is written, so an identifier never reaches the screen even briefly.",
  },
];

const CONNECTS = [
  {
    t: "Buildium",
    b: "The system of record. One API key, entered once. Occupella mirrors your account so it can answer without waiting on the API, and writes back only with your approval.",
  },
  {
    t: "Gmail",
    b: "Read a thread for context and send an approved reply from your own address.",
  },
  {
    t: "Google Calendar",
    b: "Check availability and put approved appointments on the calendar.",
  },
  {
    t: "Google Drive",
    b: "Find and read the documents your company already keeps — SOPs, templates, vendor agreements. Docs and Sheets included.",
  },
];

export default function Features() {
  return (
    <SitePageShell
      active="features"
      eyebrow="Features"
      title="Agentic AI for leasing and operations."
      lede={
        <>
          Buildium records what happened. Occupella reads every event as it arrives, gathers the
          history around it, drafts what comes next, and waits for you to approve it. Below is
          what it does, in detail, with the limits named where they exist.
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
                This is the part of the day Buildium leaves to you: something happens, you go and
                find out what else is true about it, and then you write to somebody.
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
            A work order — context gathered, reply drafted, waiting on approval.
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-section-head">
              <div className="lp-eyebrow">Ask it anything</div>
              <h2 className="lp-h2">The morning questions, answered in one go.</h2>
              <p className="lp-body">
                Ask in plain English. The answer comes from a synced copy of your Buildium
                account, so it arrives without crawling the API record by record — and it comes
                back as a table you can sort, not a paragraph with figures pasted into it.
              </p>
            </div>
          </Reveal>
          <Reveal delay={60}>
            <div className="ft-qa">
              {ASKS.map((r) => (
                <div className="ft-qa-row" key={r.q}>
                  <div className="ft-qa-q">{r.q}</div>
                  <div className="ft-qa-a">{r.a}</div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={120}>
            {/* ⚠ This caveat is not optional and not softenable. The
                open-maintenance count is per PROPERTY: Buildium leaves the
                unit id null on every mirrored work order and task, so a
                multi-unit building's count is the building's. On a
                single-unit property the two are identical, which is exactly
                why the over-claim is invisible in a demo. */}
            <div className="ft-note">
              <strong>Two limits worth knowing before you ask.</strong> The open-maintenance
              count on those rows is per property, not per unit — Buildium does not carry the
              unit on a work order, and the answer says so where it matters. And the bills
              Occupella holds are the unpaid ones, so &ldquo;when did we last pay this
              vendor&rdquo; is a question it tells you it cannot answer rather than answering it
              with a zero.
            </div>
          </Reveal>
          <Reveal delay={160}>
            <div className="ft-shot">
              <img
                src="/shots/report.png"
                alt="An owner report in Occupella's chat: a portfolio summary card with collections, revenue, operating expenses and net operating income"
                loading="lazy"
              />
            </div>
          </Reveal>
          <div className="ft-caption">
            An owner report rendered in the thread, with the source of the figures on the card.
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-section-head">
              <div className="lp-eyebrow">Writing back</div>
              <h2 className="lp-h2">It changes Buildium. It asks first, every time.</h2>
              <p className="lp-body">
                Reading is half the job. Occupella writes to your Buildium account as well, behind
                a card that shows the exact record and the exact change before anything leaves.
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
            {/* ⚠ The route-by-field sentence reads like an implementation
                detail and is the most load-bearing claim in this section:
                Buildium accepts a status or priority on the work-order
                endpoint, returns 200, and silently ignores it. A product that
                did the obvious thing would report a change that never
                happened. Do not cut it for length. */}
            <div className="ft-note">
              <strong>Where it routes matters.</strong> Buildium accepts a status or priority
              change on a work order, returns success, and ignores it. Occupella sends each field
              where Buildium actually stores it, updates records by reading and merging so an
              untouched field is never blanked, and on six of these re-reads the record afterwards
              to confirm the field it changed actually moved.
            </div>
          </Reveal>
          <Reveal delay={160}>
            <div className="ft-note">
              <strong>Two things it will not do.</strong> It will not renew a lease — a renewal
              creates a real term with no clean undo, so that one stays with you in Buildium. And
              it cannot reopen a work order once closed: Buildium latches that, and no integration
              can change it. Closing one asks for a manager for the same reason.
            </div>
          </Reveal>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-section-head">
              <div className="lp-eyebrow">The fair housing layer</div>
              <h2 className="lp-h2">The questions it refuses, and the answer it refuses next.</h2>
              <p className="lp-body">
                An assistant that answers everything is a liability in this industry. Occupella
                declines a defined set of questions outright, and the rule that matters most is
                the second one — what it says after it declines.
              </p>
            </div>
          </Reveal>
          <Reveal delay={60}>
            <div className="ft-list">
              {FAIR_HOUSING.map((f) => (
                <div className="ft-list-item" key={f}>
                  <Icon d={SHIELD} size={14} />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="ft-note">
              <strong>It is a guardrail, not a compliance opinion.</strong> Occupella will also
              give you the operational parameters for a property&rsquo;s state — deposit caps and
              return deadlines, notice periods, late-fee rules — with the statute cited and the
              actual calendar date computed. Those are state-level and carry a footer saying they
              are not legal advice. Your lawyer is still your lawyer.
            </div>
          </Reveal>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-section-head">
              <div className="lp-eyebrow">Honesty</div>
              <h2 className="lp-h2">What it says when it does not know.</h2>
              <p className="lp-body">
                The failure that costs you money is not a wrong number. It is a confident
                &ldquo;nothing found&rdquo; when the lookup broke, or a list of five when there
                were forty. Occupella is built to make both of those say so.
              </p>
            </div>
          </Reveal>
          <Reveal delay={60}>
            <div className="lp-grid ft-cards">
              {HONESTY.map((c) => (
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
              <div className="lp-eyebrow">Memory and context</div>
              <h2 className="lp-h2">It remembers, so you are not the memory.</h2>
            </div>
          </Reveal>
          <Reveal delay={60}>
            <div className="lp-grid ft-cards">
              {CONTEXT.map((c) => (
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
              <div className="lp-eyebrow">Leasing</div>
              <span className="ft-status">
                <Icon d={MINUS} size={12} />
                In carrier review
              </span>
              <h2 className="lp-h2">Leads on your own number, once the carriers clear it.</h2>
              {/* ⚠ THE STATUS SENTENCE LEADS. Leasing is code-complete and
                  reachable by nobody: no company on the deployment has a
                  provisioned number, and no A2P registration has completed.
                  Describing the pipeline first and disclosing at the bottom
                  would be selling a section a new customer cannot open. If a
                  future edit moves the disclosure below the fold, it has
                  turned this page into the thing its own header forbids. */}
              <p className="lp-body">
                US carriers vet every business that sends application-to-person texts, and that
                review runs about ten to fifteen days. Nobody on any plan can text a lead before
                it clears, so this section is honest about which half is working today.
              </p>
            </div>
          </Reveal>
          <Reveal delay={60}>
            <div className="lp-grid ft-cards" data-cols="3">
              <div className="ft-card">
                <div className="ft-card-t">Working today: the paperwork.</div>
                <div className="ft-card-b">
                  You fill in your legal business name, whether you have an EIN, your address, an
                  authorised contact, and one consent checkbox. Occupella writes the campaign
                  description, the opt-in language, the sample messages and the public privacy and
                  terms pages the carrier fetches — the four things registrations get rejected
                  over.
                </div>
              </div>
              <div className="ft-card">
                <div className="ft-card-t">Working today: the compliance rails.</div>
                <div className="ft-card-b">
                  A consent ledger you manage yourself, with revocations recorded rather than
                  deleted. STOP honoured across every number you own. Quiet hours computed from
                  the recipient&rsquo;s own state, including the four that are stricter than
                  federal.
                </div>
              </div>
              <div className="ft-card">
                <div className="ft-card-t">At approval: the pipeline opens.</div>
                <div className="ft-card-b">
                  A number belonging to your company — not a shared one — bought and wired
                  automatically the day carriers clear you. Leads arrive by text into a stage
                  board with a drafted first reply, quiet leads flagged, and click-to-call from
                  the browser.
                </div>
              </div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="ft-note">
              <strong>Nothing here answers a lead on its own.</strong> Every outbound text is
              drafted and waits for you, the same as everywhere else in the product. Leasing is
              included on Pro and Scale, and deliberately not on the free trial — the carrier
              review is longer than the trial, so a trial account would get a setup checklist it
              could never finish.
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
          <Reveal delay={120}>
            <div className="ft-note">
              <strong>Also: attach a file to any question.</strong> A lease, an invoice, an
              inspection report — PDF or image, up to 20 MB — and Occupella pulls the fields out,
              including from a scan with no text layer. When your books cannot answer, it searches
              the public web and carries a link back to whatever it based the answer on.
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
    </SitePageShell>
  );
}
