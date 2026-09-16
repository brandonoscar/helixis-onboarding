/**
 * The gate is only a gate if nothing goes around it.
 *
 * `lib/visitorTracking.test.ts` proves the policy is right. It cannot see any
 * of the four ways the policy stops governing the page, and each one leaves
 * the module perfectly correct and unused:
 *
 *   1. SOMEBODY PASTES APOLLO'S SNIPPET INTO index.html. This is the likely
 *      one, because it is what Apollo's own install instructions say to do —
 *      "loads as early as possible, inside the document head". Following
 *      those instructions bypasses consent entirely, for every visitor, with
 *      the consent bar still rendering underneath. That is the worst failure
 *      available here: the site would show a choice, record the answer, and
 *      track everybody regardless.
 *   2. The bar stops being rendered, so nobody is ever asked — in consent
 *      mode that silently means nobody is ever tracked, which reads as
 *      "Apollo isn't working" and gets debugged for an afternoon.
 *   3. The load stops being attempted at mount, so a returning visitor who
 *      already accepted is never tracked again — they are never re-asked
 *      either, by design, so the tracker simply goes quiet for them forever.
 *   4. The footer opt-out disappears, which removes the only decline in
 *      notice mode and makes the privacy policy's "you can switch it off"
 *      sentence false.
 *
 * Source text rather than rendering, via `?raw` — the alternative needs the
 * whole site mounted, and `node:fs` typechecks red in this project (no node
 * types in the frontend tsconfig).
 */

import { describe, expect, it } from 'vitest'

import consentBarSource from './ConsentBar.tsx?raw'
import indexHtml from '../index.html?raw'
import mainSource from './main.tsx?raw'
import siteSource from './Site.tsx?raw'

/** Every source file on the site, so a bypass anywhere is visible. */
const SOURCES = import.meta.glob('./**/*.{ts,tsx,html}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

describe('nothing loads Apollo except the gate', () => {
  it('found the site source to judge', () => {
    // gotchas 49/100/101 — a scan that finds zero is a claim to check, not a
    // result. Without this the assertion below is vacuously true and this
    // file reports green while measuring nothing.
    expect(Object.keys(SOURCES).length).toBeGreaterThan(8)
  })

  it('the tracker url appears in exactly one module', () => {
    const files = Object.entries(SOURCES)
      .filter(([, src]) => src.includes('assets.apollo.io'))
      .map(([path]) => path)
      .sort()

    // ⚠ Two entries, and both are correct: the module that injects it, and
    // the test that pins the url. A THIRD is the bypass — most likely
    // Apollo's raw snippet pasted somewhere it runs unconditionally.
    expect(files).toEqual(['./lib/visitorTracking.test.ts', './lib/visitorTracking.ts'])
  })

  it('index.html carries no tracking script', () => {
    // Checked separately because index.html is outside `src/` and so outside
    // the glob above — and it is the exact file Apollo's instructions point
    // at. A scan that could not see the most likely location of the defect
    // would be the wrong scan (gotcha 114).
    expect(indexHtml).not.toContain('apollo')
    expect(indexHtml).not.toContain('trackingFunctions')
  })
})

describe('the gate is actually mounted', () => {
  it('main.tsx attempts the load on every page', () => {
    // Not only from the bar's accept handler: a returning visitor who already
    // said yes is never asked again, so the mount is the only thing that can
    // track them.
    expect(mainSource).toMatch(/maybeLoadVisitorTracker\(\)/)
  })

  it('main.tsx renders the consent bar', () => {
    expect(mainSource).toMatch(/<ConsentBar\s*\/>/)
  })

  it('the load sits inside the branch that is not the OAuth popup', () => {
    // The popup auto-closes in 250ms and belongs to an authenticated wizard
    // session. Tracking it would count a window nobody sees as a visit, and
    // it is the one path here carrying a signed-in person's context.
    const popupAt = mainSource.indexOf("startsWith('/oauth/callback')")
    const loadAt = mainSource.indexOf('maybeLoadVisitorTracker()')
    expect(popupAt).toBeGreaterThan(-1)
    expect(loadAt).toBeGreaterThan(popupAt)
  })

  it('the footer offers the opt-out', () => {
    // The only decline in notice mode, and what makes the privacy policy's
    // "you can switch it off from the footer" sentence true.
    expect(siteSource).toMatch(/<TrackingOptOut\s*\/>/)
  })
})

describe('the bar asks before it decides', () => {
  it('its visibility comes from the policy, not from a local guess', () => {
    // A bar that renders unconditionally is the defect wearing the fix's
    // name: it would ask people who already answered, and ask them in notice
    // mode where consent is not the basis for collection.
    expect(consentBarSource).toMatch(/useState\(false\)/)
    expect(consentBarSource).toMatch(/setShow\(needsConsentPrompt\(\)\)/)
  })

  it('has no dismissal that is not an answer', () => {
    // ⚠ No "×". A visitor who closes the bar without answering has not
    // consented, and a close button that leaves the tracker running is how a
    // consent record becomes a fiction. Both buttons record a choice.
    expect(consentBarSource).not.toMatch(/aria-label="[Cc]lose"/)
    expect(consentBarSource).toMatch(/answer\('declined'\)/)
    expect(consentBarSource).toMatch(/answer\('accepted'\)/)
  })
})
