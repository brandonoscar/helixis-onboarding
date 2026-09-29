// ─────────────────────────────────────────────────────────────────────
// PRODUCT CROPS: pieces of the Occupella app, rebuilt in HTML at a size
// you can read, instead of full-app screenshots shrunk until the text is
// grey noise.
//
// ⚠ EVERY CROP COPIES A REAL SCREEN. The layout, labels and colours come
// from the app (AgenticHelixis/frontend: InboxPage, TodayCard, ConfirmCard,
// the table card) and the demo account it records from. The one work order
// (AC not cooling, unit 4B, 128 Lexington Ave, Maria Alvarez) runs through
// every crop, so the pages tell one consistent story. Before adding a crop,
// find the screen it copies. A crop of something the app does not show is
// a claim the product cannot back.
//
// ⚠ The app's own blue (#1E73BC) is used INSIDE crops, not the site's
// #1957A0: a crop shows the product as it looks, and a customer compares.
// The app's fonts are not: marketing pages use only the two site faces and no monospace
// (PR 2 rule), so the app's mono labels are set in IBM Plex Sans caps.
//
// ⚠ The approval card is a picture of a real gate, not the "approval
// before every write" claim, which stays held until the autonomous-notes
// flag is confirmed off. It shows one gated action; it says nothing about
// all of them.
// ─────────────────────────────────────────────────────────────────────

export const cropCss = `
  .cr {
    --app-blue: #1E73BC;
    --app-blue-soft: rgba(30, 115, 188, 0.12);
    --app-line: rgba(14, 22, 32, 0.10);
    --app-raised: #F4F8FD;
    --caution: #A8631A;
    --caution-bg: #FAF0E1;
    --danger: #B3261E;
    --danger-bg: #F9E9E7;
    background: #fff;
    border: 1px solid rgba(14, 22, 32, 0.12);
    border-radius: 8px;
    box-shadow: 0 10px 28px -12px rgba(14, 22, 32, 0.20);
    color: var(--ink);
    font-size: 15px;
    line-height: 1.5;
    text-align: left;
    overflow: hidden;
  }
  .cr-cap {
    font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
  }
  .cr-pill {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 2px 8px; border-radius: 4px;
    font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
  }
  .cr-pill[data-k="new"] { background: var(--danger-bg); color: var(--danger); }
  .cr-pill[data-k="maint"] { background: var(--caution-bg); color: var(--caution); }
  .cr-pill[data-k="late"] { background: var(--caution-bg); color: var(--caution); text-transform: none; letter-spacing: 0; font-weight: 500; }
  .cr-muted { color: var(--ink-muted); }
  .cr-btn {
    display: inline-flex; align-items: center; height: 34px; padding: 0 14px;
    border-radius: 6px; font-size: 14px; font-weight: 500;
    border: 1px solid var(--app-line); background: #fff; color: var(--ink);
  }
  .cr-btn[data-k="primary"] { background: var(--app-blue); border-color: var(--app-blue); color: #fff; }
  .cr-btn[data-k="soft"] { background: var(--app-blue-soft); border-color: rgba(30, 115, 188, 0.3); color: var(--app-blue); }

  /* inbox list card */
  .cr-wo { padding: 18px 20px; border-left: 3px solid var(--app-blue); }
  .cr-wo-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .cr-wo-t { margin-top: 10px; font-size: 18px; font-weight: 600; line-height: 1.3; }
  .cr-wo-b { margin-top: 6px; color: var(--ink-muted); }
  .cr-wo-foot {
    margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--app-line);
    display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 14px; color: var(--ink-muted);
  }
  .cr-wo-warn { margin-top: 10px; font-size: 14px; color: var(--caution); }

  /* detail header + summary */
  .cr-head { padding: 20px 22px; }
  .cr-head-t { font-size: 22px; font-weight: 600; line-height: 1.25; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  .cr-head-m { margin-top: 6px; font-size: 14px; color: var(--ink-muted); }
  .cr-box { margin-top: 16px; padding: 16px 18px; border: 1px solid var(--app-line); border-radius: 8px; }
  .cr-box .cr-cap { color: var(--ink-muted); }
  .cr-box p { margin-top: 8px; }
  .cr-hl { color: var(--app-blue); }
  .cr-chips { margin-top: 14px; display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 14px; }

  /* what it noticed */
  .cr-noticed { padding: 20px 22px; }
  .cr-noticed .cr-cap { color: var(--app-blue); }
  .cr-noticed ul { margin-top: 12px; display: flex; flex-direction: column; gap: 10px; list-style: none; }
  .cr-noticed li { display: flex; gap: 10px; }
  .cr-noticed li::before {
    content: ""; flex: none; width: 7px; height: 7px; border-radius: 50%;
    margin-top: 9px; background: var(--app-blue);
  }
  .cr-noticed li[data-k="caution"]::before { background: var(--caution); }

  /* drafted next step */
  .cr-next { padding: 20px 22px; background: var(--app-raised); }
  .cr-next-h { font-size: 16px; font-weight: 600; }
  .cr-tabs { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 6px; }
  .cr-tab { padding: 5px 10px; border: 1px solid var(--app-line); border-radius: 6px; background: #fff; font-size: 13.5px; }
  .cr-tab[data-on="true"] { background: var(--app-blue-soft); border-color: rgba(30, 115, 188, 0.35); color: var(--app-blue); }
  .cr-draft { margin-top: 12px; padding: 14px 16px; background: #fff; border: 1px solid var(--app-line); border-radius: 8px; }
  .cr-draft-t { font-weight: 600; }
  .cr-draft-why { margin-top: 2px; font-size: 14px; color: var(--ink-muted); }
  .cr-text { margin-top: 10px; padding: 10px 12px; border: 1px solid var(--app-line); border-radius: 6px; min-height: 64px; }
  .cr-draft .cr-btn { margin-top: 12px; }

  /* approval card: the one card in the app with an amber edge */
  .cr.cr-confirm { border-color: var(--caution); }
  .cr-confirm-h { display: flex; gap: 10px; align-items: center; padding: 11px 16px; background: var(--caution-bg); border-bottom: 1px solid var(--app-line); }
  .cr-confirm-h .cr-cap { color: var(--caution); }
  .cr-confirm-h b { font-weight: 600; font-size: 15px; }
  .cr-confirm-b { padding: 14px 16px; }
  .cr-confirm-b ul { margin-top: 10px; list-style: none; display: flex; flex-direction: column; gap: 4px; font-size: 14px; }
  .cr-confirm-b li { display: flex; gap: 8px; }
  .cr-confirm-b li::before { content: ""; flex: none; width: 4px; height: 4px; border-radius: 50%; margin-top: 9px; background: var(--ink-faint); }
  .cr-confirm-f { display: flex; justify-content: flex-end; gap: 8px; padding: 11px 16px; border-top: 1px solid var(--app-line); }

  /* table card */
  .cr-table-h { padding: 14px 18px; font-weight: 600; background: var(--app-raised); border-bottom: 1px solid var(--app-line); }
  .cr-table-scroll { overflow-x: auto; }
  .cr table { width: 100%; border-collapse: collapse; font-size: 14px; font-variant-numeric: tabular-nums; }
  .cr th, .cr td { padding: 11px 18px; text-align: left; border-bottom: 1px solid var(--app-line); white-space: nowrap; }
  .cr tr:last-child td { border-bottom: 0; }
  .cr th { font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-muted); }
  .cr td.num, .cr th.num { text-align: right; }

  /* two crops overlapping, the top one lifted: the second sits over the
     lower-right corner of the first, in normal flow so the pair's height is
     real and nothing below it has to guess. */
  .cr-stack { display: flex; flex-direction: column; }
  .cr-stack > :first-child { width: 84%; }
  .cr-stack > :last-child {
    position: relative; z-index: 1;
    width: 78%; align-self: flex-end; margin-top: -64px;
    box-shadow: 0 22px 48px -18px rgba(14, 22, 32, 0.32);
  }
  @media (max-width: 640px) {
    .cr-stack > :first-child { width: auto; }
    .cr-stack > :last-child { width: auto; margin-top: 14px; }
  }
  .cr-note { margin-top: 12px; font-size: 14px; color: var(--ink-muted); }

  /* numbered markers placed on parts of a crop (home, "How it works") */
  .cr.cr-marked { position: relative; overflow: visible; }
  .cr-marked .cr-detail-next { border-radius: 0 0 8px 8px; }
  .cr-mark {
    position: absolute; left: -13px; top: 14px; z-index: 2;
    width: 26px; height: 26px; border-radius: 50%;
    display: grid; place-items: center;
    background: #1957A0; color: #fff; font-size: 13px; font-weight: 600;
    box-shadow: 0 0 0 3px #fff;
  }
  .cr-detail-next { padding: 16px 22px 20px; background: var(--app-raised); border-top: 1px solid var(--app-line); }
  .cr-detail-next .cr-text { background: #fff; min-height: 0; }
  .cr-detail-next .cr-btn { margin-top: 12px; }

  /* a Today row: the reminders strip at the top of the Inbox */
  .cr-today { padding: 12px 16px; }
  .cr-today-t { font-weight: 600; font-size: 15px; }
  .cr-today-s { font-size: 14px; color: var(--ink-muted); }
  /* the Leasing board (CrmPage): five stage columns of lead cards */
  .cr-board-scroll { overflow-x: auto; }
  .cr-board { display: grid; grid-template-columns: repeat(5, minmax(170px, 1fr)); gap: 12px; padding: 16px; min-width: 900px; background: var(--app-raised); }
  .cr-col-h { display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; color: var(--ink-muted); padding: 0 2px 8px; }
  .cr-col { display: flex; flex-direction: column; gap: 8px; }
  .cr-lead { background: #fff; border: 1px solid var(--app-line); border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; }
  .cr-lead-top { display: flex; align-items: center; gap: 8px; }
  .cr-av { width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; font-size: 11px; font-weight: 600; background: var(--app-blue-soft); color: var(--app-blue); flex: none; }
  .cr-lead-n { font-size: 14px; font-weight: 600; }
  .cr-lead-u { font-size: 13px; color: var(--ink-muted); }
  .cr-lead-note { font-size: 13px; line-height: 1.4; color: var(--ink-subtle); }
  .cr-chips-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; margin-top: 2px; }
  .cr-chip { font-size: 11px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; background: rgba(14, 22, 32, 0.05); color: var(--ink-subtle); }
  .cr-chip[data-k="you"] { background: var(--app-blue-soft); color: var(--app-blue); }
  .cr-moved { font-size: 12px; color: var(--ink-faint); }

  /* a lead's drawer: what it noticed, then the drafted reply */
  .cr-drawer { padding: 20px 22px; }
  .cr-drawer-h { display: flex; align-items: center; gap: 4px 10px; flex-wrap: wrap; }
  .cr-drawer-h > .cr-muted { flex-basis: 100%; }
  @media (min-width: 641px) { .cr-drawer-h > .cr-muted { flex-basis: auto; } }
  .cr-drawer-h b { font-size: 18px; }
  .cr-drawer .cr-noticed { padding: 16px 0 0; }
  .cr-drawer .cr-text { background: #fff; }

  /* the "going cold" list */
  .cr-cold-h { padding: 12px 16px; font-weight: 600; border-bottom: 1px solid var(--app-line); background: var(--app-raised); }
  .cr-cold-row { display: flex; justify-content: space-between; gap: 12px; padding: 11px 16px; border-bottom: 1px solid var(--app-line); font-size: 14px; }
  .cr-cold-row:last-child { border-bottom: 0; }

  /* the email draft card (show_email_draft): To, Subject, body, and the
     numbered approaches the user slides through */
  .cr-mail { padding: 18px 20px; }
  .cr-mail-f { display: flex; gap: 10px; font-size: 14px; padding: 6px 0; border-bottom: 1px solid var(--app-line); }
  .cr-mail-f span:first-child { width: 64px; color: var(--ink-muted); flex: none; }
  .cr-mail .cr-tabs { margin: 0 0 12px; }
  .cr-mail-body { margin-top: 12px; font-size: 15px; line-height: 1.55; white-space: pre-line; }
  /* property snapshot (property_snapshot tool / PropertyCockpit) */
  .cr-snap { padding: 18px 20px; }
  .cr-snap-h { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; flex-wrap: wrap; }
  .cr-snap-h b { font-size: 18px; }
  .cr-kv { margin-top: 14px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; background: var(--app-line); border: 1px solid var(--app-line); border-radius: 8px; overflow: hidden; }
  @media (min-width: 560px) { .cr-kv { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  .cr-kv > div { background: #fff; padding: 10px 12px; }
  .cr-kv span { display: block; font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-muted); }
  .cr-kv b { display: block; margin-top: 2px; font-size: 16px; font-variant-numeric: tabular-nums; }
  .cr-asof { margin-top: 12px; font-size: 13px; color: var(--ink-muted); }
`;

/** A crop is a picture of the app. Screen readers get its label, not its rows. */
function Crop({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`cr ${className}`} role="img" aria-label={label}>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

export function WorkOrderCard() {
  return (
    <Crop label="An Inbox card for a new maintenance request: AC not cooling in unit 4B, flagged as the third similar issue in 90 days." className="cr-wo">
      <div className="cr-wo-top">
        <span className="cr-pill" data-k="new">New</span>
        <span className="cr-pill" data-k="maint">Maintenance</span>
        <span className="cr-muted" style={{ fontSize: 14 }}>6/27/2026</span>
      </div>
      <div className="cr-wo-t">AC not cooling — unit 4B — Maria Alvarez</div>
      <div className="cr-wo-b">
        Maria Alvarez in unit 4B reports the AC has not cooled in three days — the third HVAC
        ticket at this unit in 90 days.
      </div>
      <div className="cr-wo-foot">
        <span>128 Lexington Ave #4B</span>
        <span>Dana Whitfield</span>
      </div>
      <div className="cr-wo-warn">3rd similar issue in 90 days</div>
    </Crop>
  );
}

export function HistoryCrop() {
  return (
    <Crop label="The work order opened: who reported it, when, the address, and a summary that already counts the prior HVAC tickets at the unit." className="cr-head">
      <div className="cr-head-t">
        AC not cooling — unit 4B <span className="cr-pill" data-k="new">New</span>
      </div>
      <div className="cr-head-m">Reported by Maria Alvarez · 6/27/2026 · 128 Lexington Ave #4B</div>
      <div className="cr-box">
        <div className="cr-cap">Summary</div>
        <p>
          <span className="cr-hl">Maria Alvarez</span> in <span className="cr-hl">unit 4B</span>{" "}
          reported the AC <b>has not been cooling for three days</b> — the third HVAC ticket on
          this unit in 90 days.
        </p>
      </div>
      <div className="cr-chips">
        <span style={{ color: "var(--caution)" }}>High</span>
        <span>HVAC</span>
        <span>Dana Whitfield</span>
        <span>128 Lexington Ave #4B</span>
      </div>
    </Crop>
  );
}

export function NoticedCrop() {
  return (
    <Crop label="What Occupella noticed: the third HVAC ticket in 90 days, $1,240 owed with no rent posted this month, and the lease ending in 41 days." className="cr-noticed">
      <div className="cr-cap">What Occupella noticed</div>
      <ul>
        <li data-k="caution">Third HVAC ticket at unit 4B in the last 90 days.</li>
        <li>The lease owes $1,240. No rent has posted this month.</li>
        <li>The lease ends in 41 days.</li>
      </ul>
    </Crop>
  );
}

export function DraftCrop() {
  return (
    <Crop label="Three drafted next steps for the work order. The first, a message to Maria with a service ETA, is open for editing." className="cr-next">
      <div className="cr-next-h">Here&rsquo;s what I&rsquo;d do next</div>
      <div className="cr-tabs">
        <span className="cr-tab" data-on="true">1 Message Maria with an ETA</span>
        <span className="cr-tab">2 Open an HVAC work order</span>
        <span className="cr-tab">3 Note the 90-day pattern</span>
      </div>
      <div className="cr-draft">
        <div className="cr-draft-t">Message Maria with an ETA</div>
        <div className="cr-draft-why">Acknowledge the AC issue and give Maria a service ETA</div>
        <div className="cr-text">
          Hi Maria — sorry about the AC. I&rsquo;m getting a technician scheduled and will
          confirm a window shortly.
        </div>
        <span className="cr-btn" data-k="soft">Send to Maria</span>
      </div>
    </Crop>
  );
}

/** ConfirmCard for `buildium_create_work_order`, with the title and item
 *  format buildium_tools.py builds. IDs are the demo account's. */
export function ApprovalCrop() {
  return (
    <Crop label="An approval card: create a work order in Buildium, listing the title, property, vendor, assignee, priority and unit, with Cancel and Approve." className="cr-confirm">
      <div className="cr-confirm-h">
        <span className="cr-cap">Confirm</span>
        <b>Create a work order in Buildium?</b>
      </div>
      <div className="cr-confirm-b">
        <div className="cr-muted" style={{ fontSize: 14 }}>
          Create a work order in Buildium: &ldquo;AC not cooling — unit 4B&rdquo;.
        </div>
        <ul>
          <li>Title: AC not cooling — unit 4B</li>
          <li>Property: 1042</li>
          <li>Vendor: 318</li>
          <li>Assigned to: 27</li>
          <li>Priority: High</li>
          <li>Unit: 5561</li>
        </ul>
      </div>
      <div className="cr-confirm-f">
        <span className="cr-btn">Cancel</span>
        <span className="cr-btn" data-k="primary">Approve</span>
      </div>
    </Crop>
  );
}

export function DelinquencyCrop() {
  return (
    <Crop label="An answer to who is behind on rent: each lease with its balance, how late it is, and the open maintenance at that address.">
      <div className="cr-table-h">3 leases with a balance</div>
      <div className="cr-table-scroll">
        <table>
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Unit</th>
              <th className="num">Owed</th>
              <th>Aging</th>
              <th className="num">Open work</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Maria Alvarez</td>
              <td>128 Lexington #4B</td>
              <td className="num">$1,240.00</td>
              <td><span className="cr-pill" data-k="late">31–60</span></td>
              <td className="num">1</td>
            </tr>
            <tr>
              <td>James Okafor</td>
              <td>128 Lexington #2A</td>
              <td className="num">$1,840.00</td>
              <td><span className="cr-pill" data-k="late">31–60</span></td>
              <td className="num">0</td>
            </tr>
            <tr>
              <td>James Chen</td>
              <td>14 Garden Row #3</td>
              <td className="num">$940.00</td>
              <td><span className="cr-pill" data-k="late">61–90</span></td>
              <td className="num">2</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Crop>
  );
}

/**
 * The work order opened, top to bottom: the Buildium event, what Occupella
 * gathered, and the drafted next step with its button. The numbers are the
 * home page's three steps, placed on the part of the screen each one is.
 */
export function WorkOrderDetailCrop() {
  return (
    <Crop
      label="A work order in Occupella: (1) the Buildium event, AC not cooling in unit 4B; (2) what Occupella noticed around it; (3) a drafted reply to the tenant with a send button."
      className="cr-marked"
    >
      <div className="cr-head" style={{ position: "relative" }}>
        <span className="cr-mark">1</span>
        <div className="cr-head-t">
          AC not cooling — unit 4B <span className="cr-pill" data-k="new">New</span>
        </div>
        <div className="cr-head-m">Reported by Maria Alvarez · 6/27/2026 · 128 Lexington Ave #4B</div>
      </div>
      <div className="cr-noticed" style={{ position: "relative", paddingTop: 4 }}>
        <span className="cr-mark" style={{ top: 2 }}>2</span>
        <div className="cr-cap">What Occupella noticed</div>
        <ul>
          <li data-k="caution">Third HVAC ticket at unit 4B in the last 90 days.</li>
          <li>The lease owes $1,240. No rent has posted this month.</li>
          <li>The lease ends in 41 days.</li>
        </ul>
      </div>
      <div className="cr-detail-next" style={{ position: "relative" }}>
        <span className="cr-mark">3</span>
        <div className="cr-next-h">Message Maria with an ETA</div>
        <div className="cr-text">
          Hi Maria — sorry about the AC. I&rsquo;m getting a technician scheduled and will
          confirm a window shortly.
        </div>
        <span className="cr-btn" data-k="soft">Send to Maria</span>
      </div>
    </Crop>
  );
}

/** One row of the Inbox's Today strip. Titles are the reminder producers'
 *  own formats (AgenticHelixis reminders/producers.py). */
export function TodayRow({ title, sub, label }: { title: string; sub?: string; label: string }) {
  return (
    <Crop label={label} className="cr-today">
      <div className="cr-today-t">{title}</div>
      {sub ? <div className="cr-today-s">{sub}</div> : null}
    </Crop>
  );
}

type Lead = { i: string; n: string; u: string; note?: string; you?: boolean; bld?: boolean; moved?: string };

/**
 * The Leasing board, with the demo account's leads (AgenticHelixis
 * frontend/src/services/demoData.ts demoCrmBoard). Only the moves the code
 * makes are shown: a sent reply moves a lead to Contacted
 * (POST /crm/leads/{id}/reply), and a Buildium applicant moves to Applied or
 * Leased (webhooks/handlers/applicants.py). The demo's calendar-booked tour
 * move is left out: it is not confirmed in the backend.
 */
const BOARD: { stage: string; leads: Lead[] }[] = [
  { stage: "New", leads: [{ i: "JR", n: "Jordan Reyes", u: "Maple Court 4B", note: "Asked if 4B is still available. Could tour this weekend.", you: true }] },
  {
    stage: "Contacted",
    leads: [
      { i: "ED", n: "Elena Duarte", u: "Maple Court 4B", note: "Pet policy and parking answered. Awaiting her reply." },
      { i: "RB", n: "Renee Bishop", u: "Owner · 6 doors", note: "Intro and rates one-pager sent." },
    ],
  },
  { stage: "Scheduled", leads: [{ i: "TN", n: "Tara Nguyen", u: "Riverside 2A", note: "Tour booked for Saturday, 2:00 PM." }] },
  { stage: "Applied", leads: [{ i: "SO", n: "Sam Okafor", u: "Riverside 3A", note: "Application received.", bld: true }] },
  { stage: "Leased", leads: [{ i: "LF", n: "Leo Franklin", u: "Riverside 3C", note: "Lease signed.", bld: true, moved: "moved 9:14a" }] },
];

export function LeadBoardCrop() {
  return (
    <Crop label="The Leasing board: leads in five stages, New, Contacted, Scheduled, Applied and Leased, each card with the lead's name, unit and latest note.">
      <div className="cr-board-scroll">
        <div className="cr-board">
          {BOARD.map((c) => (
            <div key={c.stage}>
              <div className="cr-col-h">
                <span>{c.stage}</span>
                <span>{c.leads.length}</span>
              </div>
              <div className="cr-col">
                {c.leads.map((l) => (
                  <div className="cr-lead" key={l.n}>
                    <div className="cr-lead-top">
                      <span className="cr-av">{l.i}</span>
                      <span className="cr-lead-n">{l.n}</span>
                    </div>
                    <span className="cr-lead-u">{l.u}</span>
                    {l.note ? <span className="cr-lead-note">{l.note}</span> : null}
                    {l.you || l.bld || l.moved ? (
                      <div className="cr-chips-row">
                        {l.you ? <span className="cr-chip" data-k="you">Needs you</span> : null}
                        {l.bld ? <span className="cr-chip">In Buildium</span> : null}
                        {l.moved ? <span className="cr-moved">{l.moved}</span> : null}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Crop>
  );
}

/** A lead's drawer: the draft route's signals and drafted reply, from the
 *  demo account's Jordan Reyes. */
export function LeadDraftCrop() {
  return (
    <Crop label="A lead's drawer: what Occupella noticed about Jordan Reyes, and a drafted reply offering two tour times, with a Send button." className="cr-drawer">
      <div className="cr-drawer-h">
        <span className="cr-av">JR</span>
        <b>Jordan Reyes</b>
        <span className="cr-muted" style={{ fontSize: 14 }}>Maple Court 4B · New</span>
      </div>
      <div className="cr-noticed">
        <div className="cr-cap">What Occupella noticed</div>
        <ul>
          <li>Asking if Maple Court 4B is still available</li>
          <li>Wants to tour this weekend</li>
        </ul>
      </div>
      <div className="cr-text" style={{ marginTop: 16 }}>
        Hi Jordan! Yes, 4B is still available — I&rsquo;d be happy to show it to you this weekend.
        I have Saturday at 2pm or Sunday at 11am open. Which works better for you?
      </div>
      <span className="cr-btn" data-k="primary" style={{ marginTop: 12 }}>Send</span>
    </Crop>
  );
}

/** The cold-leads list: active leads quiet for 3+ days, coldest first
 *  (GET /crm/leads/cold). */
export function ColdLeadsCrop() {
  return (
    <Crop label="Two leads going cold: Jordan Reyes, quiet for 4 days, and Elena Duarte, quiet for 3 days.">
      <div className="cr-cold-h">2 leads are going cold</div>
      <div className="cr-cold-row">
        <span><b>Jordan Reyes</b> <span className="cr-muted">· Maple Court 4B</span></span>
        <span className="cr-muted">4 days quiet</span>
      </div>
      <div className="cr-cold-row">
        <span><b>Elena Duarte</b> <span className="cr-muted">· Maple Court 4B</span></span>
        <span className="cr-muted">3 days quiet</span>
      </div>
    </Crop>
  );
}

/**
 * The email draft card (visual_tools.py show_email_draft): 2 to 4 approaches
 * the model names itself, To / Subject / body, sent through Gmail behind the
 * approval card. The labels and the letter are example data.
 */
export function EmailDraftCrop() {
  return (
    <Crop label="A drafted late-rent email to Maria Alvarez with three approaches: a friendly reminder, a firmer reminder and an offer of a payment plan. The friendly reminder is open." className="cr-mail">
      <div className="cr-tabs">
        <span className="cr-tab" data-on="true">1 Friendly reminder</span>
        <span className="cr-tab">2 Firmer reminder</span>
        <span className="cr-tab">3 Offer a payment plan</span>
      </div>
      <div className="cr-mail-f"><span>To</span><span>maria.alvarez@example.com</span></div>
      <div className="cr-mail-f"><span>Subject</span><span>October rent for 128 Lexington Ave #4B</span></div>
      <div className="cr-mail-body">
        {"Hi Maria,\n\nA quick note that we haven't seen October's rent come through yet. The balance on the lease is $1,240. If it's already on the way, thank you and please ignore this.\n\nThe AC technician is booked, and we'll confirm the window shortly."}
      </div>
    </Crop>
  );
}

/**
 * One property (mirror_tools.py property_snapshot): occupancy, rent roll
 * scheduled vs collected this month, open work orders, delinquency and the
 * next lease expiration. The $3,080 owed is the two 128 Lexington leases in
 * DelinquencyCrop ($1,240 + $1,840), so the pages agree with each other.
 */
export function PropertySnapshotCrop() {
  return (
    <Crop label="A property snapshot for Lexington Court: 11 of 12 units occupied, $19,800 rent scheduled and $16,720 collected this month, 4 open work orders, $3,080 delinquent across 2 leases, next lease ending in 41 days." className="cr-snap">
      <div className="cr-snap-h">
        <b>Lexington Court</b>
        <span className="cr-muted" style={{ fontSize: 14 }}>128 Lexington Ave</span>
      </div>
      <div className="cr-kv">
        <div><span>Occupancy</span><b>11 / 12</b></div>
        <div><span>Rent scheduled</span><b>$19,800</b></div>
        <div><span>Collected</span><b>$16,720</b></div>
        <div><span>Open work orders</span><b>4</b></div>
        <div><span>Delinquent</span><b>$3,080 · 2 leases</b></div>
        <div><span>Next lease ends</span><b>in 41 days</b></div>
      </div>
      <div className="cr-asof">From your Buildium data, synced 6 minutes ago.</div>
    </Crop>
  );
}

/**
 * Billed vendor spend by GL category (mirror_tools.py spending_report).
 * Amounts are billed, not paid. The category totals match the demo
 * vendors' 12-month billing.
 */
export function SpendCrop() {
  const rows: [string, string][] = [
    ["Roofing", "$21,150"],
    ["Plumbing", "$18,240"],
    ["HVAC", "$12,960"],
    ["Landscaping", "$8,640"],
    ["Electrical", "$4,310"],
  ];
  return (
    <Crop label="Billed vendor spend over the last 365 days by category: roofing $21,150, plumbing $18,240, HVAC $12,960, landscaping $8,640, electrical $4,310, total $65,300.">
      <div className="cr-table-h">Billed spend by category, last 365 days</div>
      <div className="cr-table-scroll">
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th className="num">Billed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([c, v]) => (
              <tr key={c}>
                <td>{c}</td>
                <td className="num">{v}</td>
              </tr>
            ))}
            <tr>
              <td><b>Total</b></td>
              <td className="num"><b>$65,300</b></td>
            </tr>
          </tbody>
        </table>
      </div>
    </Crop>
  );
}

/** An owner update in the email draft card, built from the snapshot above.
 *  The letter is example data. */
export function OwnerEmailCrop() {
  return (
    <Crop label="A drafted owner update to Priya Nair about Lexington Court: occupancy, rent collected, the open AC work order and the two leases behind." className="cr-mail">
      <div className="cr-mail-f"><span>To</span><span>priya.nair@example.com</span></div>
      <div className="cr-mail-f"><span>Subject</span><span>Lexington Court, this month</span></div>
      <div className="cr-mail-body">
        {"Hi Priya,\n\nLexington Court is 11 of 12 units occupied. We've collected $16,720 of the $19,800 scheduled this month, and two leases owe a combined $3,080. We're following up with both.\n\nThere are 4 open work orders, including the AC in unit 4B, which is the third HVAC call there in 90 days. A technician is being scheduled."}
      </div>
    </Crop>
  );
}
