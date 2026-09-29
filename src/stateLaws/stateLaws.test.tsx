// @vitest-environment node
/**
 * The /state-laws pages against the data they are generated from.
 *
 * ⚠ A page that renders is not a page that is right. These read the JSON and
 * the rendered HTML side by side: every citation in the data must appear on
 * its state's page, every section without one must say so in the pinned
 * words, and every verify flag must produce a visible note. A wording helper
 * that dropped a field, or a section that forgot its citation, fails here
 * rather than on a landlord's desk.
 */
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { pageFor } from "../pages";
import { MARKETING_ROUTES, routeFor } from "../seo/routes";
import {
  DATA,
  DATA_SOURCE,
  DATA_VERSION,
  NOT_ADVICE,
  NO_CITATION,
  STATES,
  VERIFY_NOTE,
  depositCap,
  returnDeadline,
  type StateEntry,
} from "./data";

const text = (html: string) =>
  html
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<!-- -->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ");

const page = (st: StateEntry) => text(renderToString(pageFor(st.path)));
const count = (hay: string, needle: string) => hay.split(needle).length - 1;

const SECTIONS = ["deposit", "late_fee", "notice", "screening", "licensing"] as const;

describe("the data", () => {
  it("is the version its source file says, with 51 jurisdictions", () => {
    expect(DATA_VERSION).toBe(DATA_SOURCE.version);
    expect(Object.keys(DATA.states)).toHaveLength(51);
    expect(STATES).toHaveLength(51);
  });

  it("gives every state its own page, route and sitemap entry", () => {
    const paths = new Set(STATES.map((s) => s.path));
    expect(paths.size).toBe(51);
    for (const s of STATES) {
      const r = routeFor(s.path);
      expect(r, s.path).toBeDefined();
      expect(r!.inSitemap).toBe(true);
    }
    expect(routeFor("/state-laws")).toBeDefined();
    expect(STATES.map((s) => s.path)).toContain("/state-laws/district-of-columbia");
    expect(MARKETING_ROUTES.length).toBeGreaterThan(52);
  });
});

describe("every state page", () => {
  for (const st of STATES) {
    it(`${st.rules.name} shows every citation, flag and caveat in its data`, () => {
      const t = page(st);
      const s = st.rules;
      expect(t).toContain(`Data version: ${DATA_VERSION}`);
      expect(t).toContain(NOT_ADVICE);
      expect(t).not.toMatch(/\b(undefined|null|NaN)\b/);

      let missing = 0;
      let flags = 0;
      for (const sec of SECTIONS) {
        const c = (s[sec] as { citation?: string | null }).citation;
        if (c) expect(t, `${sec} citation`).toContain(c);
        else missing += 1;
        if ((s[sec] as { verify_flag?: boolean }).verify_flag) flags += 1;
      }
      for (const r of Object.values(s.rates ?? {})) {
        if (r.citation) expect(t).toContain(r.citation);
        else missing += 1;
      }
      expect(count(t, NO_CITATION), "sections without a citation say so").toBe(missing);
      expect(count(t, VERIFY_NOTE), "one visible note per verify flag").toBe(flags);
      if (s.overlay_market && s.overlay_note) expect(t).toContain(s.overlay_note);
      for (const q of s.quirks) expect(t).toContain(q);
    });
  }
});

describe("three states checked value by value", () => {
  // Chosen for their shapes: a plain state, a state with local overlays and
  // rates, and the one with a dated pending change.
  for (const code of ["TX", "CA", "CO"]) {
    it(code, () => {
      const st = STATES.find((s) => s.code === code)!;
      const s = st.rules;
      const t = page(st);
      expect(t).toContain(depositCap(s.deposit.cap_months));
      expect(t).toContain(returnDeadline(s.deposit));
      if (s.deposit.penalty) expect(t).toContain(s.deposit.penalty);
      if (s.late_fee.rule) expect(t).toContain(s.late_fee.rule);
      if (typeof s.notice.mtm_termination_days === "string") expect(t).toContain(s.notice.mtm_termination_days);
      if (s.deposit.pending_change) {
        expect(t).toContain("Scheduled change");
        expect(t).toContain(s.deposit.pending_change.effective_from.slice(0, 4));
      }
    });
  }
});

describe("the wording never turns a missing value into a rule", () => {
  it("renders an absent cap as no statewide cap, per the legend", () => {
    expect(DATA_VERSION).toBeTruthy();
    expect(depositCap(null)).toBe("No statewide cap");
  });

  it("keeps a phrase the data holds instead of a number", () => {
    const nj = STATES.find((s) => s.code === "NJ")!;
    expect(page(nj)).toContain("none - file directly");
  });
});
