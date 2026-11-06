# The one-product legal drafts

Drafts of Occupella's Terms of Service, Privacy Policy and Data Processing Agreement for the
one product (AgenticHelixis `docs/decisions/ADR-one-product.md`, the founder's decisions of
2026-11-05): Occupella built on the free PMS, with the books, the owner and tenant portals,
online rent and the AI built in.

- **Written in house, not reviewed by a lawyer.** The founder decided on 2026-11-05 that
  Occupella's legal documents are drafted in house with no lawyer's review. Nothing here says
  otherwise, and nothing should be published claiming a review that didn't happen.
- **Not published.** The live pages (`/terms`, `/privacy`, `/sms`, from `src/Legal.tsx`)
  describe the product running today: the Buildium and Rentvine connectors. They stay until the
  switch-over (the ADR's phase 6), when these drafts replace them in `src/Legal.tsx`. Publishing
  either set early would misstate what Occupella does.
- **`/sms` is unchanged.** Its consent wording is quoted by the carrier registration, so it is
  changed only with the campaign (`src/Legal.tsx`'s own warning).

| File | What it is |
|---|---|
| `terms.md` | Terms of Service: the company's agreement with Occupella. |
| `privacy.md` | Privacy Policy: what Occupella collects as itself, and how it handles what it processes for a company. |
| `dpa.md` | Data Processing Agreement: Occupella as the company's processor (service provider) for its tenants', owners', applicants' and vendors' data. |

## Blanks to fill

Each blank reads `[[LIKE THIS]]`. `grep -n "\[\[" docs/legal/*.md` lists them.

| Blank | What goes there | What the live site says today |
|---|---|---|
| `[[LEGAL NAME]]` | The company that operates Occupella | Oscar Ventures LLC |
| `[[STATE]]` | Its state of formation, and the law the terms follow | not stated |
| `[[MAILING ADDRESS]]` | Its mailing address for notices | not stated |
| `[[CONTACT EMAIL]]` | Where people write | team@occupella.com |
| `[[PLANS AND PRICES]]` | The one product's plans | Starter, Pro, Scale, priced by answers (live `/terms`) |
| `[[RETENTION]]` | How long a closed company's books are kept | not stated |
| `[[DATA LOCATION]]` | Where the databases and servers run | not stated; NOT VERIFIED from here |
| `[[BACKUPS]]` | The books' backups | not stated |
| `[[NOTICE DAYS]]` | Days of notice before a new subprocessor | not stated |
| `[[BREACH HOURS]]` | Hours to tell a company of a breach | not stated |
| `[[EFFECTIVE DATE]]` | The day these take effect | — |

## What every statement here rests on

Each claim about the product is written from the code, not from memory. Where it describes
the books, it is what `pms/CLAUDE.md` (the PMS's own rules) and its code say today; where it
describes sign-in, it holds both before and after phase 4 (one login). Check these when
publishing, as the product will have moved:

- the AI's database role can read the books and propose drafts, and nothing else
  (`pms/tests/test_privileges.py`, `AI_WRITES`);
- bank account numbers, tax IDs, payment keys and webhook secrets are sealed with AES-GCM under
  a key the server holds, and only their last four are shown (`pms/src/pms/sealed.py`);
- tenants pay online on Stripe's page, and Occupella never sees their bank account number
  (`pms/src/pms/payments.py`);
- trust records are append-only and every write is in the audit log (`pms/CLAUDE.md`, "Audit");
- a signature keeps the signer's name, address, browser, time and the lease's SHA-256
  (`pms/CLAUDE.md`, "Lease offers").
- NOT VERIFIED from here, to confirm at publication: that the database provider (Supabase)
  encrypts data at rest, as its own security page says; where the databases and servers run
  (`[[DATA LOCATION]]`); and whether the one login (phase 4) asks staff for a second step, as
  the PMS's own sign-in does today. The drafts make no claim on the last.

The subprocessor list (`src/legal/subprocessors.tsx`) is shared by `/privacy` and `/security`
and is checked against AgenticHelixis's code. At the switch-over its Supabase entry
("your synced Buildium data") becomes the books, and a mail sender joins it if the books' email
goes through one.
