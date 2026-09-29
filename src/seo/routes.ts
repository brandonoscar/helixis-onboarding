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
  changefreq: "weekly" | "monthly";
  priority: number;
}

export const MARKETING_ROUTES: readonly MarketingRoute[] = [
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
