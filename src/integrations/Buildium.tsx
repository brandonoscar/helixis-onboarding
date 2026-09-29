import { CHECK, Icon, Reveal, SitePageShell } from "../Site";
import { WRITES } from "../Features";

// ─────────────────────────────────────────────────────────────────────
// /integrations/buildium: what Occupella reads from Buildium, what it can
// change, and what it needs from you.
//
// ⚠ READS are the records the Buildium sync mirrors (AgenticHelixis
// src/helixis/buildium/purge.py lists every one, because disconnecting
// deletes them all), in the words /privacy already uses. WRITES is the
// /features list, imported: add a change there, never here.
//
// ⚠ "Integrates with Buildium", never "partner". Occupella uses the public
// Buildium API with a key the customer creates. The footer's not-affiliated
// line stays.
//
// ⚠ THE APPROVAL CLAIM IS HELD. TODO(brandon): confirm autonomous notes flag
// is off; then the changes section can say each one waits for approval.
// ─────────────────────────────────────────────────────────────────────

const css = `
  .ib-cols { display: grid; gap: 40px 56px; margin-top: 56px; }
  @media (min-width: 860px) { .ib-cols { grid-template-columns: 1fr 1fr; } }
  .ib-list { margin-top: 24px; padding: 0; list-style: none; border-top: 1px solid var(--line); }
  .ib-list li { display: flex; gap: 12px; align-items: flex-start; padding: 12px 0; border-bottom: 1px solid var(--line); font-size: 16px; line-height: 1.55; color: var(--ink); }
  .ib-list li svg { flex: none; margin-top: 4px; color: var(--iris); }
  .ib-list li span small { display: block; margin-top: 2px; font-size: 15px; color: var(--ink-muted); }
  .ib-needs { margin-top: 24px; display: grid; gap: 20px; max-width: 820px; }
  @media (min-width: 720px) { .ib-needs { grid-template-columns: 1fr 1fr; } }
  .ib-need { border-top: 1px solid var(--line); padding-top: 16px; }
  .ib-need h3 { font-size: 18px; font-weight: 600; color: var(--ink); }
  .ib-need p { margin-top: 6px; font-size: 16px; line-height: 1.6; color: var(--ink-muted); }
`;

export const READS: { t: string; d: string }[] = [
  { t: "Properties and units", d: "Names, addresses and unit numbers." },
  { t: "Leases and tenants", d: "Lease dates, rent, the tenants on each lease and whether the tenancy is current." },
  { t: "Balances and ledger entries", d: "What each lease owes and the charges and payments behind it." },
  { t: "Owners", d: "Who owns each property." },
  { t: "Vendors and unpaid bills", d: "Your vendor list, and bills not yet paid with their line items." },
  { t: "Work orders and tasks", d: "Work orders and to-dos, with their status history." },
];

export default function BuildiumIntegration() {
  return (
    <SitePageShell
      active="resources"
      title="Occupella for Buildium"
      lede={
        <>
          Occupella connects to your Buildium account through Buildium&rsquo;s API, with a key you
          create. It keeps a synced copy of your records so it can answer questions without waiting
          on the API, and it can make a set list of changes back in Buildium.
        </>
      }
      css={css}
      close={{
        title: "Connect your Buildium account",
        body: "Create the key, paste it in, and Occupella scans your portfolio. 14 days free, no card.",
      }}
    >
      <section>
        <div className="lp-wrap">
          <div className="ib-cols">
            <div id="reads">
              <h2 className="lp-h2">What it reads</h2>
              <ul className="ib-list">
                {READS.map((r) => (
                  <li key={r.t}>
                    <Icon d={CHECK} size={15} />
                    <span>
                      {r.t}
                      <small>{r.d}</small>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="lp-body" style={{ marginTop: 20 }}>
                With live updates on, Buildium also sends work orders, resident messages, lease
                events and payments as they happen.
              </p>
            </div>
            <div id="changes">
              <h2 className="lp-h2">What it can change</h2>
              <ul className="ib-list">
                {WRITES.map((w) => (
                  <li key={w}>
                    <Icon d={CHECK} size={15} />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
              <p className="lp-body" style={{ marginTop: 20 }}>
                A payment, a charge and closing a work order need a manager or an admin in
                Occupella.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section" id="what-you-need">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-section-head">
              <h2 className="lp-h2">What you need</h2>
            </div>
          </Reveal>
          <div className="ib-needs">
            <div className="ib-need">
              <h3>A Buildium API key</h3>
              <p>
                A Client ID and Client Secret, created in Buildium under Settings → Developer
                Tools. <a href="/docs/buildium-api-setup">How to create one</a>
              </p>
            </div>
            <div className="ib-need">
              <h3>Live updates, if you want them</h3>
              <p>
                A webhook subscription in Buildium pointed at Occupella. Optional, and{" "}
                <a href="/docs/buildium-api-setup#live-updates">covered in the same guide</a>.
              </p>
            </div>
            <div className="ib-need">
              <h3>Disconnecting</h3>
              <p>
                Revoke the key in Buildium at any time. Disconnecting in Occupella deletes its
                synced copy of your data, as Buildium&rsquo;s API terms require.
              </p>
            </div>
            <div className="ib-need">
              <h3>Security</h3>
              <p>
                The key is encrypted before it is stored and never shown again.{" "}
                <a href="/security">How Occupella protects your data</a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </SitePageShell>
  );
}
