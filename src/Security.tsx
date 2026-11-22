import { Coming, Reveal, SitePageShell, type Block } from "./Site";
import { SubprocessorList } from "./legal/subprocessors";
import { CHAT_READS_ONLY } from "./lib/releaseState";

// ─────────────────────────────────────────────────────────────────────
// /security: only facts that are true in the code today.
//
// Each block's source:
//   · the books (Occupella-PMS CLAUDE.md): every table carries its company and
//     every transfer stays inside one company; the ledger is append-only and
//     fixed by reversing entries; every write is in trust_audit_log naming the
//     staff member; the admin, approve and disburse roles and a trust
//     account's broker and signers; bank numbers, tax IDs and payment keys
//     sealed under PMS_DATA_KEY with only the last four shown, a tax ID's
//     reveal logged; trust_ai_agent, which reads and inserts drafts only
//   · the AI assistant add-on (AgenticHelixis): Google via Composio managed
//     OAuth, minimum scopes (Legal.tsx /privacy); outside text marked
//     untrusted; its own data in Supabase under row-level security, and
//     tests/unit/test_tenant_scoping_corpus.py failing on a query on a
//     helixis_* table without company_id
//   · company isolation in the books: Occupella-PMS tests/api/test_isolation.py
//     calls every route as one company with another's ids
//   · sign-in on app.occupella.com (checked 2026-11-22): staff sign in with
//     their Occupella account (Supabase); the books open for a staff member
//     only when that sign-in passed its second step, an authenticator code or
//     a backup code (AgenticHelixis src/helixis/books_sign_in.py and
//     api/auth.py second_factor_satisfied; pms/src/pms/external.py
//     SecondStepNeeded), and the books' own password sign-in is off
//     (helixis/books.py password_sign_in=False). NOT claimed for the hosted
//     app: argon2id (the PMS's own passwords, off there), the PMS's sign-in
//     throttle (it counts tokens, while passwords are checked by Supabase),
//     and owners' and tenants' own two-step sign-in (the PMS turns it off with
//     password sign-in, and nothing was found that offers it to them in the
//     hosted app).
//
// ⚠ "The assistant can't move money" keeps its Coming chip and today's wording
// until CHAT_READS_ONLY (src/lib/releaseState.ts): the chat's Buildium and
// Rentvine write tools have to be gone first.
//
// ⚠ IT DESCRIBED THE BUILDIUM ASSISTANT UNTIL 2026-11-13 (encrypted Buildium
// keys, the mirror deleted on disconnect, a lock before each Buildium call).
// The connector left the product (AgenticHelixis docs/decisions/
// ADR-one-product.md), so those blocks went with it.
//
// ⚠ NO CERTIFICATION CLAIMS: no SOC 2, ISO, HIPAA or similar. There are none.
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

const BLOCKS: Block[] = [
  {
    t: "Each company's books kept apart",
    b: "Every record carries the company it belongs to, and the database refuses a transfer from one company to another. A test calls every route of the books as one company with another company's ids, and fails if anything of the other company comes back. For the AI assistant's own data, row-level security limits what any signed-in user can read, and a check on every code change fails if a database query isn't limited to one company.",
  },
  {
    t: "A ledger that's never rewritten",
    b: "Nothing in the trust ledger is edited or deleted. A mistake is fixed with a reversing entry, so the record of what happened stays whole.",
  },
  {
    t: "Every change logged",
    b: "Every write to the books goes in an audit log with when it happened and what changed, and names the staff member when a staff member made it.",
  },
  {
    t: "Roles on money leaving trust",
    b: "Paying a bill or an owner takes the disburse role and approving month-end takes the approve role. A trust account's broker can limit payouts to the signers they name.",
  },
  {
    t: "Bank numbers and tax IDs encrypted",
    b: "Owners' and vendors' bank account numbers, tax IDs and payment keys are encrypted before they are stored. Only the last four digits are shown, and each time an admin reveals a tax ID is logged.",
  },
  CHAT_READS_ONLY
    ? {
        t: "The assistant can't move money",
        b: "The AI assistant has no tool that records a payment, a charge, a bill or a draw. Software you connect to the books with an API key runs under a database role whose only write is a draft for your staff to approve.",
      }
    : {
        t: "The assistant can't move money",
        coming: true,
        b: "When the AI assistant reads your books, it does so under a database role that can only read and propose drafts. It can't record a payment, a charge, a bill or a draw.",
      },
  {
    t: "Google access through managed sign-in",
    b: "For the AI assistant, Gmail, Calendar and Drive connect through Composio's OAuth with the minimum scopes it needs. We never see or store your Google password.",
  },
  {
    t: "Outside text is marked, not trusted",
    b: "An email, a file or a web page is marked as untrusted before the AI assistant reads it, and the assistant asks a person before it sends anything. This lowers the risk that someone else's text steers it. No fence removes that risk entirely.",
  },
  {
    t: "Sign-in",
    b: "On app.occupella.com, staff sign in with their Occupella account, and the books open only once that sign-in has passed its second step: an authenticator code, or one of their backup codes. The books' own password sign-in is turned off there. In a copy you run yourself, staff sign in with a password and an authenticator code, and passwords are stored as argon2id hashes.",
  },
];

export default function Security() {
  return (
    <SitePageShell
      title="How Occupella protects your data"
      lede={
        <>
          What is in place today, stated as specifically as we can. Anything not on
          app.occupella.com yet is marked Coming. We don&rsquo;t hold a security certification
          such as SOC 2, and this page doesn&rsquo;t claim one.
        </>
      }
      css={css}
      close={{
        title: "Questions about security?",
        body: "Email team@occupella.com and a person will answer.",
      }}
    >
      <section>
        <div className="lp-wrap">
          <div className="sc-blocks">
            {BLOCKS.map((b) => (
              <div className="sc-block" key={b.t}>
                <h3>
                  {b.t}
                  {b.coming ? <Coming /> : null}
                </h3>
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
            We don&rsquo;t have a published data processing agreement yet. If you need one, email{" "}
            <a href="mailto:team@occupella.com">team@occupella.com</a>. To report a security
            problem, email the same address.
          </p>
        </div>
      </section>
    </SitePageShell>
  );
}
