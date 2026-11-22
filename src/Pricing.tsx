import { Coming, Reveal, SitePageShell } from "./Site";

// ─────────────────────────────────────────────────────────────────────
// /pricing
//
// ⚠ THE OFFER (founder, 2026-11-13; copy of 2026-11-22). Occupella, the
// books, is free to use and open source. The AI assistant is the paid add-on.
// Online rent payments are not available yet, so they are a note under the
// cards, not a card: a small fee on each one, set just above our cost and
// shown before anyone pays. NO FIGURE IS SET, so the fee is written in words
// and never as a number.
//
// ⚠ "Billing isn't switched on yet" STAYS until billing is (founder's
// decision, 2026-11-22): the add-on's limits are not charged for today.
//
// ⚠ THE ADD-ON'S PRICES ARE TODAY'S CHAT PLANS, until the founder confirms
// otherwise, and they are HAND-COPIED FROM ANOTHER REPOSITORY. The authority
// is AgenticHelixis/src/helixis/billing/plans.py (Starter 50 flat, Pro 199
// per seat, Scale 500 flat, a 14-day trial). A test over there
// (test_plan_figures_have_one_source.py) names this file in its failure text,
// which is the only thing connecting them. Change a price there, change it
// here, and in the terms.
//
// ⚠ VOCABULARY (founder, 2026-11-22, replacing the call of 2026-09-08 that
// sold usage as 3x and 8x tiers, which read 400 / 150 as 3x). Each card says
// its questions a month (billing/plans.py turns_included: 150 pooled, 400 per
// seat, 1,200 pooled) and whether the leasing pipeline is included
// (billing/plans.py FEATURE_CRM: Pro and Scale). No texting line: texting is
// not offered (founder, 2026-11-13).
// ─────────────────────────────────────────────────────────────────────

const css = `
  .pr-plans { display: grid; gap: 20px; margin-top: 56px; }
  @media (min-width: 900px) { .pr-plans { grid-template-columns: repeat(3, 1fr); } }
  @media (min-width: 900px) { .pr-plans[data-cols="2"] { grid-template-columns: repeat(2, 1fr); max-width: 820px; } }
  .pr-note b { color: var(--ink); font-weight: 600; }

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
  .pr-fig[data-words="true"] { font-size: 34px; line-height: 1.1; }
  .pr-unit { font-size: 15px; color: var(--ink-muted); }
  .pr-allow { font-size: 16px; font-weight: 500; color: var(--ink); }
  .pr-for { font-size: 16px; line-height: 1.55; color: var(--ink-muted); flex: 1; }
  .pr-cta { margin-top: 8px; }
  .pr-cta .btn { width: 100%; height: 44px; font-size: 15px; }
  .pr-note { margin-top: 24px; font-size: 16px; color: var(--ink-muted); max-width: 62ch; }

  /* ── questions: plain blocks under a thin rule, no box around them ── */
  .pr-faq { display: grid; gap: 40px 56px; margin-top: 48px; }
  @media (min-width: 880px) { .pr-faq { grid-template-columns: 1fr 1fr; } }
  .pr-faq-item { border-top: 1px solid var(--line); padding-top: 22px; display: flex; flex-direction: column; gap: 10px; }
  .pr-faq-q { font-size: 18px; font-weight: 600; line-height: 1.4; color: var(--ink); }
  .pr-faq-a { font-size: 16px; line-height: 1.65; color: var(--ink-muted); max-width: 60ch; }
`;

type Card = {
  key: string;
  name: string;
  /** The big line. A word ("Free") or a price ("$50"); never a figure that
   *  isn't set. */
  fig: string;
  unit: string;
  allowance?: string;
  /** A second short line under the allowance. */
  extra?: string;
  forWho: string;
  coming?: boolean;
  featured?: boolean;
  cta?: { href: string; label: string };
};

/** What Occupella costs: the books, and the add-on. */
export const OFFER: Card[] = [
  {
    key: "books",
    name: "Occupella",
    fig: "Free",
    unit: "to use",
    forWho:
      "Trust accounting, the rent roll, leases and e-signing, bills, owner draws, month-end, owner statements, reports, maintenance, leasing and the switching tool.",
    featured: true,
    cta: { href: "/start", label: "Start free" },
  },
  {
    key: "ai",
    name: "AI assistant",
    fig: "From $50",
    unit: "per month",
    forWho: "A paid add-on: a chat that works on your data. Three plans, below.",
    cta: { href: "#ai-assistant", label: "See the plans" },
  },
];

/**
 * Online rent payments, not available yet: a note under the cards. In words,
 * with no figure, until one is set (claims.test.ts).
 */
export const PAYMENTS_NOTE = {
  t: "Online rent payments (not available yet).",
  b: "When they arrive, a small fee on each payment made online, set just above what each payment costs us and shown before anyone pays. Rent you record by hand (check, money order, cash) never carries a fee.",
};

type Plan = {
  key: string;
  name: string;
  fig: string;
  unit: string;
  allowance: string;
  extra: string;
  forWho: string;
  /** Per person, for the structured data's description. */
  perPerson?: boolean;
};

/** ⚠ Mirrors billing/plans.py. See the file header before editing a number.
 *  Also read by seo/head.ts for the SoftwareApplication offers. */
export const PLANS: Plan[] = [
  {
    key: "starter",
    name: "Starter",
    fig: "$50",
    unit: "per month",
    allowance: "150 questions a month, shared",
    extra: "Leasing pipeline: no",
    forWho: "For one person working a small book.",
  },
  {
    key: "pro",
    name: "Pro",
    fig: "$199",
    unit: "per person, per month",
    allowance: "400 questions a month per person",
    extra: "Leasing pipeline: yes",
    forWho: "For a team. Usage is counted per person, so it grows as you add people.",
    perPerson: true,
  },
  {
    key: "scale",
    name: "Scale",
    fig: "$500",
    unit: "per month",
    allowance: "1,200 questions a month, shared",
    extra: "Leasing pipeline: yes",
    forWho: "For the whole team on one bill, with no per-person charge and the usage shared.",
  },
];

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "Is Occupella really free?",
    a: (
      <>
        Yes. The books are free to use and open source, with no card to start and no trial
        that ends. We earn money from the AI assistant and, once online rent payments are
        available, from a small fee on each one.
      </>
    ),
  },
  {
    q: "What will the fee on online rent payments be?",
    a: (
      <>
        It isn&rsquo;t set yet. It will be just above what each payment costs us, and it is shown
        before anyone pays. Rent paid by check, money order, cash or any other way you record by
        hand carries no fee.
      </>
    ),
  },
  {
    q: "Do I need the AI assistant?",
    a: (
      <>
        No. Everything in the books works without it. It is there if you want a chat that works
        on your data and drafts for your staff to review.
      </>
    ),
  },
  {
    q: "How much can I use the assistant?",
    a: (
      <>
        Your plan&rsquo;s questions for the month are on the billing page in the app, which turns
        amber at 80%.
      </>
    ),
  },
  {
    q: "Is there a trial of the assistant?",
    a: (
      <>
        Yes, 14 days, with no card. You choose a plan in the app when it ends, or you don&rsquo;t,
        and the books keep working either way.
      </>
    ),
  },
  {
    q: "Can I cancel the assistant?",
    a: (
      <>
        Any time, from Settings, Billing, which opens our payment provider&rsquo;s portal.
        Cancelling stops the next charge, and the assistant keeps working until the end of the
        period you have paid for.
      </>
    ),
  },
  {
    q: "Can I bring my company over from Buildium?",
    a: (
      <>
        Yes, from CSV files you export from Buildium, with the switching tool. It costs nothing.{" "}
        <a href="/integrations/buildium">Switching from Buildium</a>
      </>
    ),
  },
  {
    q: "What happens to my data if I leave?",
    a: (
      <>
        It stays yours. An admin can download the whole ledger as CSV files, or every record,
        document and signed lease in one zip, from Settings.
      </>
    ),
  },
];

function OfferCard({ c }: { c: Card }) {
  return (
    <div className="pr-plan" data-featured={c.featured || undefined}>
      <h2 className="pr-name">
        {c.name}
        {c.coming ? <Coming /> : null}
      </h2>
      <div>
        <div className="pr-fig" data-words={!/^(\$|From \$|Free$)/.test(c.fig) || undefined}>
          {c.fig}
        </div>
        <div className="pr-unit">{c.unit}</div>
      </div>
      {c.allowance ? <div className="pr-allow">{c.allowance}</div> : null}
      {c.extra ? <div className="pr-unit">{c.extra}</div> : null}
      <p className="pr-for">{c.forWho}</p>
      {c.cta ? (
        <div className="pr-cta">
          <a className={`btn ${c.featured ? "btn-primary" : "btn-secondary"}`} href={c.cta.href}>
            {c.cta.label}
          </a>
        </div>
      ) : null}
    </div>
  );
}

export default function Pricing() {
  return (
    <SitePageShell
      active="pricing"
      title="Free to use"
      lede={
        <>
          The books are free and open source. The AI assistant is a paid add-on. Once online rent
          payments are available, there will be a small fee on each payment made online.
        </>
      }
      css={css}
      close={{
        title: "Start free today",
        body: "Make your account and bring your records over with the switching tool. No card to start.",
      }}
    >
      <section>
        <div className="lp-wrap">
          <Reveal>
            <div className="pr-plans" data-cols="2">
              {OFFER.map((c) => (
                <OfferCard c={c} key={c.key} />
              ))}
            </div>
          </Reveal>
          <p className="pr-note" id="online-payments" data-not-yet>
            <b>{PAYMENTS_NOTE.t}</b> {PAYMENTS_NOTE.b}
          </p>
        </div>
      </section>

      <section className="lp-section lp-anchor" id="ai-assistant">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-section-head">
              <h2 className="lp-h2">The AI assistant</h2>
              <p className="lp-body">
                An add-on to the free books. The plans differ in how many questions you can ask,
                whether they&rsquo;re counted per person, and whether the leasing pipeline is
                included. <a href="/features#ai-assistant">What it does</a>
              </p>
            </div>
          </Reveal>
          <Reveal delay={60}>
            <div className="pr-plans">
              {PLANS.map((p) => (
                <OfferCard
                  key={p.key}
                  c={{ ...p, featured: false, cta: { href: "/start", label: "Start free" } }}
                />
              ))}
            </div>
          </Reveal>
          <p className="pr-note">
            A question counts only when it gets an answer. One that fails or comes back empty costs
            nothing.
          </p>
          {/* The founder's decision (2026-11-22): this note stays until billing is on. */}
          <p className="pr-note" id="billing-off">
            <b>Billing isn&rsquo;t switched on yet.</b> Until it is, the assistant is free to use
            within these limits. We&rsquo;ll email every company before the first charge.
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
