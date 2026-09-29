import { Reveal, SitePageShell } from "../Site";

// ─────────────────────────────────────────────────────────────────────
// /docs/buildium-api-setup: how to create the Buildium API key Occupella
// needs, and the optional webhook for live updates.
//
// ⚠ THESE STEPS ARE THE SIGNUP WIZARD'S STEPS (src/App.tsx, StepBuildium and
// StepLive), in the wizard's words. The Buildium path is Settings → Developer
// Tools, with API Keys and Webhooks as tabs on that page; it was corrected on
// 2026-09-02 from a screenshot of the live Buildium console ("API Settings"
// does not exist). If Buildium moves a menu, change the wizard and this page
// together.
//
// ⚠ The wizard's live-updates step labels the webhook field "Buildium →
// Settings → Webhooks". The 2026-09-02 screenshot shows Webhooks as a tab on
// Developer Tools, so this page says that. TODO(brandon): check which one
// Buildium shows, and fix whichever is wrong.
//
// ⚠ THE APPROVAL CLAIM IS HELD. The wizard says Occupella "never writes to
// Buildium without your approval". TODO(brandon): confirm autonomous notes
// flag is off; then that sentence can go under "What the key allows".
//
// TODO(brandon): screenshots of the Buildium screens, one per step. Each step
// below has a marked slot. Crop to the Buildium page only, with no account
// name or key visible.
// ─────────────────────────────────────────────────────────────────────

const css = `
  .bs-steps { margin-top: 48px; padding: 0; list-style: none; counter-reset: bs; max-width: 760px; display: flex; flex-direction: column; gap: 36px; }
  .bs-step { counter-increment: bs; display: grid; grid-template-columns: 40px 1fr; gap: 0 16px; }
  .bs-step::before {
    content: counter(bs); width: 32px; height: 32px; border-radius: 50%;
    display: grid; place-items: center; border: 1px solid var(--line-strong);
    font-size: 15px; font-weight: 600; color: var(--iris); font-variant-numeric: tabular-nums;
  }
  .bs-step h3 { font-size: 19px; font-weight: 600; line-height: 1.4; color: var(--ink); padding-top: 3px; }
  .bs-step p { margin-top: 8px; font-size: 17px; line-height: 1.6; color: var(--ink-muted); max-width: 62ch; }
  .bs-step b { color: var(--ink); font-weight: 600; }
  .bs-note { margin-top: 12px; font-size: 15px; line-height: 1.6; color: var(--ink-muted); }
  .bs-facts { margin-top: 32px; padding: 0; list-style: none; max-width: 760px; border-top: 1px solid var(--line); }
  .bs-facts li { padding: 14px 0; border-bottom: 1px solid var(--line); font-size: 16px; line-height: 1.6; color: var(--ink-muted); }
  .bs-facts b { color: var(--ink); font-weight: 600; }
`;

const KEY_STEPS = [
  {
    t: "Open Developer Tools in Buildium",
    b: (
      <>
        In Buildium, open <b>Settings → Developer Tools</b> and pick the <b>API Keys</b> tab.
      </>
    ),
    note: (
      <>
        If you can&rsquo;t create a key there, someone who administers your Buildium account can.
        The setup page has a link that emails them these steps.
      </>
    ),
  },
  {
    t: "Create the key",
    b: (
      <>
        Click <b>Create API Key</b>, name it <b>Occupella</b>, and continue through the three
        steps.
      </>
    ),
  },
  {
    t: "Copy the Client ID and Client Secret",
    b: (
      <>
        Buildium shows the <b>Client ID</b> and <b>Client Secret</b> at the end. Keep the page
        open until both are pasted into Occupella.
      </>
    ),
  },
  {
    t: "Paste them into Occupella",
    b: (
      <>
        On <a href="/start">occupella.com/start</a>, the <b>Connect Buildium</b> step has a field
        for each. Pick <b>Production</b>, or <b>Sandbox</b> if the key came from Buildium&rsquo;s
        API sandbox, then click <b>Test Buildium connection</b>.
      </>
    ),
    note: (
      <>
        When the test passes, <b>Save &amp; scan my portfolio</b> starts the first sync.
      </>
    ),
  },
];

const WEBHOOK_STEPS = [
  {
    t: "Add Occupella's address in Buildium",
    b: (
      <>
        The <b>Turn on live Buildium updates</b> step shows the address to copy. In Buildium, open{" "}
        <b>Settings → Developer Tools</b>, pick the <b>Webhooks</b> tab and create a subscription
        with that address. One address takes every event.
      </>
    ),
  },
  {
    t: "Paste the signing secret",
    b: (
      <>
        Buildium shows a signing secret once, when the subscription is created. Paste it into the
        same Occupella step and click <b>Save signing secret</b>.
      </>
    ),
  },
];

function Steps({ steps }: { steps: typeof KEY_STEPS }) {
  return (
    <ol className="bs-steps">
      {steps.map((s) => (
        <li className="bs-step" key={s.t}>
          <div>
            <h3>{s.t}</h3>
            <p>{s.b}</p>
            {s.note ? <p className="bs-note">{s.note}</p> : null}
            {/* TODO(brandon): screenshot for this step. */}
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function BuildiumApiSetup() {
  return (
    <SitePageShell
      active="resources"
      title="How to create a Buildium API key for Occupella"
      lede={
        <>
          Occupella connects to Buildium with an API key you create in your own account. It takes
          about two minutes, and you can revoke the key in Buildium at any time.
        </>
      }
      css={css}
      close={{
        title: "Have the key? Start the trial",
        body: "Paste it into the setup page and Occupella runs its first scan of your portfolio. 14 days, no card.",
      }}
    >
      <section>
        <div className="lp-wrap">
          <Steps steps={KEY_STEPS} />
        </div>
      </section>

      <section className="lp-section" id="live-updates">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-section-head">
              <h2 className="lp-h2">Live updates, optional</h2>
              <p className="lp-body">
                Buildium can send work orders, resident messages, lease events and payments to
                Occupella as they happen. Without this, Occupella sees them at the next sync. You
                can skip it during setup.
              </p>
            </div>
          </Reveal>
          <Steps steps={WEBHOOK_STEPS} />
        </div>
      </section>

      <section className="lp-section" id="what-the-key-allows">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-section-head">
              <h2 className="lp-h2">What the key allows</h2>
            </div>
          </Reveal>
          <ul className="bs-facts">
            <li>
              <b>What Occupella reads:</b> properties and units, leases, tenants and balances,
              owners, vendors and unpaid bills, work orders and tasks.{" "}
              <a href="/integrations/buildium">The full list</a>
            </li>
            <li>
              <b>What it can change:</b> the Buildium changes are listed on{" "}
              <a href="/features#writing-back">the features page</a>.
            </li>
            <li>
              <b>How the key is kept:</b> encrypted before it is stored, and never shown again,
              not even to you.
            </li>
            <li>
              <b>Removing it:</b> revoke the key in Buildium at any time. Disconnecting Buildium
              in Occupella deletes Occupella&rsquo;s synced copy of your data.
            </li>
          </ul>
        </div>
      </section>
    </SitePageShell>
  );
}
