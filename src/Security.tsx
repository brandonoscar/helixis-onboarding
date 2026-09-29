import { Reveal, SitePageShell } from "./Site";
import { SubprocessorList } from "./legal/subprocessors";

// ─────────────────────────────────────────────────────────────────────
// /security: only facts that are true in the AgenticHelixis code today.
//
// Each block's source:
//   · company isolation: every helixis_* query carries company_id, pinned by
//     tests/unit/test_tenant_scoping_corpus.py and test_tenant_isolation_probe.py
//   · credentials encrypted at rest: Fernet with HELIXIS_DATA_KEY (settings.py,
//     api/routes/buildium.py); entered once and never shown again
//   · Google via Composio managed OAuth, minimum scopes (Legal.tsx /privacy)
//   · disconnect deletes the mirror: Buildium's API terms (/privacy, /pricing)
//   · role checks, locks, half-landed writes: the /features safeguards
//   · identifiers stripped from replies, outside text fenced: /features
//
// ⚠ NO CERTIFICATION CLAIMS: no SOC 2, ISO, HIPAA or similar. There are none.
// ⚠ THE APPROVAL CLAIM IS HELD. TODO(brandon): confirm autonomous notes flag
// is off; then add "Nothing is written to Buildium or sent without an
// approval card" as the first block.
// ⚠ TODO(brandon): confirm security@occupella.com routes to you; until then
// every request here goes to team@occupella.com, the address the site
// already uses.
// ─────────────────────────────────────────────────────────────────────

const css = `
  .sc-blocks { display: grid; gap: 32px 48px; margin-top: 48px; }
  @media (min-width: 760px) { .sc-blocks { grid-template-columns: 1fr 1fr; } }
  .sc-block { border-top: 1px solid var(--line); padding-top: 20px; }
  .sc-block h3 { font-size: 18px; font-weight: 600; line-height: 1.4; color: var(--ink); }
  .sc-block p { margin-top: 8px; font-size: 16px; line-height: 1.6; color: var(--ink-muted); }
  .sp-list { margin-top: 32px; padding: 0; list-style: none; max-width: 820px; border-top: 1px solid var(--line); }
  .sp-list li { padding: 14px 0; border-bottom: 1px solid var(--line); font-size: 16px; line-height: 1.6; color: var(--ink-muted); }
  .sp-list b { color: var(--ink); font-weight: 600; }
  .sp-list em { font-style: normal; color: var(--ink-subtle); }
  .sc-ask { margin-top: 20px; font-size: 17px; line-height: 1.6; color: var(--ink); max-width: 62ch; }
`;

const BLOCKS = [
  {
    t: "Your data stays in your company",
    b: "Every query Occupella runs is scoped to your company. A test reads every query in the codebase to keep it that way, and another tries to read one company's data from another's session.",
  },
  {
    t: "Credentials encrypted at rest",
    b: "Your Buildium API keys are encrypted before they are stored, entered once and never shown again, not even to you.",
  },
  {
    t: "Google access through managed sign-in",
    b: "Gmail, Calendar and Drive connect through Composio's OAuth with the minimum scopes Occupella needs. We never see or store your Google password.",
  },
  {
    t: "Disconnect deletes the copy",
    b: "Disconnecting Buildium deletes Occupella's synced copy of your data, as Buildium's API terms require. There is no option to keep it.",
  },
  {
    t: "Roles on the changes that can't be undone",
    b: "A payment, a charge and closing a work order need a manager or an admin, and are refused if the role can't be verified.",
  },
  {
    t: "No double charges",
    b: "Each approved change takes a lock before the Buildium call. A change that might have half-landed is flagged for review and never retried automatically.",
  },
  {
    t: "Identifiers kept off the screen",
    b: "Buildium record numbers, tenant emails and phone numbers are stripped from replies as they are written.",
  },
  {
    t: "Outside text can't give orders",
    b: "A resident's message, an email, a file or a web page is fenced off before the AI reads it, so text written by someone else can't tell Occupella what to do.",
  },
];

export default function Security() {
  return (
    <SitePageShell
      title="How Occupella protects your data"
      lede={
        <>
          What is in place today, stated as specifically as we can. We don&rsquo;t hold a
          security certification such as SOC 2, and this page doesn&rsquo;t claim one.
        </>
      }
      css={css}
      close={{
        title: "Questions before you connect Buildium?",
        body: "Email team@occupella.com and a person will answer.",
      }}
    >
      <section>
        <div className="lp-wrap">
          <div className="sc-blocks">
            {BLOCKS.map((b) => (
              <div className="sc-block" key={b.t}>
                <h3>{b.t}</h3>
                <p>{b.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section" id="subprocessors">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-section-head">
              <h2 className="lp-h2">Subprocessors</h2>
              <p className="lp-body">
                The service providers that process data for Occupella, and what each one does.
                The same list is in our <a href="/privacy">privacy policy</a>.
              </p>
            </div>
          </Reveal>
          <SubprocessorList />
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-section-head">
              <h2 className="lp-h2">Agreements and reports</h2>
            </div>
          </Reveal>
          <p className="sc-ask">
            A data processing agreement is available on request. To ask for one, or to report a
            security problem, email <a href="mailto:team@occupella.com">team@occupella.com</a>.
          </p>
        </div>
      </section>
    </SitePageShell>
  );
}
