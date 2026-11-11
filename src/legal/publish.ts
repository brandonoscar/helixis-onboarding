/**
 * The one product's legal pages: whether they are published, and the routes they add.
 *
 * ⚠ PUBLISHING THE DRAFTS IS THIS ONE LINE. While it is false, /terms and /privacy are the live
 * pages in src/Legal.tsx (the product running today) and /dpa doesn't exist. At the switch-over
 * (AgenticHelixis docs/decisions/ADR-one-product.md, phase 6), set it to true: /terms, /privacy
 * and /dpa then render docs/legal/terms.md, privacy.md and dpa.md (src/legal/oneProduct.tsx).
 * src/legal/oneProduct.test.tsx refuses true while any [[BLANK]] is left in a draft, so the
 * drafts can't go out half filled. /sms is never one of them: its consent wording is quoted by
 * the carrier registration.
 *
 * No React here: src/seo/routes.ts reads it too.
 */
import type { MarketingRoute } from "../seo/routes";

export const ONE_PRODUCT_LEGAL_PUBLISHED = false;

/** The file each legal page is written in, for the sitemap's <lastmod>. */
export function legalSource(page: "terms" | "privacy", published: boolean): string {
  return published ? `docs/legal/${page}.md` : "src/Legal.tsx";
}

/** The route the drafts add once published: /dpa. /terms and /privacy keep their routes. */
export function legalRoutes(published: boolean): MarketingRoute[] {
  if (!published) return [];
  return [
    {
      path: "/dpa",
      name: "dpa",
      title: "Data processing agreement | Occupella",
      description:
        "How Occupella processes your tenants', owners', applicants' and vendors' data for you: security, subprocessors, breaches, retention and deletion.",
      inSitemap: true,
      source: "docs/legal/dpa.md",
      changefreq: "monthly",
      priority: 0.3,
    },
  ];
}
