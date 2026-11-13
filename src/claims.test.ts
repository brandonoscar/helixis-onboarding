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
 */
import { describe, expect, it } from 'vitest'

import { render } from './entry-server'
import { DEMO_URL } from './lib/urls'
import { OFFER } from './Pricing'
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
const shown = new Map(PAGES.map((p) => [p, text(render(p))]))

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
  for (const p of PRODUCT) {
    it(`${p} offers none of them`, () => {
      const t = shown.get(p)!
      for (const [what, re] of NEVER) expect(t, `${p} implies ${what}`).not.toMatch(re)
    })
  }
})

describe('what is coming is marked Coming', () => {
  // Online rent payments, owner and tenant sign-in on app.occupella.com, and
  // the assistant reading the books. A page that names one must carry the
  // Coming chip, so it can't be read as working today.
  const COMING = /online rent payments?|pay rent online|rent paid online|owner sign-in|tenant sign-in|owner and tenant sign-in|reads? your books|reading your books/i
  const mentions = PAGES.filter((p) => COMING.test(shown.get(p)!))

  it('found pages that mention them', () => {
    expect(mentions).toEqual(expect.arrayContaining(['/', '/features', '/pricing']))
  })

  for (const p of mentions) {
    it(`${p} marks them Coming`, () => {
      expect(render(p)).toContain('class="lp-coming"')
    })
  }
})

describe('the online payment fee', () => {
  it('is written in words, with no figure, until one is set', () => {
    const fee = OFFER.find((o) => o.key === 'payments')!
    expect(fee.coming).toBe(true)
    for (const words of [fee.fig, fee.unit, fee.forWho]) expect(words).not.toMatch(/\d/)
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
