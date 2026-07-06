import Helix from "./Helix";

// Plain-English Privacy Policy + Terms of Service. Written to be honest and
// specific to what Helixis actually does (Buildium API mirror, Composio-managed
// Google OAuth, Fernet-encrypted credentials, confirm-gated writes). A lawyer
// or a Termly/iubenda pass should review before paid launch — but real pages
// beat dead links for procurement and due diligence today.

const css = `
  .legal {
    max-width: 720px;
    margin: 0 auto;
    padding: 22px 32px 80px;
  }

  .legal-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 56px;
  }

  .legal-wordmark {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.2px;
    color: var(--ink);
    text-decoration: none;
  }

  .legal h1 {
    font-size: 30px;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: var(--ink);
    margin-bottom: 6px;
  }

  .legal-date {
    font-family: var(--font-mono);
    font-size: 11.5px;
    color: var(--ink-subtle);
    margin-bottom: 40px;
  }

  .legal h2 {
    font-size: 17px;
    font-weight: 600;
    color: var(--ink);
    margin: 32px 0 10px;
  }

  .legal p, .legal li {
    font-size: 14px;
    line-height: 1.7;
    color: var(--ink-muted);
    margin-bottom: 10px;
  }

  .legal ul { padding-left: 20px; margin-bottom: 10px; }
  .legal a { color: var(--iris); text-decoration: none; }

  .legal-note {
    border: 1px solid var(--line);
    border-radius: var(--r-sm);
    background: var(--canvas-1);
    padding: 12px 14px;
    font-size: 12.5px;
    color: var(--ink-subtle);
    margin-bottom: 36px;
  }

  .legal-footer {
    border-top: 1px solid var(--line);
    margin-top: 56px;
    padding-top: 20px;
    font-size: 12.5px;
    color: var(--ink-subtle);
    display: flex;
    gap: 20px;
  }
  .legal-footer a { color: var(--ink-muted); }
`;

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="legal">
      <style>{css}</style>
      <nav className="legal-nav">
        <a className="legal-wordmark" href="/">
          <Helix width={22} height={30} dots={10} speed={0.5} />
          Helixis
        </a>
        <a href="/" style={{ fontSize: 13, color: "var(--ink-muted)", textDecoration: "none" }}>
          ← Back to helixis
        </a>
      </nav>
      <h1>{title}</h1>
      <div className="legal-date">Effective July 6, 2026</div>
      <div className="legal-note">
        This is written in plain English on purpose. If anything here is unclear, email{" "}
        <a href="mailto:hello@helixis.com">hello@helixis.com</a> and a human will answer.
      </div>
      {children}
      <div className="legal-footer">
        <span>© 2026 Helixis</span>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="mailto:hello@helixis.com">hello@helixis.com</a>
      </div>
    </div>
  );
}

export function Privacy() {
  return (
    <Shell title="Privacy Policy">
      <h2>What Helixis is</h2>
      <p>
        Helixis is an execution layer for property management teams using Buildium. It
        mirrors data from the accounts you connect, surfaces context, drafts actions, and
        performs writes only after you approve them.
      </p>

      <h2>Data we access</h2>
      <ul>
        <li>
          <strong>Buildium:</strong> when you connect your API credentials, we mirror the
          records needed to operate — properties, units, leases, tenants, work orders,
          tasks, vendors, bills, and related events delivered by Buildium webhooks.
        </li>
        <li>
          <strong>Google (optional):</strong> if you connect Gmail or Google Calendar, access
          is granted through Google's OAuth consent screen via our managed-auth provider
          (Composio), using the minimum scopes required. We never see or store your Google
          password.
        </li>
        <li>
          <strong>Account data:</strong> your email address, workspace name, and team member
          invitations.
        </li>
        <li>
          <strong>Usage and diagnostics:</strong> product analytics and error reports that help
          us fix problems. These are scoped to your workspace.
        </li>
      </ul>

      <h2>How data is protected</h2>
      <ul>
        <li>API credentials and webhook secrets are encrypted at rest and are never displayed again after setup.</li>
        <li>All data is isolated per company. Your workspace's records, AI memory, and files are not visible to any other customer.</li>
        <li>Every write to Buildium or Gmail requires explicit approval in the app. Helixis never auto-sends email.</li>
        <li>Sensitive identifiers (such as SSNs and payment card numbers) are redacted before anything is stored in AI memory.</li>
      </ul>

      <h2>What we do NOT do</h2>
      <ul>
        <li>We do not sell your data, ever.</li>
        <li>We do not use your data to train foundation models.</li>
        <li>We do not share your data with third parties except the subprocessors below, and only as needed to run the service.</li>
      </ul>

      <h2>Subprocessors</h2>
      <p>
        Helixis runs on a small set of infrastructure providers: cloud hosting and database
        (Render, Supabase), AI model providers (Google), managed OAuth (Composio), and
        observability/analytics (Sentry, Langfuse, PostHog). Each receives only what it needs
        to perform its function.
      </p>

      <h2>Deletion and your rights</h2>
      <p>
        You can disconnect any integration at any time — rotate or remove Buildium keys, or
        revoke Google access from your Google account. On request we will erase your
        workspace entirely: the mirrored data, stored AI memory, credentials, and account
        records. Buildium remains your system of record throughout; nothing you do in
        Helixis is required to keep your Buildium account intact.
      </p>

      <h2>Contact</h2>
      <p>
        Questions, deletion requests, or concerns: <a href="mailto:hello@helixis.com">hello@helixis.com</a>.
      </p>
    </Shell>
  );
}

export function Terms() {
  return (
    <Shell title="Terms of Service">
      <h2>The agreement</h2>
      <p>
        By creating a Helixis workspace you agree to these terms on behalf of your company.
        If you don't agree, don't use the service.
      </p>

      <h2>The service</h2>
      <p>
        Helixis provides software that connects to accounts you control (such as Buildium and
        Google), mirrors their data, and drafts or performs actions with your approval. You
        are responsible for the accounts you connect and for having the right to connect them.
      </p>

      <h2>Early access</h2>
      <p>
        Helixis is in early access. The service is provided as-is, features may change, and
        access is currently free. We will announce pricing before any billing begins — you
        will never be charged without agreeing to a price first.
      </p>

      <h2>Your responsibilities</h2>
      <ul>
        <li>Review AI-drafted content before approving it. Helixis drafts; you decide.</li>
        <li>Keep your account credentials secure and your team access list current.</li>
        <li>Use the service lawfully, including compliance with landlord-tenant and fair-housing laws that apply to your business.</li>
      </ul>

      <h2>Our responsibilities</h2>
      <ul>
        <li>Protect your data as described in the <a href="/privacy">Privacy Policy</a>.</li>
        <li>Perform writes to your systems only with your approval.</li>
        <li>Make deletion straightforward when you leave.</li>
      </ul>

      <h2>Limitations</h2>
      <p>
        AI-generated drafts and summaries can be wrong. Helixis is a tool that assists your
        team — it is not legal, financial, or professional advice, and final decisions are
        yours. To the maximum extent permitted by law, Helixis is not liable for indirect or
        consequential damages, and our total liability is limited to the amounts you paid us
        in the twelve months before a claim (during free early access, that is $0).
      </p>

      <h2>Termination</h2>
      <p>
        You can stop using Helixis at any time and request full deletion. We may suspend
        accounts that abuse the service or put other customers at risk, with notice where
        practical.
      </p>

      <h2>Changes</h2>
      <p>
        If these terms change materially, we'll notify workspace owners by email before the
        change takes effect.
      </p>

      <h2>Contact</h2>
      <p>
        <a href="mailto:hello@helixis.com">hello@helixis.com</a>
      </p>
    </Shell>
  );
}
