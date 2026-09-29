import { CHECK, Icon, MINUS, Reveal, SitePageShell } from "./Site";

// ─────────────────────────────────────────────────────────────────────
// /pricing
//
// ⚠ EVERY FIGURE HERE IS HAND-COPIED FROM ANOTHER REPOSITORY AND NOTHING
// HOLDS THE TWO IN AGREEMENT. The authority is
// AgenticHelixis/src/helixis/billing/plans.py — that module prices itself
// against a measured cost per turn and its own docstring invites re-deriving
// the numbers before any price change. A test over there
// (test_plan_figures_have_one_source.py) fails on a change and names this file
// in its failure text, which is the only thing connecting them.
//
// So: change a price there, change it HERE, and change it in Legal.tsx's
// billing section. A stale number on a marketing page is a bad look; a stale
// number in the terms is a different kind of problem.
//
// ⚠ WHAT THE PLANS ACTUALLY DIFFER ON. Two things, and only two: how much
// usage is included, and whether the Leasing pipeline is part of it.
// Everything else Occupella does is on every plan. Presenting it any other way
// — a feature matrix with invented distinctions to make the dear plans look
// fuller — is the thing this table is written to avoid.
//
// ⚠ VOCABULARY (founder call, 2026-09-08). This page sells USAGE and does not
// put a countable number on a card. The unit has now moved three times —
// "questions" (too narrow once the answer to "what counts" had to include
// things that are not questions), "requests" (accurate and too small; reads
// like an HTTP call), "credits" (a countable number on a card invites the
// buyer to divide it by thirty and decide it is not enough) — and the lesson
// is that a marketing page should not carry the unit at all. It carries a
// TIER: Standard, 3x, 8x, relative to Starter.
//
// ⚠ The exact figures still exist and still have to be somewhere. They are in
// Legal.tsx's billing section, as a fair-use ceiling in "answered turns", and
// in the app where a paying customer can see their own balance. Vague on the
// page, precise in the contract, precise in the product — which is the split
// Claude and OpenAI both use, and the one that survives a dispute.
//
// ⚠ Four surfaces, and a change is a change in all of them: this page,
// Legal.tsx, the app's billing panel (AgenticHelixis), and the refusal
// billing/gate.py generates when somebody runs out. That last one is the
// sentence a customer reads at the worst moment; it says "usage limit"
// rather than a number, and a test over there pins it.

// ⚠ TWO PLANS EXCLUDE LEASING, for two different reasons, and the API
// enforces both: every authenticated Leasing route refuses with a 402.
//   · Starter — Leasing costs real per-customer money that $50 does not cover.
//   · Trial — carrier approval outlasts the trial, so it could never be used.
// The cards say each reason in as many words rather than leaving it to the
// table, because those are the two plans where somebody could arrive and find
// a section closed.
// ─────────────────────────────────────────────────────────────────────

const css = `
  /* ── plans: four separate columns, space between them ────────────────
     Pro is marked by a heavier border and nothing else. It used to carry a
     "Most teams" pill, which is a claim about customers there is no data
     behind. */
  .pr-plans { display: grid; gap: 20px; margin-top: 56px; }
  @media (min-width: 700px) { .pr-plans { grid-template-columns: 1fr 1fr; } }
  @media (min-width: 1100px) { .pr-plans { grid-template-columns: repeat(4, 1fr); } }

  .pr-plan {
    display: flex; flex-direction: column; gap: 12px;
    padding: 28px 24px 24px;
    border: 1px solid var(--line); border-radius: 8px; background: var(--canvas);
  }
  .pr-plan[data-featured="true"] { border: 2px solid var(--ink-secondary); padding: 27px 23px 23px; }

  .pr-name { font-size: 17px; font-weight: 600; color: var(--ink); }
  .pr-fig {
    font-family: var(--font-display); font-optical-sizing: auto;
    font-size: 44px; font-weight: 560; letter-spacing: -0.02em; line-height: 1;
    color: var(--ink); font-variant-numeric: lining-nums tabular-nums;
  }
  .pr-unit { font-size: 15px; color: var(--ink-muted); }
  .pr-allow { font-size: 16px; font-weight: 500; color: var(--ink); }
  .pr-for { font-size: 16px; line-height: 1.55; color: var(--ink-muted); flex: 1; }
  .pr-leasing { font-size: 15px; line-height: 1.5; display: flex; gap: 8px; align-items: flex-start; }
  .pr-leasing svg { flex: none; margin-top: 3px; }
  .pr-leasing[data-has="true"] { color: var(--ink); }
  /* Excluded reads MUTED, never red. A cheaper plan is a smaller plan, not a
     broken one, and the danger colour is reserved for real failure. */
  .pr-leasing[data-has="false"] { color: var(--ink-muted); }
  .pr-leasing[data-has="false"] svg { color: var(--ink-faint); }
  .pr-cta { margin-top: 8px; }
  .pr-cta .btn { width: 100%; height: 44px; font-size: 15px; }
  .pr-note { margin-top: 24px; font-size: 16px; color: var(--ink-muted); max-width: 62ch; }

  /* ── comparison table ────────────────────────────────────────────────
     Scrolls inside its own container so the PAGE never scrolls sideways on
     a phone. */
  .pr-table-wrap { margin-top: 40px; overflow-x: auto; border: 1px solid var(--line); border-radius: 8px; }
  .pr-table { width: 100%; min-width: 680px; border-collapse: collapse; background: var(--canvas); }
  .pr-table th, .pr-table td { text-align: left; padding: 15px 20px; border-bottom: 1px solid var(--line); font-size: 16px; }
  .pr-table tr:last-child th, .pr-table tr:last-child td { border-bottom: 0; }
  .pr-table thead th { background: var(--foot); font-weight: 600; color: var(--ink); white-space: nowrap; }
  .pr-table thead th + th { text-align: center; }
  .pr-table tbody th { font-weight: 500; color: var(--ink); }
  .pr-table td { text-align: center; color: var(--ink-muted); font-variant-numeric: tabular-nums; }
  .pr-table td svg { color: var(--ink); vertical-align: middle; }
  .pr-table td[data-off="true"] svg { color: var(--ink-faint); }
  .pr-table-note { margin-top: 16px; font-size: 15px; color: var(--ink-muted); max-width: 62ch; }

  /* The table is 680px wide at its narrowest and a phone is 390px, so on a
     phone it shows one column and reads as truncated rather than as
     scrollable. A scrollbar inside a container is close to invisible on iOS,
     so it says so. Hidden above the width where the whole table fits. */
  .pr-scroll-hint { display: none; font-size: 15px; color: var(--ink-muted); }
  @media (max-width: 760px) { .pr-scroll-hint { display: block; } }

  /* ── questions: plain blocks under a thin rule, no box around them ── */
  .pr-faq { display: grid; gap: 40px 56px; margin-top: 48px; }
  @media (min-width: 880px) { .pr-faq { grid-template-columns: 1fr 1fr; } }
  .pr-faq-item { border-top: 1px solid var(--line); padding-top: 22px; display: flex; flex-direction: column; gap: 10px; }
  .pr-faq-q { font-size: 18px; font-weight: 600; line-height: 1.4; color: var(--ink); }
  .pr-faq-a { font-size: 16px; line-height: 1.65; color: var(--ink-muted); max-width: 60ch; }
`;

type Plan = {
  key: string;
  name: string;
  fig: string;
  unit: string;
  allowance: string;
  forWho: string;
  leasing: boolean;
  /** The one-line Leasing verdict on the card. Required, so a new plan cannot
   *  inherit a default that happens to be wrong for it. */
  leasingLabel: string;
  featured?: boolean;
  cta: string;
};

/** ⚠ Mirrors billing/plans.py. See the file header before editing a number. */
const PLANS: Plan[] = [
  {
    key: "trial",
    name: "Trial",
    fig: "Free",
    unit: "14 days",
    allowance: "Standard usage",
    // ⚠ Leasing is FALSE on the trial and the reason is arithmetic, not
    // packaging (founder call, 2026-09-04). Carrier approval for texting runs
    // ten to fifteen days; the trial is fourteen. A trialist given Leasing
    // gets a setup checklist they cannot finish inside the trial, which is a
    // worse first week than not offering it. Do not flip this back without
    // changing billing/plans.py in the same commit — the API refuses on that
    // file's feature set, so a tick here that disagrees is a promise the
    // product breaks on click.
    forWho:
      "Two weeks of the everyday work: Buildium, the Inbox, reporting and documents. Long enough to connect your account and watch it handle real work.",
    leasing: false,
    leasingLabel: "Leasing opens on Pro",
    cta: "Start free trial",
  },
  {
    key: "starter",
    name: "Starter",
    fig: "$50",
    unit: "per month",
    allowance: "Standard usage, every month",
    forWho: "For one person running a small book. The trial's usage, every month.",
    leasing: false,
    leasingLabel: "No Leasing pipeline",
    cta: "Start free trial",
  },
  {
    key: "pro",
    name: "Pro",
    fig: "$199",
    unit: "per person, per month",
    allowance: "3× more usage, per person",
    forWho:
      "For a team working the whole portfolio. Usage is counted per person, so it grows as you hire.",
    leasing: true,
    leasingLabel: "Leasing included",
    featured: true,
    cta: "Start free trial",
  },
  {
    key: "scale",
    name: "Scale",
    fig: "$500",
    unit: "per month",
    allowance: "8× more usage, pooled",
    forWho:
      "For putting the whole team on one bill. No per-person charge, and the usage is shared across the team.",
    leasing: true,
    leasingLabel: "Leasing included",
    cta: "Start free trial",
  },
];

type Row = { label: string; values: (string | boolean)[] };

/**
 * ⚠ Rows where every plan is identical are KEPT, deliberately. The two things
 * the plans differ on are the allowance and Leasing; a table that showed only
 * those two rows would be honest and useless, because the question a buyer is
 * actually asking is "what do I lose by paying less" — and the answer is
 * mostly "nothing". Showing the ticks all the way across is what says that.
 */
const ROWS: Row[] = [
  {
    label: "Usage",
    values: ["Standard", "Standard", "3× Starter, per person", "8× Starter, pooled"],
  },
  { label: "People", values: ["Your team", "Your team", "Priced per person", "Your team"] },
  { label: "Buildium sync and history", values: [true, true, true, true] },
  { label: "Inbox with drafted replies", values: [true, true, true, true] },
  // TODO(brandon): confirm autonomous notes flag is off. The row "Approval
  // gates on every write" is held back until HELIXIS_NOTES__AUTONOMOUS_ENABLED
  // is confirmed off in Render; with it on, notes reach Buildium unapproved.
  // ⚠ "Reports and tables", NOT "and charts". The chart card is built, wired
  // and has never once been produced by a real question — a tick beside the
  // word charts is a claim a buyer can falsify on their first afternoon.
  { label: "Reports and tables", values: [true, true, true, true] },
  { label: "Documents, Drive and web search", values: [true, true, true, true] },
  { label: "Gmail and Calendar", values: [true, true, true, true] },
  { label: "Roles, permissions and activity log", values: [true, true, true, true] },
  { label: "Fair housing guardrails", values: [true, true, true, true] },
  // ⚠ Trial is FALSE on both Leasing rows — see the note on the trial plan
  // above, and billing/plans.py, which is what the API actually refuses on.
  { label: "Leasing pipeline", values: [false, false, true, true] },
  { label: "Your own number for texts and calls", values: [false, false, true, true] },
];

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "How much can I use?",
    a: (
      <>
        Usage counts the things you ask Occupella that produce an answer. A question that fails
        or comes back empty costs nothing, and neither does anything Occupella does on its own,
        such as the Inbox drafting a reply to a work order, a nightly sweep or a reminder.
        Reading the Inbox, approving a draft and browsing your portfolio are free. If you get
        near your plan&rsquo;s limit we tell you before you reach it. The exact fair-use figures
        are in the <a href="/terms">terms</a>.
      </>
    ),
  },
  {
    q: "What happens if I run out?",
    a: (
      <>
        Asking pauses until the month resets, or until you move up a plan. Nothing is deleted,
        the Inbox keeps working, and your Buildium account is untouched. Your usage for the
        period is on the billing page in the app.
      </>
    ),
  },
  {
    q: "Do I need a card to start?",
    a: (
      <>
        No. The 14-day trial needs no card, and nothing is charged when it ends. You pick a plan
        then, or you don&rsquo;t.
      </>
    ),
  },
  {
    q: "Why is Leasing not in Starter?",
    a: (
      <>
        Leasing runs on a phone number registered to your business and a carrier campaign that
        costs money every month, per customer. $50 a month doesn&rsquo;t cover it. Everything
        else Occupella does is on Starter.
      </>
    ),
  },
  {
    q: "Why is Leasing not in the trial?",
    a: (
      <>
        Because you couldn&rsquo;t use it inside two weeks. Texting a lead needs carrier
        approval, which takes about ten to fifteen days, and the trial is fourteen. Everything
        else is in the trial, and Leasing turns on when you pick Pro or Scale.
      </>
    ),
  },
  {
    q: "When can I actually text a lead?",
    a: (
      <>
        After the carriers approve your business, which takes about ten to fifteen days. We file
        it for you and there is nothing to chase. Until it clears, nobody on any plan can text a
        lead, including us. The rest of Occupella works from day one.
      </>
    ),
  },
  {
    q: "Can I cancel?",
    a: (
      <>
        Any time, from Settings → Billing, which opens our payment provider&rsquo;s portal.
        Cancelling stops the next charge and Occupella keeps working until the end of the period
        you have already paid for. The <a href="/terms">terms</a> spell it out.
      </>
    ),
  },
  {
    q: "Is Buildium still the system of record?",
    a: (
      <>
        {/* TODO(brandon): confirm autonomous notes flag is off. This answer
            said "and writes back only what you approve"; restore it then. */}
        Yes. Occupella keeps a copy of your account so it can answer quickly. There is no
        migration and nothing to move.
      </>
    ),
  },
  {
    q: "What happens to my data if I leave?",
    a: (
      <>
        Disconnecting Buildium deletes Occupella&rsquo;s copy of your data, as Buildium&rsquo;s
        API terms require. If you reconnect, it syncs again.
      </>
    ),
  },
];

function Cell({ v }: { v: string | boolean }) {
  if (typeof v === "string") return <td>{v}</td>;
  return (
    <td data-off={!v}>
      <Icon d={v ? CHECK : MINUS} size={16} />
      <span className="lp-sr">{v ? "Included" : "Not included"}</span>
    </td>
  );
}

export default function Pricing() {
  return (
    <SitePageShell
      active="pricing"
      title="Start free for two weeks"
      lede={
        <>
          No card to begin. Plans differ on two things: how much usage is included, and
          whether the Leasing pipeline is part of it. Everything else is on every plan.
        </>
      }
      css={css}
      close={{
        title: "Try Occupella free for 14 days",
        body: "Connect Buildium, watch it handle a real work order, then pick a plan. If you don't, nothing is charged.",
      }}
    >
      <section>
        <div className="lp-wrap">
          <Reveal>
            <div className="pr-plans">
              {PLANS.map((p) => (
                <div className="pr-plan" key={p.key} data-featured={p.featured || undefined}>
                  <h2 className="pr-name">{p.name}</h2>
                  <div>
                    <div className="pr-fig">{p.fig}</div>
                    <div className="pr-unit">{p.unit}</div>
                  </div>
                  <div className="pr-allow">{p.allowance}</div>
                  <p className="pr-for">{p.forWho}</p>
                  {/* ⚠ The two no-Leasing plans get DIFFERENT wording, because
                      they are different facts. Starter does not buy it. The
                      trial cannot use it (carrier approval outlasts fourteen
                      days), and labelling that "no Leasing" would read as the
                      free plan being crippled rather than as a timing limit
                      that applies to everyone. */}
                  <div className="pr-leasing" data-has={p.leasing}>
                    <Icon d={p.leasing ? CHECK : MINUS} size={15} />
                    <span>{p.leasingLabel}</span>
                  </div>
                  <div className="pr-cta">
                    <a className={`btn ${p.featured ? "btn-primary" : "btn-secondary"}`} href="/start">
                      {p.cta}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
          {/* Every card starts the same trial, because you cannot buy before
              you have an account. Saying so beats four buttons that look
              like four different purchases. */}
          <p className="pr-note">
            Every plan starts with the same 14-day trial. You choose a plan when it ends, inside
            the app.
          </p>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-section-head">
              <h2 className="lp-h2">Compare plans</h2>
              <p className="pr-scroll-hint">Scroll the table sideways to see every plan.</p>
            </div>
          </Reveal>
          <Reveal delay={60}>
            <div className="pr-table-wrap">
              <table className="pr-table">
                <caption className="lp-sr">
                  Occupella plans compared: Trial, Starter, Pro and Scale.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">
                      <span className="lp-sr">Capability</span>
                    </th>
                    {PLANS.map((p) => (
                      <th scope="col" key={p.key}>
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Price</th>
                    {PLANS.map((p) => (
                      <td key={p.key}>
                        {p.fig}
                        {p.key === "pro" ? " / person" : ""}
                      </td>
                    ))}
                  </tr>
                  {ROWS.map((r) => (
                    <tr key={r.label}>
                      <th scope="row">{r.label}</th>
                      {r.values.map((v, i) => (
                        <Cell key={PLANS[i].key} v={v} />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
          {/* TODO(brandon): Leasing and "your own number" are sold here as
              included on Pro and Scale. Confirm carrier approval status and
              that HELIXIS_CRM__ENABLED is on in Render; with it off the
              Leasing section does not open on any plan. */}
          <p className="pr-table-note">
            Texting and calling leads begins once the carriers approve your business, which takes
            about ten to fifteen days on any plan.
          </p>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <Reveal>
            <h2 className="lp-h2">Questions before you sign up</h2>
          </Reveal>
          <div className="pr-faq">
            {FAQ.map((f) => (
              <div className="pr-faq-item" key={f.q}>
                <h3 className="pr-faq-q">{f.q}</h3>
                <div className="pr-faq-a">{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SitePageShell>
  );
}
