import { SitePageShell } from "./Site";
import { APP_URL } from "./lib/urls";

// ─────────────────────────────────────────────────────────────────────
// /contact
//
// ⚠ ONE ADDRESS, the one the site already uses. The plan named support@,
// security@, partners@ and billing@occupella.com, plus a phone number and
// hours. An address that doesn't route is a message that disappears, so
// none is published until it's confirmed.
// TODO(brandon): confirm support@, security@, partners@ and billing@ route
// to your inbox, and give the business phone and hours; then list them here.
// ─────────────────────────────────────────────────────────────────────

const css = `
  .ct-grid { display: grid; gap: 32px 48px; margin-top: 48px; max-width: 900px; }
  @media (min-width: 760px) { .ct-grid { grid-template-columns: 1fr 1fr; } }
  .ct-item { border-top: 1px solid var(--line); padding-top: 20px; }
  .ct-item h2 { font-size: 18px; font-weight: 600; color: var(--ink); }
  .ct-item p { margin-top: 8px; font-size: 16px; line-height: 1.6; color: var(--ink-muted); }
  .ct-mail { display: inline-block; margin-top: 10px; font-size: 20px; font-weight: 600; }
`;

export default function Contact() {
  return (
    <SitePageShell
      title="Contact Occupella"
      lede={<>Email is the fastest way to reach us. Support replies within one business day.</>}
      css={css}
    >
      <section>
        <div className="lp-wrap">
          <div className="ct-grid">
            <div className="ct-item">
              <h2>Questions, support and billing</h2>
              <p>Setup help, a question about your account, or anything about your plan.</p>
              <a className="ct-mail" href="mailto:team@occupella.com">
                team@occupella.com
              </a>
            </div>
            <div className="ct-item">
              <h2>Security and data requests</h2>
              <p>
                A data processing agreement, a deletion request or a security report. The same
                address reaches us.
              </p>
              <a className="ct-mail" href="mailto:team@occupella.com">
                team@occupella.com
              </a>
            </div>
            <div className="ct-item">
              <h2>Already a customer</h2>
              <p>
                Sign in to your workspace at <a href={APP_URL}>app.occupella.com</a>.
              </p>
            </div>
            <div className="ct-item">
              <h2>The company</h2>
              <p>Occupella is operated by Oscar Ventures LLC.</p>
            </div>
          </div>
        </div>
      </section>
    </SitePageShell>
  );
}
