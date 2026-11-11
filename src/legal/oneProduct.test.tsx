// @vitest-environment node
/**
 * The one product's legal drafts go out with one change (src/legal/publish.ts), never half
 * filled, and until then the live /terms, /privacy and /sms are what visitors read.
 */
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { render } from "../entry-server";
import { PAGES } from "../pages";
import { MARKETING_ROUTES } from "../seo/routes";
import { DRAFTS, DraftPage, type LegalDoc, blanksLeft, legalPage, legalPages } from "./oneProduct";
import { ONE_PRODUCT_LEGAL_PUBLISHED, legalRoutes } from "./publish";
import { SUBPROCESSORS } from "./subprocessors";

const DOCS: LegalDoc[] = ["terms", "privacy", "dpa"];

describe("publishing the one product's legal pages", () => {
  it("is refused while any [[BLANK]] is left in a draft", () => {
    // Flipping ONE_PRODUCT_LEGAL_PUBLISHED to true fails here until every blank is filled.
    expect(ONE_PRODUCT_LEGAL_PUBLISHED ? blanksLeft() : []).toEqual([]);
  });

  it("finds the blanks that are left, and not ones filled or in the draft note", () => {
    const left = blanksLeft();
    expect(left).toContain("terms.md: [[LEGAL NAME]]");
    expect(left).toContain("dpa.md: [[BREACH HOURS]]");
    expect(left.some((b) => b.includes("[[DATA LOCATION]]"))).toBe(false);
    expect(left.some((b) => b.includes("[[LIKE THIS]]"))).toBe(false);
    const filled = "# T (draft)\n\n> Blanks read [[LIKE THIS]].\n\nEffective now\n\nAll set.";
    expect(blanksLeft({ terms: filled, privacy: filled, dpa: filled })).toEqual([]);
  });

  it("adds /dpa to the pages and the routes together, and replaces /terms and /privacy", () => {
    expect(Object.keys(legalPages(true)).sort()).toEqual(["/dpa", "/privacy", "/terms"]);
    expect(legalRoutes(true).map((r) => r.path)).toEqual(["/dpa"]);
    expect(legalPages(false)).toEqual({});
    expect(legalRoutes(false)).toEqual([]);
  });

  it("links only to pages that exist once published", () => {
    // /start is the sign-up app, served beside the marketing pages (vercel.json).
    const published = new Set([...Object.keys(PAGES), ...Object.keys(legalPages(true)), "/start"]);
    for (const doc of DOCS) {
      const html = renderToString(<DraftPage doc={doc} />);
      for (const [, href] of html.matchAll(/href="(\/[^"#]*)/g)) {
        expect(published, `${doc}.md links to ${href}`).toContain(href);
      }
    }
  });
});

describe("each draft as a page", () => {
  for (const doc of DOCS) {
    it(`${doc}: titled without "(draft)", dated, and without the draft note`, () => {
      const page = legalPage(DRAFTS[doc]);
      expect(page.title).not.toMatch(/draft/i);
      expect(page.effective).not.toBe("");
      const html = renderToString(<DraftPage doc={doc} />);
      expect(html).toContain(`<h1>${page.title}</h1>`);
      expect(html).toContain(`Effective ${page.effective}`);
      expect(html).not.toContain("Not published");
      expect(html).not.toContain("not reviewed by a lawyer");
      // One plain-English box, the draft's own, not the live pages' too.
      expect(html.match(/class="legal-note"/g)?.length ?? 0).toBeLessThanOrEqual(1);
    });
  }

  it("privacy lists every subprocessor where the draft says the list goes", () => {
    const html = renderToString(<DraftPage doc="privacy" />);
    for (const s of SUBPROCESSORS) {
      expect(html, `${s.name} missing`).toContain(s.name.replace(/&/g, "&amp;"));
    }
    expect(html).not.toContain("At publication");
  });
});

describe("which pages visitors read", () => {
  it("is the live /terms, /privacy and /sms until published, and no /dpa; the drafts after", () => {
    if (ONE_PRODUCT_LEGAL_PUBLISHED) {
      expect(render("/dpa")).toContain("Data Processing Agreement");
      expect(render("/terms")).not.toContain("such as Buildium and");
      expect(MARKETING_ROUTES.some((r) => r.path === "/dpa")).toBe(true);
    } else {
      expect(render("/terms")).toContain("such as Buildium and");
      expect(render("/dpa")).toContain("That page isn");
      expect(MARKETING_ROUTES.some((r) => r.path === "/dpa")).toBe(false);
    }
    expect(render("/sms")).toContain("STOP");
  });
});
