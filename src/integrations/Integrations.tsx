import { CONNECTS } from "../Features";
import { Reveal, SitePageShell } from "../Site";

// ─────────────────────────────────────────────────────────────────────
// /integrations: what Occupella connects to, and the state of each.
//
// ⚠ THREE STATUSES, AND EACH MEANS ONE THING.
//   · Live: a customer can connect it today from the setup page.
//   · In carrier review: built, and waiting on the carrier's A2P approval.
//     Nobody on any plan can text before it clears (see /features).
//   · Planned: not built. No date is given, because none is set.
// The Live descriptions are the /features "Works with" blocks, imported, so
// the two pages can't describe the same connection two ways.
//
// ⚠ RENTVINE IS NOT LISTED, deliberately. It is held off the site.
// TODO(brandon): confirm the planned list (Rent Manager, Propertyware,
// DoorLoop, Rentec Direct) is still the order you'd build them in.
// ─────────────────────────────────────────────────────────────────────

const css = `
  .ig-grid { display: grid; gap: 20px; margin-top: 40px; }
  @media (min-width: 720px) { .ig-grid { grid-template-columns: 1fr 1fr; } }
  @media (min-width: 1060px) { .ig-grid[data-cols="4"] { grid-template-columns: repeat(4, 1fr); } }
  .ig-card {
    display: flex; flex-direction: column; gap: 10px;
    padding: 22px 22px 24px; border: 1px solid var(--line); border-radius: 10px; background: var(--canvas);
  }
  .ig-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .ig-card h3 { font-size: 19px; font-weight: 600; color: var(--ink); }
  .ig-card p { font-size: 16px; line-height: 1.6; color: var(--ink-muted); }
  .ig-card a.lp-textlink { margin-top: auto; padding-top: 6px; }
  .ig-chip {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 3px 10px; border-radius: 999px; font-size: 13px; font-weight: 600; white-space: nowrap;
    border: 1px solid var(--line-strong); color: var(--ink-muted); background: var(--canvas);
  }
  .ig-chip::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
  .ig-chip[data-s="live"] { color: #1F6B45; border-color: #B9DCC8; background: #EEF7F1; }
  .ig-chip[data-s="review"] { color: #8A5212; border-color: #E8C99A; background: #FBF3E6; }
  .ig-ask { margin-top: 24px; font-size: 17px; line-height: 1.6; color: var(--ink); max-width: 62ch; }
`;

type Status = "live" | "review" | "planned";
const LABEL: Record<Status, string> = { live: "Live", review: "In carrier review", planned: "Planned" };

type Card = { name: string; status: Status; body?: string; href?: string; link?: string };

const LIVE_LINKS: Record<string, { href: string; link: string }> = {
  Buildium: { href: "/integrations/buildium", link: "What it reads and changes" },
};

export const LIVE: Card[] = CONNECTS.map((c) => ({ name: c.t, status: "live", body: c.b, ...LIVE_LINKS[c.t] }));

export const MESSAGING: Card[] = [
  {
    name: "Text messages",
    status: "review",
    body: "Texting leads and residents from a number that belongs to your company, sent through Twilio. It opens when the carrier approves your registration, which takes about ten to fifteen days.",
    href: "/sms",
    link: "How the SMS program works",
  },
];

export const PLANNED: Card[] = ["Rent Manager", "Propertyware", "DoorLoop", "Rentec Direct"].map((name) => ({
  name,
  status: "planned",
}));

function Cards({ cards, cols }: { cards: Card[]; cols?: 4 }) {
  return (
    <div className="ig-grid" data-cols={cols}>
      {cards.map((c) => (
        <div className="ig-card" key={c.name} data-status={c.status}>
          <div className="ig-top">
            <h3>{c.name}</h3>
            <span className="ig-chip" data-s={c.status}>
              {LABEL[c.status]}
            </span>
          </div>
          {c.body ? <p>{c.body}</p> : null}
          {c.href ? (
            <a className="lp-textlink" href={c.href}>
              {c.link}
            </a>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default function Integrations() {
  return (
    <SitePageShell
      active="resources"
      title="Integrations"
      lede={
        <>
          Occupella works on top of Buildium and your Google account. Each connection below says
          whether you can turn it on today.
        </>
      }
      css={css}
      close={{
        title: "Connect Buildium and see your own data",
        body: "One API key, then Occupella scans your portfolio. 14 days free, no card.",
      }}
    >
      <section>
        <div className="lp-wrap">
          <Cards cards={LIVE} />
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-section-head">
              <h2 className="lp-h2">Waiting on approval</h2>
            </div>
          </Reveal>
          <Cards cards={MESSAGING} />
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-section-head">
              <h2 className="lp-h2">Other property management systems</h2>
              <p className="lp-body">
                Occupella needs Buildium today. None of these is built yet; they are the systems we plan to support next.
              </p>
            </div>
          </Reveal>
          <Cards cards={PLANNED} cols={4} />
          <p className="ig-ask">
            On a different system? Email <a href="mailto:team@occupella.com">team@occupella.com</a>{" "}
            and tell us which one.
          </p>
        </div>
      </section>
    </SitePageShell>
  );
}
