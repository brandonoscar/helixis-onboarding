/**
 * Every marketing page, and everything a search engine reads about it.
 *
 * ⚠ THIS IS THE ONLY PLACE HEAD TAGS ARE DEFINED. Until 2026-09 every route
 * was served the same index.html, so every page carried the homepage's title,
 * description and `<link rel="canonical" href="https://occupella.com/">`.
 * Google took the canonical at its word and filed /features as a duplicate of
 * the homepage, so it was never indexed. The build now prerenders each route
 * below with its own tags (scripts/prerender.mjs), and the sitemap is
 * generated from the same list, so a new page cannot ship without a title,
 * a description and a self-canonical, and cannot be missing from the sitemap.
 *
 * `source` is the file the page is written in. The build reads its last
 * commit date for the sitemap's <lastmod>.
 *
 * Adding a page: add it here, render it in src/pages.tsx. seo.test.ts checks
 * the two agree.
 */

import { STATES, descriptionFor } from "../stateLaws/data";

export const SITE_ORIGIN = "https://occupella.com";

export interface MarketingRoute {
  path: string;
  /** The page's name in analytics (lib/analytics.ts `pageName`). */
  name: string;
  title: string;
  /** Under 155 characters, so search results show it whole. */
  description: string;
  inSitemap: boolean;
  source: string;
  /** The page's name in a breadcrumb trail (head.ts). Defaults to the title
   *  up to " | ". */
  crumb?: string;
  changefreq: "weekly" | "monthly";
  priority: number;
}

const STATIC_ROUTES: MarketingRoute[] = [
  {
    path: "/",
    name: "landing",
    title: "Occupella | AI assistant for Buildium property managers",
    description:
      "Occupella connects to Buildium, reads your work orders, late payments and lease events, and drafts the reply for your approval. 14-day free trial.",
    inSitemap: true,
    source: "src/Landing.tsx",
    changefreq: "weekly",
    priority: 1.0,
  },
  {
    path: "/features",
    name: "features",
    title: "Features | Occupella",
    description:
      "Occupella reads your Buildium work orders and payments, drafts replies and owner updates, and answers questions from your own data.",
    inSitemap: true,
    source: "src/Features.tsx",
    changefreq: "weekly",
    priority: 0.9,
  },
  {
    path: "/pricing",
    name: "pricing",
    title: "Pricing | Occupella",
    description:
      "Starter $50 a month, Pro $199 per person a month, Scale $500 a month. Every plan starts with a 14-day free trial, and no card is needed to start.",
    inSitemap: true,
    source: "src/Pricing.tsx",
    changefreq: "weekly",
    priority: 0.9,
  },
  {
    path: "/screenshots",
    name: "screenshots",
    title: "Screenshots of the Occupella Inbox, chat and Operations",
    description:
      "Screenshots of Occupella, the AI assistant for Buildium property managers: a work order in the Inbox, answers in chat and the Operations tables.",
    inSitemap: true,
    source: "src/Screenshots.tsx",
    changefreq: "monthly",
    priority: 0.6,
  },
  {
    path: "/solutions/owner-reporting",
    name: "solutions_owner_reporting",
    title: "Owner reporting from your Buildium data | Occupella",
    description:
      "Ask how a property is doing: occupancy, rent collected, open work orders, what's owed and spent, from your Buildium data. Then send the owner update.",
    inSitemap: true,
    source: "src/solutions/OwnerReporting.tsx",
    changefreq: "monthly",
    priority: 0.7,
  },
  {
    path: "/solutions/delinquency",
    name: "solutions_delinquency",
    title: "Late rent follow-up for Buildium users | Occupella",
    description:
      "See every lease with a balance and how late it is, get a reminder when rent hasn't posted by the 10th, and send a drafted late-rent email from your Gmail.",
    inSitemap: true,
    source: "src/solutions/Delinquency.tsx",
    changefreq: "monthly",
    priority: 0.7,
  },
  {
    path: "/solutions/maintenance",
    name: "solutions_maintenance",
    title: "Maintenance coordination for Buildium users | Occupella",
    description:
      "Occupella reads each Buildium maintenance request, pulls the unit's history and drafts the resident reply and the work order for you to edit and send.",
    inSitemap: true,
    source: "src/solutions/Maintenance.tsx",
    changefreq: "monthly",
    priority: 0.7,
  },
  {
    path: "/solutions/leasing",
    name: "solutions_leasing",
    // ⚠ Not the planned "Leasing follow-up by text and email": texting waits
    // on carrier approval, and the title must not say it works today.
    title: "Leasing pipeline and lead follow-up | Occupella",
    description:
      "One board for every lead, a drafted reply for each, and a flag when one goes quiet. Replies send from your Gmail today, and by text after carrier approval.",
    inSitemap: true,
    source: "src/solutions/Leasing.tsx",
    changefreq: "monthly",
    priority: 0.7,
  },
  {
    path: "/integrations",
    name: "integrations",
    crumb: "Integrations",
    title: "Integrations | Occupella",
    description:
      "Occupella works with Buildium, Gmail, Google Calendar and Google Drive today. Texting opens after carrier approval. See the status of each.",
    inSitemap: true,
    source: "src/integrations/Integrations.tsx",
    changefreq: "monthly",
    priority: 0.6,
  },
  {
    path: "/integrations/buildium",
    name: "integrations_buildium",
    crumb: "Buildium",
    title: "Occupella for Buildium: what it reads and changes",
    description:
      "What Occupella reads from your Buildium account, the changes it can make there, and the API key it needs. Revoke the key in Buildium at any time.",
    inSitemap: true,
    source: "src/integrations/Buildium.tsx",
    changefreq: "monthly",
    priority: 0.7,
  },
  {
    path: "/docs/buildium-api-setup",
    name: "docs_buildium_api_setup",
    title: "How to create a Buildium API key | Occupella",
    description:
      "Create a Buildium API key under Settings, Developer Tools, API Keys, and paste the Client ID and Client Secret into Occupella. About two minutes.",
    inSitemap: true,
    source: "src/docs/BuildiumApiSetup.tsx",
    changefreq: "monthly",
    priority: 0.6,
  },
  {
    path: "/changelog",
    name: "changelog",
    title: "Changelog | Occupella",
    description: "What changed in Occupella, newest first: new features and fixes you can see in the app.",
    inSitemap: true,
    source: "src/changelog/entries.ts",
    changefreq: "weekly",
    priority: 0.4,
  },
  {
    path: "/tools/deposit-deadline",
    name: "tool_deposit_deadline",
    title: "Security deposit return deadline calculator | Occupella",
    description:
      "Pick a state and a move-out date to get the day a security deposit has to go back, with the statute. All 50 states and DC, business days counted.",
    inSitemap: true,
    source: "src/tools/DepositDeadlineTool.tsx",
    changefreq: "monthly",
    priority: 0.7,
  },
  {
    path: "/security",
    name: "security",
    title: "Security | Occupella",
    description:
      "How Occupella protects your data: per-company isolation, encrypted credentials, role checks on money, and the list of service providers that process data.",
    inSitemap: true,
    source: "src/Security.tsx",
    changefreq: "monthly",
    priority: 0.5,
  },
  {
    path: "/contact",
    name: "contact",
    title: "Contact | Occupella",
    description: "Email team@occupella.com for setup help, account and billing questions, security and data requests. Support replies within one business day.",
    inSitemap: true,
    source: "src/Contact.tsx",
    changefreq: "monthly",
    priority: 0.4,
  },
  {
    path: "/sms",
    name: "sms",
    title: "SMS program | Occupella",
    description:
      "Who sends Occupella text messages and to whom, how consent is collected and recorded, and how a recipient stops them by replying STOP.",
    inSitemap: true,
    source: "src/Legal.tsx",
    changefreq: "monthly",
    priority: 0.4,
  },
  {
    path: "/terms",
    name: "terms",
    title: "Terms of service | Occupella",
    description: "The terms of service for Occupella, operated by Oscar Ventures LLC.",
    inSitemap: true,
    source: "src/Legal.tsx",
    changefreq: "monthly",
    priority: 0.3,
  },
  {
    path: "/privacy",
    name: "privacy",
    title: "Privacy policy | Occupella",
    description:
      "What data Occupella collects, how we use and protect it, and which service providers process it for us.",
    inSitemap: true,
    source: "src/Legal.tsx",
    changefreq: "monthly",
    priority: 0.3,
  },
];

/**
 * The landlord-rules pages, generated from src/data/jurisdiction_rules.json:
 * an index and one page per state (50 states and DC).
 */
const STATE_LAW_ROUTES: MarketingRoute[] = [
  {
    path: "/state-laws",
    name: "state_laws",
    crumb: "Landlord rules by state",
    title: "Landlord rules by state | Occupella",
    description:
      "Security deposit caps and return deadlines, late fees, notice periods and source-of-income rules for all 50 states and DC, with statute citations.",
    inSitemap: true,
    source: "src/data/jurisdiction_rules.json",
    changefreq: "monthly",
    priority: 0.7,
  },
  ...STATES.map(
    (st): MarketingRoute => ({
      path: st.path,
      name: "state_law",
      crumb: st.rules.name,
      title: `${st.rules.name} security deposit, late fee and notice rules | Occupella`,
      description: descriptionFor(st.rules),
      inSitemap: true,
      source: "src/data/jurisdiction_rules.json",
      changefreq: "monthly",
      priority: 0.5,
    }),
  ),
];

export const MARKETING_ROUTES: readonly MarketingRoute[] = [...STATIC_ROUTES, ...STATE_LAW_ROUTES];

/** Served for any URL no route answers, with a real 404 status. */
export const NOT_FOUND_PAGE = {
  title: "Page not found | Occupella",
  description: "This page does not exist on occupella.com.",
} as const;

/**
 * Paths that stay client-rendered and are never prerendered, listed in the
 * sitemap or given a canonical: the setup wizard and the OAuth popup return.
 * vercel.json rewrites exactly these to the app shell.
 */
export const CLIENT_ONLY_PREFIXES = ["/start", "/oauth"] as const;

/** `/features/` and `/features` are one page. */
export function normalizePath(path: string): string {
  if (path === "" || path === "/") return "/";
  return path.replace(/\/+$/, "");
}

export function routeFor(path: string): MarketingRoute | undefined {
  const p = normalizePath(path);
  return MARKETING_ROUTES.find((r) => r.path === p);
}

export function canonicalFor(route: MarketingRoute): string {
  return route.path === "/" ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${route.path}`;
}
