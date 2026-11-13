import { Blocks, Coming, SectionHead, SitePageShell, type Block } from "../Site";

// ─────────────────────────────────────────────────────────────────────
// /integrations: switching to Occupella from Buildium and other systems.
//
// ⚠ IT WAS "Integrations" UNTIL 2026-11-13, and its first card was "Connect
// Buildium". The connectors left the product (AgenticHelixis
// docs/decisions/ADR-one-product.md): a company now comes over through the
// files its property manager exports, read by the PMS's switching tool, never
// through a vendor's API. The path stays /integrations so links to it keep
// working; the page is about switching.
//
// ⚠ EVERY FILE BELOW IS A KIND THE SWITCHING TOOL READS (Occupella-PMS
// src/pms/api/switching.py: NEEDS, the opening balances, the uncleared items,
// the vendor payments and the history files). The tool reads CSV with the
// columns it names; it does not read any vendor's own export layout, so the
// page never says a file "just works" from a given system.
//
// ⚠ The AI assistant's connections (Gmail, Calendar, Drive) are the add-on's,
// and online payments are Coming. Nothing else is listed: there is no bank
// feed, no screening partner and no texting.
// ─────────────────────────────────────────────────────────────────────

const css = `
  .ig-grid { display: grid; gap: 20px; margin-top: 40px; }
  @media (min-width: 720px) { .ig-grid { grid-template-columns: 1fr 1fr; } }
  @media (min-width: 1060px) { .ig-grid[data-cols="4"] { grid-template-columns: repeat(4, 1fr); } }
  .ig-card {
    display: flex; flex-direction: column; gap: 10px;
    padding: 22px 22px 24px; border: 1px solid var(--line); border-radius: 10px; background: var(--canvas);
  }
  .ig-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .ig-card h3 { font-size: 19px; font-weight: 600; color: var(--ink); }
  .ig-card p { font-size: 16px; line-height: 1.6; color: var(--ink-muted); }
  .ig-chip {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 3px 10px; border-radius: 999px; font-size: 13px; font-weight: 600; white-space: nowrap;
    border: 1px solid var(--line-strong); color: var(--ink-muted); background: var(--canvas);
  }
  .ig-chip::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
  .ig-chip[data-s="live"] { color: #1F6B45; border-color: #B9DCC8; background: #EEF7F1; }
  .ig-ask { margin-top: 24px; font-size: 17px; line-height: 1.6; color: var(--ink); max-width: 62ch; }

  .sw-steps { margin-top: 48px; padding: 0; list-style: none; counter-reset: sw; max-width: 760px; display: flex; flex-direction: column; gap: 28px; }
  .sw-step { counter-increment: sw; display: grid; grid-template-columns: 40px 1fr; gap: 0 16px; }
  .sw-step::before {
    content: counter(sw); width: 32px; height: 32px; border-radius: 50%;
    display: grid; place-items: center; border: 1px solid var(--line-strong);
    font-size: 15px; font-weight: 600; color: var(--iris); font-variant-numeric: tabular-nums;
  }
  .sw-step h3 { font-size: 19px; font-weight: 600; line-height: 1.4; color: var(--ink); padding-top: 3px; }
  .sw-step p { margin-top: 8px; font-size: 17px; line-height: 1.6; color: var(--ink-muted); max-width: 62ch; }
`;

/** Each file the switching tool reads, by what it brings. */
export const FILES: Block[] = [
  {
    t: "Owners and vendors",
    b: "Each by name, with their email, phones and mailing address if the file has them.",
  },
  {
    t: "Properties and units",
    b: "Each property with its owner, and each unit with its bedrooms, bathrooms, square feet and market rent if given.",
  },
  {
    t: "Tenants and leases",
    b: "Each tenant at their property, and each lease with its unit, tenants, first day and monthly rent.",
  },
  {
    t: "Open charges",
    b: "What tenants still owe, each charge on the lease it belongs to with its own due date. A charge is never guessed onto a lease.",
  },
  {
    t: "Unpaid bills",
    b: "Vendors' bills the old system had not paid, under their old references and dates, so owner draws hold them back from the first day.",
  },
  {
    t: "Opening balances",
    b: "What each trust bank account held on your cutover day for each owner, tenant deposit, prepaid rent, vendor and your company's fees, checked against the old system's book cash.",
  },
  {
    t: "Checks and deposits not cleared",
    b: "The items the bank hadn't cleared at the cutover, so your first reconciliation ties out.",
  },
  {
    t: "This year's vendor payments",
    b: "What the old system paid each vendor earlier in the cutover's year, so the year's 1099 summary is whole.",
  },
  {
    t: "History",
    b: "Each tenant's, owner's and vendor's past ledger lines, kept beside the books under Before the switch. History is never posted and moves no money.",
  },
];

const STEPS: { t: string; b: string }[] = [
  {
    t: "Start free and add your trust bank accounts",
    b: "One for security deposits and one for everything else you hold in trust, or as many of each as you keep.",
  },
  {
    t: "Bring the roster in, a file at a time",
    b: "Owners, vendors, properties, units, tenants, leases, open charges and unpaid bills. Each file goes in whole or not at all, and sending a file again adds nothing twice.",
  },
  {
    t: "Open each trust bank account at the cutover",
    b: "Bring in what each account held on your cutover day. Occupella checks it against the old system's book cash, once.",
  },
  {
    t: "Carry over what hadn't cleared, and sign off",
    b: "List the checks and deposits the bank hadn't cleared, then sign off the tie-out. From the cutover day, rent and late fees post in Occupella.",
  },
];

type Card = { name: string; status: "live" | "coming"; body: string };

/** What else Occupella connects to, and the state of each. */
export const CONNECTIONS: Card[] = [
  {
    name: "Gmail, Google Calendar and Google Drive",
    status: "live",
    body: "For the AI assistant add-on: it reads a thread or a document for context and works from your own Google account.",
  },
  {
    name: "Online rent payments",
    status: "coming",
    body: "Tenants pay rent online through our payments provider, by bank first and by card after, with a small fee on each payment shown before anyone pays.",
  },
];

export default function Integrations() {
  return (
    <SitePageShell
      active="resources"
      title="Switching from Buildium and other systems"
      lede={
        <>
          Occupella&rsquo;s switching tool brings your company over from CSV files you export
          from your current system. It needs no API key, and it changes nothing in the system
          you&rsquo;re leaving.
        </>
      }
      css={css}
      close={{
        title: "Start free, then bring your files",
        body: "Make your account, add your trust bank accounts and bring your records in a file at a time. No card to start.",
      }}
    >
      <section className="lp-section" style={{ paddingTop: 72 }}>
        <div className="lp-wrap">
          <SectionHead title="What comes over">
            One CSV file per kind of record, with the columns the switching tool names in the
            app. Names are matched exactly, so a file you send twice adds nothing twice.
          </SectionHead>
          <Blocks items={FILES} cols={3} />
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <SectionHead title="How a switch goes" />
          <ol className="sw-steps">
            {STEPS.map((s) => (
              <li className="sw-step" key={s.t}>
                <div>
                  <h3>{s.t}</h3>
                  <p>{s.b}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <SectionHead title="Coming from Buildium">
            The same steps, from the files you export from Buildium. Your Buildium account
            isn&rsquo;t touched.
          </SectionHead>
          <a className="lp-textlink" href="/integrations/buildium" style={{ display: "inline-block", marginTop: 24 }}>
            Switching from Buildium →
          </a>
          <p className="ig-ask">
            On another system? The switching tool reads CSV files, so the steps are the same from
            any system that exports them. Email{" "}
            <a href="mailto:team@occupella.com">team@occupella.com</a> and tell us which one
            you&rsquo;re leaving.
          </p>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <SectionHead title="Other connections" />
          <div className="ig-grid">
            {CONNECTIONS.map((c) => (
              <div className="ig-card" key={c.name} data-status={c.status}>
                <div className="ig-top">
                  <h3>{c.name}</h3>
                  {c.status === "live" ? (
                    <span className="ig-chip" data-s="live">
                      Live
                    </span>
                  ) : (
                    <Coming />
                  )}
                </div>
                <p>{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SitePageShell>
  );
}
