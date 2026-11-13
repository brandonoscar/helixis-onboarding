import { Blocks, SectionHead, SitePageShell, type Block } from "../Site";

// ─────────────────────────────────────────────────────────────────────
// /solutions/owner-reporting: one job, an owner's money, from the rent that
// comes in to the statement and the draw.
//
// ⚠ EVERY LINE IS CHECKED AGAINST THE BOOKS (Occupella-PMS CLAUDE.md: the
// owner money loop, owners' fees, owner draws and payout files, ownership
// shares, bill markups, owner year-end, the income statements, budgets;
// trust_report_owner_statement takes any period). It was the Buildium
// assistant's page until 2026-11-13.
//
// ⚠ NOT CLAIMED: statements emailed to owners each month (needs the server
// to send email, NOT VERIFIED on the hosted app) and mailing anything. The
// owner portal carries the Coming chip until owner sign-in arrives.
// ─────────────────────────────────────────────────────────────────────

const STATEMENTS: Block[] = [
  {
    t: "Owner statements",
    b: "An owner's statement for any period: opening balance, rent collected, fees, bills, draws and contributions, closing balance.",
  },
  {
    t: "Income statements",
    b: "Cash or accrual, by what each charge was, with each line on its Schedule E line, for one owner or all of them.",
  },
  {
    t: "The year-end",
    b: "Each property account's year, added up across the owner's properties, with the year's 1099-MISC rents. Occupella files nothing.",
  },
  {
    t: "Budgets",
    b: "Set a property's budget month by month, and read it beside what happened.",
  },
];

const DRAWS: Block[] = [
  {
    t: "What is available",
    b: "An owner is paid what is above their reserve and the bills not yet paid, so a draw never pays out money a bill is holding.",
  },
  {
    t: "Your draw day",
    b: "On the day of the month you pick, the nightly run prepares each owner's draw. Nothing is paid until you approve it.",
  },
  {
    t: "ACH file or check",
    b: "Each owner is paid their way. Occupella writes the NACHA file for your bank and checks for your pre-printed stock, and your bank moves the money.",
  },
  {
    t: "Owners who share a property",
    b: "Payments, bills and fees split by each owner's share, to the cent, with the cents left over placed the same way every time.",
  },
];

const FEES: Block[] = [
  {
    t: "Management fees",
    b: "A percent of rent collected, a minimum and a flat fee, from each owner's agreement. Collect them by hand for a period, or have the nightly run take last month's by itself.",
  },
  {
    t: "Other fees and markups",
    b: "Take an inspection or lease-up fee from an owner with what it is for, and add the agreement's markup to a bill.",
  },
  {
    t: "Contributions",
    b: "Record money an owner sends in to cover a bill or rebuild their reserve.",
  },
];

export default function OwnerReporting() {
  return (
    <SitePageShell
      active="solutions"
      title="Owner reporting, from the rent to the draw"
      lede={
        <>
          Each owner&rsquo;s money is tracked in trust from the first rent payment to the draw.
          Statements, the year-end and the income statement come from the same books, so they
          agree with each other.
        </>
      }
    >
      <section className="lp-section" style={{ paddingTop: 72 }}>
        <div className="lp-wrap">
          <SectionHead title="Statements and the year-end" />
          <Blocks items={STATEMENTS} />
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <SectionHead title="Paying owners" />
          <Blocks items={DRAWS} />
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <SectionHead title="Fees" />
          <Blocks items={FEES} cols={3} />
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <SectionHead title="The owner portal" coming>
            Owners read their statements and the year-end, approve bills over their limit and see
            repairs at their properties. They sign in on app.occupella.com once owner sign-in
            arrives. Until then, staff record an approval an owner gives by phone, email or in
            person.
          </SectionHead>
        </div>
      </section>
    </SitePageShell>
  );
}
