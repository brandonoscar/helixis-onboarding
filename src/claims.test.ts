// @vitest-environment node
/**
 * What the site claims, read from the prerendered pages.
 *
 * ⚠ SINCE 2026-11-13 OCCUPELLA IS THE BOOKS (founder; AgenticHelixis
 * docs/decisions/ADR-one-product.md): property management software, free to
 * use, with the AI assistant as a paid add-on. The Buildium connector left
 * the product, and some things are coming while others are not offered at
 * all. Each rule below is one of the founder's, checked on the rendered HTML,
 * the same bytes a visitor and a crawler get, so a comment explaining a rule
 * can neither satisfy it nor trip it.
 *
 * Re-pointed from textingStatus.test.ts, which pinned "Texting: not available
 * yet" on three pages. Texting is no longer offered or implied at all, so the
 * label went and this checks that no page offers it.
 *
 * Re-pointed again for the founder's copy of 2026-11-22: what isn't ready sits
 * in one labelled part of a page, "Not available yet" (marked data-not-yet),
 * instead of a Coming chip beside it. The portals keep their Coming chips
 * until PORTALS_LIVE (src/lib/releaseState.ts); releaseState.test.tsx renders
 * the pages with each flag on and off.
 */
import { describe, expect, it } from 'vitest'

import { render } from './entry-server'
import { PORTALS_LIVE } from './lib/releaseState'
import { DEMO_URL } from './lib/urls'
import { OFFER, PAYMENTS_NOTE, PLANS } from './Pricing'
import { MARKETING_ROUTES } from './seo/routes'

/** Visible text only: tags dropped, entities and whitespace collapsed. */
function text(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
}

/**
 * The pages that speak for the product. Left out: the legal pages, which
 * another change publishes (src/legal/publish.ts) and which carriers read as
 * written, and blog posts, which are dated engineering notes about
 * Buildium's API, not claims about Occupella.
 */
const LEGAL = new Set(['/terms', '/privacy', '/sms', '/dpa'])
const PAGES = MARKETING_ROUTES.filter((r) => !LEGAL.has(r.path) && r.name !== 'blog_post').map((r) => r.path)
const html = new Map(PAGES.map((p) => [p, render(p)]))
const shown = new Map(PAGES.map((p) => [p, text(html.get(p)!)]))

/** The HTML of each part of a page marked data-not-yet ("Not available yet"). */
function notYetParts(page: string): string[] {
  const parts: string[] = []
  const open = /<(\w+)\b[^>]*\bdata-not-yet\b[^>]*>/g
  for (let m = open.exec(page); m; m = open.exec(page)) {
    const end = page.indexOf(`</${m[1]}>`, m.index)
    parts.push(page.slice(m.index, end === -1 ? undefined : end))
  }
  return parts
}
/** What a page says in its Not available yet parts. */
const notYet = (p: string) => notYetParts(html.get(p)!).map(text).join(' ')
/** What a page says everywhere else. */
const outsideNotYet = (p: string) => {
  let page = html.get(p)!
  for (const part of notYetParts(page)) page = page.replace(part, ' ')
  return text(page)
}
/** What a page says above its footer. */
const body = (p: string) => text(html.get(p)!.split('<footer')[0])
/** What the footer says (the same on every page). */
const footer = (p: string) => text(html.get(p)!.split('<footer')[1] ?? '')

describe('reading the pages at all', () => {
  it('found the pages to judge, each with real copy', () => {
    expect(PAGES.length).toBeGreaterThan(60)
    for (const p of ['/', '/features', '/pricing', '/integrations', '/integrations/buildium']) {
      expect(PAGES).toContain(p)
      expect(shown.get(p)!.length, `${p} rendered nothing`).toBeGreaterThan(500)
    }
  })
})

describe('the Buildium connector is gone', () => {
  for (const p of PAGES) {
    it(`${p} sends nobody to connect Buildium`, () => {
      const t = shown.get(p)!
      expect(t).not.toMatch(/connect (your )?buildium/i)
      expect(t).not.toMatch(/buildium (api )?key|client secret/i)
      expect(t).not.toMatch(/for buildium (users|property managers)|works with buildium/i)
      // The call to action is "Start free": the product is free, and only the
      // AI add-on has a trial.
      expect(t).not.toMatch(/start (your )?free trial/i)
    })
  }

  it('talks to Buildium users as people switching', () => {
    expect(shown.get('/integrations/buildium')).toMatch(/Switching from Buildium/)
    expect(shown.get('/')).toMatch(/Switching from Buildium/)
  })
})

describe('nothing that is not offered is implied', () => {
  // The founder's list (2026-11-13): a real tenant-screening partner,
  // texting, listing syndication, HOA management, bank feeds, 1099 e-filing,
  // mailing, renters-insurance sales, credit reporting, SOC 2.
  const NEVER: [string, RegExp][] = [
    ['texting', /\btexting\b|\btexts? (a |your |the )?(leads?|tenants?|residents?|owners?)\b|texts and calls|carrier (review|approval)/i],
    ['a screening partner', /screening partner|transunion|experian|equifax|smartmove/i],
    ['listing syndication', /syndicat|zillow|apartments\.com/i],
    ['HOA management', /\bHOAs?\b|homeowners'? association/i],
    ['bank feeds', /bank feeds?\b|bank connection|connect your bank/i],
    ['1099 e-filing', /e-?fil(e|es|ing)\b/i],
    ['mailing', /mailing service|we mail|print and mail/i],
    ['renters insurance sales', /(sell|sells|selling|buy) renters insurance|renters insurance (quote|plan)s?\b/i],
    ['credit reporting', /report(s|ing)? (rent )?to (the )?credit bureaus?|credit reporting/i],
    ['a SOC 2 certification', /SOC 2 (type|certified|compliant|report|audited)/i],
  ]
  // A state's own page is left out of this one check: it quotes that
  // state's law, which may name HOAs or court e-filing. Its closing band is
  // the state laws index's, which is checked.
  const PRODUCT = PAGES.filter((p) => MARKETING_ROUTES.find((r) => r.path === p)!.name !== 'state_law')
  it('judges the product pages', () => {
    expect(PRODUCT.length).toBeGreaterThan(15)
  })
  // Outside a page's "Not available yet" part. In that part a thing may be
  // named only to say it isn't done (the next test).
  for (const p of PRODUCT) {
    it(`${p} offers none of them`, () => {
      const t = outsideNotYet(p)
      for (const [what, re] of NEVER) expect(t, `${p} implies ${what}`).not.toMatch(re)
    })
  }

  it('names one under Not available yet only to say it is not done', () => {
    for (const p of PRODUCT) {
      const t = notYet(p)
      if (/syndicat/i.test(t)) expect(t, p).toMatch(/Listing syndication: listings are on your own public page, not sent to other sites\./)
      if (/screen/i.test(t)) expect(t, p).toMatch(/Tenant screening: Occupella doesn.t screen applicants\./)
      for (const [what, re] of NEVER.filter(([w]) => !['listing syndication', 'a screening partner'].includes(w))) {
        expect(t, `${p} lists ${what} as coming`).not.toMatch(re)
      }
    }
  })
})

describe('what is not available yet is listed under Not available yet', () => {
  // Online rent payments and the assistant reading the books. The pages the
  // founder's copy rewrote list them in their "Not available yet" part; any
  // other page that names one still carries the Coming chip, so neither can
  // be read as working today.
  const PAYMENTS = /online rent payments?|pay rent online|rent paid online/i
  const READS = /reads? your books|reading your books/i
  const mentions = PAGES.filter((p) => PAYMENTS.test(shown.get(p)!) || READS.test(shown.get(p)!))

  it('found pages that mention them', () => {
    expect(mentions).toEqual(expect.arrayContaining(['/', '/features', '/pricing']))
  })

  it('lists online rent payments under Not available yet on the home page, /features and /pricing', () => {
    for (const p of ['/', '/features', '/pricing']) expect(notYet(p), p).toMatch(/online rent payments/i)
  })

  it('lists the assistant reading your books under Not available yet on the home page and /features', () => {
    for (const p of ['/', '/features']) expect(notYet(p), p).toMatch(READS)
  })

  it('heads each of those parts "Not available yet"', () => {
    for (const p of ['/', '/features']) expect(notYet(p), p).toMatch(/^\s*Not available yet/)
    expect(notYet('/pricing')).toMatch(/not available yet/)
  })

  for (const p of mentions) {
    it(`${p} lists them under Not available yet, or marks them Coming`, () => {
      const listed = (PAYMENTS.test(shown.get(p)!) ? PAYMENTS.test(notYet(p)) : true) && (READS.test(shown.get(p)!) ? READS.test(notYet(p)) : true)
      if (!listed) expect(html.get(p)!).toContain('class="lp-coming"')
    })
  }

  it('says card payments come with bank payments, not after them', () => {
    for (const p of PAGES) expect(shown.get(p)!, p).not.toMatch(/bank first/i)
  })
})

describe('the owner and tenant portals', () => {
  // Built, and Coming on app.occupella.com until PORTALS_LIVE.
  const SIGN_IN_ARRIVES = /once (owner |tenant |that )?sign-in arrives/i

  if (PORTALS_LIVE) {
    it('carry no Coming chip and no "once sign-in arrives" anywhere', () => {
      for (const p of PAGES) expect(shown.get(p)!, p).not.toMatch(SIGN_IN_ARRIVES)
      expect(html.get('/')!).not.toContain('class="lp-coming"')
      const portals = html.get('/features')!.split('id="portals"')[1].split('</section>')[0]
      expect(portals).not.toContain('class="lp-coming"')
    })
  } else {
    it('carry the Coming chip on the home page tour', () => {
      const tour = html.get('/')!.split('id="tour"')[1].split('</section>')[0]
      for (const who of ['Owner portal', 'Tenant portal']) {
        expect(tour).toMatch(new RegExp(`${who}<span class="lp-coming">Coming</span>`))
      }
    })

    it('carry the Coming chip on /features, tenant requests too', () => {
      const portals = html.get('/features')!.split('id="portals"')[1].split('</section>')[0]
      expect(portals).toContain('class="lp-coming"')
      expect(html.get('/features')!).toMatch(/Tenant requests<span class="lp-coming">Coming<\/span>/)
    })

    it('carry the Coming chip on the solutions pages that describe them', () => {
      for (const p of ['/solutions/owner-reporting', '/solutions/maintenance']) {
        expect(html.get(p)!, p).toContain('class="lp-coming"')
        expect(shown.get(p)!, p).toMatch(SIGN_IN_ARRIVES)
      }
    })
  }
})

describe('the fixes in the founder\'s copy of 2026-11-22', () => {
  it('prices the add-on in questions, never as a multiple of Starter', () => {
    for (const p of PAGES) expect(shown.get(p)!, p).not.toMatch(/\d\s?[×x] (Starter|usage)/i)
    expect(PLANS.map((p) => p.allowance)).toEqual([
      '150 questions a month, shared',
      '400 questions a month per person',
      '1,200 questions a month, shared',
    ])
  })

  it('promises no reply time', () => {
    for (const p of PAGES) expect(shown.get(p)!, p).not.toMatch(/within one business day/i)
    expect(shown.get('/contact')).toMatch(/A person reads every email\./)
  })

  it('never says the books can\'t drift from the bank or tie out to it', () => {
    for (const p of PAGES) expect(shown.get(p)!, p).not.toMatch(/can.t drift from the bank|tie out to the bank/i)
  })

  it('says Occupella is not affiliated with Buildium on the home page, the switching page and the footer', () => {
    for (const p of ['/', '/integrations/buildium']) expect(body(p), p).toMatch(/Occupella is not affiliated with Buildium\./)
    for (const p of PAGES) expect(footer(p), p).toMatch(/Occupella is not affiliated with Buildium\./)
  })

  it('says switching works from CSV files on the home page, the switching page and the footer', () => {
    for (const p of ['/', '/integrations/buildium']) expect(body(p), p).toMatch(/CSV files/)
    for (const p of PAGES) expect(footer(p), p).toMatch(/Switching from it works from CSV files you export\./)
  })

  it('puts Apache-2.0 in the home page hero', () => {
    const page = html.get('/')!
    const hero = text(page.slice(page.indexOf('class="lp-hero"'), page.indexOf('id="how"')))
    expect(hero).toMatch(/open-source property management software/)
    expect(hero).toMatch(/Apache-2\.0\./)
  })

  it('keeps the billing note on /pricing (the founder\'s decision)', () => {
    expect(shown.get('/pricing')).toMatch(/Billing isn.t switched on yet\. Until it is, the assistant is free to use within these limits\./)
  })

  it('offers no data processing agreement that isn\'t written', () => {
    expect(shown.get('/security')).not.toMatch(/available on request/i)
    expect(shown.get('/security')).toMatch(/We don.t have a published data processing agreement yet\./)
  })

  it('says how the books are tested only with what the PMS\'s CI runs', () => {
    const t = shown.get('/features')!
    expect(t).toMatch(/How the books are tested/)
    // Neither repository's main branch requires checks before a merge
    // (measured 2026-11-22), so no page may say one can't merge.
    for (const p of PAGES) expect(shown.get(p)!, p).not.toMatch(/can.t merge|before it can merge/i)
  })
})

describe('the online payment fee', () => {
  it('is written in words, with no figure, until one is set', () => {
    // Not a card while online payments aren't available: a note under them.
    expect(OFFER.map((o) => o.key)).toEqual(['books', 'ai'])
    for (const words of [PAYMENTS_NOTE.t, PAYMENTS_NOTE.b]) expect(words).not.toMatch(/\d/)
  })

  it('is never given a number on any page', () => {
    for (const p of PAGES) {
      expect(shown.get(p)!, p).not.toMatch(/fee on (each|every|online)[^.]*\d|\d+(\.\d+)?\s?% (fee|per payment)/i)
    }
  })

  it('is shown before anyone pays, on the pricing page', () => {
    expect(shown.get('/pricing')).toMatch(/shown before anyone pays/)
  })
})

describe('"Book a demo"', () => {
  it('ships no button while there is no calendar link', () => {
    // demoLink.test.tsx checks the button appears once DEMO_URL is set.
    if (DEMO_URL) return
    for (const p of PAGES) expect(shown.get(p)!, p).not.toMatch(/book a demo/i)
  })
})
