import { SitePageShell } from "../Site";
import { ENTRIES, type ChangelogEntry } from "./entries";

// ─────────────────────────────────────────────────────────────────────
// /changelog: entries.ts, grouped by day. See that file before adding one.
// ─────────────────────────────────────────────────────────────────────

const css = `
  .cl-days { margin-top: 48px; max-width: 820px; border-top: 1px solid var(--line); }
  .cl-day { display: grid; gap: 6px 32px; padding: 20px 0; border-bottom: 1px solid var(--line); }
  @media (min-width: 720px) { .cl-day { grid-template-columns: 170px 1fr; } }
  .cl-day time { font-size: 15px; font-weight: 600; color: var(--ink); font-variant-numeric: tabular-nums; padding-top: 1px; }
  .cl-day ul { margin: 0; padding: 0 0 0 18px; display: flex; flex-direction: column; gap: 8px; }
  .cl-day li { font-size: 17px; line-height: 1.6; color: var(--ink); }
`;

/** "2026-09-08" -> "September 8, 2026", without the visitor's time zone
 *  moving it to the day before. */
export function formatDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function byDay(entries: ChangelogEntry[]): [string, ChangelogEntry[]][] {
  const days = new Map<string, ChangelogEntry[]>();
  for (const e of entries) days.set(e.date, [...(days.get(e.date) ?? []), e]);
  return [...days.entries()];
}

export default function Changelog() {
  return (
    <SitePageShell
      active="resources"
      title="Changelog"
      lede={<>What changed in Occupella, newest first.</>}
      css={css}
    >
      <section>
        <div className="lp-wrap">
          <div className="cl-days">
            {byDay(ENTRIES).map(([day, items]) => (
              <div className="cl-day" key={day}>
                <time dateTime={day}>{formatDay(day)}</time>
                <ul>
                  {items.map((e) => (
                    <li key={e.text}>{e.text}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SitePageShell>
  );
}
