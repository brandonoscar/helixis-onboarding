// @vitest-environment node
/**
 * Every marketing page renders on the server, with no browser, to real copy.
 *
 * This is what a crawler that runs no JavaScript now receives. A component
 * that touches `window` while rendering (instead of inside an effect) throws
 * here, and in the build, which would freeze the live site on the previous
 * deploy (gotcha 131). Failing here is the cheap place to find out.
 */
import { describe, expect, it } from "vitest";

import { NOT_FOUND_PATH, render } from "./entry-server";
import { MARKETING_ROUTES } from "./seo/routes";

const text = (html: string) =>
  html
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");

describe("server rendering", () => {
  it("runs with no browser at all", () => {
    expect(typeof window).toBe("undefined");
  });

  for (const route of MARKETING_ROUTES) {
    it(`renders ${route.path} to its own copy`, () => {
      const words = text(render(route.path)).trim().split(" ").length;
      expect(words, `${route.path} rendered ${words} words`).toBeGreaterThan(80);
    });
  }

  it("renders the pages apart from each other", () => {
    // A router that fell through to one page for every path would pass the
    // word count above on every route.
    const pages = MARKETING_ROUTES.map((r) => render(r.path));
    expect(new Set(pages).size).toBe(pages.length);
  });

  it("renders the 404 page for a path nothing answers", () => {
    const html = text(render(NOT_FOUND_PATH));
    expect(html).toBe(text(render("/this-page-does-not-exist")));
    expect(html).not.toBe(text(render("/")));
  });
});
