# Getting "occupella" to find this Occupella

Written 2026-09-29. The problem: "occupella" is also the name of a Bay Area
activist a cappella group (occupella.org, active since 2011). It has fifteen
years of links and owns the results for the bare name. Google ranks a brand
by the web agreeing on who the brand is, and most of that agreement is
off-site: profiles on sites Google already trusts, each linking back to
occupella.com and describing the company the same way.

## What the site already does

- Every page is prerendered with its own title, description and canonical,
  and every one is in `sitemap.xml` (`npm run build` prints the count).
- The Organization structured data names Oscar Ventures LLC and says
  "Occupella is free property management software with trust accounting, for
  companies that manage rentals for owners" (since 2026-11-13; it said "AI
  software for property managers who use Buildium" before), so a crawler can
  tell the two Occupellas apart.
- `setup.occupella.com` and `helixis-onboarding.vercel.app` redirect to
  occupella.com (`vercel.json`), so Google counts one site instead of three.
- After each production deploy, `.github/workflows/indexnow.yml` tells Bing
  every URL in the sitemap. Bing's index also feeds DuckDuckGo, Yahoo and
  Copilot.
- The home and pricing pages carry SoftwareApplication structured data with
  the pricing page's own prices, so a search engine reads "Occupella" as
  software, not an a cappella group. No rating or review is claimed; Google's rich-result
  test will call it ineligible for stars, which is expected.
- `/llms.txt` summarises the site for AI assistants (ChatGPT, Perplexity,
  Copilot), built from the same route list as the sitemap.
- Two free calculators (`/tools/deposit-deadline`, `/tools/notice-period`)
  and the state-law pages are the pages other sites have a reason to link
  to. The home page links all three.

## What only you can do, in order of payoff

Each one takes 10 to 30 minutes. After each, send me the profile URL and I'll
add it to `SAME_AS` in `src/seo/head.ts`. That list tells Google the profiles
and the site are the same company.

1. **Google Search Console.** Add occupella.com as a *Domain* property
   (verify with a DNS TXT record at your registrar). Submit
   `https://occupella.com/sitemap.xml`. Then use URL Inspection on
   `https://occupella.com/` and click Request indexing. This is the
   single biggest step: it's how Google learns the pages exist today rather
   than in weeks.
2. **Bing Webmaster Tools.** Sign in and choose "Import from Google Search
   Console". It takes two minutes once step 1 is done.
3. **LinkedIn company page.** Company pages usually rank in the top three
   for a company name. Use the copy below and the logo `public/icon-512.png`.
4. **Crunchbase.** A free organization profile. Crunchbase feeds a lot of
   the web's company data.
5. **G2 and Capterra.** Free vendor listings, category "Property Management
   Software". One Capterra listing also appears on GetApp and Software
   Advice.
6. **YouTube.** A channel named Occupella, with a tour of the books uploaded
   as "Occupella product tour". Link occupella.com in the channel and the
   video description. Videos show up in brand results as their own block.
   (`public/demo/product-tour.mp4` is the Buildium assistant's tour, from
   before 2026-11-13; it no longer shows the product.)
7. **Product Hunt.** A launch day gives one strong link and a spike of
   branded searches, which Google notices. Do it after 1 to 6, so the
   searches land on something.
8. **Smaller directories:** SaaSHub, AlternativeTo (as an alternative to
   Buildium and other property management systems), BetaList.

Not recommended:
- **Wikipedia or Wikidata.** Both require independent press coverage, and a
  self-made entry gets deleted.
- **Calling Buildium a partner anywhere.** Since 2026-11-13 Occupella
  doesn't connect to Buildium at all: say "switch from Buildium". The site's
  footer says Occupella is not affiliated with Buildium, and every profile has
  to agree.

## Copy to paste

Use the same words everywhere. Consistency is the signal.

**Name:** Occupella

**Website:** https://occupella.com

**Company:** Oscar Ventures LLC

**Category:** Property Management Software

(Rewritten 2026-11-13 for the one product: the books, free to use, with the
AI assistant as a paid add-on. Profiles made with the old copy say "AI
assistant for property managers who use Buildium" and need the same change.)

**Tagline (under 60 characters):**
Free property management software with trust accounting

**Short description (under 160 characters):**
The rent roll, leases and e-signing, bills, owner draws, month-end and owner
statements, with trust accounting under it all. Free to use.

**Long description:**
Occupella is property management software for companies that manage rentals
for owners. It keeps the books: trust accounting for the money you hold, the
rent roll, leases signed on its own signing page, rent and late fees posted
by themselves every night, bills and owner approvals, owner draws by ACH file
or check, month-end bank reconciliation, owner statements and 1099
summaries, maintenance and work orders, vendors and leasing.

Every trust bank account is checked on every posting, nothing in the ledger
is edited or deleted, and every change is logged with who made it.

Companies switching from Buildium bring their records over from CSV files
with its switching tool.

Occupella is free to use. Online rent payments are coming, with a small fee
on each one shown before anyone pays. The AI assistant is a paid add-on.

**Pricing:** Free to use. AI assistant add-on: Starter $50/month, Pro $199
per person/month, Scale $500/month, with a 14-day trial and no card.

**Screenshots:** none of the books yet. TODO(brandon): the old frames in
`public/shots/gallery/` show the Buildium assistant; don't use them.

TODO(brandon): the city and state, and the year founded. Most of these forms
ask for both. Nothing above states them, because the site doesn't.

## What to expect

- **Within days of step 1:** searches like "occupella buildium", "occupella
  ai" and "occupella property management" should find occupella.com, because
  nothing else matches them.
- **The bare word "occupella":** occupella.org will likely hold the top spot
  for a while. What moves it is the profiles above linking to occupella.com,
  and people searching for the name and clicking the site. There is no
  on-page fix that outranks fifteen years of links on its own.
- **How to measure:** the Search Console Performance report, filtered to
  queries containing "occupella". NOT VERIFIED from here: this container
  can't run a Google search, so none of the rankings above were measured.
