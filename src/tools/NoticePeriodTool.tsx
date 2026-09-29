import { useId, useState } from "react";
import { SitePageShell } from "../Site";
import { DATA, DATA_VERSION, NOT_ADVICE, NO_CITATION, STATES, VERIFY_NOTE, days, nonpayNotice } from "../stateLaws/data";
import { longDay, toolCss } from "./DepositDeadlineTool";
import { noticePeriod, type NoticeKind } from "./noticePeriod";

// ─────────────────────────────────────────────────────────────────────
// /tools/notice-period: the last day of a notice to pay rent or leave, and
// the earliest a month-to-month tenancy can end.
//
// ⚠ THE DATES ARE THE PRODUCT'S DATES. noticePeriod.ts ports the chat's
// two notice deadlines and is tested against backend-computed cases.
//
// ⚠ A STATE WITH WORDS GETS WORDS. Georgia's nonpayment rule is a demand,
// not a day count; New Jersey files without notice; California's
// month-to-month period depends on how long the tenancy ran. The data says
// so in words, and the calculator shows those words instead of a date.
//
// ⚠ THE FEDERAL 30-DAY RULE IS ON EVERY PAY-OR-QUIT ANSWER. On a covered
// property it can override a shorter state notice, so a "3 days" answer
// never appears without it. The wording follows the data's own note
// (courts split, 30 days the safest practice), not a stronger claim.
// ─────────────────────────────────────────────────────────────────────

const extraCss = `
  .np-kind { display: flex; flex-direction: column; gap: 8px; border: 0; padding: 0; margin: 0; }
  .np-kind legend { font-size: 15px; font-weight: 600; color: var(--ink); margin-bottom: 6px; }
  .np-kind label { display: flex; gap: 10px; align-items: center; font-size: 16px; font-weight: 500; color: var(--ink); cursor: pointer; letter-spacing: 0; }
  /* The app's base input rule sets appearance: none, width 100% and a
     border, which turns a radio into an empty box with no visible choice. */
  .lp .np-kind input {
    -webkit-appearance: radio; appearance: auto; flex: none;
    width: 18px; height: 18px; padding: 0; margin: 0; border: 0; box-shadow: none;
    accent-color: var(--iris);
  }
`;

const KIND_LABEL: Record<NoticeKind, { choice: string; date: string; hint: string }> = {
  nonpay: {
    choice: "Notice to pay rent or leave",
    date: "Date the notice was served",
    hint: "The day the tenant received it.",
  },
  mtm: {
    choice: "Ending a month-to-month tenancy",
    date: "Date notice was given",
    hint: "The day the other side received it.",
  },
};

const cares = DATA.federal.cares_act_nonpay_notice_days;

function Calculator() {
  const [kind, setKind] = useState<NoticeKind>("nonpay");
  const [code, setCode] = useState("");
  const [start, setStart] = useState("");
  const ids = { state: useId(), date: useId() };

  const state = STATES.find((s) => s.code === code);
  const answer = state ? noticePeriod(state, kind, start) : null;
  const n = state?.rules.notice;

  return (
    <div className="dd-box">
      <form className="dd-form" onSubmit={(e) => e.preventDefault()}>
        <fieldset className="np-kind">
          <legend>Which notice</legend>
          {(["nonpay", "mtm"] as const).map((k) => (
            <label key={k}>
              <input type="radio" name="kind" checked={kind === k} onChange={() => setKind(k)} />
              {KIND_LABEL[k].choice}
            </label>
          ))}
        </fieldset>
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
          <label htmlFor={ids.date}>{KIND_LABEL[kind].date}</label>
          <input id={ids.date} type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          <small>{KIND_LABEL[kind].hint}</small>
        </div>
      </form>

      <div className="dd-out" aria-live="polite">
        {!state ? (
          <p className="dd-empty">Pick the notice, the state and the date.</p>
        ) : answer?.kind === "words" ? (
          <>
            <div className="dd-label">{state.rules.name}</div>
            <p className="dd-sub">
              Our data has no day count here. It says: <b>{answer.words}</b>. There is no single number of
              days to add, so this calculator doesn&rsquo;t give a date.
            </p>
          </>
        ) : answer?.kind === "date" ? (
          <>
            <div className="dd-label">{kind === "nonpay" ? "The notice period runs through" : "The tenancy can end no earlier than"}</div>
            <div className="dd-date">{longDay(answer.end)}</div>
            <p className="dd-meta">
              {answer.days} {answer.unit === "calendar" ? "days" : answer.unit === "business" ? "business days" : "court days"},
              counted from the day after {longDay(answer.start)}.
            </p>
            {answer.notes.map((x) => (
              <p className="dd-warn" key={x}>
                {x}
              </p>
            ))}
          </>
        ) : (
          <p className="dd-empty">Add the date.</p>
        )}

        {state && n ? (
          <>
            {/* One note covers every notice in the state's data, so it is
                labelled as that, not as being about the chosen notice. */}
            {n.note ? (
              <p className="dd-meta">
                A note in our data on {state.rules.name}&rsquo;s notice rules: {n.note}.
              </p>
            ) : null}
            <p className="dd-meta">
              {n.citation ? (
                <>
                  Source: <b>{n.citation}</b>.
                </>
              ) : (
                <>{NO_CITATION}.</>
              )}{" "}
              <a href={state.path}>All {state.rules.name} rules</a>
            </p>
            {n.verify_flag ? <p className="dd-warn">{VERIFY_NOTE}</p> : null}
            {kind === "nonpay" ? (
              <p className="dd-warn">
                On a property with a federally backed mortgage or in a federal housing program, federal law
                ({cares.citation}) calls for {cares.value} days&rsquo; notice for nonpayment, and courts are
                split on how far that reaches. Our data&rsquo;s safest practice is {cares.value} days on any
                covered property, even where the state allows fewer.
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function NoticePeriodTool() {
  return (
    <SitePageShell
      active="resources"
      title="Notice period calculator for landlords"
      lede={
        <>
          The last day of a notice to pay rent or leave, and the earliest a month-to-month tenancy can
          end, for every state. {NOT_ADVICE}
        </>
      }
      css={toolCss + extraCss}
      close={{
        title: "Notice dates from your own leases",
        body: "Ask Occupella for a notice date and it counts it the same way, for the property's own state, with the statute named. 14 days free, no card.",
      }}
    >
      <section>
        <div className="lp-wrap">
          <Calculator />

          <h2 className="lp-h2" style={{ marginTop: 72 }} id="every-state">
            Notice periods by state
          </h2>
          <div className="dd-table-wrap">
            <table className="dd-table">
              <thead>
                <tr>
                  <th scope="col">State</th>
                  <th scope="col">Pay rent or leave</th>
                  <th scope="col">End month-to-month</th>
                  <th scope="col">Source</th>
                </tr>
              </thead>
              <tbody>
                {STATES.map((s) => (
                  <tr key={s.code}>
                    <td>
                      <a href={s.path}>{s.rules.name}</a>
                    </td>
                    <td>{nonpayNotice(s.rules.notice)}</td>
                    <td>{days(s.rules.notice.mtm_termination_days)}</td>
                    <td className="muted">{s.rules.notice.citation ?? NO_CITATION}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="dd-foot">
            Data version {DATA_VERSION}. {NOT_ADVICE} Business and court days skip weekends and the
            state&rsquo;s holidays. Federal rule for covered properties: {cares.note}
          </p>
        </div>
      </section>
    </SitePageShell>
  );
}
