import { Blocks, SectionHead, SitePageShell, type Block } from "../Site";

// ─────────────────────────────────────────────────────────────────────
// /solutions/leasing: one job, a vacant unit, from the listing to the signed
// lease and the renewal.
//
// ⚠ EVERY LINE IS CHECKED AGAINST THE BOOKS (Occupella-PMS CLAUDE.md:
// listings and the public vacancy page, leads and showings, rental
// applications and what applicants give, screening criteria, lease offers
// and signing on the PMS's own page, renewals, rent_notice.py). It was the
// Buildium assistant's lead pipeline until 2026-11-13.
//
// ⚠ NEVER IMPLIED (founder, 2026-11-13): a screening partner, listing
// syndication, texting. The PMS has a hook for a screening partner and none
// is connected, so the page says Occupella doesn't screen; listings stay on
// the company's own page, and the page says so.
// ─────────────────────────────────────────────────────────────────────

const LISTINGS: Block[] = [
  {
    t: "Your listings page",
    b: "List units that are vacant or coming free, with rent, the day they're available, their size and photos, on a public page of your own. Listings aren't sent to other sites.",
  },
  {
    t: "Leads",
    b: "A prospect's name, how to reach them, the unit they asked about, where they heard of you and when they want to move in.",
  },
  {
    t: "Showings",
    b: "Schedule showings of a unit and record how each went: shown, no-show or cancelled.",
  },
];

const APPLICATIONS: Block[] = [
  {
    t: "A link for each unit",
    b: "Applicants apply through the unit's link or its listing, and follow their application with a status link of their own. No login.",
  },
  {
    t: "What the form asks",
    b: "A phone, a current address, a previous landlord, an employer, an emergency contact, proof of income, the household, animals and vehicles. Never a Social Security number or a birth date.",
  },
  {
    t: "Your criteria, in writing",
    b: "Write your company's screening criteria once, and every applicant sees them on the application.",
  },
  {
    t: "Decisions",
    b: "Approve, approve on conditions or reject, or record that the applicant withdrew. Occupella doesn't screen applicants.",
  },
];

const LEASES: Block[] = [
  {
    t: "Draft leases",
    b: "From an approved application, a draft lease with the rent, deposit and up to ten monthly fees or credits, on your own PDF or a lease template filled from its terms.",
  },
  {
    t: "Signing",
    b: "Each signer gets a link of their own, agrees to sign electronically, opens the lease and signs with a typed name or a drawn signature. Guarantors sign too.",
  },
  {
    t: "The certificate",
    b: "Every lease signed on Occupella's page has a signing certificate showing each signer's steps.",
  },
  {
    t: "It becomes the lease",
    b: "Once everyone has signed, it becomes the lease on its first day, with its tenants, the deposit it asked and its monthly charges.",
  },
];

export default function Leasing() {
  return (
    <SitePageShell
      active="solutions"
      title="Leasing, from the listing to the signed lease"
      lede={
        <>
          List a unit, take applications through its link and send the lease to sign on
          Occupella&rsquo;s own signing page. Renewals are tracked 90 days out.
        </>
      }
    >
      <section className="lp-section" style={{ paddingTop: 72 }}>
        <div className="lp-wrap">
          <SectionHead title="Listings, leads and showings" />
          <Blocks items={LISTINGS} cols={3} />
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <SectionHead title="Applications">
            The form asks nothing a fair housing law protects.
          </SectionHead>
          <Blocks items={APPLICATIONS} />
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <SectionHead title="Leases, signed on Occupella's own page" />
          <Blocks items={LEASES} />
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <SectionHead title="Renewals">
            Leases ending in the next 90 days, with where each renewal stands: none, drafted,
            sent, signed or renewed. Before a rent increase, Occupella warns when the
            property&rsquo;s state asks for longer written notice, for the five states it knows so
            far. A lease whose term runs out goes month to month at the same rent.
          </SectionHead>
        </div>
      </section>
    </SitePageShell>
  );
}
