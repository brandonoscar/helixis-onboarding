import { CHECK, Icon, Reveal, SitePageShell } from "../Site";
import { DelinquencyCrop, EmailDraftCrop, TodayRow, cropCss } from "../crops";

// ─────────────────────────────────────────────────────────────────────
// /solutions/delinquency: one job, late rent, from the missed payment to
// the follow-up and the ledger.
//
// ⚠ EVERY LINE IS CHECKED AGAINST AgenticHelixis:
//   · "who is behind on rent?": lease, amount, 31-60 / 61-90 / 90+ aging,
//     open maintenance on the row (the /features answer)
//   · "$X owed across N leases": db/repositories/morning_brief.py
//   · "N leases at <property> have no rent payment this month", after the
//     10th (RENT_GRACE_DAY_OF_MONTH), quiet when somebody contacted the
//     tenant recently: reminders/producers.py rent_missing
//   · the email draft card with 2-4 named approaches, sent through Gmail
//     behind an editable approval card: agents/visual_tools.py
//     show_email_draft and its hint
//   · post a charge, record a payment: registered tools, manager or admin,
//     a lock against double-firing (the /features safeguards)
//   · state late-fee rules and notice periods, cited: /features
//
// ⚠ NOT CLAIMED: payment promises read from tenant emails. They come from
// Gmail -> Inbox email ingest, which defaults off. TODO(brandon): if that is
// on in Render, add "a tenant who promised a date by email is left alone
// until the date passes".
// ⚠ NOT CLAIMED: texting a rent reminder. SMS waits on carrier approval.
// ─────────────────────────────────────────────────────────────────────

const css = `
  .dq-split { display: grid; gap: 40px; margin-top: 48px; align-items: start; }
  @media (min-width: 1024px) {
    .dq-split { grid-template-columns: 5fr 6fr; gap: 72px; }
    .dq-split[data-flip="true"] { grid-template-columns: 6fr 5fr; }
    .dq-split[data-flip="true"] > :first-child { order: 2; }
  }
  .dq-list { margin-top: 28px; display: flex; flex-direction: column; }
  .dq-list p { padding: 14px 0; border-top: 1px solid var(--line); font-size: 17px; line-height: 1.55; color: var(--ink); }
  .dq-today { display: flex; flex-direction: column; gap: 12px; }
  .dq-band { margin-top: clamp(80px, 10vw, 128px); padding: clamp(64px, 8vw, 104px) 0; background: var(--band); }
  .dq-li {
    display: flex; gap: 12px; align-items: flex-start;
    padding: 12px 0; border-top: 1px solid var(--line);
    font-size: 17px; line-height: 1.5; color: var(--ink);
  }
  .dq-li svg { flex: none; margin-top: 4px; color: var(--ink-muted); }
  .dq-caption { margin-top: 12px; font-size: 14px; color: var(--ink-muted); }
`;

const LEDGER = [
  "Post a charge to a lease ledger, such as a late fee",
  "Record a payment against a lease",
  "Look up your state's late-fee rule and notice period, with the statute named",
];

export default function Delinquency() {
  return (
    <SitePageShell
      active="solutions"
      title="Late rent, from the missed payment to the follow-up"
      lede={
        <>
          Occupella shows which leases owe money and how late they are, flags leases with no
          rent posted after the 10th, and drafts the email to the tenant. You pick the version
          and send it from your Gmail.
        </>
      }
      css={css + cropCss}
      close={{
        title: "Try Occupella free for 14 days",
        body: "Connect Buildium and ask who is behind on rent. No card to start.",
      }}
    >
      <section className="lp-section" style={{ paddingTop: 72 }}>
        <div className="lp-wrap">
          <div className="dq-split" style={{ marginTop: 0 }}>
            <div>
              <Reveal>
                <div className="lp-section-head">
                  <h2 className="lp-h2">Who is behind, and by how much</h2>
                  <p className="lp-body">
                    Ask &ldquo;who is behind on rent?&rdquo; and every lease with a balance comes
                    back as a table: tenant, property and unit, the amount, and whether it is
                    31&ndash;60, 61&ndash;90 or over 90 days late.
                  </p>
                </div>
              </Reveal>
              <div className="dq-list">
                <p>
                  The open maintenance at that address is on the same row, so you can see
                  whether a tenant is waiting on a repair before you send a late notice.
                </p>
                <p>
                  The answer comes from a synced copy of your Buildium account and says when that
                  copy was last refreshed.
                </p>
              </div>
            </div>
            <div>
              <DelinquencyCrop />
              <p className="dq-caption">The answer to &ldquo;who is behind on rent?&rdquo;, with example data.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <div className="dq-split" data-flip="true" style={{ marginTop: 0 }}>
            <div>
              <Reveal>
                <div className="lp-section-head">
                  <h2 className="lp-h2">A reminder when rent hasn&rsquo;t posted</h2>
                  <p className="lp-body">
                    After the 10th, leases with no payment this month are grouped by property in
                    the Today strip at the top of your Inbox. A lease drops off when somebody on
                    your team has already contacted the tenant.
                  </p>
                </div>
              </Reveal>
            </div>
            <div className="dq-today">
              <TodayRow
                title="2 leases at Garden Row have no rent payment this month"
                sub="Past the 10th with nothing posted: Unit 3, Unit 5. No recent outreach on file."
                label="A Today reminder: 2 leases at Garden Row have no rent payment this month."
              />
              <TodayRow
                title="$4,020 owed across 3 leases"
                sub="Ask “who's behind on rent?” to see who actually needs the nudge."
                label="A Today reminder: $4,020 owed across 3 leases."
              />
              <p className="dq-caption">Two Inbox reminders, with example data.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="dq-band">
        <div className="lp-wrap">
          <div className="dq-split" style={{ marginTop: 0 }}>
            <div>
              <Reveal>
                <div className="lp-section-head">
                  <h2 className="lp-h2">The late-rent email, drafted</h2>
                  <p className="lp-body">
                    When there is more than one sensible way to write it, Occupella drafts each
                    one and names the approach. You slide through them, edit any word, and send
                    from your own Gmail address.
                  </p>
                </div>
              </Reveal>
              <div className="dq-list">
                <p>
                  Sending goes through a card that shows the exact message, where you can still
                  change it.
                </p>
                <p>
                  Every message drafted for a resident is checked against fair housing rules
                  before you see it.
                </p>
              </div>
            </div>
            <div>
              <EmailDraftCrop />
              <p className="dq-caption">A drafted late-rent email, with example data.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-section-head">
              <h2 className="lp-h2">Charges, payments and the rules</h2>
              <p className="lp-body">
                Posting a charge or recording a payment needs a manager or an admin, and each one
                takes a lock before the Buildium call, so a double-click or a retry can&rsquo;t
                post it twice. Buildium can&rsquo;t undo either one.
              </p>
            </div>
          </Reveal>
          <div className="dq-list" style={{ maxWidth: 760 }}>
            {LEDGER.map((w) => (
              <div className="dq-li" key={w}>
                <Icon d={CHECK} size={15} />
                <span>{w}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SitePageShell>
  );
}
