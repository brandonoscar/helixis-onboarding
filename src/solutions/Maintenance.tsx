import { CHECK, Icon, Reveal, SitePageShell } from "../Site";
import { ApprovalCrop, TodayRow, WorkOrderCard, WorkOrderDetailCrop, cropCss } from "../crops";

// ─────────────────────────────────────────────────────────────────────
// /solutions/maintenance: one job, a maintenance request from the report
// to the reply and the work order.
//
// ⚠ EVERY LINE IS CHECKED AGAINST AgenticHelixis. What each section rests
// on:
//   · the card before the AI, the 90-day history, checked numbers, drafted
//     next steps: the same facts as /features "How an event is handled"
//   · the Buildium writes: registered, confirm-gated tools only (the list on
//     /features); closing a work order needs a manager or an admin
//   · "N work orders stalled over 7 days": db/repositories/morning_brief.py
//     (open work orders not updated in STALLED_AFTER_DAYS = 7)
//   · "N overdue tasks at <property>", "Oldest is N days past due":
//     reminders/producers.py tasks_overdue
//   · follow-up questions on the card, per-company memory: /features
//
// ⚠ NOT CLAIMED, each is real code and not a feature (see Features.tsx):
// photo assessment, "find a plumber near this property", vendor payment
// history, reopening a completed work order.
// ─────────────────────────────────────────────────────────────────────

const css = `
  .mt-split { display: grid; gap: 40px; margin-top: 48px; align-items: start; }
  @media (min-width: 1024px) {
    .mt-split { grid-template-columns: 5fr 6fr; gap: 72px; }
    .mt-split[data-flip="true"] { grid-template-columns: 6fr 5fr; }
    .mt-split[data-flip="true"] > :first-child { order: 2; }
  }
  .mt-steps { display: flex; flex-direction: column; gap: 28px; }
  .mt-step { border-top: 1px solid var(--line); padding-top: 20px; }
  .mt-step-n {
    display: inline-grid; place-items: center; width: 26px; height: 26px; border-radius: 50%;
    background: var(--iris); color: #fff; font-size: 13px; font-weight: 600;
  }
  .mt-step-t { margin-top: 10px; font-size: 18px; font-weight: 600; color: var(--ink); }
  .mt-step-b { margin-top: 8px; font-size: 16px; line-height: 1.6; color: var(--ink-muted); }
  .mt-vis { padding-left: 14px; }
  .mt-list { margin-top: 28px; display: flex; flex-direction: column; }
  .mt-li {
    display: flex; gap: 12px; align-items: flex-start;
    padding: 12px 0; border-top: 1px solid var(--line);
    font-size: 17px; line-height: 1.5; color: var(--ink);
  }
  .mt-li svg { flex: none; margin-top: 4px; color: var(--ink-muted); }
  .mt-note { margin-top: 20px; font-size: 15px; line-height: 1.6; color: var(--ink-muted); max-width: 56ch; }
  .mt-band { margin-top: clamp(80px, 10vw, 128px); padding: clamp(64px, 8vw, 104px) 0; background: var(--band); }
  .mt-today { display: flex; flex-direction: column; gap: 12px; }
  .mt-blocks { display: grid; gap: 32px 48px; margin-top: 40px; }
  @media (min-width: 1024px) { .mt-blocks { grid-template-columns: repeat(3, 1fr); } }
  .mt-block { border-top: 1px solid var(--line); padding-top: 20px; }
  .mt-block-t { font-size: 18px; font-weight: 600; line-height: 1.4; color: var(--ink); }
  .mt-block-b { margin-top: 8px; font-size: 16px; line-height: 1.6; color: var(--ink-muted); }
  .mt-caption { margin-top: 12px; font-size: 14px; color: var(--ink-muted); }
`;

const STEPS = [
  {
    n: "1",
    t: "The card appears within seconds",
    b: "A resident reports a problem in Buildium. Occupella verifies the webhook and builds a readable card from the record: title, address and unit, who reported it and who it is assigned to.",
  },
  {
    n: "2",
    t: "It pulls the unit's history",
    b: "The task, the unit, the active lease and its tenants, and ninety days of prior tickets at that address. Any number it shows is checked against the record first, like the third HVAC ticket in 90 days.",
  },
  {
    n: "3",
    t: "It drafts the next steps",
    b: "A reply to the resident, a work order for the vendor, a note about the pattern. Each is written out with the reason it was suggested, and you can edit every word.",
  },
];

const WRITES = [
  "Create a work order and assign a vendor",
  "Reassign a work order to a different vendor",
  "Change a task's status, priority or due date",
  "Add a note to a task, a work order or a vendor",
  "Close a work order (a manager or an admin)",
  "Share a file with a tenant or an owner",
];

const ASK = [
  {
    t: "Ask on the card",
    b: "“Has this unit done this before?” “Who did we use last time?” Typed into the card and answered there, with the property, unit and task already in context.",
  },
  {
    t: "Tell it your vendors once",
    b: "“We use Redbud for anything electrical.” It keeps that for your company and brings it back the next time an electrical request comes in.",
  },
  {
    t: "Ask across the portfolio",
    b: "“What is overdue?” lists open tasks (new, in progress and deferred) with priority, property, assignee and due date, overdue first.",
  },
];

export default function Maintenance() {
  return (
    <SitePageShell
      active="solutions"
      title="Maintenance requests, from the first report to the work order"
      lede={
        <>
          When a resident reports a problem in Buildium, Occupella builds the card, pulls the
          unit&rsquo;s history and drafts the reply and the work order. You edit them, pick the
          vendor and send.
        </>
      }
      css={css + cropCss}
      close={{
        title: "Try Occupella free for 14 days",
        body: "Connect Buildium and watch it handle a real work order from your account. No card to start.",
      }}
    >
      <section className="lp-section" style={{ paddingTop: 72 }}>
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-section-head">
              <h2 className="lp-h2">From report to drafted reply</h2>
            </div>
          </Reveal>
          <div className="mt-split">
            <div className="mt-steps">
              {STEPS.map((s) => (
                <div className="mt-step" key={s.n}>
                  <span className="mt-step-n">{s.n}</span>
                  <h3 className="mt-step-t">{s.t}</h3>
                  <p className="mt-step-b">{s.b}</p>
                </div>
              ))}
            </div>
            <div className="mt-vis">
              <WorkOrderDetailCrop />
              <p className="mt-caption">One work order in Occupella, with example data.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-band">
        <div className="lp-wrap">
          <div className="mt-split" data-flip="true" style={{ marginTop: 0 }}>
            <div>
              <Reveal>
                <div className="lp-section-head">
                  <h2 className="lp-h2">Changes it can make in Buildium</h2>
                  <p className="lp-body">
                    Occupella writes to your Buildium account too. For maintenance, these are
                    the changes it can make.
                  </p>
                </div>
              </Reveal>
              <div className="mt-list">
                {WRITES.map((w) => (
                  <div className="mt-li" key={w}>
                    <Icon d={CHECK} size={15} />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
              <p className="mt-note">
                A completed work order can&rsquo;t be reopened. Buildium locks it, and no API can
                undo that, so Occupella doesn&rsquo;t offer it.
              </p>
            </div>
            <div>
              <div className="cr-stack">
                <WorkOrderCard />
                <ApprovalCrop />
              </div>
              <p className="mt-caption">The approval card for a new work order, with example data.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <div className="mt-split" style={{ marginTop: 0 }}>
            <Reveal>
              <div className="lp-section-head">
                <h2 className="lp-h2">Work that has stalled</h2>
                <p className="lp-body">
                  The Today strip at the top of your Inbox counts open work orders with no update
                  in 7 days, and groups overdue tasks by property so a messy week is one line per
                  building.
                </p>
              </div>
            </Reveal>
            <div className="mt-today">
              <TodayRow
                title="4 work orders stalled over 7 days"
                sub="No update from anyone — residents are waiting."
                label="A Today reminder: 4 work orders stalled over 7 days."
              />
              <TodayRow
                title="4 overdue tasks at Garden Row"
                sub="Oldest is 9 days past due."
                label="A Today reminder: 4 overdue tasks at Garden Row, the oldest 9 days past due."
              />
              <p className="mt-caption">Two Inbox reminders, with example data.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-section-head">
              <h2 className="lp-h2">Questions about a unit or a vendor</h2>
            </div>
          </Reveal>
          <div className="mt-blocks">
            {ASK.map((c) => (
              <div className="mt-block" key={c.t}>
                <h3 className="mt-block-t">{c.t}</h3>
                <p className="mt-block-b">{c.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SitePageShell>
  );
}
