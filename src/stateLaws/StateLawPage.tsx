import { Reveal, SitePageShell } from "../Site";
import {
  DATA,
  DATA_VERSION,
  NOT_ADVICE,
  NO_CITATION,
  VERIFY_NOTE,
  days,
  depositCap,
  evictionTier,
  graceDays,
  hours,
  nonpayNotice,
  pendingChange,
  pmLicense,
  rateName,
  rateValue,
  returnDeadline,
  soi,
  yesNo,
  type StateEntry,
} from "./data";

// ─────────────────────────────────────────────────────────────────────
// /state-laws/<state>: one state's landlord rules, straight from the data.
//
// ⚠ EVERY SECTION ENDS IN ITS SOURCE. A section with a citation prints it; a
// section without one prints NO_CITATION, so a reader never mistakes a
// missing citation for a settled rule. A section with verify_flag carries
// VERIFY_NOTE where it can be seen, not in a tooltip. stateLaws.test.ts
// checks three states against the JSON, value by value.
// ─────────────────────────────────────────────────────────────────────

export const stateLawCss = `
  .sl-meta { margin-top: 18px; display: flex; flex-wrap: wrap; gap: 8px 20px; font-size: 15px; color: var(--ink-muted); }
  .sl-meta b { color: var(--ink); font-weight: 600; }
  .sl-warn {
    margin-top: 40px; padding: 18px 20px; border: 1px solid #E8C99A; background: #FBF3E6;
    border-radius: 8px; font-size: 16px; line-height: 1.6; color: var(--ink); max-width: 760px;
  }
  .sl-warn ul { margin: 10px 0 0 20px; }
  .sl-sections { margin-top: 48px; display: flex; flex-direction: column; gap: 48px; max-width: 860px; }
  .sl-sec h2 {
    font-family: var(--font-display); font-optical-sizing: auto;
    font-size: 28px; font-weight: 560; line-height: 1.2; color: var(--ink);
  }
  .sl-rows { margin-top: 16px; border-top: 1px solid var(--line); }
  .sl-row { display: grid; gap: 4px 24px; padding: 14px 0; border-bottom: 1px solid var(--line); }
  @media (min-width: 720px) { .sl-row { grid-template-columns: 240px 1fr; } }
  .sl-row dt { font-size: 15px; font-weight: 600; color: var(--ink); }
  .sl-row dd { margin: 0; font-size: 16px; line-height: 1.6; color: var(--ink); }
  .sl-src { margin-top: 12px; font-size: 15px; color: var(--ink-muted); }
  .sl-src b { color: var(--ink); font-weight: 600; }
  .sl-verify {
    margin-top: 12px; padding: 10px 14px; border-left: 3px solid #A8631A; background: #FAF0E1;
    font-size: 15px; line-height: 1.5; color: var(--ink);
  }
  .sl-quirks { margin: 16px 0 0 20px; display: flex; flex-direction: column; gap: 10px; }
  .sl-quirks li { font-size: 16px; line-height: 1.6; color: var(--ink); }
  .sl-foot { margin-top: 56px; padding-top: 20px; border-top: 1px solid var(--line); font-size: 15px; line-height: 1.7; color: var(--ink-muted); max-width: 860px; }
  .sl-foot a { font-weight: 600; }
`;

type Row = [string, string];

function Section({
  title,
  rows,
  citation,
  verify,
  children,
}: {
  title: string;
  rows: Row[];
  /** undefined means the section has no citation field; both render NO_CITATION. */
  citation?: string | null;
  verify?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <section className="sl-sec">
      <h2>{title}</h2>
      <dl className="sl-rows">
        {rows.map(([k, v]) => (
          <div className="sl-row" key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      {children}
      <p className="sl-src" data-source>
        {citation ? (
          <>
            Source: <b>{citation}</b>
          </>
        ) : (
          NO_CITATION
        )}
      </p>
      {verify ? (
        <p className="sl-verify" data-verify>
          {VERIFY_NOTE}
        </p>
      ) : null}
    </section>
  );
}

export default function StateLawPage({ state }: { state: StateEntry }) {
  const s = state.rules;
  const places = DATA.overlay_jurisdictions[state.code]?.places ?? [];
  const cares = DATA.federal.cares_act_nonpay_notice_days;
  const noteRow = (n?: string): Row[] => (n ? [["Note", n]] : []);

  return (
    <SitePageShell
      title={`${s.name} landlord rules: deposits, late fees and notices`}
      lede={
        <>
          The rules Occupella applies to properties in {s.name}, from our jurisdiction data. {NOT_ADVICE}{" "}
          Check the statute, or a local attorney, before you act.
        </>
      }
      css={stateLawCss}
      close={{
        title: "Rules applied per property",
        body: `Occupella looks up these rules for each property's own state and does the date arithmetic, like the day a deposit is due back. 14 days free, no card.`,
      }}
    >
      <section>
        <div className="lp-wrap">
          <div className="sl-meta">
            <span>
              Data version: <b>{DATA_VERSION}</b>
            </span>
            <span>
              <a href="/state-laws">All 50 states and DC</a>
            </span>
          </div>

          {s.overlay_market ? (
            <div className="sl-warn" data-overlay>
              <b>Local rules apply here.</b> {s.overlay_note}
              {places.length ? (
                <ul>
                  {places.map((p) => (
                    <li key={p.name}>
                      <b>{p.name}:</b> {p.warning}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <div className="sl-sections">
            <Section
              title="Security deposit"
              rows={[
                ["Maximum deposit", depositCap(s.deposit.cap_months)],
                ["Return deadline", returnDeadline(s.deposit)],
                ["Penalty for late return", s.deposit.penalty ?? "Not in our data"],
                ["Interest owed", yesNo(s.deposit.interest_owed)],
                ...noteRow(s.deposit.note),
              ]}
              citation={s.deposit.citation}
              verify={s.deposit.verify_flag}
            >
              {s.deposit.pending_change ? (
                <p className="sl-verify" data-pending>
                  Scheduled change: {pendingChange(s.deposit.pending_change)}
                  {s.deposit.pending_change.citation ? ` Source: ${s.deposit.pending_change.citation}.` : ""}
                </p>
              ) : null}
            </Section>

            <Section
              title="Late fees"
              rows={[
                ["Rule", s.late_fee.rule ?? "Not in our data"],
                ["Grace period", graceDays(s.late_fee.grace_days)],
              ]}
              citation={s.late_fee.citation}
              verify={s.late_fee.verify_flag}
            />

            <Section
              title="Notice periods"
              rows={[
                ["Notice to pay or quit", nonpayNotice(s.notice)],
                ["Ending a month-to-month tenancy", days(s.notice.mtm_termination_days)],
                ["Notice before entering a unit", hours(s.notice.entry_hours)],
                ...noteRow(s.notice.note),
              ]}
              citation={s.notice.citation}
              verify={s.notice.verify_flag}
            />

            <Section
              title="Screening"
              rows={[["Source-of-income protection", soi(s.screening.soi_protection)], ...noteRow(s.screening.note)]}
              citation={s.screening.citation}
              verify={s.screening.verify_flag}
            />

            <Section
              title="Licensing"
              rows={[["To manage for others", pmLicense(s.licensing.pm_license)], ...noteRow(s.licensing.note)]}
              citation={s.licensing.citation}
              verify={s.licensing.verify_flag}
            />

            <section className="sl-sec">
              <h2>How long an eviction takes</h2>
              <p className="sl-src" style={{ color: "var(--ink)", fontSize: 16 }}>
                {evictionTier(s.eviction_speed_tier)} This is a rough tier from our data, not a
                court timeline.
              </p>
            </section>

            {s.quirks.length ? (
              <section className="sl-sec">
                <h2>Also worth knowing</h2>
                <ul className="sl-quirks">
                  {s.quirks.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {s.rates
              ? Object.entries(s.rates).map(([key, r]) => (
                  <Section
                    key={key}
                    title={rateName(key)}
                    rows={[
                      ...(r.formula ? ([["Formula", r.formula]] as Row[]) : []),
                      ["This year's figure", rateValue(r)],
                      ...(r.publisher ? ([["Published by", r.publisher]] as Row[]) : []),
                      ...(r.scope ? ([["Applies to", r.scope]] as Row[]) : []),
                    ]}
                    citation={r.citation}
                  />
                ))
              : null}

            <Section
              title="A federal rule that can override this"
              rows={[
                ["Notice for nonpayment on covered properties", `${cares.value} days`],
                ["Note", cares.note],
              ]}
              citation={cares.citation}
            />
          </div>

          <div className="sl-foot">
            <p>
              Data version {DATA_VERSION}. {NOT_ADVICE} Rules change, and the version is when our
              data was last reviewed, not a promise that every rule is still current.
            </p>
            <p style={{ marginTop: 8 }}>
              <a href="/state-laws">Landlord rules for every state</a>
            </p>
          </div>
        </div>
      </section>
    </SitePageShell>
  );
}
