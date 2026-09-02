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

function Shell({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
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
      <div className="legal-date">
        {updated ?? "Effective July 6, 2026 · Updated August 14, 2026"}
      </div>
      <div className="legal-note">
        This is written in plain English on purpose. If anything here is unclear, email{" "}
        <a href="mailto:team@occupella.com">team@occupella.com</a> and a human will answer.
      </div>
      {children}
      <div className="legal-footer">
        <span>© 2026 Oscar Ventures LLC</span>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/sms">SMS</a>
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
        separately, and messages are never sent without it. How consent is obtained —
        including the verbatim language a recipient agrees to — is set out in full on our{" "}
        <a href="/sms">SMS Program &amp; Consent</a> page.
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

      <h2>Plans and billing</h2>
      <p>
        Every workspace starts with a <strong>14-day free trial</strong>. No card is required
        to start it, and it includes 150 questions. When it ends, you pick a plan or your
        workspace stops answering questions — nothing is deleted and nothing is charged
        automatically at the end of a trial.
      </p>
      <p>
        <strong>Starter</strong> is $199 per seat per month and includes 400 questions per
        seat each month. <strong>Pro</strong> is $500 per month for the whole account, with a
        pooled fair-use ceiling of 1,200 questions per month. A "question" is one request you
        send Occupella that produces an answer; we don't count requests that fail or return
        nothing.
      </p>
      <p>
        Paid plans are billed monthly in advance and <strong>renew automatically each month
        until you cancel</strong>. You can cancel at any time in Settings → Billing, which
        opens our payment provider's portal — cancelling stops the next charge and your
        workspace keeps working until the end of the period you already paid for. Prices
        exclude any sales tax we're required to collect.
      </p>
      <p>
        If a payment fails we keep your workspace running while the card is retried, rather
        than cutting you off over an expired card. If it ultimately can't be collected, the
        subscription ends and the workspace stops answering questions — your data stays put
        and you can start again.
      </p>
      <p>
        We don't automatically refund partial months. If something goes wrong on our side,
        email us and a person will sort it out. If we change a price, we'll tell workspace
        owners by email before it takes effect, and you can cancel before it does.
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
        customers and authorized users who have opted in. The full program disclosure —
        who sends the messages, how consent is obtained and recorded, sample messages, and
        how to stop them — is on our <a href="/sms">SMS Program &amp; Consent</a> page. By
        opting in you agree to the following:
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
        in the twelve months before a claim.
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

// ─────────────────────────────────────────────────────────
// SMS PROGRAM & CONSENT — the A2P 10DLC campaign's public
// "call to action" URL.
//
// This page exists because the carrier reviewer could not SEE the opt-in
// flow: the app is behind a login (App.tsx returns <LoginForm/> for any
// unauthenticated path), so every URL we could point at rendered a sign-in
// screen and the campaign was rejected twice for an unverifiable CTA.
// The wizard deployment is public by construction — it is the front door
// for new customers — so the disclosure lives HERE, at /sms, alongside
// /privacy and /terms, and is linked from both.
//
// ⚠ The consent language in "How consent is obtained" is the VERBATIM text
// property managers present to residents. It is what the campaign
// registration quotes. Changing the wording here without changing the
// signed form (and the campaign) puts the two out of sync — which is
// itself a rejection reason.
// ─────────────────────────────────────────────────────────

export function Sms() {
  return (
    <Shell title="SMS Program & Consent" updated="Updated August 24, 2026">
      <p>
        Occupella is a property-management software platform operated by{" "}
        <strong>Oscar Ventures LLC</strong>. This page describes our
        application-to-person (A2P) text-messaging program in full: who sends messages,
        what they contain, how consent is obtained and recorded, and how a recipient
        stops them. No account or login is required to read this page.
      </p>

      <h2>Who sends the messages, and to whom</h2>
      <p>
        Property-management companies use Occupella to send{" "}
        <strong>operational, non-marketing</strong> text messages to two audiences:
      </p>
      <ul>
        <li>
          <strong>Residents (tenants)</strong> — rent payment reminders, maintenance and
          work-order status updates, appointment confirmations, and account notices
          relating to their own tenancy.
        </li>
        <li>
          <strong>Property managers and owners</strong> — operational notices about
          properties they manage or own.
        </li>
      </ul>
      <p>
        We send no marketing, promotional, or advertising messages of any kind. We do not
        sell, rent, or share mobile numbers or consent records with third parties for
        their own marketing.
      </p>

      <h2>How consent is obtained (call to action)</h2>
      <p>
        Consent is collected <strong>offline, by the property-management company, in
        writing</strong> — not through a web form on this site. That follows from the
        relationship: a resident's phone number reaches Occupella only through their
        lease or a signed authorization with their property manager, and Occupella never
        contacts anyone who is not already that company's resident, owner, or staff
        member.
      </p>
      <p>A recipient gives prior express written consent in one of two ways:</p>
      <ul>
        <li>
          <strong>A signed SMS authorization form</strong> presented by the property
          manager at lease signing or on request; or
        </li>
        <li>
          <strong>A dedicated text-messaging clause in the lease agreement</strong>,
          initialed or signed separately from the lease as a whole.
        </li>
      </ul>
      <p>In both cases the recipient agrees to the following disclosure, presented verbatim:</p>
      <div className="legal-note">
        <p>
          <strong>Consent language presented to the recipient:</strong>
        </p>
        <p>
          “I agree to receive operational text messages from [Property Management Company]
          sent via Occupella at the mobile number I provide, including rent reminders,
          maintenance and work-order updates, appointment confirmations, and account
          notices. Message frequency varies. Message and data rates may apply. Consent is
          not a condition of renting or of any purchase. Reply STOP to unsubscribe or HELP
          for help. See setup.occupella.com/sms and setup.occupella.com/privacy.”
        </p>
      </div>
      <p>
        <strong>Consent is not a condition of renting</strong>, of applying for a tenancy,
        or of any purchase. A resident who declines still receives every notice through
        the other channels their property manager uses.
      </p>

      <h2>How consent is recorded and enforced</h2>
      <p>
        A phone number on file is <strong>not</strong> consent. Occupella keeps a separate
        consent ledger, and the platform will not send a message to any number without a
        live consent record in it. Each record stores the phone number, the
        property-management company, when consent was captured, the source of the
        consent, and the recipient's time zone.
      </p>
      <p>
        Every send is checked against that ledger first. If no live record exists — or if
        consent was revoked — the send is refused. A user of the platform cannot bypass
        the check.
      </p>

      <h2>Message frequency</h2>
      <p>
        Message frequency varies and depends on the recipient's own tenancy activity — a
        rent reminder near a due date, an update when a maintenance request they filed
        changes status. Recipients typically receive fewer than ten messages per month.
        There is no recurring broadcast or campaign schedule.
      </p>

      <h2>Cost</h2>
      <p>
        <strong>Message and data rates may apply.</strong> Neither Occupella nor the
        property manager charges for the messages; your mobile carrier's standard rates
        apply.
      </p>

      <h2>How to stop messages (opt out)</h2>
      <p>
        Reply <strong>STOP</strong> to any message. Opt-out is immediate and automatic: it
        revokes consent for that number across every property-management company using
        Occupella, and the platform refuses all further sends to it. No further action is
        required, and no confirmation call or email is needed.
      </p>
      <p>The keywords STOP, END, CANCEL, UNSUBSCRIBE, and QUIT are all honored.</p>
      <p>
        To resume messages after opting out, reply <strong>START</strong>. That restores
        only consent that previously existed; it never creates new consent.
      </p>
      <p>
        A recipient may also ask their property manager to remove their number, or contact
        us directly at <a href="mailto:team@occupella.com">team@occupella.com</a>.
      </p>

      <h2>How to get help</h2>
      <p>
        Reply <strong>HELP</strong> to any message for support information. Replying HELP
        does not change consent either way.
      </p>
      <p>
        You can also reach us at{" "}
        <a href="mailto:team@occupella.com">team@occupella.com</a>. For questions about a
        specific notice — a rent amount, a work order, an appointment — contact your
        property-management company directly; they control the content of the message.
      </p>

      <h2>Quiet hours</h2>
      <p>
        Occupella does not send messages outside 8:00 a.m. – 9:00 p.m. in the{" "}
        <em>recipient's</em> local time zone, consistent with the Telephone Consumer
        Protection Act. A send attempted outside that window is refused by the platform,
        not merely delayed by policy.
      </p>

      <h2>Sample messages</h2>
      <div className="legal-note">
        <p>
          <strong>Rent reminder</strong>
          <br />
          Occupella: Hi Maria, a reminder that rent of $1,450 for Unit 4B, 400 Oak St is
          due Sep 1. Questions? Reply to this message or call (555) 010-2233. Reply STOP to
          unsubscribe, HELP for help.
        </p>
        <p>
          <strong>Maintenance update</strong>
          <br />
          Occupella: Hi Maria, your work order for Unit 4B (kitchen faucet leak) is
          scheduled for Thu Sep 4 between 1–4pm. Reply to this message with questions.
          Reply STOP to unsubscribe, HELP for help.
        </p>
        <p>
          <strong>Appointment confirmation</strong>
          <br />
          Occupella: Hi Maria, confirming your unit inspection at 400 Oak St on Fri Sep 5
          at 10:00am. Reply to this message to reschedule. Reply STOP to unsubscribe, HELP
          for help.
        </p>
      </div>

      <h2>Privacy</h2>
      <p>
        Mobile numbers and consent records are used only to deliver the operational
        messages described above.{" "}
        <strong>
          No mobile information is shared with third parties or affiliates for marketing or
          promotional purposes.
        </strong>{" "}
        Information is shared only with the messaging provider that delivers the message on
        our behalf, and only for that purpose. Full details are in our{" "}
        <a href="/privacy">Privacy Policy</a>; the program's terms are in our{" "}
        <a href="/terms">Terms of Service</a>.
      </p>

      <h2>Contact</h2>
      <p>
        Oscar Ventures LLC, operator of Occupella
        <br />
        <a href="mailto:team@occupella.com">team@occupella.com</a>
      </p>
    </Shell>
  );
}
