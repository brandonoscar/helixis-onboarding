import { Icon, MINUS, Reveal, SitePageShell } from "../Site";
import { ColdLeadsCrop, LeadBoardCrop, LeadDraftCrop, TodayRow, cropCss } from "../crops";

// ─────────────────────────────────────────────────────────────────────
// /solutions/leasing: one job, lead follow-up, from first message to lease.
//
// ⚠ EVERY LINE IS CHECKED AGAINST AgenticHelixis, not against the old
// marketing copy. Leasing is ON in production (HELIXIS_CRM__ENABLED, founder
// confirmation 2026-09-29). What each section rests on:
//   · stages New / Contacted / Scheduled / Applied / Leased, renter and
//     owner leads: db/repositories/leads.py LEAD_STAGES, LEAD_KINDS
//   · add a lead by hand: POST /crm/leads ("walk-in, a phone call, or any
//     channel Helixis doesn't watch")
//   · Buildium applicant creates or moves the lead to Applied, Leased on
//     AddedToLease: webhooks/handlers/applicants.py
//   · a sent reply moves the lead to Contacted; replies go out on email via
//     the PM's Gmail or on text via Twilio; manager+ role; fair-housing
//     egress gate returns 422 for revise-and-resend: POST /crm/leads/{id}/reply
//   · first draft is the company template merge-filled, later drafts are
//     conversational: GET /crm/leads/{id}/draft
//   · quiet 3+ days, coldest first: GET /crm/leads/cold, reminders producer
//   · an inbound text find-or-creates a lead and never replies:
//     POST /crm/sms/inbound; click-to-call rings the PM's cell first:
//     POST /crm/leads/{id}/call
//   · Pro and Scale only; trial and Starter refuse with 402: billing/plans.py
//
// ⚠ NOT CLAIMED: leads arriving by themselves from Zillow or Apartments.com
// emails. That is HELIXIS_CRM__EMAIL_INGEST_ENABLED, default off.
// TODO(brandon): if that flag is on in Render, add it to "Every lead on one
// board". Also NOT claimed: a calendar tour moving a lead to Scheduled; the
// demo board shows it, the backend does not confirm it.
//
// ⚠ TEXTING IS NOT LIVE until carrier approval. TODO(brandon): when A2P is
// approved, drop the status chip and change the texting section to present
// tense. Until then nothing here may imply a text can be sent today.
// ─────────────────────────────────────────────────────────────────────

const css = `
  .ls-board { margin-top: 48px; }
  .ls-split { display: grid; gap: 40px; margin-top: 0; align-items: start; }
  @media (min-width: 1024px) {
    .ls-split { grid-template-columns: 5fr 6fr; gap: 72px; }
    .ls-split[data-flip="true"] { grid-template-columns: 6fr 5fr; }
    .ls-split[data-flip="true"] > :first-child { order: 2; }
  }
  .ls-blocks { display: grid; gap: 32px 48px; margin-top: 40px; }
  @media (min-width: 760px) { .ls-blocks { grid-template-columns: 1fr 1fr; } }
  @media (min-width: 1024px) { .ls-blocks[data-cols="3"] { grid-template-columns: repeat(3, 1fr); } }
  .ls-block { border-top: 1px solid var(--line); padding-top: 20px; }
  .ls-block-t { font-size: 18px; font-weight: 600; line-height: 1.4; color: var(--ink); }
  .ls-block-b { margin-top: 8px; font-size: 16px; line-height: 1.6; color: var(--ink-muted); }
  .ls-list { margin-top: 28px; display: flex; flex-direction: column; }
  .ls-list p { padding: 14px 0; border-top: 1px solid var(--line); font-size: 17px; line-height: 1.55; color: var(--ink); }
  .ls-caption { margin-top: 12px; font-size: 14px; color: var(--ink-muted); }
  .ls-cold { display: flex; flex-direction: column; gap: 14px; }
  .ls-band { margin-top: clamp(80px, 10vw, 128px); padding: clamp(64px, 8vw, 104px) 0; background: var(--band); }
  .ls-status {
    align-self: flex-start;
    display: inline-flex; align-items: center; gap: 7px;
    padding: 4px 12px; border: 1px solid var(--line-strong); border-radius: 999px;
    font-size: 14px; font-weight: 500; color: var(--ink-muted); background: var(--canvas);
  }
  .ls-plans { margin-top: 20px; display: flex; flex-wrap: wrap; gap: 12px 24px; align-items: center; }
`;

type Block = { t: string; b: string };

const INTAKE: Block[] = [
  {
    t: "Add a lead by hand",
    b: "A walk-in, a phone call, or a message from anywhere Occupella doesn't watch. A name, a phone number or an email is enough.",
  },
  {
    t: "Buildium applicants move on their own",
    b: "When someone applies in Buildium, their lead is created or moved to Applied. When they're added to a lease, it moves to Leased.",
  },
  {
    t: "Your reply moves the lead",
    b: "Sending the first reply moves a lead to Contacted. You can move any lead by hand, or mark it as not pursued and keep it for your records.",
  },
];

const PHONE: Block[] = [
  {
    t: "A number that belongs to your company",
    b: "Not a shared number. It is bought and set up for you the day the carriers approve your business.",
  },
  {
    t: "Texts arrive as leads",
    b: "A text to your number creates a lead, or joins the lead it belongs to, and the message is logged. Nothing is sent back on its own.",
  },
  {
    t: "Click to call",
    b: "Occupella rings your cell first, then connects you to the lead from your business number. The call is logged on the lead.",
  },
  {
    t: "We write the registration",
    b: "You give your legal business name, whether you have an EIN, your address and a contact. Occupella writes the campaign description, the opt-in language and the sample messages the carriers review.",
  },
];

function Blocks({ items, cols }: { items: Block[]; cols?: 3 }) {
  return (
    <div className="ls-blocks" data-cols={cols}>
      {items.map((c) => (
        <div className="ls-block" key={c.t}>
          <h3 className="ls-block-t">{c.t}</h3>
          <p className="ls-block-b">{c.b}</p>
        </div>
      ))}
    </div>
  );
}

export default function Leasing() {
  return (
    <SitePageShell
      active="solutions"
      title="Leasing follow-up, from first message to signed lease"
      lede={
        <>
          Occupella keeps your leads on one board, drafts the reply to each one and flags the
          ones that have gone quiet. You send every reply yourself, from your Gmail today, and by
          text once the carriers approve your number.
        </>
      }
      css={css + cropCss}
      close={{
        title: "Try Occupella free for 14 days",
        body: "The trial covers everything except Leasing, which opens when you pick Pro or Scale. No card to start.",
      }}
    >
      <section className="lp-section" style={{ paddingTop: 72 }}>
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-section-head">
              <h2 className="lp-h2">Every lead on one board</h2>
              <p className="lp-body">
                Five stages: New, Contacted, Scheduled, Applied and Leased. Renters and owners
                looking for management both fit on it.
              </p>
            </div>
          </Reveal>
          <div className="ls-board">
            <LeadBoardCrop />
            <p className="ls-caption">The Leasing board, with example data.</p>
          </div>
          <Blocks items={INTAKE} cols={3} />
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <div className="ls-split" data-flip="true">
            <div>
              <Reveal>
                <div className="lp-section-head">
                  <h2 className="lp-h2">A drafted reply for every lead</h2>
                  <p className="lp-body">
                    The first reply is your company&rsquo;s template, filled in with the
                    lead&rsquo;s details, so you read it and send. After that, Occupella drafts
                    from the conversation so far and lists what it noticed about the lead.
                  </p>
                </div>
              </Reveal>
              <div className="ls-list">
                <p>
                  Every message to a prospect is checked against fair housing rules right before
                  it sends. If it fails, it is stopped and you can revise it.
                </p>
                <p>Sending takes a manager or an admin.</p>
                <p>Email replies go out from your own Gmail address.</p>
              </div>
            </div>
            <div>
              <LeadDraftCrop />
              <p className="ls-caption">A lead&rsquo;s drafted reply, with example data.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <div className="ls-split">
            <Reveal>
              <div className="lp-section-head">
                <h2 className="lp-h2">Leads that have gone quiet</h2>
                <p className="lp-body">
                  A lead still in play with no contact for 3 days or more is flagged, coldest
                  first. It also shows up in the Today strip at the top of your Inbox.
                </p>
              </div>
            </Reveal>
            <div className="ls-cold">
              <ColdLeadsCrop />
              <TodayRow
                title="Jordan Reyes is going cold"
                sub="No touch in 3+ days · interested in Maple Court"
                label="A Today reminder: Jordan Reyes is going cold, no touch in 3 or more days."
              />
              <p className="ls-caption">The cold list and the Inbox reminder, with example data.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="ls-band">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-section-head">
              <span className="ls-status">
                <Icon d={MINUS} size={12} />
                Texting: in carrier review
              </span>
              <h2 className="lp-h2">Texting and calls on your own number</h2>
              <p className="lp-body">
                US carriers vet every business that sends texts, and the review takes about ten
                to fifteen days. Until it clears, nobody on any plan can text a lead, including
                us. Email replies work from day one.
              </p>
            </div>
          </Reveal>
          <Blocks items={PHONE} />
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-section-head">
              <h2 className="lp-h2">Which plans include it</h2>
              <p className="lp-body">
                Leasing is included on Pro and Scale. It isn&rsquo;t part of Starter or the free
                trial.
              </p>
            </div>
          </Reveal>
          <div className="ls-plans">
            <a className="btn btn-secondary" href="/pricing">
              Compare plans
            </a>
            <a className="lp-textlink" href="/features#the-loop">
              Everything else Occupella does
            </a>
          </div>
        </div>
      </section>
    </SitePageShell>
  );
}
