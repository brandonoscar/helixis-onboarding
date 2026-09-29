// @vitest-environment node
/**
 * The calculator against the backend, date for date.
 *
 * ⚠ deadline-cases.json is written by scripts/gen-deadline-data.py, which
 * calls AgenticHelixis deadline_math.compute_deadline and
 * compliance_completion_date: the functions Occupella's chat answers with.
 * A site that said "due the 14th" while the product said "the 15th" would be
 * worse than no calculator.
 */
import { describe, expect, it } from "vitest";

import { STATES } from "../stateLaws/data";
import cases from "./deadline-cases.json";
import { NEEDS_FORWARDING, OUTSIDE_HOLIDAYS_NOTE, depositDeadline, parseDay } from "./depositDeadline";

const byCode = new Map(STATES.map((s) => [s.code, s]));

describe("the deposit deadline matches the backend", () => {
  const rows = cases as [string, string, string, string][];

  it("has cases for every state, including the business-day one", () => {
    expect(rows.length).toBeGreaterThan(1000);
    expect(new Set(rows.map((r) => r[0])).size).toBe(51);
    expect(rows.some((r) => r[0] === "AZ")).toBe(true);
  });

  it("gives the same due date and finish-by date in every case", () => {
    const wrong: string[] = [];
    for (const [code, trigger, due, finishBy] of rows) {
      // The backend's trigger is the clock start; in Texas that is the
      // later of move-out and forwarding address, so pass it as both.
      const got = depositDeadline(byCode.get(code)!, trigger, trigger)!;
      if (got.due !== due || got.finishBy !== finishBy) {
        wrong.push(`${code} ${trigger}: site ${got.due}/${got.finishBy}, backend ${due}/${finishBy}`);
      }
    }
    expect(wrong.slice(0, 10)).toEqual([]);
  });
});

describe("the inputs", () => {
  const tx = byCode.get("TX")!;
  const ca = byCode.get("CA")!;

  it("starts the Texas clock at the later of move-out and forwarding address", () => {
    expect(tx.rules.deposit.deadline_trigger).toBe(NEEDS_FORWARDING);
    expect(depositDeadline(tx, "2026-03-02")).toBeNull();
    const late = depositDeadline(tx, "2026-03-02", "2026-03-10")!;
    expect(late.trigger).toBe("2026-03-10");
    const early = depositDeadline(tx, "2026-03-02", "2026-02-20")!;
    expect(early.trigger).toBe("2026-03-02");
  });

  it("ignores a forwarding address where the state doesn't count it", () => {
    expect(depositDeadline(ca, "2026-03-02", "2026-03-20")!.trigger).toBe("2026-03-02");
  });

  it("refuses a date that doesn't exist rather than rolling it over", () => {
    expect(parseDay("2026-02-30")).toBeNull();
    expect(depositDeadline(ca, "2026-02-30")).toBeNull();
    expect(depositDeadline(ca, "")).toBeNull();
  });

  it("says so when the date is past the holiday calendar", () => {
    const far = depositDeadline(byCode.get("AZ")!, "2031-06-01")!;
    expect(far.notes).toContain(OUTSIDE_HOLIDAYS_NOTE);
    expect(depositDeadline(ca, "2026-06-01")!.notes).toEqual([]);
  });
});
