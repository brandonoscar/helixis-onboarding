/**
 * The deposit-return deadline, computed the way Occupella's chat computes it.
 *
 * ⚠ THIS IS A PORT, AND IT MUST STAY ONE. The rules are AgenticHelixis
 * src/helixis/geo/deadline_math.py, called from mirror_tools.py with
 * `return_deadline_unit or "calendar"`:
 *   · the clock starts the day AFTER the trigger (day zero is the trigger);
 *   · calendar days are a straight count; business days skip weekends and
 *     US federal + state holidays;
 *   · "finish by" is the last business day STRICTLY before the due date,
 *     because a deadline the manager owes never rolls forward.
 * depositDeadline.test.ts checks this file against cases computed by the
 * backend's own functions (scripts/gen-deadline-data.py), date for date.
 *
 * Holidays come from src/data/holidays.json, generated from the same
 * `holidays` package the backend uses, for a fixed range of years. Outside
 * that range only weekends are skipped, and the result says so.
 */
import holidayData from "../data/holidays.json";
import type { StateEntry } from "../stateLaws/data";

const HOLIDAYS = holidayData as {
  years: number[];
  generated_with: string;
  federal: string[];
  state_only: Record<string, string[]>;
  /** Federal days a state's own calendar leaves out. */
  state_drops: Record<string, string[]>;
};

const DAY = 86_400_000;

/** "2026-09-30" → a UTC timestamp, so no time zone moves the date. */
export function parseDay(iso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(t).toISOString().slice(0, 10) === iso ? t : null;
}

export const isoDay = (t: number) => new Date(t).toISOString().slice(0, 10);

/** The state's own calendar: federal days, minus the ones it drops, plus
 *  its own. Not simply federal + extras (Georgia has no Presidents' Day). */
function holidaySet(code: string): Set<string> {
  const set = new Set([...HOLIDAYS.federal, ...(HOLIDAYS.state_only[code] ?? [])]);
  for (const d of HOLIDAYS.state_drops[code] ?? []) set.delete(d);
  return set;
}

const inRange = (t: number) => HOLIDAYS.years.includes(new Date(t).getUTCFullYear());

function isBusinessDay(t: number, holidays: Set<string>): boolean {
  const wd = new Date(t).getUTCDay();
  if (wd === 0 || wd === 6) return false;
  return !holidays.has(isoDay(t));
}

export interface DepositDeadline {
  /** The day the clock started: the move-out, or in Texas the later of the
   *  move-out and the day the forwarding address arrived. */
  trigger: string;
  due: string;
  /** The last business day strictly before `due`. */
  finishBy: string;
  unit: "calendar" | "business";
  days: number;
  /** Shown under the result. Empty means nothing to warn about. */
  notes: string[];
}

export const NEEDS_FORWARDING = "surrender_plus_forwarding_address";

export const OUTSIDE_HOLIDAYS_NOTE =
  "This date is outside the years our holiday calendar covers, so only weekends were skipped. A holiday could move it.";

/**
 * Null when the state's data has no numeric deadline (the page then shows
 * what the data says instead of guessing a date), or when a date is
 * missing or not a real date.
 */
export function depositDeadline(
  state: StateEntry,
  moveOut: string,
  forwardingAddress?: string,
): DepositDeadline | null {
  const dep = state.rules.deposit;
  const days = dep.return_deadline_days;
  if (typeof days !== "number") return null;
  const out = parseDay(moveOut);
  if (out === null) return null;

  let trigger = out;
  if (dep.deadline_trigger === NEEDS_FORWARDING) {
    const fwd = forwardingAddress ? parseDay(forwardingAddress) : null;
    if (fwd === null) return null;
    trigger = Math.max(out, fwd);
  }

  const unit = dep.return_deadline_unit === "business" ? "business" : "calendar";
  const holidays = holidaySet(state.code);
  const notes: string[] = [];

  let due = trigger;
  if (unit === "calendar") {
    due = trigger + days * DAY;
  } else {
    let left = days;
    while (left > 0) {
      due += DAY;
      if (isBusinessDay(due, holidays)) left -= 1;
    }
  }

  let finishBy = due - DAY;
  for (let i = 0; i < 30 && !isBusinessDay(finishBy, holidays); i++) finishBy -= DAY;

  const covered = inRange(due) && inRange(finishBy) && (unit === "calendar" || inRange(trigger));
  if (!covered) notes.push(OUTSIDE_HOLIDAYS_NOTE);

  return { trigger: isoDay(trigger), due: isoDay(due), finishBy: isoDay(finishBy), unit, days, notes };
}
