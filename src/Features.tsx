import { Blocks, Checks, SectionHead, SitePageShell, type Block } from "./Site";

// ─────────────────────────────────────────────────────────────────────
// /features — what Occupella does, in detail.
//
// ⚠ EVERY LINE ON THIS PAGE IS A CLAIM SOMEBODY WILL TEST WITHIN TEN MINUTES
// OF READING IT. The source is the free PMS the hosted product is built on:
// Occupella-PMS, whose CLAUDE.md lists what is built and the rule behind each
// line (founder, 2026-11-13: "read what is really built"). A capability is
// listed as working only if a staff member can reach it on
// app.occupella.com/books today. Anything else carries the Coming chip:
//   · online rent payments and autopay (bank first, then card),
//   · owner and tenant sign-in, so everything the portals do,
//   · the assistant reading the books and proposing drafts.
//
// ⚠ THE SPECIFICS ARE THE POINT (founder direction, 2026-09-04: "get nitty
// gritty"). Replace a specific with a better specific, never with an
// adjective.
//
// ⚠ NOT CLAIMED, each deliberately:
//   · Any email the PMS sends by itself (reminders, late notices, statements,
//     receipts). The hosted books send email only once PMS_EMAIL_SENDER is set
//     on Render, which is NOT VERIFIED.
//   · Screening. The PMS has a hook for a screening partner and none is
//     connected; the leasing section says Occupella doesn't screen.
//   · Texting, listing syndication, HOA management, bank feeds, 1099 e-filing,
//     mailing, renters insurance sales, credit reporting. None is offered,
//     and the wording near each neighbour (listings, statements, 1099s,
//     reconciliation, insurance) says so rather than leave it implied.
//   · Per-state rules beyond the two the books apply: the rent increase
//     notice for five states (src/pms/rent_notice.py) and the deposit due
//     date on the strictest deadline found.
//
// ⚠ The section ids (trust-accounting, rent, bills-and-owners, month-end,
// ai-assistant) are link targets for the site menu. nav.test.tsx fails if one
// is renamed without the menu.
// ─────────────────────────────────────────────────────────────────────

const css = `
  .ft-band { margin-top: clamp(80px, 10vw, 128px); padding: clamp(64px, 8vw, 104px) 0; background: var(--band); }
  .ft-band .lp-block { border-top-color: rgba(14, 22, 32, 0.12); }
`;

const TRUST: Block[] = [
  {
    t: "Each kind of money in its own account",
    b: "Tenants' security deposits sit in a security deposit trust account and everything else you hold in an operating one. A posting into the wrong kind is refused.",
  },
  {
    t: "Every account ties out",
    b: "On every posting, a trust bank account's cash must equal what it holds for owners, prepaid rent, deposits, vendors and your company's fees, or the posting doesn't go through.",
  },
  {
    t: "A ledger that's never rewritten",
    b: "Nothing is edited or deleted. A mistake is fixed with a reversing entry, and every change is logged with the staff member who made it.",
  },
  {
    t: "Closed months stay closed",
    b: "An approved month-end closes its account through that day, so a late correction goes in the next open month. A closed year takes nothing dated in it.",
  },
  {
    t: "Your fees out of trust on time",
    b: "Fees you've earned are listed with the last day to take them out of trust: 25 days after the oldest, the strictest state deadline we found.",
  },
  {
    t: "Reserves and shares",
    b: "Each owner's reserve stays in the account when bills and draws are paid. A property owned in shares splits payments and bills by them, to the cent.",
  },
];

const RENT: Block[] = [
  {
    t: "The rent roll",
    b: "Every lease, current, upcoming, ended or owing, with days left, rent, market rent, deposits and balance, a page at a time.",
  },
  {
    t: "Rent posts by itself",
    b: "Each night, rent and monthly charges such as pet rent or parking post on their due day, prorated by the day when a lease starts or ends mid-month. A due day can be any day from the 1st to the 28th.",
  },
  {
    t: "Late fees and NSF fees",
    b: "Each property's late fee terms: grace days, a flat fee, a percent of what's unpaid and a cap. A rent still open when its grace ends gets one late fee. A returned payment is charged the NSF fee once.",
  },
  {
    t: "Payments and receipts",
    b: "Record a check, money order, EFT or cash, or a bank's file of many. A payment pays rent before other charges, anything over is prepaid rent, and each one has a PDF receipt.",
  },
  {
    t: "Leases and e-signing",
    b: "Draft a lease on your own PDF or a template filled from its terms. Each signer agrees to sign electronically and signs on Occupella's own page, and the lease keeps a signing certificate.",
  },
  {
    t: "Renewals and holds",
    b: "A lease whose term runs out goes month to month at the same rent. When you file an eviction, a payment hold keeps payments from being applied until someone accepts them.",
  },
];

const BILLS: Block[] = [
  {
    t: "Bills",
    b: "Enter a bill once per vendor reference, split across expense accounts or shared across properties. It holds its amount in the owner's account until it is paid, and reads Short when the owner can't cover it.",
  },
  {
    t: "Owner approvals",
    b: "A bill over the owner's approval limit waits for their approval. Staff record an approval given by phone, email or in person, naming who took it.",
  },
  {
    t: "Paying bills",
    b: "Pay several bills at once, by check with its number or by ACH, all or none. Pay part of a bill when that is what was agreed.",
  },
  {
    t: "Owner draws",
    b: "Pay owners what is above their reserve and unpaid bills, several at once. On your draw day the nightly run prepares each owner's draw, and nothing is paid until you approve it.",
  },
  {
    t: "ACH files and checks",
    b: "Occupella writes the NACHA file to upload to your bank, and checks to print on pre-printed stock, numbered on. Your bank moves the money; Occupella records it.",
  },
  {
    t: "Management fees",
    b: "Each owner's agreement sets a percent of rent collected, a minimum and a flat fee. Collect fees by hand, or have the nightly run take last month's by itself.",
  },
];

const MONTH_END: Block[] = [
  {
    t: "Bank reconciliation",
    b: "Import the statement file you download from your bank, CSV or OFX, match its lines to the books, and approve. One person prepares it and another approves it.",
  },
  {
    t: "Three-way reconciliation",
    b: "The bank's balance, the book balance and what each owner, tenant and vendor holds, side by side, with what hadn't cleared listed.",
  },
  {
    t: "Owner statements",
    b: "Each owner's statement for any period, an income statement by Schedule E line, and the year-end summary with the year's 1099-MISC rents.",
  },
  {
    t: "1099 summary",
    b: "What each vendor was paid in a year, against the IRS threshold, for your 1099s. Occupella files nothing with the IRS.",
  },
  {
    t: "Reports",
    b: "Rent roll, delinquency, balance sheet, cash flow, general ledger, trial balance, budget against actual, vacancy and more, each on screen and as CSV, Excel or PDF.",
  },
  {
    t: "Your data, whole",
    b: "Download the ledger as CSV files, or every record, document and signed lease in one zip. Journal entries export to QuickBooks Desktop and Online.",
  },
];

// The section head carries the Coming chip for all three.
const PORTALS: Block[] = [
  {
    t: "For owners",
    b: "Their properties, units and who rents each, statements and the year-end, bills waiting for their approval, repairs and documents.",
  },
  {
    t: "For tenants",
    b: "Their balance and ledger, the lease and its documents, repair requests with photos, renters insurance and a notice to move out.",
  },
  {
    t: "Messages and announcements",
    b: "Owners and tenants write to your company from the portal, and you post announcements to one property's tenants or all of them.",
  },
];

const MAINTENANCE: Block[] = [
  {
    t: "Work orders",
    b: "Open one for a property or a unit with its priority, what's wrong and the day it's due. Assign a vendor, schedule a visit window and close it, each step kept in order.",
  },
  {
    t: "Vendors without a login",
    b: "Send a vendor a link to the work orders assigned to them. They schedule the visit or say the work is done, and the timeline marks it as theirs.",
  },
  {
    t: "Insurance and W-9s",
    b: "Keep each vendor's W-9 and insurance policies. A vendor whose insurance ran out can't be assigned new work.",
  },
  {
    t: "Recurring jobs",
    b: "A job that comes back every 1 to 12 months opens by itself on its day, with its vendor and priority.",
  },
  {
    t: "From the job to the bill",
    b: "Create the vendor's bill from the work order, or charge the tenant a fee for damage they caused.",
  },
  {
    t: "Tenant requests",
    coming: true,
    b: "Tenants file repair requests from their portal, with the kind of repair, where in the unit and photos.",
  },
];

const LEASING: Block[] = [
  {
    t: "Listings",
    b: "List units that are vacant or coming free, with rent, the day they're available and photos, on a public listings page of your own. Listings aren't sent to other sites.",
  },
  {
    t: "Leads and showings",
    b: "Keep prospects and the unit they asked about, schedule showings and record how each went.",
  },
  {
    t: "Applications",
    b: "Each unit gets an application link. The form asks for the household, a previous landlord, an employer and proof of income, never a Social Security number or a birth date. Occupella doesn't screen applicants.",
  },
  {
    t: "From approval to lease",
    b: "Turn an approved application into a draft lease with its deposit and monthly charges, send it to sign, and it becomes the lease once everyone has signed.",
  },
  {
    t: "Renewals",
    b: "Leases ending in the next 90 days, with where each renewal stands. Before a rent increase, Occupella warns when the property's state asks for longer written notice (five states so far).",
  },
  {
    t: "Move-out and deposits",
    b: "Return deposits once a lease ends, keeping what is owed, with an itemized statement letter for each tenant. Each ended lease shows the day its deposit is due back.",
  },
];

const MORE = [
  "Housing assistance: the authority's share of rent charged to the authority, the tenant charged the rest",
  "Utility bills billed back to tenants by unit, square feet, occupants or submeter",
  "Tax credit units: income limits, income certifications and rent tests",
  "Deposit interest, paid as a rent credit or added to the deposit",
  "Budgets by property and month, beside what happened",
  "Property groups, to narrow every list to part of your portfolio",
  "Notice templates in your own words, filled in from a lease",
  "Staff roles for paying and approving, custom roles by area of work, and named signers on each trust account",
  "Calendar feeds of move-ins, lease ends, visits and bills due",
  "Year close: a finished year locked so nothing is dated in it",
];

const AI: Block[] = [
  {
    t: "Today",
    b: "A chat that works with your Gmail, Google Calendar and Google Drive, the documents you give it and the web.",
  },
  {
    t: "Fair housing guardrails",
    b: "It declines questions that would steer by a protected class, and doesn't offer a workaround after it declines.",
  },
  {
    t: "It can't move money",
    b: "When it works with your books, it can only read them and propose. It can't record a payment, a charge, a bill or a draw.",
  },
  {
    t: "Reading your books",
    coming: true,
    b: "Ask about rent, balances, bills and work orders in plain English, and it answers from your books.",
  },
  {
    t: "Drafts your staff approve",
    coming: true,
    b: "It proposes an email, a notice, a work order or a note. Nothing happens until someone on your staff approves it.",
  },
];

export default function Features() {
  return (
    <SitePageShell
      active="features"
      title="Everything Occupella does"
      lede={
        <>
          The books for a property management company, with trust accounting under every page.
          Occupella is free to use. Anything not on app.occupella.com yet is marked Coming.
        </>
      }
      css={css}
      close={{
        title: "Run your books in Occupella",
        body: "Start free and bring your records over with the switching tool. No card to start.",
      }}
    >
      <section className="lp-section lp-anchor" id="trust-accounting" style={{ paddingTop: 72 }}>
        <div className="lp-wrap">
          <SectionHead title="Trust accounting">
            The rules below are kept by the database itself, on every posting, whoever makes it.
          </SectionHead>
          <Blocks items={TRUST} cols={3} />
        </div>
      </section>

      <section className="lp-section lp-anchor" id="rent">
        <div className="lp-wrap">
          <SectionHead title="Rent, leases and the rent roll">
            Rent and late fees post by themselves every night. You record what comes in.
          </SectionHead>
          <a className="lp-textlink" href="/solutions/delinquency" style={{ display: "inline-block", marginTop: 16 }}>
            Late rent, in detail
          </a>
          <Blocks items={RENT} cols={3} />
        </div>
      </section>

      <section className="ft-band lp-anchor" id="bills-and-owners">
        <div className="lp-wrap">
          <SectionHead title="Bills, owners and draws">
            Each owner&rsquo;s money is tracked from the rent that comes in to the draw that goes
            out.
          </SectionHead>
          <a className="lp-textlink" href="/solutions/owner-reporting" style={{ display: "inline-block", marginTop: 16 }}>
            Owner reporting, in detail
          </a>
          <Blocks items={BILLS} cols={3} />
        </div>
      </section>

      <section className="lp-section lp-anchor" id="month-end">
        <div className="lp-wrap">
          <SectionHead title="Month-end and reports">
            Reconcile each trust bank account against the bank, then read every report from the
            same books.
          </SectionHead>
          <Blocks items={MONTH_END} cols={3} />
        </div>
      </section>

      <section className="lp-section lp-anchor" id="portals">
        <div className="lp-wrap">
          <SectionHead title="Owner and tenant portals" coming>
            The portals are built. Owners and tenants sign in to them on app.occupella.com once
            that sign-in arrives.
          </SectionHead>
          <Blocks items={PORTALS} cols={3} />
        </div>
      </section>

      <section className="lp-section lp-anchor" id="maintenance">
        <div className="lp-wrap">
          <SectionHead title="Maintenance, work orders and vendors" />
          <a className="lp-textlink" href="/solutions/maintenance" style={{ display: "inline-block", marginTop: 16 }}>
            Maintenance, in detail
          </a>
          <Blocks items={MAINTENANCE} cols={3} />
        </div>
      </section>

      <section className="lp-section lp-anchor" id="leasing">
        <div className="lp-wrap">
          <SectionHead title="Leasing, renewals and move-out" />
          <a className="lp-textlink" href="/solutions/leasing" style={{ display: "inline-block", marginTop: 16 }}>
            Leasing, in detail
          </a>
          <Blocks items={LEASING} cols={3} />
        </div>
      </section>

      <section className="lp-section lp-anchor" id="more">
        <div className="lp-wrap">
          <SectionHead title="Also in the books" />
          <Checks items={MORE} />
        </div>
      </section>

      <section className="lp-section lp-anchor" id="switching">
        <div className="lp-wrap">
          <SectionHead title="Switching from another system">
            The switching tool brings your roster, open charges, unpaid bills and opening
            balances over from CSV files, and keeps your old system&rsquo;s history beside the
            books.
          </SectionHead>
          <a className="lp-textlink" href="/integrations" style={{ display: "inline-block", marginTop: 24 }}>
            How switching works →
          </a>
        </div>
      </section>

      <section className="ft-band lp-anchor" id="ai-assistant">
        <div className="lp-wrap">
          <SectionHead title="The AI assistant">
            A paid add-on. Everything above works without it.
          </SectionHead>
          <a className="lp-textlink" href="/pricing#ai-assistant" style={{ display: "inline-block", marginTop: 16 }}>
            What it costs
          </a>
          <Blocks items={AI} cols={3} />
        </div>
      </section>
    </SitePageShell>
  );
}
