// @vitest-environment node
/**
 * One subprocessor list, and both pages that promise it show all of it.
 * The old /privacy paragraph named seven providers while the code called
 * more; a page that lists a subset is a legal statement that is wrong.
 */
import { describe, expect, it } from "vitest";

import { render } from "../entry-server";
import { SUBPROCESSORS } from "./subprocessors";

describe("subprocessors", () => {
  it("has entries to check", () => {
    expect(SUBPROCESSORS.length).toBeGreaterThan(10);
  });

  for (const page of ["/security", "/privacy"]) {
    it(`${page} lists every one`, () => {
      const html = render(page);
      for (const s of SUBPROCESSORS) {
        expect(html, `${s.name} missing from ${page}`).toContain(s.name.replace(/&/g, "&amp;"));
      }
    });
  }
});
