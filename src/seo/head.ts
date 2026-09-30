/**
 * The per-page <head> tags, the structured data and the sitemap, all built
 * from src/seo/routes.ts. The build (scripts/prerender.mjs) calls these;
 * seo.test.ts calls the same functions, so what is tested is what ships.
 */

import { PLANS } from "../Pricing";
import {
  MARKETING_ROUTES,
  NOT_FOUND_PAGE,
  SITE_ORIGIN,
  canonicalFor,
  routeFor,
  type MarketingRoute,
} from "./routes";

/** Replaced in index.html by each page's own tags. */
export const HEAD_START = "<!-- page-head:start -->";
export const HEAD_END = "<!-- page-head:end -->";

const SOCIAL_IMAGE = `${SITE_ORIGIN}/social-preview.png`;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Organization: who runs the site. `sameAs` lists only profiles that exist.
 * TODO(brandon): add the LinkedIn company URL and the YouTube channel URL here
 * once they exist; an empty list is left out rather than published.
 */
const SAME_AS: string[] = [];

/**
 * ⚠ The description and legalName are here to DISAMBIGUATE. "Occupella" is
 * also the name of a Bay Area activist a cappella group (occupella.org,
 * active since 2011), and it owns the search results for the bare name.
 * Telling Google plainly that this Occupella is property-management
 * software, run by Oscar Ventures LLC, is the on-site half of fixing that;
 * the off-site half is the profiles listed in SAME_AS.
 */
export const ORGANIZATION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Occupella",
  legalName: "Oscar Ventures LLC",
  description: "Occupella is AI software for property managers who use Buildium.",
  url: `${SITE_ORIGIN}/`,
  logo: `${SITE_ORIGIN}/icon-512.png`,
  ...(SAME_AS.length ? { sameAs: SAME_AS } : {}),
};

export const WEBSITE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Occupella",
  url: `${SITE_ORIGIN}/`,
};

/**
 * Home > parent > page, for a page whose parent path is itself a page
 * (/state-laws/texas, /integrations/buildium). Null for top-level pages, and
 * for /solutions/* and /docs/*, whose parents don't exist: a breadcrumb that
 * links to a 404 is worse than none.
 */
export function breadcrumbJsonLd(route: MarketingRoute): object | null {
  const parts = route.path.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  const parent = routeFor("/" + parts.slice(0, -1).join("/"));
  if (!parent) return null;
  const home = routeFor("/")!;
  const name = (r: MarketingRoute) => r.crumb ?? r.title.split(" | ")[0];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { name: "Home", r: home },
      { name: name(parent), r: parent },
      { name: name(route), r: route },
    ].map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: canonicalFor(c.r) })),
  };
}

/**
 * The product itself, on the pages that describe it and price it.
 *
 * ⚠ THE PRICES ARE THE PRICING PAGE'S PLANS, read from the same list the
 * cards render (Pricing.tsx PLANS), so a price change cannot leave a stale
 * number in what Google reads. No aggregateRating or review: there are no
 * public reviews yet, and inventing one is the thing this site never does.
 * Google's rich-result test calls that "ineligible for stars", which is true
 * and harmless; the point here is telling search engines, and the assistants
 * that read them, that Occupella is software and what it costs.
 */
export const SOFTWARE_PAGES = ["/", "/pricing"] as const;

export function softwareJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Occupella",
    url: `${SITE_ORIGIN}/`,
    description: ORGANIZATION_JSONLD.description,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Property management",
    operatingSystem: "Web",
    publisher: { "@type": "Organization", name: "Occupella", legalName: ORGANIZATION_JSONLD.legalName },
    offers: PLANS.map((p) => ({
      "@type": "Offer",
      name: p.name,
      price: p.fig === "Free" ? "0" : p.fig.replace(/^\$/, ""),
      priceCurrency: "USD",
      description: `${p.name}: ${p.fig === "Free" ? "free for" : p.fig} ${p.unit}`,
      url: `${SITE_ORIGIN}/pricing`,
    })),
  };
}

/** `<` escaped so no string inside can close the script tag. */
function jsonLd(data: object): string {
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
}

export function headTags(route: MarketingRoute): string {
  const url = canonicalFor(route);
  const title = esc(route.title);
  const description = esc(route.description);
  const crumbs = breadcrumbJsonLd(route);
  return [
    HEAD_START,
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<link rel="canonical" href="${url}" />`,
    ...(route.lcpImage
      ? [`<link rel="preload" as="image" href="${esc(route.lcpImage)}" fetchpriority="high" />`]
      : []),
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Occupella" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${SOCIAL_IMAGE}" />`,
    `<meta property="og:image:alt" content="The Occupella chat surface answering a question about a property." />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${SOCIAL_IMAGE}" />`,
    jsonLd(ORGANIZATION_JSONLD),
    jsonLd(WEBSITE_JSONLD),
    ...(crumbs ? [jsonLd(crumbs)] : []),
    ...((SOFTWARE_PAGES as readonly string[]).includes(route.path) ? [jsonLd(softwareJsonLd())] : []),
    HEAD_END,
  ].join("\n    ");
}

/** The 404 page and the app shell: never indexed, no canonical. */
function unindexedHead(title: string, description: string): string {
  return [
    HEAD_START,
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<meta name="robots" content="noindex" />`,
    HEAD_END,
  ].join("\n    ");
}

export function notFoundHead(): string {
  return unindexedHead(NOT_FOUND_PAGE.title, NOT_FOUND_PAGE.description);
}

/**
 * The shell the setup wizard (/start) and the OAuth popup load into. It used
 * to be served for every URL, carrying the homepage's canonical; now it only
 * answers the client-only paths, and says nothing a search engine should keep.
 */
export function appShellHead(): string {
  return unindexedHead("Start your free trial | Occupella", "Set up Occupella.");
}

/**
 * The sitemap. `lastmod` comes from `lastmodFor` (the build reads each page's
 * last commit date) and is left out when unknown, never guessed: a lastmod
 * that changes on every deploy teaches Google to ignore it.
 */
export function sitemapXml(
  lastmodFor: (route: MarketingRoute) => string | undefined,
  routes: readonly MarketingRoute[] = MARKETING_ROUTES,
): string {
  const urls = routes.filter((r) => r.inSitemap).map((r) => {
    const lastmod = lastmodFor(r);
    return [
      "  <url>",
      `    <loc>${canonicalFor(r)}</loc>`,
      ...(lastmod ? [`    <lastmod>${lastmod}</lastmod>`] : []),
      `    <changefreq>${r.changefreq}</changefreq>`,
      `    <priority>${r.priority.toFixed(1)}</priority>`,
      "  </url>",
    ].join("\n");
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<!-- Generated by scripts/prerender.mjs from src/seo/routes.ts. Do not edit. -->",
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

/**
 * /llms.txt: a plain summary of the site for AI assistants (the llmstxt.org
 * format), written by the build from the same route list as the sitemap.
 *
 * ⚠ It says only what the pages say: the Organization description, then each
 * page's own title and description. The state pages are one line, not 51.
 */
export function llmsTxt(): string {
  const main = MARKETING_ROUTES.filter((r) => r.inSitemap && r.name !== "state_law");
  const line = (r: MarketingRoute) => `- [${r.title.split(" | ")[0]}](${canonicalFor(r)}): ${r.description}`;
  const group = (label: string, test: (r: MarketingRoute) => boolean) => {
    const rows = main.filter(test).map(line);
    return rows.length ? [`## ${label}`, "", ...rows, ""] : [];
  };
  const isLegal = (r: MarketingRoute) => ["/terms", "/privacy", "/sms"].includes(r.path);
  const isResource = (r: MarketingRoute) =>
    r.path.startsWith("/tools/") || r.path.startsWith("/state-laws") || r.path.startsWith("/docs/") || r.path === "/changelog";
  return [
    "# Occupella",
    "",
    `> ${ORGANIZATION_JSONLD.description} It is operated by ${ORGANIZATION_JSONLD.legalName}. Occupella is not affiliated with Buildium.`,
    "",
    "Occupella connects to a property manager's Buildium account with an API key, keeps a synced copy of it, and drafts replies, work orders and owner updates. Every plan starts with a 14-day free trial, and no card is needed to start.",
    "",
    ...group("Product", (r) => !isLegal(r) && !isResource(r)),
    ...group("Free resources", isResource),
    ...group("Legal", isLegal),
  ].join("\n");
}
