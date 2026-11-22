// @vitest-environment node
/**
 * Every line of the founder's copy of 2026-11-22 that turns true later reads
 * one flag in src/lib/releaseState.ts. Here each flag is rendered off and on,
 * and the pages are read as a visitor reads them: off, the true fallback;
 * on, the approved wording. So flipping a flag is a one-line change these
 * tests already cover, and a flag that stops reaching its page fails here.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

import * as live from './lib/releaseState'

type Flags = { [K in keyof typeof live]: boolean }

const OFF: Flags = { BOOKS_LIVE: false, BOOKS_EMAIL_LIVE: false, PORTALS_LIVE: false, CHAT_READS_ONLY: false }

/** Visible text only: tags dropped, entities and whitespace collapsed. */
function text(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;|&rsquo;/g, "'")
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
}

/** The site rendered with these flags (the rest off). */
async function site(flags: Partial<Flags>) {
  vi.resetModules()
  vi.doMock('./lib/releaseState', () => ({ ...OFF, ...flags }))
  const { render } = await import('./entry-server')
  const landing = await import('./Landing')
  return {
    html: (p: string) => render(p),
    shown: (p: string) => text(render(p)),
    tour: landing.TOUR,
  }
}

/** The HTML of the part of a page from `marker` to the end of its section. */
const part = (page: string, marker: string) => page.split(marker)[1]?.split('</section>')[0] ?? ''

afterEach(() => {
  vi.doUnmock('./lib/releaseState')
  vi.resetModules()
})

describe('the flags as shipped', () => {
  it('are all off until their work is done (2026-11-22)', () => {
    expect({ ...live }).toEqual(OFF)
  })
})

describe('BOOKS_LIVE: the hosted books are running [after A]', () => {
  it('off: the hero says self-hosting only, and there is no "use ours"', async () => {
    const s = await site({ BOOKS_LIVE: false })
    expect(s.shown('/')).toContain('Apache-2.0. Run it on your own server with one Docker command.')
    expect(s.shown('/')).not.toMatch(/use ours/i)
  })

  it('on: the hero and Open source add the hosted copy', async () => {
    const s = await site({ BOOKS_LIVE: true })
    expect(s.shown('/')).toContain(
      'Apache-2.0. Run it on your own server with one Docker command, or use ours at no cost.',
    )
    expect(s.shown('/')).toContain('Or use ours, which runs the same code.')
  })

  it('off: no "Connect your own AI" on the home page or /features', async () => {
    const s = await site({ BOOKS_LIVE: false })
    expect(s.shown('/')).not.toContain('Connect the AI you already use.')
    expect(s.shown('/features')).not.toContain('Connect your own AI')
    expect(s.html('/features')).not.toContain('id="connect-ai"')
    expect(s.shown('/features')).toContain('The assistant reading your books and proposing drafts your staff approve.')
  })

  it('on: "Connect your own AI" on both, and /features points to it', async () => {
    const s = await site({ BOOKS_LIVE: true })
    for (const p of ['/', '/features']) {
      expect(s.shown(p), p).toContain('An admin makes an API key in Settings.')
      expect(s.shown(p), p).toContain('Nothing happens until someone on your staff approves it.')
      expect(s.shown(p), p).toContain("The key's database role can't record a payment, a charge, a bill or a draw.")
    }
    expect(s.shown('/')).toContain('Connect the AI you already use.')
    expect(s.shown('/features')).toContain('Connect your own AI')
    expect(s.shown('/features')).toContain(
      'Any AI you connect with an API key can do this today (see Connect your own AI).',
    )
  })
})

describe('BOOKS_EMAIL_LIVE: the hosted books send email [after A, and the email sender]', () => {
  it('off: /features claims no email the books send by themselves', async () => {
    const s = await site({ BOOKS_LIVE: true, BOOKS_EMAIL_LIVE: false })
    expect(s.shown('/features')).not.toContain('Emails the books send by themselves')
    expect(s.shown('/features')).not.toMatch(/rent reminders before the due day/)
  })

  it('on: /features lists them', async () => {
    const s = await site({ BOOKS_LIVE: true, BOOKS_EMAIL_LIVE: true })
    expect(s.shown('/features')).toContain('Emails the books send by themselves')
    expect(s.shown('/features')).toContain('Your admins are emailed if a nightly run fails.')
  })
})

describe('PORTALS_LIVE: owners and tenants sign in on app.occupella.com [after B]', () => {
  it('off: the portals and tenant requests carry the Coming chip', async () => {
    const s = await site({ PORTALS_LIVE: false })
    expect(s.tour.filter((r) => /portal/i.test(r.who)).every((r) => r.coming)).toBe(true)
    expect(part(s.html('/'), 'id="tour"')).toContain('Tenant portal<span class="lp-coming">Coming</span>')
    expect(part(s.html('/features'), 'id="portals"')).toContain('class="lp-coming"')
    expect(s.html('/features')).toContain('Tenant requests<span class="lp-coming">Coming</span>')
    expect(s.shown('/features')).toContain('Owners and tenants sign in to them on app.occupella.com once that sign-in arrives.')
    expect(s.shown('/solutions/maintenance')).toContain('once tenant sign-in arrives')
    expect(s.shown('/solutions/owner-reporting')).toContain('once owner sign-in arrives')
  })

  it('on: no chip and no "once sign-in arrives" on any of them', async () => {
    const s = await site({ PORTALS_LIVE: true })
    expect(s.tour.some((r) => r.coming)).toBe(false)
    expect(s.html('/')).not.toContain('class="lp-coming"')
    expect(s.shown('/')).not.toContain('signing in to it on app.occupella.com is coming')
    expect(part(s.html('/features'), 'id="portals"')).not.toContain('class="lp-coming"')
    expect(s.html('/features')).not.toContain('Tenant requests<span class="lp-coming">')
    expect(s.shown('/features')).toContain('Owners and tenants sign in with the email you invite them at.')
    for (const p of ['/', '/features', '/solutions/maintenance', '/solutions/owner-reporting']) {
      expect(s.shown(p), p).not.toMatch(/sign-in arrives/)
    }
    for (const p of ['/solutions/maintenance', '/solutions/owner-reporting']) {
      expect(s.html(p), p).not.toContain('class="lp-coming"')
    }
    expect(s.shown('/')).toContain('They file repair requests and write to your staff from the same page.')
  })
})

describe("CHAT_READS_ONLY: the chat can't move money [after G]", () => {
  it("off: /security keeps today's wording with the Coming chip, /features today's AI section", async () => {
    const s = await site({ CHAT_READS_ONLY: false })
    expect(s.html('/security')).toContain("The assistant can&#x27;t move money<span class=\"lp-coming\">Coming</span>")
    expect(s.shown('/security')).toContain('it does so under a database role that can only read and propose drafts')
    const ai = text(part(s.html('/features'), 'id="ai-assistant"'))
    expect(ai).toContain("It can't move money")
    expect(ai).toContain('Reading your books')
    expect(ai).not.toContain('The assistant has no tool that records a payment')
  })

  it('on: /security loses the chip and takes the new wording, /features its new AI section', async () => {
    const s = await site({ CHAT_READS_ONLY: true })
    expect(s.html('/security')).not.toContain('class="lp-coming"')
    expect(s.shown('/security')).toContain(
      'Software you connect to the books with an API key runs under a database role whose only write is a draft for your staff to approve.',
    )
    const ai = text(part(s.html('/features'), 'id="ai-assistant"'))
    expect(ai).toContain('What it does today')
    expect(ai).toContain('The assistant has no tool that records a payment, a charge, a bill or a draw.')
    expect(ai).toContain('These cases are in the test suite, and a change that breaks one fails it.')
    expect(ai).not.toContain('Reading your books')
    expect(part(s.html('/features'), 'id="ai-assistant"')).not.toContain('class="lp-coming"')
    // Reading the books stays listed as not available.
    expect(text(part(s.html('/features'), 'data-not-yet'))).toContain('The assistant reading your books')
  })
})

describe('every flag on at once', () => {
  it('leaves no Coming chip on the pages the copy rewrote, but /pricing never had one', async () => {
    const s = await site({ BOOKS_LIVE: true, BOOKS_EMAIL_LIVE: true, PORTALS_LIVE: true, CHAT_READS_ONLY: true })
    for (const p of ['/', '/features', '/security', '/pricing']) expect(s.html(p), p).not.toContain('class="lp-coming"')
    // What still isn't available stays listed as such.
    expect(s.shown('/')).toContain('Not available yet')
    expect(s.shown('/features')).toContain('Not available yet')
  })
})
