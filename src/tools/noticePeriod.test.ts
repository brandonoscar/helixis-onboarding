// @vitest-environment node
/**
 * The notice-period calculator against the backend, date for date.
 * notice-cases.json is written by scripts/gen-deadline-data.py from
 * deadline_math.compute_deadline, called with the units mirror_tools passes.
 */
import { describe, expect, it } from "vitest";

import { STATES } from "../stateLaws/data";
import { COURT_NOTE } from "./depositDeadline";
import cases from "./notice-cases.json";
import { noticePeriod, type NoticeKind } from "./noticePeriod";

const byCode = new Map(STATES.map((s) => [s.code, s]));
const rows = cases as [string, NoticeKind, string, string, string][];

describe("notice periods match the backend", () => {
  it("has cases for both notices and every counting unit", () => {
    expect(rows.length).toBeGreaterThan(1000);
    expect(new Set(rows.filter((r) => r[1] === "nonpay").map((r) => r[4]))).toEqual(
      new Set(["calendar", "business", "court"]),
    );
    expect(rows.some((r) => r[1] === "mtm")).toBe(true);
  });

  it("gives the same last day and the same unit in every case", () => {
    const wrong: string[] = [];
    for (const [code, kind, start, end, unit] of rows) {
      const got = noticePeriod(byCode.get(code)!, kind, start);
      if (!got || got.kind !== "date" || got.end !== end || got.unit !== unit) {
        wrong.push(`${code} ${kind} ${start}: site ${JSON.stringify(got)}, backend ${end} ${unit}`);
      }
    }
    expect(wrong.slice(0, 10)).toEqual([]);
  });
});

describe("states whose data has words, not a day count", () => {
  it("returns the words and never a date", () => {
    let words = 0;
    for (const st of STATES) {
      for (const kind of ["nonpay", "mtm"] as const) {
        const raw = kind === "nonpay" ? st.rules.notice.nonpay_days : st.rules.notice.mtm_termination_days;
        if (typeof raw !== "string") continue;
        words += 1;
        expect(noticePeriod(st, kind, "2026-03-02")).toEqual({ kind: "words", words: raw });
      }
    }
    expect(words).toBeGreaterThan(10);
    expect(noticePeriod(byCode.get("GA")!, "nonpay", "2026-03-02")).toEqual({ kind: "words", words: "demand" });
  });

  it("notes that court days can run longer", () => {
    const court = STATES.find((s) => ["court", "judicial"].includes(s.rules.notice.nonpay_unit))!;
    const got = noticePeriod(court, "nonpay", "2026-03-02");
    expect(got && got.kind === "date" && got.notes).toContain(COURT_NOTE);
  });
});
