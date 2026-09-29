/**
 * Notice periods, computed the way Occupella's chat computes them.
 *
 * ⚠ PORT OF AgenticHelixis mirror_tools._nonpay_notice_lines and
 * _mtm_termination_lines:
 *   · pay-or-quit: compute_deadline(served, nonpay_days, nonpay_unit), the
 *     unit passed as the data has it (court and judicial days are business
 *     days plus a note);
 *   · month-to-month: compute_deadline(given, mtm_termination_days,
 *     "calendar"), read as the earliest the tenancy can end.
 * A state whose data holds words instead of a day count ("demand",
 * "for-cause only") gets those words back, never a date.
 * noticePeriod.test.ts checks both against backend-computed cases.
 */
import type { StateEntry } from "../stateLaws/data";
import { OUTSIDE_HOLIDAYS_NOTE, computeDeadline, holidaysCover, isoDay, parseDay } from "./depositDeadline";

export type NoticeKind = "nonpay" | "mtm";

export type NoticeAnswer =
  | { kind: "date"; start: string; end: string; days: number; unit: "calendar" | "business" | "court"; notes: string[] }
  | { kind: "words"; words: string }
  | null;

export function noticePeriod(state: StateEntry, kind: NoticeKind, startIso: string): NoticeAnswer {
  const n = state.rules.notice;
  const raw = kind === "nonpay" ? n.nonpay_days : n.mtm_termination_days;
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "number") return { kind: "words", words: raw };
  const start = parseDay(startIso);
  if (start === null) return null;
  const unit = kind === "nonpay" ? n.nonpay_unit : "calendar";
  const c = computeDeadline(start, raw, unit, state.code);
  const notes = [...c.notes];
  if (c.unit !== "calendar" && !holidaysCover(start, c.due)) notes.push(OUTSIDE_HOLIDAYS_NOTE);
  return { kind: "date", start: isoDay(start), end: isoDay(c.due), days: raw, unit: c.unit, notes };
}
