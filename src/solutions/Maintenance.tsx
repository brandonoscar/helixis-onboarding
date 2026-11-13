import { Blocks, SectionHead, SitePageShell, type Block } from "../Site";

// ─────────────────────────────────────────────────────────────────────
// /solutions/maintenance: one job, a repair, from the work order to the paid
// bill.
//
// ⚠ EVERY LINE IS CHECKED AGAINST THE BOOKS (Occupella-PMS CLAUDE.md: work
// orders, vendor links, vendor insurance, recurring work orders, charging a
// tenant for a work order, bills naming a work order). It was the Buildium
// assistant's page until 2026-11-13.
//
// ⚠ NOT CLAIMED: the on-call email for an emergency request and the vendor's
// work order email. Both need the server to send email, which is NOT
// VERIFIED on the hosted app. Tenant requests come from the tenant portal, so
// they carry the Coming chip until tenant sign-in arrives.
// ─────────────────────────────────────────────────────────────────────

const ORDERS: Block[] = [
  {
    t: "Numbered, with every step",
    b: "Each work order has a priority, what is wrong, the day it is due and whether the vendor may let themselves in. Assigned, scheduled, completed or cancelled, each step is kept in order.",
  },
  {
    t: "Visit windows",
    b: "Schedule the visit for a day and a window, such as 8 to 10 am. Work orders count their days open.",
  },
  {
    t: "Photos and files",
    b: "Keep photos and documents on the work order, and read its timeline top to bottom.",
  },
  {
    t: "Recurring jobs",
    b: "A job that comes back every 1 to 12 months opens by itself on its day, with its vendor and priority.",
  },
];

const VENDORS: Block[] = [
  {
    t: "A link instead of a login",
    b: "Send a vendor a link to the work orders assigned to them. They schedule the visit or say the work is done, and the timeline marks it as theirs. A new link takes back the old one.",
  },
  {
    t: "Insurance on file",
    b: "Keep each vendor's policies. A vendor whose insurance ran out can't be assigned, and the vendors page shows whose runs out within 30 days.",
  },
  {
    t: "W-9s and 1099s",
    b: "Keep the W-9 on the vendor, mark who gets a 1099, and the 1099 summary adds up what each was paid in the year.",
  },
];

const MONEY: Block[] = [
  {
    t: "Bill it from the work order",
    b: "Create the vendor's bill from the work order's page. It holds its amount in the owner's account until it is paid.",
  },
  {
    t: "The owner's approval limit",
    b: "A bill over the owner's approval limit waits for their approval before it is paid.",
  },
  {
    t: "Charge the tenant",
    b: "When a tenant caused the damage, charge them a fee that names the work order.",
  },
];

export default function Maintenance() {
  return (
    <SitePageShell
      active="solutions"
      title="Maintenance, from the work order to the paid bill"
      lede={
        <>
          Open a work order, assign a vendor whose insurance is current, schedule the visit and
          bill the owner when the work is done. Vendors update their own jobs through a link.
        </>
      }
    >
      <section className="lp-section" style={{ paddingTop: 72 }}>
        <div className="lp-wrap">
          <SectionHead title="Work orders" />
          <Blocks items={ORDERS} />
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <SectionHead title="Vendors" />
          <Blocks items={VENDORS} cols={3} />
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <SectionHead title="Paying for the work" />
          <Blocks items={MONEY} cols={3} />
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <SectionHead title="Requests from tenants" coming>
            Tenants file repair requests from their portal, with the kind of repair, where in the
            unit and photos, and staff open the work order from the request. Tenants reach the
            portal once tenant sign-in arrives on app.occupella.com.
          </SectionHead>
        </div>
      </section>
    </SitePageShell>
  );
}
