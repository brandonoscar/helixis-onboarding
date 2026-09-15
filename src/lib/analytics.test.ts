// @vitest-environment jsdom
//
// ⚠ PER-FILE, not in vite.config.ts. The other three test files here are pure
// logic and run in `node`; switching the whole suite to jsdom would slow every
// one of them down to buy a DOM only this file needs. This module reaches for
// `document`, `localStorage` and `window.location`, so it is the exception
// rather than the new default.

/**
 * What the marketing site is allowed to measure, and what it must not.
 *
 * The app repo instruments fifteen product events and this site instrumented
 * none, so every one of those events was a count with no denominator. This
 * file guards the half that closes it — and, more importantly, guards the
 * three ways it could quietly become something worse than nothing:
 *
 *   1. RECORDING A STRANGER. `disable_session_recording` / `autocapture:
 *      false` / `respect_dnt` are one-word edits away from a public page that
 *      films whoever reads it. The app records deliberately, because its user
 *      signed an agreement; a prospect has agreed to nothing, so these three
 *      are the whole difference between counting page loads and surveillance.
 *
 *   2. SILENTLY LOSING COVERAGE. "One pageview per load is complete" is true
 *      only because every link is a plain `<a href>` and `main.tsx` routes on
 *      `window.location.pathname`. Client-side routing added later makes the
 *      claim false with nothing failing — so the absence of `pushState` is
 *      asserted rather than assumed.
 *
 *   3. LABELLING A PAGE AS SOMETHING THE ROUTER DOES NOT RENDER. `pageName`
 *      and `route()` are a producer/consumer pair and are read on BOTH sides
 *      here; a seventh route added to one and not the other is how a funnel
 *      breakdown starts quietly mis-attributing a page.
 *
 * ⚠ The module reads its key at IMPORT time, so every test that cares about
 * the configured/unconfigured split stubs the env FIRST and then dynamically
 * imports. A top-level import would freeze whichever state ran first.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

const posthogMock = vi.hoisted(() => ({
  init: vi.fn(),
  capture: vi.fn(),
}))

vi.mock('posthog-js', () => ({ default: posthogMock }))

const KEY = 'VITE_PUBLIC_POSTHOG_KEY'

async function loadWithKey(key: string | undefined) {
  vi.resetModules()
  if (key === undefined) vi.stubEnv(KEY, '')
  else vi.stubEnv(KEY, key)
  return import('./analytics')
}

beforeEach(() => {
  posthogMock.init.mockClear()
  posthogMock.capture.mockClear()
  vi.unstubAllEnvs()
})

// ── The privacy posture ─────────────────────────────────────────────

describe('what a visitor to a public page is subjected to', () => {
  it('never records their session, never autocaptures, and honours Do Not Track', async () => {
    const { initAnalytics } = await loadWithKey('phc_test')
    initAnalytics()

    expect(posthogMock.init).toHaveBeenCalledTimes(1)
    const config = posthogMock.init.mock.calls[0][1]

    // Each of these three is a deliberate divergence from the app's config.
    // Asserting them together is the point: the harm is not any one of them,
    // it is a public page that films a stranger who never agreed to anything.
    expect(config.disable_session_recording).toBe(true)
    expect(config.autocapture).toBe(false)
    expect(config.respect_dnt).toBe(true)
  })

  it('sends nothing at all when no key is configured', async () => {
    const { initAnalytics, watchStartClicks, analyticsConfigured } =
      await loadWithKey(undefined)

    expect(analyticsConfigured).toBe(false)
    initAnalytics()
    watchStartClicks()

    // A preview deploy and a local `npm run dev` must not reach the same
    // PostHog project the real numbers live in — otherwise every funnel
    // figure carries developer traffic nobody can separate out afterwards.
    expect(posthogMock.init).not.toHaveBeenCalled()
    expect(posthogMock.capture).not.toHaveBeenCalled()
  })

  it('does not start capturing for somebody who opted out', async () => {
    localStorage.setItem('occupella_analytics_opt_out', '1')
    try {
      const { initAnalytics } = await loadWithKey('phc_test')
      initAnalytics()
      // Read BEFORE the first capture, not after — the app's own reasoning:
      // opting out afterwards has already sent the load of the page the
      // person opted out on.
      expect(posthogMock.init.mock.calls[0][1].opt_out_capturing_by_default).toBe(
        true,
      )
    } finally {
      localStorage.removeItem('occupella_analytics_opt_out')
    }
  })
})

// ── The pageview ────────────────────────────────────────────────────

describe('the page load', () => {
  it('emits one named pageview carrying the page', async () => {
    const { initAnalytics } = await loadWithKey('phc_test')
    initAnalytics()

    expect(posthogMock.capture).toHaveBeenCalledWith('marketing_page_viewed', {
      page: expect.any(String),
    })
  })

  it('does not ALSO let PostHog send its own pageview', async () => {
    const { initAnalytics } = await loadWithKey('phc_test')
    initAnalytics()

    // Both firing double-counts every visit, and the automatic one carries no
    // `page` — so a breakdown would show half the traffic under a raw URL and
    // half under a name, which reads as a traffic split rather than as a bug.
    expect(posthogMock.init.mock.calls[0][1].capture_pageview).toBe(false)
    expect(posthogMock.capture).toHaveBeenCalledTimes(1)
  })
})

// ── pageName vs the real router ─────────────────────────────────────

const ROUTER_SOURCE = Object.values(
  import.meta.glob('../main.tsx', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
)[0] as string

/** Every `p.startsWith('/x')` prefix `main.tsx` actually routes on. */
function routerPrefixes(): string[] {
  const found = [...ROUTER_SOURCE.matchAll(/p\.startsWith\(['"](\/[a-z/]*)['"]\)/g)]
  return found.map((m) => m[1])
}

describe('the page label and the page rendered cannot disagree', () => {
  it('reads the router source at all', () => {
    // gotcha 49/100/101: a scan that finds zero is a claim to check, not a
    // result. Without this, a renamed file or a changed router shape makes
    // every assertion below vacuously true.
    expect(ROUTER_SOURCE.length).toBeGreaterThan(500)
    expect(routerPrefixes().length).toBeGreaterThanOrEqual(6)
  })

  it('names every route the router serves', async () => {
    const { pageName } = await loadWithKey('phc_test')

    for (const prefix of routerPrefixes()) {
      // `/oauth/callback` is handled before React mounts and is deliberately
      // not a page — it is an auto-closing popup belonging to a signed-in
      // wizard session (see main.tsx).
      if (prefix.startsWith('/oauth')) continue
      expect(
        pageName(prefix),
        `${prefix} is routed by main.tsx but has no analytics name — a new ` +
          `page would be filed under "not_found" in every breakdown`,
      ).not.toBe('not_found')
    }
  })

  it('collapses the shapes a raw pathname would split', async () => {
    const { pageName } = await loadWithKey('phc_test')

    // Without a stable name these are three rows in every chart, and the
    // question "does pricing lose people" needs a regex at read time.
    expect(pageName('/pricing')).toBe('pricing')
    expect(pageName('/pricing/')).toBe('pricing')
    expect(pageName('/pricing/anything')).toBe('pricing')
  })

  it('still calls an unrouted path not_found rather than inventing a page', async () => {
    const { pageName } = await loadWithKey('phc_test')

    // The other direction. A `pageName` that returned 'landing' for everything
    // would satisfy the route coverage test above perfectly, and would report
    // every mistyped URL as a landing-page visit.
    expect(pageName('/nope')).toBe('not_found')
    expect(pageName('/')).toBe('landing')
  })
})

// ── The claim that one pageview per load is complete ────────────────

const SOURCES = import.meta.glob('../**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

describe('the precondition the coverage claim rests on', () => {
  it('finds source files to scan', () => {
    expect(Object.keys(SOURCES).length).toBeGreaterThan(5)
  })

  it('has no client-side navigation anywhere', () => {
    const offenders = Object.entries(SOURCES)
      .filter(([path]) => !path.includes('.test.'))
      .filter(([, src]) =>
        /history\.(pushState|replaceState)\s*\(/.test(src),
      )
      .map(([path]) => path)

    // One pageview per LOAD is complete coverage only while a navigation IS a
    // load. Client-side routing silently converts this file from "counts
    // every page" into "counts the first page anybody lands on", with no
    // error and no failing test — so the precondition is the assertion.
    expect(
      offenders,
      'client-side navigation was added — lib/analytics.ts now needs a ' +
        'route-change hook, and its pageview is no longer complete',
    ).toEqual([])
  })
})

// ── The CTA listener ────────────────────────────────────────────────

describe('the primary call to action', () => {
  it('catches a click on any /start link, including ones added later', async () => {
    const { watchStartClicks } = await loadWithKey('phc_test')
    watchStartClicks()

    document.body.innerHTML =
      '<a href="/start"><span>Start setup</span></a>'
    const inner = document.querySelector('span')!
    inner.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    // The click lands on the text inside the styled anchor, never on the
    // anchor itself — a listener reading `event.target` directly measures
    // nothing. And a delegated listener is what makes the seventh /start
    // link somebody adds measured on the day it is written, rather than
    // silently missing the way a per-call-site onClick would be.
    expect(posthogMock.capture).toHaveBeenCalledWith(
      'marketing_start_clicked',
      { page: expect.any(String) },
    )
  })

  it('ignores clicks that are not the call to action', async () => {
    const { watchStartClicks } = await loadWithKey('phc_test')
    watchStartClicks()

    document.body.innerHTML =
      '<a href="/pricing">Pricing</a><button>Something</button>'
    document.querySelector('a')!.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    )
    document.querySelector('button')!.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    )

    // The other direction: a listener that fired on every click would pass
    // the test above and make the conversion figure meaningless.
    expect(posthogMock.capture).not.toHaveBeenCalled()
  })

  it('listens during the capture phase, because the click navigates away', async () => {
    const spy = vi.spyOn(document, 'addEventListener')
    try {
      const { watchStartClicks } = await loadWithKey('phc_test')
      watchStartClicks()

      const call = spy.mock.calls.find((c) => c[0] === 'click')
      expect(call).toBeDefined()
      // A bubbling listener can lose the race against the navigation the
      // click is about to start. This is the difference between measuring
      // the conversion and measuring the fast half of it.
      expect(call![2]).toBe(true)
    } finally {
      spy.mockRestore()
    }
  })
})

// ── Wiring ──────────────────────────────────────────────────────────

describe('where analytics is started', () => {
  it('starts after the OAuth-callback branch, never before it', () => {
    const oauth = ROUTER_SOURCE.indexOf("startsWith('/oauth/callback')")
    const init = ROUTER_SOURCE.indexOf('initAnalytics()')

    expect(oauth).toBeGreaterThan(-1)
    expect(init).toBeGreaterThan(-1)
    // That branch is an auto-closing popup belonging to a signed-in wizard
    // session. Counting it inflates every marketing figure with a window the
    // visitor never sees — and a behavioural test cannot see statement order
    // (gotcha 97's "present in the source, absent in effect").
    expect(
      init,
      'initAnalytics() must sit inside the else branch, after the OAuth ' +
        'popup short-circuit',
    ).toBeGreaterThan(oauth)
  })

  it('watches for CTA clicks too — an init with no events measures arrivals only', () => {
    expect(ROUTER_SOURCE).toContain('watchStartClicks()')
  })
})
