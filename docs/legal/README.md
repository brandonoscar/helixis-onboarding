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

## Publishing

Publishing all three is one change: set `ONE_PRODUCT_LEGAL_PUBLISHED` to `true` in
`src/legal/publish.ts`. `/terms` and `/privacy` then render `terms.md` and `privacy.md`
(`src/legal/oneProduct.tsx`), `/dpa` renders `dpa.md` and joins the sitemap, and the Privacy
Policy's "*(At publication: ...)*" line becomes the shared subprocessor list. Each draft's
"> Draft ..." note and the "(draft)" in its title are left out of the page. `/sms` stays as it is.

`src/legal/oneProduct.test.tsx` refuses the switch while any `[[BLANK]]` is left. Measured on
2026-11-11 with the switch set to true: every other test passed (391 of 392, the seo and prerender
checks included), so the blanks are all that stand in the way. When it flips, also do the two
items under "Not changed here" below.

## Blanks to fill

Each blank reads `[[LIKE THIS]]`. `grep -n "\[\[" docs/legal/*.md` lists them.
`[[DATA LOCATION]]` is filled. Every other blank is left for the founder. Each row gives a
recommended value and why. **Lawyer** marks a choice a lawyer should make or check, and none has
reviewed these drafts.

| Blank | Recommended | Why | Lawyer |
|---|---|---|---|
| `[[DATA LOCATION]]` | **Filled:** the United States. The app's database and sign-in are on Supabase in AWS us-east-1 (Northern Virginia). The servers and the books' database are on Render in Oregon. | The founder's facts (11/11). The Supabase project `helixis-test` reads region `us-east-1` in Supabase's API (checked 2026-11-11). Render's region is NOT VERIFIED from here: its API needs a workspace chosen first. | |
| `[[LEGAL NAME]]` | Oscar Ventures LLC | The name the live `/terms` and the app's legal pages use today. Check it against the formation filing, spelled exactly. | |
| `[[STATE]]` | The LLC's state of formation, from its articles of organization. | The terms name it as the LLC's state and as the law they follow. Which law and which courts is a choice to check. | **Lawyer** |
| `[[MAILING ADDRESS]]` | A registered agent's or mail service's address that accepts legal mail, not a home address. | The pages are public and the address takes legal notices. | |
| `[[CONTACT EMAIL]]` | team@occupella.com | The address the live pages use, on the domain's Google Workspace mail (its MX), so someone reads it. A privacy@ alias can come later. | |
| `[[EFFECTIVE DATE]]` | The day the switch flips. | There are no paying customers today, so no notice period applies. With customers, give 30 days' notice of a material change. | |
| `[[PLANS AND PRICES]]` | "The plans and prices are those on [Pricing](/pricing) when you subscribe or renew." | Prices live in three places that must change together today (`plans.py`, `Pricing.tsx`, `Legal.tsx`; `src/Pricing.tsx`'s header). A link keeps the terms from drifting. Today's plans are Trial, Starter $50, Pro $199 and Scale $500 a month (`src/Pricing.tsx`). | |
| `[[RETENTION]]` | "We keep a closed company's books, read only, for six years after its agreement ends, then delete them within 30 days. A company may ask in writing for them to be deleted sooner." | Trust records must be kept for years after the fact, six in Oregon by the founder's reading (the strictest state is in the PMS's `docs/law.md`; the Oregon cite is NOT VERIFIED here). Keeping them protects a company that didn't export, and early deletion on request leaves the duty with the company. | **Lawyer** |
| `[[BACKUPS]]` | "Encrypted daily backups in the same region, each kept N days and then deleted." N comes from the Render and Supabase plans in use. | A deletion is only complete once the backups age out, so N has to be the real number. NOT VERIFIED here: the plans' retention. | |
| `[[NOTICE DAYS]]` | 30 | The common figure in processing agreements. It is long enough for a company to object and leave under the DPA's own objection clause. | |
| `[[BREACH HOURS]]` | 72 | A company may owe its own notices within 30 days of discovery: the FTC's Safeguards Rule, 16 CFR 314.4(j), for 500 or more people, and many state laws within 30 to 45. 72 hours leaves it about 27. Whether the Safeguards Rule covers a property manager is a question for counsel. | **Lawyer** |

Also for a lawyer, beyond the blanks: the limitation of liability (`terms.md`, twelve months'
fees); the DPA's processor and service-provider terms under each state's privacy law; and the
statements about e-signing (ESIGN disclosures, in the books' signing page).

## Not changed here

- **AgenticHelixis `frontend/public/legal/*.html`**: the app's own Terms, Privacy, SMS, Billing,
  Subprocessors and Accessibility pages. They are dated August to September 2026, describe the
  Buildium product, and are what the app's sign-in form links to (`LoginForm.tsx`). At the
  switch-over they say something other than these pages. That repo belongs to another session.
- **Sign-up's `tos_version`**: `src/App.tsx` records `TOS_VERSION = "2026-07-05"` with each
  sign-up's acceptance. When the switch flips, it should become the new effective date, so an
  acceptance names the terms it accepted.
- `/sms`: unchanged, as above.

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
and is checked against AgenticHelixis's code. Since 2026-11-11 it names the books' database on
Render, Resend (Amazon SES behind it) for email, and Stripe for rent paid online. At the
switch-over its Supabase entry ("your synced Buildium data") becomes the app's account data.
