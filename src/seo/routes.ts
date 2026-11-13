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

import { BLOG_CARD, BLOG_INDEX, BLOG_PATH, CARD_SIZE, POSTS } from "../blog/posts";
import { STATES, descriptionFor } from "../stateLaws/data";
import { ONE_PRODUCT_LEGAL_PUBLISHED, legalRoutes, legalSource } from "../legal/publish";

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
  /** The page's largest image, preloaded at high priority (head.ts). Lighthouse
   *  measured the home page's video poster as its largest paint, found late
   *  and fetched at low priority. */
  lcpImage?: string;
  changefreq: "weekly" | "monthly";
  priority: number;
  /** The share image LinkedIn and others show for this page (og:image).
   *  Absent: the site's social-preview.png, a product screenshot, which is
   *  right for product pages and wrong for the blog (head.ts). */
  image?: { src: string; alt: string; width?: number; height?: number };
  /** A blog post: og:type article, its dates, and BlogPosting structured
   *  data (head.ts). Only the blog's post routes set it. */
  article?: {
    headline: string;
    author: string;
    datePublished: string;
    dateModified: string;
  };
}

const STATIC_ROUTES: MarketingRoute[] = [
  {
    path: "/",
    name: "landing",
    title: "Occupella | Free property management software with trust accounting",
    description:
      "The rent roll, leases and e-signing, bills, owner draws, month-end and owner statements, with trust accounting under it all. Free to use.",
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
      "Trust accounting, the rent roll, rent and late fees each night, bills and owner approvals, ACH and check draws, month-end, owner statements and leasing.",
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
      "Free to use, with a small fee on online rent payments once they arrive. AI assistant add-on: Starter $50, Pro $199 per person, Scale $500 a month.",
    inSitemap: true,
    source: "src/Pricing.tsx",
    changefreq: "weekly",
    priority: 0.9,
  },
  {
    path: "/solutions/owner-reporting",
    name: "solutions_owner_reporting",
    title: "Owner statements, draws and the year-end | Occupella",
    description:
      "Owner statements for any period, draws by ACH file or check, income statements by Schedule E line and the year-end summary with 1099-MISC rents.",
    inSitemap: true,
    source: "src/solutions/OwnerReporting.tsx",
    changefreq: "monthly",
    priority: 0.7,
  },
  {
    path: "/solutions/delinquency",
    name: "solutions_delinquency",
    title: "Late rent, late fees and payments | Occupella",
    description:
      "Rent and late fees post by themselves each night under each property's terms. See every balance by age, record payments and undo a bounced one.",
    inSitemap: true,
    source: "src/solutions/Delinquency.tsx",
    changefreq: "monthly",
    priority: 0.7,
  },
  {
    path: "/solutions/maintenance",
    name: "solutions_maintenance",
    title: "Maintenance, work orders and vendors | Occupella",
    description:
      "Open work orders, assign vendors with current insurance, schedule visits and bill the owner. Vendors update their own jobs through a link, with no login.",
    inSitemap: true,
    source: "src/solutions/Maintenance.tsx",
    changefreq: "monthly",
    priority: 0.7,
  },
  {
    path: "/solutions/leasing",
    name: "solutions_leasing",
    // ⚠ No texting, no syndication and no screening partner: none is offered.
    title: "Listings, applications and e-signed leases | Occupella",
    description:
      "A public listings page, leads and showings, an application link for each unit, and leases signed on Occupella's own signing page. Renewals 90 days out.",
    inSitemap: true,
    source: "src/solutions/Leasing.tsx",
    changefreq: "monthly",
    priority: 0.7,
  },
  {
    path: "/integrations",
    name: "integrations",
    crumb: "Switching to Occupella",
    title: "Switching from Buildium and other systems | Occupella",
    description:
      "Bring your company over from CSV files: owners, properties, tenants, leases, open charges, unpaid bills and opening balances. No API key to create.",
    inSitemap: true,
    source: "src/integrations/Integrations.tsx",
    changefreq: "monthly",
    priority: 0.6,
  },
  {
    path: "/integrations/buildium",
    name: "integrations_buildium",
    crumb: "From Buildium",
    title: "Switching from Buildium | Occupella",
    description:
      "Move from Buildium to Occupella with CSV files you export: the roster, open charges, unpaid bills and opening balances. No change to your Buildium account.",
    inSitemap: true,
    source: "src/integrations/Buildium.tsx",
    changefreq: "monthly",
    priority: 0.7,
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
    path: "/tools/notice-period",
    name: "tool_notice_period",
    title: "Notice period calculator: pay-or-quit and month-to-month | Occupella",
    description:
      "The last day of a notice to pay rent or leave, and the earliest a month-to-month tenancy can end, for all 50 states and DC, with the statute.",
    inSitemap: true,
    source: "src/tools/NoticePeriodTool.tsx",
    changefreq: "monthly",
    priority: 0.7,
  },
  {
    path: "/security",
    name: "security",
    title: "Security | Occupella",
    description:
      "How Occupella protects your books: company isolation, a ledger that is never rewritten, roles on payouts, encrypted bank numbers and the service providers.",
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
    source: legalSource("terms", ONE_PRODUCT_LEGAL_PUBLISHED),
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
    source: legalSource("privacy", ONE_PRODUCT_LEGAL_PUBLISHED),
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

/**
 * The blog: an index and one page per Markdown file in content/blog/
 * (src/blog/posts.ts). A post's `source` is its file, so the sitemap's
 * lastmod is that file's last commit.
 *
 * ⚠ A post's description is the author's own words from its frontmatter,
 * printed as written, and may run past the 155 characters the other routes
 * keep to (seo.test.ts). docs/blog.md asks for 155 or fewer.
 */
const BLOG_ROUTES: MarketingRoute[] = [
  {
    path: BLOG_PATH,
    name: "blog",
    crumb: "Blog",
    title: BLOG_INDEX.title,
    description: BLOG_INDEX.description,
    image: BLOG_CARD,
    inSitemap: true,
    source: "content/blog",
    changefreq: "weekly",
    priority: 0.6,
  },
  ...POSTS.map(
    (p): MarketingRoute => ({
      path: p.path,
      name: "blog_post",
      crumb: p.title,
      title: `${p.title} | Occupella`,
      description: p.description,
      inSitemap: true,
      source: p.source,
      changefreq: "monthly",
      priority: 0.6,
      // The post's own card (scripts/blog-card.mjs), else the blog's card.
      // A card under /blog/ is drawn at CARD_SIZE (blog.test.tsx checks the
      // file); an image hosted elsewhere carries no size.
      image: p.image
        ? { src: p.image, alt: p.title, ...(p.image.startsWith(`${BLOG_PATH}/`) ? CARD_SIZE : {}) }
        : BLOG_CARD,
      article: {
        headline: p.title,
        author: p.author,
        datePublished: p.datePublished,
        dateModified: p.dateModified,
      },
    }),
  ),
];

export const MARKETING_ROUTES: readonly MarketingRoute[] = [
  ...STATIC_ROUTES,
  ...legalRoutes(ONE_PRODUCT_LEGAL_PUBLISHED),
  ...STATE_LAW_ROUTES,
  ...BLOG_ROUTES,
];

/**
 * Pages that are gone, and where each one's visitors go instead. vercel.json
 * carries the same pairs as permanent redirects (seo.test.ts checks both
 * agree, and that each destination is a page here).
 *
 *   · /screenshots showed the Buildium assistant's Inbox, chat and
 *     Operations pages, which left the product (ADR-one-product, 2026-11-05).
 *   · /docs/buildium-api-setup was the Buildium connector's API key guide.
 *     A Buildium user now switches with files, so it goes to that page.
 */
export const RETIRED: Readonly<Record<string, string>> = {
  "/screenshots": "/features",
  "/docs/buildium-api-setup": "/integrations/buildium",
};

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
