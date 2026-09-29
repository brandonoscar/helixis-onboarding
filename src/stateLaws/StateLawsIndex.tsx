import { Reveal, SitePageShell } from "../Site";
import { DATA_VERSION, NOT_ADVICE, STATES, depositCap, nonpayNotice, returnDeadline, soi } from "./data";

// /state-laws: every state in one table, each row linking to its page. The
// cells use the same wording functions as the state pages, so the table and
// the page cannot disagree.

const css = `
  .si-meta { margin-top: 18px; font-size: 15px; color: var(--ink-muted); }
  .si-meta b { color: var(--ink); }
  .si-wrap { margin-top: 40px; overflow-x: auto; border: 1px solid var(--line); border-radius: 8px; }
  .si-table { width: 100%; min-width: 860px; border-collapse: collapse; font-size: 15px; }
  .si-table th, .si-table td { text-align: left; padding: 12px 16px; border-bottom: 1px solid var(--line); vertical-align: top; }
  .si-table thead th { background: var(--foot); font-weight: 600; color: var(--ink); position: sticky; top: 0; }
  .si-table tbody tr:last-child td, .si-table tbody tr:last-child th { border-bottom: 0; }
  .si-table tbody th { font-weight: 600; white-space: nowrap; }
  .si-table td { color: var(--ink-muted); }
  .si-hint { display: none; margin-top: 10px; font-size: 15px; color: var(--ink-muted); }
  @media (max-width: 900px) { .si-hint { display: block; } }
`;

export default function StateLawsIndex() {
  return (
    <SitePageShell
      title="Landlord rules by state"
      lede={
        <>
          Security deposit caps and return deadlines, notice periods and source-of-income rules
          for all 50 states and DC, from the data Occupella uses. Open a state for late fees,
          licensing, citations and local rules. {NOT_ADVICE}
        </>
      }
      css={css}
      close={{
        title: "Rules applied per property",
        body: "Occupella looks up these rules for each property's own state and does the date arithmetic. 14 days free, no card.",
      }}
    >
      <section>
        <div className="lp-wrap">
          <p className="si-meta">
            Data version: <b>{DATA_VERSION}</b>
          </p>
          <p className="si-hint">Scroll the table sideways to see every column.</p>
          <Reveal>
            <div className="si-wrap">
              <table className="si-table">
                <caption className="lp-sr">Landlord rules by state, data version {DATA_VERSION}</caption>
                <thead>
                  <tr>
                    <th scope="col">State</th>
                    <th scope="col">Deposit cap</th>
                    <th scope="col">Deposit return</th>
                    <th scope="col">Pay-or-quit notice</th>
                    <th scope="col">Source-of-income protection</th>
                  </tr>
                </thead>
                <tbody>
                  {STATES.map((s) => (
                    <tr key={s.code}>
                      <th scope="row">
                        <a href={s.path}>{s.rules.name}</a>
                      </th>
                      <td>{depositCap(s.rules.deposit.cap_months)}</td>
                      <td>{returnDeadline(s.rules.deposit)}</td>
                      <td>{nonpayNotice(s.rules.notice)}</td>
                      <td>{soi(s.rules.screening.soi_protection)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>
    </SitePageShell>
  );
}
