// @vitest-environment node
import { describe, expect, it } from "vitest";

import { ENTRIES } from "./entries";
import { formatDay } from "./Changelog";

describe("the changelog", () => {
  it("is newest first", () => {
    const dates = ENTRIES.map((e) => e.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it("dates every entry and ties it to a merged pull request", () => {
    for (const e of ENTRIES) {
      expect(e.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isInteger(e.pr) && e.pr > 0, e.text).toBe(true);
    }
  });

  it("never names a system the site doesn't, a flag, or the old product name", () => {
    for (const e of ENTRIES) {
      expect(e.text, e.text).not.toMatch(/rentvine|helixis|HELIXIS_|_ENABLED|partner/i);
    }
  });

  it("prints the day it was written for, in any time zone", () => {
    expect(formatDay("2026-09-01")).toBe("September 1, 2026");
  });
});
