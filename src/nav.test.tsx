// @vitest-environment node
/**
 * Every link in the site menu and the footer lands on something real.
 *
 * ⚠ A menu is a list of promises. A link to a page that is planned and not
 * built, or to a /features section whose id was renamed, deploys clean and
 * sends the visitor to the 404 page. This reads the menu and the pages
 * together: each path must be a marketing route, and each #anchor must be an
 * id the target page actually renders.
 */
import { describe, expect, it } from "vitest";

import { NOT_FOUND_PATH, render } from "./entry-server";
import { FOOTER_EXTRA, MENU, TOP_LINKS } from "./Site";
import { routeFor } from "./seo/routes";

const links = [
  ...MENU.flatMap((g) => g.items.map((i) => i.href)),
  ...TOP_LINKS.map((l) => l.href),
  ...FOOTER_EXTRA,
];

describe("menu and footer links", () => {
  it("found links to check", () => {
    expect(links.length).toBeGreaterThan(12);
  });

  for (const href of links) {
    it(`${href} lands on a real page`, () => {
      const [path, anchor] = href.split("#");
      expect(routeFor(path), `${path} is not a marketing route`).toBeDefined();
      if (anchor) {
        const html = render(path);
        expect(html, `${path} has no id="${anchor}"`).toContain(`id="${anchor}"`);
      }
    });
  }

  it("renders the menu into the prerendered HTML, closed", () => {
    // Crawlers read the prerendered page. The panels must be there, hidden by
    // CSS, not added on click.
    const html = render("/pricing");
    for (const g of MENU) for (const i of g.items) expect(html).toContain(`href="${i.href}"`);
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toBe(render(NOT_FOUND_PATH));
  });
});
