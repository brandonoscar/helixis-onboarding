import { Blocks, Checks, SectionHead, SitePageShell, type Block } from "../Site";

// ─────────────────────────────────────────────────────────────────────
// /integrations/buildium: switching from Buildium to Occupella.
//
// ⚠ IT WAS "Occupella for Buildium" UNTIL 2026-11-13: what the Buildium
// connector read and changed, and the API key it needed. The connector left
// the product (AgenticHelixis docs/decisions/ADR-one-product.md, decision 4:
// "a company comes over from Buildium through the files its property manager
// exports, read by the PMS's switching tool, never through a vendor's API").
// This page talks to a Buildium user as somebody switching, not as somebody
// adding a connector. The old /docs/buildium-api-setup guide redirects here
// (vercel.json).
//
// ⚠ NOTHING HERE NAMES A BUILDIUM REPORT OR ITS COLUMNS. The switching tool
// reads CSV files with the columns it names in the app (Occupella-PMS
// src/pms/api/switching.py), not Buildium's own export layout, and nobody has
// checked which Buildium exports carry which columns. TODO(brandon): once a
// real switch has been done, name the Buildium exports to start from.
//
// ⚠ "Switching from", never "partner" or "integrates with". The footer's
// not-affiliated line stays.
// ─────────────────────────────────────────────────────────────────────

const STEPS: Block[] = [
  {
    t: "Pick a cutover day",
    b: "The day Occupella's books start. Occupella charges no rent due before it, and each trust bank account's first reconciliation starts there.",
  },
  {
    t: "Export your records from Buildium",
    b: "Owners, vendors, properties, units, tenants, leases, what tenants still owe and the bills not yet paid, each as a CSV file with the columns the switching tool lists.",
  },
  {
    t: "Bring them in, a file at a time",
    b: "Each file goes in whole or not at all, and a line that can't go in says which line and why. Files saved by Excel on Windows read as they are.",
  },
  {
    t: "Open your trust bank accounts",
    b: "Bring in what each account held on the cutover day, checked against Buildium's book cash, then carry over what the bank hadn't cleared and sign off the tie-out.",
  },
];

const AFTER = [
  "Rent, monthly charges and late fees post by themselves every night, under each property's terms",
  "Every trust bank account is checked on every posting, so its cash always equals what it holds",
  "Bills over an owner's approval limit wait for the owner before they are paid",
  "Owner draws go out by an ACH file you upload to your bank, or by checks you print",
  "Month-end is prepared by one person and approved by another",
  "Your Buildium history stays readable beside the books, under Before the switch",
];

export default function BuildiumIntegration() {
  return (
    <SitePageShell
      active="resources"
      title="Switching from Buildium"
      lede={
        <>
          Bring your company from Buildium to Occupella with CSV files you export. There is no API
          key to create, and nothing changes in your Buildium account.
        </>
      }
      close={{
        title: "Start free, then bring your files",
        body: "Make your account, add your trust bank accounts and bring your Buildium records in. No card to start.",
      }}
    >
      <section className="lp-section" style={{ paddingTop: 72 }}>
        <div className="lp-wrap">
          <SectionHead title="How it goes" />
          <Blocks items={STEPS} />
          <a className="lp-textlink" href="/integrations" style={{ display: "inline-block", marginTop: 32 }}>
            Every file the switching tool reads
          </a>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <SectionHead title="What runs differently after">
            The same work, in books that keep trust accounting rules on every posting.
          </SectionHead>
          <Checks items={AFTER} />
        </div>
      </section>

      <section className="lp-section" id="questions">
        <div className="lp-wrap">
          <SectionHead title="Questions about your files?">
            Email <a href="mailto:team@occupella.com">team@occupella.com</a> with what
            you&rsquo;re bringing over. Occupella is not affiliated with Buildium.
          </SectionHead>
        </div>
      </section>
    </SitePageShell>
  );
}
