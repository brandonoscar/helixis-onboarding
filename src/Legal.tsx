import Mark from "./Mark";

// Plain-English Privacy Policy + Terms of Service. Written to be honest and
// specific to what Occupella actually does (Buildium API mirror, Composio-managed
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
          <Mark size={22} />
          Occupella
        </a>
        <a href="/" style={{ fontSize: 13, color: "var(--ink-muted)", textDecoration: "none" }}>
          ← Back to Occupella
        </a>
      </nav>
      <h1>{title}</h1>
      <div className="legal-date">Effective July 6, 2026 · Updated August 14, 2026</div>
      <div className="legal-note">
        This is written in plain English on purpose. If anything here is unclear, email{" "}
        <a href="mailto:team@occupella.com">team@occupella.com</a> and a human will answer.
      </div>
      {children}
      <div className="legal-footer">
        <span>© 2026 Oscar Ventures LLC</span>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="mailto:team@occupella.com">team@occupella.com</a>
      </div>
    </div>
  );
}

export function Privacy() {
  return (
    <Shell title="Privacy Policy">
      <h2>What Occupella is</h2>
      <p>
        Occupella is an execution layer for property management teams using Buildium. It
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
        <li>Every write to Buildium or Gmail requires explicit approval in the app. Occupella never auto-sends email.</li>
        <li>Sensitive identifiers (such as SSNs and payment card numbers) are redacted before anything is stored in AI memory.</li>
      </ul>

      <h2>SMS / text messaging</h2>
      <p>
        Occupella can send SMS text messages about account activity, property operations,
        maintenance updates, and service-related notices — but only to people who have
        expressly opted in. A phone number on file is not consent; consent is recorded
        separately, and messages are never sent without it.
      </p>
      <ul>
        <li>
          <strong>No third-party sharing:</strong> we will not share or sell your mobile
          phone number, SMS opt-in consent, or text messaging originator opt-in data to
          third parties or affiliates for marketing or promotional purposes.
        </li>
        <li>Message frequency varies based on your account activity.</li>
        <li>Message and data rates may apply, depending on your carrier plan.</li>
        <li>
          Reply <strong>STOP</strong> at any time to opt out — it takes effect immediately.
          Reply <strong>HELP</strong> for help, or email{" "}
          <a href="mailto:team@occupella.com">team@occupella.com</a>. You can also revoke
          consent by any reasonable means, including email.
        </li>
        <li>Messages are sent only between 8am and 9pm in your local time zone.</li>
      </ul>

      <h2>What we do NOT do</h2>
      <ul>
        <li>We do not sell your data, ever.</li>
        <li>We do not use your data to train foundation models.</li>
        <li>We do not share your data with third parties except the subprocessors below, and only as needed to run the service.</li>
        <li>We do not share mobile numbers or SMS consent data with anyone for marketing — see the SMS section above.</li>
      </ul>

      <h2>Subprocessors</h2>
      <p>
        Occupella runs on a small set of infrastructure providers: cloud hosting and database
        (Render, Supabase), AI model providers (Anthropic, Voyage AI), managed OAuth
        (Composio), and observability/analytics (Sentry, Langfuse, PostHog). Each receives
        only what it needs to perform its function.
      </p>

      <h2>Deletion and your rights</h2>
      <p>
        You can disconnect any integration at any time — rotate or remove Buildium keys, or
        revoke Google access from your Google account. On request we will erase your
        workspace entirely: the mirrored data, stored AI memory, credentials, and account
        records. Buildium remains your system of record throughout; nothing you do in
        Occupella is required to keep your Buildium account intact.
      </p>

      <h2>Contact</h2>
      <p>
        Questions, deletion requests, or concerns: <a href="mailto:team@occupella.com">team@occupella.com</a>.
      </p>
    </Shell>
  );
}

export function Terms() {
  return (
    <Shell title="Terms of Service">
      <h2>The agreement</h2>
      <p>
        Occupella is operated by Oscar Ventures LLC. By creating an Occupella workspace you
        agree to these terms with Oscar Ventures LLC on behalf of your company. If you don't
        agree, don't use the service.
      </p>

      <h2>The service</h2>
      <p>
        Occupella provides software that connects to accounts you control (such as Buildium and
        Google), mirrors their data, and drafts or performs actions with your approval. You
        are responsible for the accounts you connect and for having the right to connect them.
      </p>

      <h2>Early access</h2>
      <p>
        Occupella is in early access. The service is provided as-is, features may change, and
        access is currently free. We will announce pricing before any billing begins — you
        will never be charged without agreeing to a price first.
      </p>

      <h2>Your responsibilities</h2>
      <ul>
        <li>Review AI-drafted content before approving it. Occupella drafts; you decide.</li>
        <li>Keep your account credentials secure and your team access list current.</li>
        <li>Use the service lawfully, including compliance with landlord-tenant and fair-housing laws that apply to your business.</li>
      </ul>

      <h2>Our responsibilities</h2>
      <ul>
        <li>Protect your data as described in the <a href="/privacy">Privacy Policy</a>.</li>
        <li>Perform writes to your systems only with your approval.</li>
        <li>Make deletion straightforward when you leave.</li>
      </ul>

      <h2>SMS terms</h2>
      <p>
        The Occupella SMS program sends text messages about account activity, property
        operations, maintenance updates, and service-related notices to property management
        customers and authorized users who have opted in. By opting in you agree to the
        following:
      </p>
      <ul>
        <li>Message frequency varies based on your account activity.</li>
        <li>Message and data rates may apply.</li>
        <li>
          Reply <strong>STOP</strong> to cancel at any time. Reply <strong>HELP</strong> for
          help, or contact <a href="mailto:team@occupella.com">team@occupella.com</a>.
        </li>
        <li>
          Consent to receive text messages is optional and is never a condition of using
          the service.
        </li>
        <li>
          Carriers are not liable for delayed or undelivered messages.
        </li>
        <li>
          How we handle mobile numbers and opt-in data is described in the{" "}
          <a href="/privacy">Privacy Policy</a> — in short, it is never shared with third
          parties for marketing.
        </li>
      </ul>

      <h2>Limitations</h2>
      <p>
        AI-generated drafts and summaries can be wrong. Occupella is a tool that assists your
        team — it is not legal, financial, or professional advice, and final decisions are
        yours. To the maximum extent permitted by law, Occupella is not liable for indirect or
        consequential damages, and our total liability is limited to the amounts you paid us
        in the twelve months before a claim (during free early access, that is $0).
      </p>

      <h2>Termination</h2>
      <p>
        You can stop using Occupella at any time and request full deletion. We may suspend
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
        <a href="mailto:team@occupella.com">team@occupella.com</a>
      </p>
    </Shell>
  );
}
