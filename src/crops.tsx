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
              <td className="num">$2,180.00</td>
              <td><span className="cr-pill" data-k="late">61–90</span></td>
              <td className="num">2</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Crop>
  );
}
