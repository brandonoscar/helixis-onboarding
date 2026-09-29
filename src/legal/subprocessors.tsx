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
 *     turning one on must not silently outrun this page.
 *     TODO(brandon): confirm both are off in Render, and update their status
 *     here the day either is turned on.
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
  { name: "Render", purpose: "Runs the Occupella servers and background workers." },
  { name: "Vercel", purpose: "Hosts this website and the Occupella web app." },
  { name: "Composio", purpose: "Manages the Google sign-in (OAuth) for Gmail, Calendar and Drive." },
  { name: "Stripe", purpose: "Billing and payments for your subscription." },
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
