# Getting "occupella" to find this Occupella

Written 2026-09-29. The problem: "occupella" is also the name of a Bay Area
activist a cappella group (occupella.org, active since 2011). It has fifteen
years of links and owns the results for the bare name. Google ranks a brand
by the web agreeing on who the brand is, and most of that agreement is
off-site: profiles on sites Google already trusts, each linking back to
occupella.com and describing the company the same way.

## What the site already does

- Every page is prerendered with its own title, description and canonical,
  and all 69 are in `sitemap.xml`.
- The Organization structured data names Oscar Ventures LLC and says
  "Occupella is AI software for property managers who use Buildium", so a
  crawler can tell the two Occupellas apart.
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
6. **YouTube.** A channel named Occupella, with
   `public/demo/product-tour.mp4` uploaded as "Occupella product tour". Link
   occupella.com in the channel and the video description. Videos show up
   in brand results as their own block.
7. **Product Hunt.** A launch day gives one strong link and a spike of
   branded searches, which Google notices. Do it after 1 to 6, so the
   searches land on something.
8. **Smaller directories:** SaaSHub, AlternativeTo (as an alternative to
   other Buildium add-ons), BetaList.

Not recommended:
- **Wikipedia or Wikidata.** Both require independent press coverage, and a
  self-made entry gets deleted.
- **Calling Buildium a partner anywhere.** Say "works with Buildium" or
  "integrates with Buildium". The site's footer says Occupella is not
  affiliated with Buildium, and every profile has to agree.

## Copy to paste

Use the same words everywhere. Consistency is the signal.

**Name:** Occupella

**Website:** https://occupella.com

**Company:** Oscar Ventures LLC

**Category:** Property Management Software

**Tagline (under 60 characters):**
AI assistant for property managers who use Buildium

**Short description (under 160 characters):**
Occupella connects to Buildium, reads your work orders, late rent and lease
events, and drafts the reply, the work order or the owner update for you.

**Long description:**
Occupella is an AI assistant for property management companies that run on
Buildium. You connect it with a Buildium API key, and it keeps a synced copy
of your properties, units, leases, tenants, owners, vendors, bills and work
orders.

When something happens in Buildium, such as a maintenance request, it pulls
the history around it and drafts what comes next: the reply to the resident,
the work order, the follow-up task. You can ask it questions in plain
English, like "who is behind on rent?" or "what do we owe vendors?", and get
a table built from your own data. It sends email from your own Gmail, checks
Google Calendar and reads the documents you keep in Google Drive.

It declines fair housing questions that turn on a protected class, and it
won't offer school ratings or crime statistics as a workaround.

Plans start at $50 a month, and every plan starts with a 14-day free trial
with no card.

**Pricing:** Starter $50/month. Pro $199 per person/month. Scale $500/month.
14-day free trial, no card.

**Screenshots:** `public/shots/gallery/*.jpg`, the same frames as
occupella.com/screenshots.

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
