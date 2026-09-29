import { useId, useState } from "react";
import { SitePageShell } from "../Site";
import { DATA_VERSION, NOT_ADVICE, NO_CITATION, STATES, VERIFY_NOTE, returnDeadline } from "../stateLaws/data";
import { NEEDS_FORWARDING, depositDeadline } from "./depositDeadline";

// ─────────────────────────────────────────────────────────────────────
// /tools/deposit-deadline: pick a state and a move-out date, get the day the
// security deposit has to go back.
//
// ⚠ THE DATE IS THE PRODUCT'S DATE. depositDeadline.ts is a port of the
// backend's deadline arithmetic and is tested against it case by case, so
// this page and Occupella's chat never disagree about a deadline.
//
// ⚠ THE TABLE IS THE PAGE AT REST. Before anybody picks a date, every state's
// rule is on the page with its source. That is also what a search engine
// reads, since the calculator itself only exists after a click.
// ─────────────────────────────────────────────────────────────────────

export const toolCss = `
  .dd-box {
    margin-top: 40px; max-width: 860px; padding: 28px; border: 1px solid var(--line);
    border-radius: 10px; background: var(--canvas);
    display: grid; gap: 28px;
  }
  @media (min-width: 820px) { .dd-box { grid-template-columns: 300px 1fr; } }
  .dd-form { display: flex; flex-direction: column; gap: 18px; }
  .dd-field { display: flex; flex-direction: column; gap: 6px; }
  .dd-field label { font-size: 15px; font-weight: 600; color: var(--ink); letter-spacing: 0; }
  .dd-field small { font-size: 14px; color: var(--ink-muted); }
  .lp .dd-field select, .lp .dd-field input { font-size: 16px; height: 44px; font-family: var(--font-sans); }
  .dd-out { border-top: 1px solid var(--line); padding-top: 20px; }
  @media (min-width: 820px) { .dd-out { border-top: 0; border-left: 1px solid var(--line); padding: 0 0 0 28px; } }
  .dd-empty { font-size: 17px; line-height: 1.6; color: var(--ink-muted); }
  .dd-label { font-size: 15px; font-weight: 600; color: var(--ink-muted); }
  .dd-date {
    margin-top: 4px; font-family: var(--font-display); font-optical-sizing: auto;
    font-size: clamp(30px, 4vw, 40px); font-weight: 560; line-height: 1.15; color: var(--ink);
  }
  .dd-sub { margin-top: 18px; font-size: 16px; line-height: 1.6; color: var(--ink); }
  .dd-sub b { font-weight: 600; }
  .dd-meta { margin-top: 14px; font-size: 15px; line-height: 1.6; color: var(--ink-muted); }
  .dd-meta b { color: var(--ink); font-weight: 600; }
  .dd-warn {
    margin-top: 14px; padding: 10px 14px; border-left: 3px solid #A8631A; background: #FAF0E1;
    font-size: 15px; line-height: 1.5; color: var(--ink);
  }
  .dd-table-wrap { margin-top: 32px; overflow-x: auto; max-width: 980px; }
  .dd-table { width: 100%; border-collapse: collapse; font-size: 15px; }
  .dd-table th { text-align: left; font-weight: 600; color: var(--ink); padding: 10px 12px 10px 0; border-bottom: 1px solid var(--line-strong); white-space: nowrap; }
  .dd-table td { padding: 10px 12px 10px 0; border-bottom: 1px solid var(--line); color: var(--ink); vertical-align: top; line-height: 1.5; }
  .dd-table td.muted { color: var(--ink-muted); }
  .dd-foot { margin-top: 28px; font-size: 15px; line-height: 1.7; color: var(--ink-muted); max-width: 860px; }
`;

/** "2026-10-14" → "Wednesday, October 14, 2026", in UTC so no time zone
 *  moves it a day. */
export function longDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function Calculator() {
  const [code, setCode] = useState("");
  const [moveOut, setMoveOut] = useState("");
  const [forwarding, setForwarding] = useState("");
  const ids = { state: useId(), out: useId(), fwd: useId() };

  const state = STATES.find((s) => s.code === code);
  const needsForwarding = state?.rules.deposit.deadline_trigger === NEEDS_FORWARDING;
  const result = state && moveOut ? depositDeadline(state, moveOut, forwarding) : null;

  let empty = "Pick a state and the move-out date.";
  if (state && moveOut && needsForwarding && !forwarding) {
    empty = `In ${state.rules.name} the clock starts once the tenant has moved out and given a forwarding address. Add the date the address arrived.`;
  } else if (state && typeof state.rules.deposit.return_deadline_days !== "number") {
    empty = `Our data has no day count for ${state.rules.name}: ${returnDeadline(state.rules.deposit)}.`;
  }

  return (
    <div className="dd-box">
      <form className="dd-form" onSubmit={(e) => e.preventDefault()}>
        <div className="dd-field">
          <label htmlFor={ids.state}>State</label>
          <select id={ids.state} value={code} onChange={(e) => setCode(e.target.value)}>
            <option value="">Choose a state</option>
            {STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.rules.name}
              </option>
            ))}
          </select>
        </div>
        <div className="dd-field">
          <label htmlFor={ids.out}>Move-out date</label>
          <input id={ids.out} type="date" value={moveOut} onChange={(e) => setMoveOut(e.target.value)} />
          <small>The day the tenancy ended.</small>
        </div>
        {needsForwarding ? (
          <div className="dd-field">
            <label htmlFor={ids.fwd}>Forwarding address received</label>
            <input id={ids.fwd} type="date" value={forwarding} onChange={(e) => setForwarding(e.target.value)} />
            <small>{state!.rules.name} counts from this date if it is later than the move-out.</small>
          </div>
        ) : null}
      </form>

      <div className="dd-out" aria-live="polite">
        {result && state ? (
          <>
            <div className="dd-label">Return the deposit by</div>
            <div className="dd-date">{longDay(result.due)}</div>
            <p className="dd-sub">
              Plan to finish by <b>{longDay(result.finishBy)}</b>, the last business day before it.
              Don&rsquo;t count on a deadline that lands on a weekend moving to Monday.
            </p>
            <p className="dd-meta">
              {result.days} {result.unit === "business" ? "business days" : "days"}, counted from the day
              after {longDay(result.trigger)}.{" "}
              {state.rules.deposit.penalty ? (
                <>
                  Penalty for returning it late: {state.rules.deposit.penalty}.{" "}
                </>
              ) : null}
              {state.rules.deposit.citation ? (
                <>
                  Source: <b>{state.rules.deposit.citation}</b>.
                </>
              ) : (
                <>{NO_CITATION}.</>
              )}{" "}
              <a href={state.path}>All {state.rules.name} rules</a>
            </p>
            {state.rules.deposit.verify_flag ? <p className="dd-warn">{VERIFY_NOTE}</p> : null}
            {result.notes.map((n) => (
              <p className="dd-warn" key={n}>
                {n}
              </p>
            ))}
          </>
        ) : (
          <p className="dd-empty">{empty}</p>
        )}
      </div>
    </div>
  );
}

export default function DepositDeadlineTool() {
  return (
    <SitePageShell
      active="resources"
      title="Security deposit return deadline calculator"
      lede={
        <>
          Pick the state and the move-out date to get the day the deposit has to go back, with the
          statute. {NOT_ADVICE}
        </>
      }
      css={toolCss}
      close={{
        title: "The same date, from your Buildium leases",
        body: "Ask Occupella when a deposit is due back and it works out the date from the move-out on the lease, with the statute named. 14 days free, no card.",
      }}
    >
      <section>
        <div className="lp-wrap">
          <Calculator />

          <h2 className="lp-h2" style={{ marginTop: 72 }} id="every-state">
            Deposit return deadlines by state
          </h2>
          <div className="dd-table-wrap">
            <table className="dd-table">
              <thead>
                <tr>
                  <th scope="col">State</th>
                  <th scope="col">Return deadline</th>
                  <th scope="col">Source</th>
                </tr>
              </thead>
              <tbody>
                {STATES.map((s) => (
                  <tr key={s.code}>
                    <td>
                      <a href={s.path}>{s.rules.name}</a>
                    </td>
                    <td>{returnDeadline(s.rules.deposit)}</td>
                    <td className="muted">{s.rules.deposit.citation ?? NO_CITATION}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="dd-foot">
            Data version {DATA_VERSION}. {NOT_ADVICE} Business days skip weekends and the state&rsquo;s
            holidays. Some cities add rules of their own; each state&rsquo;s page names
            the places in our data.
          </p>
        </div>
      </section>
    </SitePageShell>
  );
}
