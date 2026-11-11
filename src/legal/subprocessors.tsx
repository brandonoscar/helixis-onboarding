/**
 * The service providers that process data for Occupella: ONE list, rendered
 * on /security and /privacy, so the two pages cannot disagree.
 *
 * ⚠ EACH ENTRY IS CHECKED AGAINST AgenticHelixis (settings.py and the code
 * that calls it), not against a vendor list from memory. Checked 2026-09-29:
 *   · Mem0 is NOT here: it is an open-source library storing into our own
 *     Supabase Postgres (pgvector), not a hosted service.
 *   · OpenAI is NOT here: a settings field exists, and assert_no_openai_default
 *     refuses to boot on an OpenAI model.
 *   · Browserbase and E2B are real integrations that are off or unused for
 *     customers; they are listed with that status rather than hidden, since
 *     turning one on must not silently outrun this page. Checked 2026-11-11
 *     in AgenticHelixis main:
 *       E2B: code execution ships dark. HELIXIS_CODEEXEC__ENABLED defaults to
 *       false (settings.py CodeExecSettings), render.yaml never sets it, and
 *       docs/adr/0008-agent-code-execution.md says it must stay false.
 *       Browserbase: browser_agent runs only when both
 *       HELIXIS_BROWSER__BROWSERBASE_API_KEY and _PROJECT_ID are set. They are
 *       dashboard secrets in render.yaml (sync: false), so whether they are set
 *       is in Render, not the code; without them every browser tool answers
 *       "browser_unavailable". Update its status the day they are set.
 * Checked 2026-11-11 for the one product:
 *   · Render also runs the books' database (Postgres): the PMS mounted at
 *     /books (AgenticHelixis src/helixis/books.py).
 *   · Resend sends email from updates.occupella.com, with Amazon SES behind
 *     it: the domain's DNS has Resend's DKIM key
 *     (resend._domainkey.updates) and SPF include:amazonses.com with an SES
 *     feedback MX on send.updates.
 *   · Stripe also takes tenants' rent and owners' money online, on Stripe's
 *     own page (the PMS's src/pms/payments.py; it never sees a bank number).
 * Adding a vendor to the code means adding it here the same day.
 */

export interface Subprocessor {
  name: string;
  purpose: string;
  status?: string;
}

export const SUBPROCESSORS: Subprocessor[] = [
  { name: "Anthropic", purpose: "The AI models that read your data and write answers and drafts." },
  { name: "Voyage AI", purpose: "Turns remembered facts into search vectors so they can be recalled later." },
  { name: "Supabase", purpose: "Database and sign-in. Your synced Buildium data and your account live here." },
  {
    name: "Render",
    purpose: "Runs the Occupella servers and background workers, and the books' database.",
  },
  { name: "Vercel", purpose: "Hosts this website and the Occupella web app." },
  { name: "Composio", purpose: "Manages the Google sign-in (OAuth) for Gmail, Calendar and Drive." },
  {
    name: "Stripe",
    purpose:
      "Billing for your subscription, and rent and owners' money paid online by bank, on Stripe's own page.",
  },
  {
    name: "Resend",
    purpose: "Sends Occupella's email, with Amazon Web Services' email service (Amazon SES) behind it.",
  },
  { name: "Twilio", purpose: "Text messages and calls, and the carrier registration for your business number." },
  { name: "Tavily", purpose: "Web search, when a question needs public information." },
  { name: "Sentry", purpose: "Error reports, so we can see and fix failures." },
  { name: "Langfuse", purpose: "Traces of AI requests, so we can check answer quality." },
  { name: "PostHog", purpose: "Product analytics on this website and in the app." },
  { name: "Apollo.io", purpose: "Identifies which businesses visit this website. The marketing site only." },
  {
    name: "US Census geocoder",
    purpose: "Turns property addresses into map coordinates. A public government service.",
  },
  {
    name: "US government public data (FEMA, HUD, EPA, USFS)",
    purpose: "Flood, wildfire and radon data and fair market rents, looked up by property location.",
  },
  {
    name: "Browserbase",
    purpose: "Browser automation for websites without an API.",
    status: "Not in use for customers today.",
  },
  {
    name: "E2B",
    purpose: "An isolated sandbox for running analysis code.",
    status: "Not in use for customers today.",
  },
];

export function SubprocessorList() {
  return (
    <ul className="sp-list">
      {SUBPROCESSORS.map((s) => (
        <li key={s.name}>
          <b>{s.name}</b>: {s.purpose}
          {s.status ? <em> {s.status}</em> : null}
        </li>
      ))}
    </ul>
  );
}
