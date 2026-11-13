import { Blocks, SectionHead, SitePageShell, type Block } from "../Site";

// ─────────────────────────────────────────────────────────────────────
// /solutions/delinquency: one job, late rent, from the due date to the late
// fee and the payment.
//
// ⚠ EVERY LINE IS CHECKED AGAINST THE BOOKS (Occupella-PMS CLAUDE.md, the
// rent automation, rent first, rent work, payment files and payment holds
// rules; trust_report_delinquency's columns: current, 1-30, 31-60, 61-90,
// over 90). It was the Buildium assistant's page until 2026-11-13.
//
// ⚠ NOT CLAIMED: rent reminders and late notices by email. The books write
// them only while the server sends email, which is NOT VERIFIED on the hosted
// app. Texting a tenant is not offered. Online payments and autopay carry the
// Coming chip.
// ─────────────────────────────────────────────────────────────────────

const RUN: Block[] = [
  {
    t: "Each property's terms",
    b: "Grace days, a flat fee, a percent of what is unpaid and a cap, in force from a day you choose. New terms are a new row, so earlier fees keep theirs.",
  },
  {
    t: "Due days besides the first",
    b: "A lease can be due on any day from the 1st to the 28th, and its grace period counts from that day.",
  },
  {
    t: "Nothing charged twice",
    b: "Rent posts once per lease and due date. An admin can run the night's posting by hand from the rent roll, and running it again charges nothing new.",
  },
  {
    t: "Waive with a reason",
    b: "Waive a charge, or part of one, from its menu, with why and who did it. A waiver is a credit linked to the charge, never an edit.",
  },
];

const OWED: Block[] = [
  {
    t: "The delinquency report",
    b: "Each lease's balance as current, 1 to 30, 31 to 60, 61 to 90 and over 90 days late, on screen or as CSV, Excel or PDF.",
  },
  {
    t: "The rent roll",
    b: "Every lease's balance on its row, beside its rent, deposits and days left, with Receive payment on the same page.",
  },
  {
    t: "The lease's ledger",
    b: "Each charge and payment over the days you pick, with the running balance, each line opening the charge or payment behind it.",
  },
];

const PAYMENTS: Block[] = [
  {
    t: "One panel for every payment",
    b: "A check, cashier's check, money order, EFT or cash, from the rent roll or the lease. It pays rent before fees, oldest first, and anything over is prepaid rent.",
  },
  {
    t: "No double entries",
    b: "A payment like one already recorded to the lease (the same amount, day and way) is stopped until you say it is another.",
  },
  {
    t: "Bank and lockbox files",
    b: "Bring in a bank's CSV file of the payments it received. Each line goes to the lease it names, and a line that can't be placed waits for you with the reason.",
  },
  {
    t: "Bounced payments",
    b: "Undo a returned payment in one step: what it paid is owed again, and the property's NSF fee is charged once.",
  },
  {
    t: "Receipts",
    b: "Every payment has a PDF receipt saying who paid, for which home, how much, how, and what it paid of each charge.",
  },
  {
    t: "Payment holds",
    b: "When you file an eviction, place a hold on the lease. Payments dated in the hold aren't applied until someone accepts them, and who accepted is kept.",
  },
];

export default function Delinquency() {
  return (
    <SitePageShell
      active="solutions"
      title="Late rent, from the due date to the late fee"
      lede={
        <>
          Occupella charges rent on its due day, adds the late fee when the grace period ends and
          shows every balance by how late it is. You record the payments, and Occupella applies
          them rent first.
        </>
      }
    >
      <section className="lp-section" style={{ paddingTop: 72 }}>
        <div className="lp-wrap">
          <SectionHead title="Rent and late fees, by themselves">
            Every night, rent and monthly charges post for the day, prorated when a lease starts
            or ends mid-month. A rent still open when its grace period ends gets one late fee,
            under the terms in force on its due date.
          </SectionHead>
          <Blocks items={RUN} />
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <SectionHead title="Who owes what, and how late" />
          <Blocks items={OWED} cols={3} />
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <SectionHead title="Recording what comes in" />
          <Blocks items={PAYMENTS} cols={3} />
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <SectionHead title="Rent paid online" coming>
            Tenants will pay rent online through our payments provider, by bank first and then by
            card, and set up autopay. Occupella will earn a small fee on each payment, shown
            before anyone pays. Until then, you record payments as they come in.
          </SectionHead>
        </div>
      </section>
    </SitePageShell>
  );
}
