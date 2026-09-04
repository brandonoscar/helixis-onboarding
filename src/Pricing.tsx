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
// ⚠ WHAT THE PLANS ACTUALLY DIFFER ON. Two things, and only two: how many
// requests are included, and whether the Leasing pipeline is part of it.
// Everything else Occupella does is on every plan. Presenting it any other way
// — a feature matrix with invented distinctions to make the dear plans look
// fuller — is the thing this table is written to avoid.
//
// ⚠ VOCABULARY (founder call, 2026-09-04). The metered unit is a REQUEST and
// the meter itself is USAGE. It used to be "questions" here and in the app,
// which broke the moment the answer to "what counts" had to include things
// that are not questions. Both words are load-bearing across three surfaces —
// this page, Legal.tsx's billing section, and the app's own billing panel and
// refusal messages — so a change is a change in all of them. The refusal a
// customer reads when they run out is generated from the backend, and it must
// use the same noun this page sold them.
//
// ⚠ TWO PLANS EXCLUDE LEASING, for two different reasons, and the API
// enforces both: every authenticated Leasing route refuses with a 402.
//   · Starter — Leasing costs real per-customer money that $50 does not cover.
//   · Trial — carrier approval outlasts the trial, so it could never be used.
// The cards say each reason in as many words rather than leaving it to the
// table, because those are the two plans where somebody could arrive and find
// a section closed.
// ─────────────────────────────────────────────────────────────────────

const css = `
  .pr-cards { margin-top: 36px; }
  @media (min-width: 700px) { .pr-cards { grid-template-columns: 1fr 1fr; } }
  @media (min-width: 1060px) { .pr-cards { grid-template-columns: repeat(4, 1fr); } }

  .pr-card { padding: 26px 22px 24px; display: flex; flex-direction: column; gap: 10px; }
  /* The recommended plan is marked by GROUND, not by a border or a scale —
     a card that grows on a pricing page shoves the other three around and
     reads as a pop-up. */
  .pr-card[data-featured="true"] { background: var(--canvas-1); }

  .pr-name { font-size: 12px; letter-spacing: .09em; text-transform: uppercase; font-weight: 600; color: var(--ink-muted); display: flex; align-items: center; gap: 8px; }
  .pr-tag {
    font-family: var(--font-mono); font-size: 10px; letter-spacing: .08em;
    text-transform: uppercase; font-weight: 500;
    color: var(--iris); background: var(--iris-soft);
    border-radius: var(--r-pill); padding: 3px 7px;
  }
  .pr-fig { font-size: 32px; font-weight: 700; letter-spacing: -.025em; font-variant-numeric: tabular-nums; line-height: 1.1; color: var(--ink); }
  .pr-fig span { font-size: 14px; font-weight: 500; color: var(--ink-muted); letter-spacing: 0; }
  .pr-allow { font-size: 13.5px; color: var(--ink-secondary, var(--ink-muted)); font-variant-numeric: tabular-nums; }
  .pr-for { font-size: 14px; line-height: 1.55; color: var(--ink-muted); flex: 1; }
  .pr-leasing { font-size: 13px; line-height: 1.5; display: flex; gap: 8px; align-items: flex-start; }
  .pr-leasing svg { flex: none; margin-top: 2px; }
  .pr-leasing[data-has="true"] { color: var(--ink-secondary, var(--ink-muted)); }
  .pr-leasing[data-has="true"] svg { color: var(--iris); }
  /* Excluded reads MUTED, never red. A cheaper plan is a smaller plan, not a
     broken one, and the danger colour is reserved for real failure. */
  .pr-leasing[data-has="false"] { color: var(--ink-subtle); }
  .pr-leasing[data-has="false"] svg { color: var(--ink-faint); }
  .pr-cta { margin-top: 4px; }
  .pr-cta .btn { width: 100%; justify-content: center; }

  /* ── comparison table ────────────────────────────────────────────────
     Scrolls inside its own container so the PAGE never scrolls sideways on
     a phone, and the first column stays put so a row keeps its label. */
  .pr-table-wrap { margin-top: 36px; overflow-x: auto; border: 1px solid var(--line); border-radius: var(--r-lg); }
  .pr-table { width: 100%; min-width: 640px; border-collapse: collapse; background: var(--canvas); }
  .pr-table th, .pr-table td { text-align: left; padding: 13px 16px; border-bottom: 1px solid var(--line); font-size: 14px; }
  .pr-table tr:last-child th, .pr-table tr:last-child td { border-bottom: 0; }
  .pr-table thead th {
    position: sticky; top: 0; background: var(--canvas-1);
    font-size: 12px; letter-spacing: .07em; text-transform: uppercase; font-weight: 600;
    color: var(--ink-muted); white-space: nowrap;
  }
  .pr-table tbody th { font-weight: 500; color: var(--ink-secondary, var(--ink-muted)); white-space: nowrap; }
  .pr-table td { text-align: center; color: var(--ink-muted); font-variant-numeric: tabular-nums; }
  .pr-table td svg { color: var(--iris); }
  .pr-table td[data-off="true"] svg { color: var(--ink-faint); }
  .pr-table-note { margin-top: 14px; font-size: 13px; color: var(--ink-subtle); }

  /* ⚠ The table is 640px wide at its narrowest and a phone is 390px, so on a
     phone it shows ONE column and reads as truncated rather than as
     scrollable. Saying so is the fix: a horizontal scrollbar inside a
     container is close to invisible on iOS, and the alternative — a fading
     edge — is a gradient fill, which the design spec rules out. Hidden above
     the width where the whole table fits. */
  .pr-scroll-hint { display: none; margin-top: 10px; font-size: 12.5px; color: var(--ink-subtle); }
  @media (max-width: 700px) { .pr-scroll-hint { display: block; } }

  /* ── FAQ ── */
  .pr-faq { margin-top: 32px; }
  @media (min-width: 820px) { .pr-faq { grid-template-columns: 1fr 1fr; } }
  .pr-faq-item { padding: 22px 22px 24px; display: flex; flex-direction: column; gap: 8px; }
  .pr-faq-q { font-size: 15px; font-weight: 600; letter-spacing: -0.01em; color: var(--ink); }
  .pr-faq-a { font-size: 14px; line-height: 1.6; color: var(--ink-muted); }
  .pr-faq-a a { color: var(--iris); text-decoration: none; }
`;

type Plan = {
  key: string;
  name: string;
  tag?: string;
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
    unit: " · 14 days",
    allowance: "150 requests",
    // ⚠ Leasing is FALSE on the trial and the reason is arithmetic, not
    // packaging (founder call, 2026-09-04). Carrier approval for texting runs
    // ten to fifteen days; the trial is fourteen. A trialist given Leasing
    // gets a setup checklist they cannot finish inside the trial, which is a
    // worse first week than not offering it. Do not flip this back without
    // changing billing/plans.py in the same commit — the API refuses on that
    // file's feature set, so a tick here that disagrees is a promise the
    // product breaks on click.
    forWho:
      "The everyday work for two weeks — Buildium, the Inbox, reporting and documents. Long enough to connect your account and watch it handle real work.",
    leasing: false,
    leasingLabel: "Leasing opens on Pro",
    cta: "Start free",
  },
  {
    key: "starter",
    name: "Starter",
    fig: "$50",
    unit: " / month",
    allowance: "150 requests a month",
    forWho:
      "One person running a small book. The trial's allowance, kept — every month, without a card expiring on you.",
    leasing: false,
    leasingLabel: "No Leasing pipeline",
    cta: "Start free",
  },
  {
    key: "pro",
    name: "Pro",
    tag: "Most teams",
    fig: "$199",
    unit: " / person / month",
    allowance: "400 requests each, every month",
    forWho:
      "A team working the whole portfolio. About eighteen requests a working day per person, and the allowance grows as you hire.",
    leasing: true,
    leasingLabel: "Leasing included",
    featured: true,
    cta: "Start free",
  },
  {
    key: "scale",
    name: "Scale",
    fig: "$500",
    unit: " / month",
    allowance: "1,200 requests a month, pooled",
    forWho:
      "Put everyone on it for one predictable bill. No per-person charge, and the allowance is shared across the team.",
    leasing: true,
    leasingLabel: "Leasing included",
    cta: "Start free",
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
  { label: "Requests included", values: ["150 once", "150 / mo", "400 / person", "1,200 / mo"] },
  { label: "People", values: ["Your team", "Your team", "Priced per person", "Your team"] },
  { label: "Buildium sync and history", values: [true, true, true, true] },
  { label: "Inbox with drafted replies", values: [true, true, true, true] },
  { label: "Approval gates on every write", values: [true, true, true, true] },
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
    q: "What counts as a request?",
    a: (
      <>
        One thing you ask Occupella that produces an answer. A request that fails or comes back
        empty is not counted, and neither is anything Occupella does on its own — the Inbox
        drafting a reply to a work order, a nightly sweep, a reminder. Reading the Inbox,
        approving a draft and browsing your portfolio are free. Asking is what counts.
      </>
    ),
  },
  {
    q: "What happens if I run out?",
    a: (
      <>
        Asking pauses until the month resets, or until you move up a plan. Nothing is deleted,
        the Inbox keeps working, and your Buildium account is untouched. Your usage for the
        period is on the billing page, so it should not be a surprise.
      </>
    ),
  },
  {
    q: "Do I need a card to start?",
    a: <>No. The fourteen days need no card, and nothing is charged when the trial ends — you
      pick a plan then, or you do not.</>,
  },
  {
    q: "Why is Leasing not in Starter?",
    a: (
      <>
        Leasing runs on a phone number registered to your business and a carrier campaign that
        costs money every month, per customer. At $50 that does not cover itself. Everything else
        Occupella does is on Starter.
      </>
    ),
  },
  {
    q: "Why is Leasing not in the trial?",
    a: (
      <>
        Because you could not use it inside two weeks. Texting a lead needs carrier approval,
        that review runs about ten to fifteen days, and the trial is fourteen — so it would be a
        setup checklist you never got to finish. Everything else is in the trial, and Leasing
        turns on when you pick Pro or Scale.
      </>
    ),
  },
  {
    q: "When can I actually text a lead?",
    a: (
      <>
        After the carriers approve your business, which takes about ten to fifteen days. We file
        it for you and there is nothing to chase. Until it clears, nobody on any plan can text a
        lead — us included. The rest of the product works from day one.
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
        Yes. Occupella mirrors your account so it can answer quickly, and writes back only what
        you approve. There is no migration and nothing to move.
      </>
    ),
  },
  {
    q: "What happens to my data if I leave?",
    a: (
      <>
        Disconnecting Buildium deletes the mirror of your data. That is a requirement of
        Buildium&rsquo;s API terms, not a favour — reconnecting simply syncs it again.
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
      eyebrow="Pricing"
      title="Start free for two weeks."
      lede={
        <>
          No card to begin. Plans differ on two things: how many requests are included, and
          whether the Leasing pipeline is part of it. Everything else is on every plan.
        </>
      }
      css={css}
      close={{
        title: "Fourteen days, no card.",
        body: "Connect Buildium, watch it handle a real work order, and pick a plan after — or do not, and nothing is charged.",
      }}
    >
      <section className="lp-section">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-grid pr-cards">
              {PLANS.map((p) => (
                <div className="pr-card" key={p.key} data-featured={p.featured || undefined}>
                  <div className="pr-name">
                    {p.name}
                    {p.tag ? <span className="pr-tag">{p.tag}</span> : null}
                  </div>
                  <div className="pr-fig">
                    {p.fig}
                    <span>{p.unit}</span>
                  </div>
                  <div className="pr-allow">{p.allowance}</div>
                  <p className="pr-for">{p.forWho}</p>
                  {/* ⚠ The two no-Leasing plans get DIFFERENT wording, because
                      they are different facts. Starter does not buy it. The
                      trial cannot use it — carrier approval outlasts fourteen
                      days — and labelling that "no Leasing" would read as the
                      free plan being crippled rather than as a timing limit
                      that applies to everyone. */}
                  <div className="pr-leasing" data-has={p.leasing}>
                    <Icon d={p.leasing ? CHECK : MINUS} size={14} />
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
              you have an account — saying so beats four buttons that look
              like four different purchases. */}
          <p className="lp-note" style={{ marginTop: 18, textAlign: "center" }}>
            Every plan starts with the same fourteen-day trial. You choose which one when it
            ends, inside the app.
          </p>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-section-head">
              <div className="lp-eyebrow">Compared</div>
              <h2 className="lp-h2">What you get on each.</h2>
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
          <p className="pr-table-note">
            Texting and calling leads begins once the carriers approve your business, which takes
            about ten to fifteen days on any plan.
          </p>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-section-head">
              <div className="lp-eyebrow">Questions</div>
              <h2 className="lp-h2">The things people ask before signing up.</h2>
            </div>
          </Reveal>
          <Reveal delay={60}>
            <div className="lp-grid pr-faq">
              {FAQ.map((f) => (
                <div className="pr-faq-item" key={f.q}>
                  <div className="pr-faq-q">{f.q}</div>
                  <div className="pr-faq-a">{f.a}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </SitePageShell>
  );
}
