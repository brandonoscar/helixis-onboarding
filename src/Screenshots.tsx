import { Reveal, SitePageShell } from "./Site";

// ─────────────────────────────────────────────────────────────────────
// /screenshots: six frames from the product recordings, cropped to the part
// that matters, so a visitor (and image search) can see the app at a size
// where the text reads.
//
// ⚠ EVERY IMAGE IS A FRAME FROM public/demo/product-tour.mp4 OR
// walkthrough-web.mp4, cropped with ffmpeg + Pillow. Nothing is mocked. The
// frames were checked against what ships, and these were left out on
// purpose:
//   · the Leasing board: recorded while Leasing was off, it carries a
//     "leasing CRM isn't enabled" banner and Zillow source chips
//   · the Operations Vendors tab: its "billed 12mo" column is vendor payment
//     history, which /features says is not a feature
//   · the "rent charged below the lease" card: that detector is unconfirmed
//   · the lease-expiry chat answer: it suggests "Draft renewal offers", and
//     renewal drafting is dark
//   · the Inbox list column: its Today strip shows payment promises from
//     email ingest, which defaults off (the crop keeps the detail pane)
// Re-cut from the recordings when the app changes; do not screenshot a
// customer's account.
// ─────────────────────────────────────────────────────────────────────

const css = `
  .ss-list { display: flex; flex-direction: column; gap: clamp(64px, 8vw, 96px); margin-top: 56px; }
  .ss-fig { margin: 0; display: grid; gap: 24px; align-items: start; }
  @media (min-width: 1024px) {
    .ss-fig { grid-template-columns: 4fr 8fr; gap: 56px; }
  }
  .ss-cap h2 {
    font-family: var(--font-display); font-optical-sizing: auto;
    font-size: 28px; font-weight: 560; line-height: 1.2; color: var(--ink);
  }
  .ss-cap p { margin-top: 10px; font-size: 16px; line-height: 1.6; color: var(--ink-muted); }
  .ss-cap a { display: inline-block; margin-top: 12px; }
  .ss-img {
    border: 1px solid var(--line); border-radius: 8px; overflow: hidden; background: var(--canvas-1);
    box-shadow: 0 18px 44px -24px rgba(14, 22, 32, 0.30);
  }
  .ss-img img { display: block; width: 100%; height: auto; }
`;

type Shot = {
  file: string;
  w: number;
  h: number;
  title: string;
  body: string;
  alt: string;
  more?: { href: string; label: string };
};

const SHOTS: Shot[] = [
  {
    file: "inbox-work-order.jpg",
    w: 860,
    h: 900,
    title: "A work order in the Inbox",
    body: "A maintenance request from Buildium, with a summary, what Occupella noticed across the unit's history, and three drafted next steps.",
    alt: "Occupella Inbox: an AC not cooling work order for unit 4B with a summary, what Occupella noticed, and a drafted reply to the tenant",
    more: { href: "/solutions/maintenance", label: "Maintenance, in detail" },
  },
  {
    file: "chat-what-needs-attention.jpg",
    w: 1356,
    h: 700,
    title: "“What needs my attention today?”",
    body: "Occupella checks open work orders, balances, expiring leases and unpaid bills, and leads with the issue that has gone unhandled longest.",
    alt: "Occupella chat answering what needs my attention today, leading with five water-heater leaks still marked low priority and unassigned",
  },
  {
    file: "chat-behind-on-rent.jpg",
    w: 1356,
    h: 960,
    title: "“Which tenants are behind on rent?”",
    body: "Every lease with a balance, with the amount, how late it is and the open maintenance at that address.",
    alt: "Occupella chat table of tenants behind on rent, with address, balance, 31 to 60 and 31 to 90 day aging, and open work orders",
    more: { href: "/solutions/delinquency", label: "Late rent, in detail" },
  },
  {
    file: "operations-properties.jpg",
    w: 1180,
    h: 380,
    title: "Operations: properties",
    body: "Occupancy, open work orders, leases ending in 90 days and the delinquent balance for each property, sortable by any column.",
    alt: "Occupella Operations page, properties tab: occupancy, open work orders, leases ending in 90 days and delinquent balance per property",
  },
  {
    file: "operations-tenants.jpg",
    w: 1180,
    h: 480,
    title: "Operations: tenants",
    body: "Each tenant's unit, balance, aging, rent and lease end date, with the contact options on the row.",
    alt: "Occupella Operations page, tenants tab: unit, balance, aging, rent and lease end date for each tenant",
  },
  {
    file: "operations-team.jpg",
    w: 1180,
    h: 400,
    title: "Operations: team",
    body: "Open work orders, open tasks and what each person finished this week.",
    alt: "Occupella Operations page, team tab: open work orders, open tasks and tasks done this week per team member",
  },
];

export default function Screenshots() {
  return (
    <SitePageShell
      active="resources"
      title="What Occupella looks like"
      lede={
        <>
          Six screenshots taken from our product recordings and cropped to the part that
          matters. The names and numbers come from demo and test accounts, not from a
          customer&rsquo;s data.
        </>
      }
      css={css}
      close={{
        title: "See it on your own portfolio",
        body: "Connect Buildium and these screens fill with your own properties, tenants and work orders. 14 days, no card.",
      }}
    >
      <section>
        <div className="lp-wrap">
          <div className="ss-list">
            {SHOTS.map((s, i) => (
              <figure className="ss-fig" key={s.file}>
                <Reveal>
                  <figcaption className="ss-cap">
                    <h2>{s.title}</h2>
                    <p>{s.body}</p>
                    {s.more ? (
                      <a className="lp-textlink" href={s.more.href}>
                        {s.more.label}
                      </a>
                    ) : null}
                  </figcaption>
                </Reveal>
                <div className="ss-img">
                  <img
                    src={`/shots/gallery/${s.file}`}
                    width={s.w}
                    height={s.h}
                    alt={s.alt}
                    loading={i < 2 ? "eager" : "lazy"}
                    decoding="async"
                  />
                </div>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </SitePageShell>
  );
}
