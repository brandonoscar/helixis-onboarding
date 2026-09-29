/**
 * The landlord-rules data behind /state-laws, and every way it is turned
 * into words.
 *
 * ⚠ NOTHING HERE ADDS A FACT. Each function either passes a value from
 * src/data/jurisdiction_rules.json through unchanged or decodes a code using
 * that file's own `legend` (Y/N/P/L, B/PM/N, eviction tiers). A value the
 * data does not have renders as "not in our data", never as zero, "none" or
 * "no rule": an absent rule and a rule that says "none" are different facts
 * (CLAUDE.md rule 14).
 *
 * The data is a committed copy of AgenticHelixis
 * src/helixis/geo/data/jurisdiction_rules.json. See
 * scripts/copy-jurisdiction-rules.mjs and jurisdiction_rules.source.json.
 */
import raw from "../data/jurisdiction_rules.json";
import source from "../data/jurisdiction_rules.source.json";

type Val = number | string | null;

export interface PendingChange {
  field: string;
  new_value: Val;
  effective_from: string;
  precision?: string;
  citation?: string;
}

export interface Rate {
  formula?: string;
  publisher?: string;
  citation?: string;
  value: Val;
  unit?: string;
  scope?: string;
}

export interface StateRules {
  name: string;
  deposit: {
    cap_months: Val;
    return_deadline_days: Val;
    return_deadline_unit?: string;
    deadline_trigger: string;
    penalty: string | null;
    interest_owed: boolean | null;
    citation: string | null;
    verify_flag?: boolean;
    note?: string;
    pending_change?: PendingChange;
  };
  late_fee: { rule: string | null; grace_days: Val; citation?: string | null; verify_flag?: boolean };
  notice: {
    nonpay_days: Val;
    nonpay_unit: string;
    mtm_termination_days: Val;
    entry_hours: Val;
    note?: string;
    verify_flag?: boolean;
    citation?: string | null;
  };
  screening: { soi_protection: string; note?: string; verify_flag?: boolean; citation?: string | null };
  licensing: { pm_license: string; note?: string; verify_flag?: boolean; citation?: string | null };
  eviction_speed_tier: number;
  quirks: string[];
  overlay_market: boolean;
  overlay_note: string | null;
  rates?: Record<string, Rate>;
}

interface Data {
  version: string;
  federal: { cares_act_nonpay_notice_days: { value: number; citation: string; note: string } };
  states: Record<string, StateRules>;
  overlay_jurisdictions: Record<string, { places?: { name: string; warning: string }[] }>;
}

export const DATA = raw as unknown as Data;
export const DATA_VERSION = DATA.version;
export const DATA_SOURCE = source as { repository: string; path: string; version: string; commit: string };

/** Shown wherever a section has no citation. The exact words are pinned by
 *  stateLaws.test.ts, because the prompt that asked for these pages did. */
export const NO_CITATION = "No statute cited in our data";
export const VERIFY_NOTE =
  "Verify this with the statute or a local attorney before you act on it. The rule changed recently or has known ambiguity.";
export const NOT_ADVICE = "This is general information, not legal advice.";

export function slugFor(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export interface StateEntry {
  code: string;
  slug: string;
  path: string;
  rules: StateRules;
}

export const STATES: StateEntry[] = Object.entries(DATA.states)
  .map(([code, rules]) => ({ code, slug: slugFor(rules.name), path: `/state-laws/${slugFor(rules.name)}`, rules }))
  .sort((a, b) => a.rules.name.localeCompare(b.rules.name));

export function stateByPath(path: string): StateEntry | undefined {
  return STATES.find((s) => s.path === path);
}

// ── wording ──────────────────────────────────────────────────────────

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function depositCap(v: Val): string {
  if (v === null) return "No statewide cap";
  if (typeof v === "number") return `${v === 1 ? "1 month's" : `${v} months'`} rent`;
  return v;
}

export function returnDeadline(r: StateRules["deposit"]): string {
  const v = r.return_deadline_days;
  if (v === null) return "Not in our data";
  if (typeof v !== "number") return v;
  // The legend: absent unit means calendar days, and count the longer reading.
  const unit = r.return_deadline_unit === "business" ? "business day" : "day";
  const trigger =
    r.deadline_trigger === "tenancy_end"
      ? "after the tenancy ends"
      : r.deadline_trigger === "surrender_plus_forwarding_address"
        ? "after the tenant moves out and gives a forwarding address"
        : r.deadline_trigger;
  return `${plural(v, unit)} ${trigger}`;
}

export function yesNo(v: boolean | null | undefined): string {
  if (v === true) return "Yes";
  if (v === false) return "No";
  return "Not in our data";
}

export function graceDays(v: Val): string {
  if (v === null) return "Not in our data";
  if (typeof v === "number") return plural(v, "day");
  return v;
}

export function nonpayNotice(n: StateRules["notice"]): string {
  const v = n.nonpay_days;
  if (v === null) return "Not in our data";
  if (typeof v !== "number") return v;
  const unit =
    n.nonpay_unit === "business"
      ? "business day"
      : n.nonpay_unit === "calendar"
        ? "day"
        : n.nonpay_unit === "court"
          ? "court day"
          : n.nonpay_unit === "judicial"
            ? "judicial day"
            : `${n.nonpay_unit} day`;
  return plural(v, unit);
}

export function days(v: Val): string {
  if (v === null) return "Not in our data";
  return typeof v === "number" ? plural(v, "day") : v;
}

export function hours(v: Val): string {
  if (v === null) return "Not in our data";
  return typeof v === "number" ? plural(v, "hour") : v;
}

/** From the data's legend.soi_protection. */
export function soi(code: string): string {
  switch (code) {
    case "Y":
      return "Yes, statewide. Refusing a housing voucher is illegal.";
    case "N":
      return "No statewide protection.";
    case "P":
      return "No. The state stops cities and counties from adding one.";
    case "L":
      return "Only where a local ordinance adds it.";
    default:
      return code;
  }
}

/** From the data's legend.pm_license. */
export function pmLicense(code: string): string {
  switch (code) {
    case "B":
      return "A real-estate broker license, to manage property for others.";
    case "PM":
      return "A dedicated property-management license.";
    case "N":
      return "No license required.";
    default:
      return code;
  }
}

/** From the data's legend.eviction_speed_tier. */
export function evictionTier(t: number): string {
  switch (t) {
    case 1:
      return "Among the fastest: about 2 to 4 weeks.";
    case 2:
      return "Moderate: about 1 to 2 months.";
    case 3:
      return "Slow: about 2 to 4 months.";
    case 4:
      return "Among the slowest: 4 months or more, in tenant-protective courts.";
    default:
      return String(t);
  }
}

const RATE_NAMES: Record<string, string> = {
  ab1482_max_increase: "AB 1482 maximum rent increase",
  local_board_increases: "Local rent board increases",
  application_screening_fee_cap: "Application screening fee cap",
  deposit_interest_rate: "Interest owed on deposits",
  stabilized_increase: "Rent-stabilized increase",
  estoppel_fee_caps: "Estoppel fee caps",
  chicago_deposit_interest_rate: "Chicago deposit interest rate",
  portland_me_rent_cap: "Portland rent cap",
  montgomery_co_cap: "Montgomery County rent cap",
  st_paul_rent_cap: "St. Paul rent cap",
  rgb_stabilized_renewal: "Rent Guidelines Board stabilized renewal",
  statewide_rent_cap: "Statewide rent cap",
};

export function rateName(key: string): string {
  return RATE_NAMES[key] ?? key.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

export function rateValue(r: Rate): string {
  if (r.value === null || r.value === undefined) {
    return "This year's figure is not loaded in our data. Use the formula and check the publisher.";
  }
  return r.unit === "percent" ? `${r.value}%` : r.unit === "dollars" ? `$${r.value}` : String(r.value);
}

/** "the cap becomes 1 month's rent from 2026-01-01" */
export function pendingChange(p: PendingChange): string {
  const field = p.field === "cap_months" ? "The deposit cap" : p.field.replace(/_/g, " ");
  const value = p.field === "cap_months" ? depositCap(p.new_value) : String(p.new_value);
  const when =
    p.precision === "year"
      ? `during ${p.effective_from.slice(0, 4)} (the exact date is not verified in our data)`
      : `on ${p.effective_from}`;
  return `${field} changes to ${value} ${when}.`;
}

export function descriptionFor(s: StateRules): string {
  const d = s.deposit.return_deadline_days;
  const unit = s.deposit.return_deadline_unit === "business" ? "business day" : "day";
  const deadline = typeof d === "number" ? ` Deposits go back within ${plural(d, unit)}.` : "";
  return `${s.name} landlord rules for deposits, late fees and notices, with statute citations.${deadline} Data version ${DATA_VERSION}.`;
}
