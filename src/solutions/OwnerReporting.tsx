import { Reveal, SitePageShell } from "../Site";
import { OwnerEmailCrop, PropertySnapshotCrop, SpendCrop, cropCss } from "../crops";

// ─────────────────────────────────────────────────────────────────────
// /solutions/owner-reporting: one job, answering an owner's questions from
// the Buildium data, then writing the update.
//
// ⚠ EVERY LINE IS CHECKED AGAINST AgenticHelixis agents/mirror_tools.py:
//   · property_snapshot: occupancy, rent roll scheduled vs collected this
//     month, open work orders, delinquency, tenant roster, next expiration
//   · spending_report: BILLED vendor spend by GL category and by property,
//     last N days (default 90), filterable by property
//   · portfolio_review, expiring_leases, unpaid_bills, bank_balances,
//     vendor_performance (12-month billing, "billed, not paid"),
//     property_hazards (FEMA flood, wildfire, radon, Superfund, HUD FMR)
//   · every answer carries an as-of line from the sync
//   · the owner update: the email draft card, sent from the PM's Gmail
//
// ⚠ NOT CLAIMED: charts (built, never produced by a real question), CSV
// export, NOI (implemented nowhere), paid vendor history (the mirror has
// unpaid bills and billed totals only), generating owner statements (that
// is Buildium's).
// ─────────────────────────────────────────────────────────────────────

const css = `
  .or-split { display: grid; gap: 40px; align-items: start; }
  @media (min-width: 1024px) {
    .or-split { grid-template-columns: 5fr 6fr; gap: 72px; }
    .or-split[data-flip="true"] { grid-template-columns: 6fr 5fr; }
    .or-split[data-flip="true"] > :first-child { order: 2; }
  }
  .or-list { margin-top: 28px; display: flex; flex-direction: column; }
  .or-list p { padding: 14px 0; border-top: 1px solid var(--line); font-size: 17px; line-height: 1.55; color: var(--ink); }
  .or-qa { margin-top: 40px; display: grid; gap: 32px 48px; }
  @media (min-width: 760px) { .or-qa { grid-template-columns: 1fr 1fr; } }
  .or-q { border-top: 1px solid var(--line); padding-top: 18px; }
  .or-q h3 { font-size: 17px; font-weight: 600; color: var(--ink); }
  .or-q p { margin-top: 6px; font-size: 16px; line-height: 1.6; color: var(--ink-muted); }
  .or-band { margin-top: clamp(80px, 10vw, 128px); padding: clamp(64px, 8vw, 104px) 0; background: var(--band); }
  .or-caption { margin-top: 12px; font-size: 14px; color: var(--ink-muted); }
`;

const ASK = [
  {
    q: "Give me a full portfolio review",
    a: "Units and occupancy, total delinquency with the largest balances, unpaid vendor bills, open work orders and tasks with overdue flagged, and leases ending within 90 days, in one answer.",
  },
  {
    q: "Which leases expire this quarter?",
    a: "Tenant, property, unit, end date, rent and current balance, soonest first, with the open maintenance at each address.",
  },
  {
    q: "What do we owe vendors?",
    a: "Every unpaid bill with vendor, amount and due date, overdue flagged, and the properties it charges.",
  },
  {
    q: "Which vendor bills us the most?",
    a: "Each vendor's 12-month billing, work-order volume and how fast they finish. Amounts are billed, not paid.",
  },
  {
    q: "What's in our operating account?",
    a: "Every bank account and its balance, refreshed on each Buildium bank-transaction webhook. Account and routing numbers are never shown.",
  },
  {
    q: "Is this property in a flood zone?",
    a: "FEMA flood zone, wildfire hazard, radon zone and nearby Superfund sites for the property's own coordinates, with HUD's fair market rent for its ZIP.",
  },
];

export default function OwnerReporting() {
  return (
    <SitePageShell
      active="solutions"
      title="The numbers an owner asks for, from your Buildium data"
      lede={
        <>
          Ask how a property is doing and Occupella answers from a synced copy of your Buildium
          account: occupancy, rent scheduled against rent collected, open work orders, what is
          owed and what was spent. Then it drafts the owner update for you to send.
        </>
      }
      css={css + cropCss}
      close={{
        title: "Try Occupella free for 14 days",
        body: "Connect Buildium and ask how your biggest property is doing. No card to start.",
      }}
    >
      <section className="lp-section" style={{ paddingTop: 72 }}>
        <div className="lp-wrap">
          <div className="or-split">
            <div>
              <Reveal>
                <div className="lp-section-head">
                  <h2 className="lp-h2">One property at a glance</h2>
                  <p className="lp-body">
                    Ask &ldquo;how is Lexington Court doing?&rdquo; and the answer comes back with
                    the figures an owner asks about first.
                  </p>
                </div>
              </Reveal>
              <div className="or-list">
                <p>Occupancy, and rent scheduled this month against rent collected.</p>
                <p>Open work orders, the delinquent balance and the next lease to end.</p>
                <p>
                  Every answer says when your Buildium data was last synced, so you know how
                  fresh each number is.
                </p>
              </div>
            </div>
            <div>
              <PropertySnapshotCrop />
              <p className="or-caption">A property snapshot, with example data.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <div className="or-split" data-flip="true">
            <div>
              <Reveal>
                <div className="lp-section-head">
                  <h2 className="lp-h2">Where the money went</h2>
                  <p className="lp-body">
                    Vendor spend, grouped by category and by property, over the period you ask
                    for. Narrow it to one property with its name.
                  </p>
                </div>
              </Reveal>
              <div className="or-list">
                <p>
                  The amounts are what vendors billed, summed from each bill&rsquo;s line items.
                  Payments are recorded in Buildium, and the report says billed, not paid.
                </p>
                <p>Answers come back as tables you can sort, not figures pasted into a paragraph.</p>
              </div>
            </div>
            <div>
              <SpendCrop />
              <p className="or-caption">Spend by category, with example data.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="or-band">
        <div className="lp-wrap">
          <div className="or-split">
            <div>
              <Reveal>
                <div className="lp-section-head">
                  <h2 className="lp-h2">The owner update, drafted</h2>
                  <p className="lp-body">
                    Ask for an update to the owner and Occupella writes the email from those
                    figures. You edit any word and send it from your own Gmail address.
                  </p>
                </div>
              </Reveal>
            </div>
            <div>
              <OwnerEmailCrop />
              <p className="or-caption">A drafted owner update, with example data.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-section-head">
              <h2 className="lp-h2">Other questions owners ask</h2>
            </div>
          </Reveal>
          <div className="or-qa">
            {ASK.map((r) => (
              <div className="or-q" key={r.q}>
                <h3>{r.q}</h3>
                <p>{r.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SitePageShell>
  );
}
