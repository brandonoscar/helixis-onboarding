// @vitest-environment jsdom
//
// ⚠ PER-FILE, matching analytics.test.ts. This module reaches for `document`,
// `localStorage` and `navigator`, so it needs a DOM; the pure-logic files here
// stay in `node` rather than paying for one they never use.

/**
 * When a third party is allowed to learn who is reading the landing page.
 *
 * This is not an analytics config test. Apollo's person-level mode requires
 * attesting that the site "obtained applicable consents", and the only thing
 * on our side that can make that sentence true is whether the script runs. So
 * every assertion here is really about one of three claims:
 *
 *   1. CONSENT MODE MEANS CONSENT. A visitor who has not answered has not
 *      consented, so the tracker must stay off for them. This is the single
 *      load-bearing property in the file — get it wrong and the attestation
 *      is false for the majority of visitors, silently, with the bar still
 *      rendering exactly as designed.
 *
 *   2. THE BROWSER'S ANSWER COUNTS IN BOTH MODES. The published privacy
 *      policy says "If your browser sends a Do Not Track signal, we collect
 *      nothing." Apollo honours no such signal by default. So this module is
 *      what keeps a sentence on a legal page true, and a regression here is a
 *      false legal statement rather than a lost metric.
 *
 *   3. "NO" MEANS NO, AND "0" DOES NOT MEAN NO. `doNotTrack === '0'` is a
 *      visitor who explicitly turned the signal OFF. A truthiness test reads
 *      that as a refusal and blocks the tracker for everybody who has ever
 *      opened the setting — a guard that is wrong in the quiet direction, and
 *      the exact shape a one-sided test passes against.
 *
 * ⚠ The module reads its env at IMPORT time, so every test stubs first and
 * then dynamically imports. A top-level import would freeze whichever mode
 * happened to run first and every later assertion would measure that one.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const APP_ID = 'app_test_id'

type Mode = 'notice' | 'consent'

/** Import the module fresh under a named configuration. */
async function load(opts: { mode?: Mode; appId?: string | undefined } = {}) {
  vi.resetModules()
  vi.stubEnv('VITE_PUBLIC_APOLLO_APP_ID', opts.appId === undefined ? APP_ID : opts.appId)
  vi.stubEnv('VITE_PUBLIC_APOLLO_CONSENT', opts.mode === 'consent' ? 'consent' : '')
  const mod = await import('./visitorTracking')
  mod.resetTrackerForTests()
  return mod
}

/** The tracker scripts currently in the document head. */
function injected(): HTMLScriptElement[] {
  return [...document.querySelectorAll('script')].filter((s) =>
    s.src.includes('assets.apollo.io'),
  )
}

/**
 * Set a browser privacy signal.
 *
 * ⚠ `configurable: true` is required — jsdom defines `doNotTrack` as a plain
 * accessor, and a second plain assignment throws rather than overriding, so a
 * fixture written the obvious way fails on the second test in the file.
 */
function setSignal(name: string, value: unknown, on: 'navigator' | 'window' = 'navigator') {
  const target = on === 'navigator' ? navigator : window
  Object.defineProperty(target, name, { value, configurable: true, writable: true })
}

beforeEach(() => {
  localStorage.clear()
  document.head.querySelectorAll('script').forEach((s) => s.remove())
  setSignal('doNotTrack', undefined)
  setSignal('msDoNotTrack', undefined)
  setSignal('globalPrivacyControl', undefined)
  setSignal('doNotTrack', undefined, 'window')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('consent mode — the gate person-level identification depends on', () => {
  it('does NOT load for a visitor who has not answered', async () => {
    const m = await load({ mode: 'consent' })

    expect(m.shouldLoadTracker()).toBe(false)
    m.maybeLoadVisitorTracker()
    expect(injected()).toHaveLength(0)

    // And the bar is shown, because the whole point of withholding the
    // tracker is that the question gets asked.
    expect(m.needsConsentPrompt()).toBe(true)
  })

  it('loads once the visitor accepts, and stops asking', async () => {
    const m = await load({ mode: 'consent' })
    m.recordChoice('accepted')

    expect(m.shouldLoadTracker()).toBe(true)
    m.maybeLoadVisitorTracker()
    expect(injected()).toHaveLength(1)
    expect(m.needsConsentPrompt()).toBe(false)
  })

  it('never loads for a visitor who declined', async () => {
    const m = await load({ mode: 'consent' })
    m.recordChoice('declined')

    expect(m.shouldLoadTracker()).toBe(false)
    m.maybeLoadVisitorTracker()
    expect(injected()).toHaveLength(0)
    expect(m.needsConsentPrompt()).toBe(false)
  })
})

describe('notice mode — company-level firmographics, opt-out', () => {
  it('loads by default', async () => {
    const m = await load({ mode: 'notice' })

    expect(m.shouldLoadTracker()).toBe(true)
    m.maybeLoadVisitorTracker()
    expect(injected()).toHaveLength(1)
  })

  it('shows no bar — the footer opt-out is the whole mechanism here', async () => {
    const m = await load({ mode: 'notice' })
    expect(m.needsConsentPrompt()).toBe(false)
  })

  it('respects a decline recorded from the footer', async () => {
    const m = await load({ mode: 'notice' })
    m.recordChoice('declined')

    expect(m.shouldLoadTracker()).toBe(false)
    m.maybeLoadVisitorTracker()
    expect(injected()).toHaveLength(0)
  })
})

describe('the browser can answer for the visitor, in both modes', () => {
  // Both modes, because the privacy policy's sentence is about the SITE and
  // does not know which mode is deployed. A guard that held in one mode only
  // would make that sentence true or false depending on an env var nobody
  // reading the policy can see.
  for (const mode of ['notice', 'consent'] as Mode[]) {
    it(`Do Not Track blocks the tracker in ${mode} mode`, async () => {
      setSignal('doNotTrack', '1')
      const m = await load({ mode })

      expect(m.browserRefusesTracking()).toBe(true)
      expect(m.shouldLoadTracker()).toBe(false)
      m.maybeLoadVisitorTracker()
      expect(injected()).toHaveLength(0)
    })

    it(`Global Privacy Control blocks the tracker in ${mode} mode`, async () => {
      setSignal('globalPrivacyControl', true)
      const m = await load({ mode })

      expect(m.shouldLoadTracker()).toBe(false)
      m.maybeLoadVisitorTracker()
      expect(injected()).toHaveLength(0)
    })
  }

  it('an explicit accept does NOT override Do Not Track', async () => {
    // The two signals disagree, and the refusal wins. A stored "accepted" can
    // be months old and from a different browser profile state; the header is
    // what this request is sending right now.
    setSignal('doNotTrack', '1')
    const m = await load({ mode: 'consent' })
    m.recordChoice('accepted')

    expect(m.shouldLoadTracker()).toBe(false)
  })

  it('is not asked to consent when it has already refused', async () => {
    setSignal('globalPrivacyControl', true)
    const m = await load({ mode: 'consent' })

    // Asking somebody who has already sent the signal is asking a question
    // they answered. The polite reading is to stop, not to negotiate.
    expect(m.needsConsentPrompt()).toBe(false)
  })

  it('reads doNotTrack on window as well as navigator', async () => {
    // Older Safari and IE put it on `window`. Checked because dropping it
    // costs nothing to write and silently narrows who is protected.
    setSignal('doNotTrack', '1', 'window')
    const m = await load({ mode: 'notice' })
    expect(m.browserRefusesTracking()).toBe(true)
  })

  it('reads the vendor-prefixed spelling', async () => {
    setSignal('msDoNotTrack', '1')
    const m = await load({ mode: 'notice' })
    expect(m.browserRefusesTracking()).toBe(true)
  })

  it('treats "0" as NOT a refusal — the truthiness trap', async () => {
    // ⚠ The distinguishing input for the whole guard. `'0'` is a non-empty
    // string, so `if (navigator.doNotTrack)` blocks the tracker for a visitor
    // who explicitly turned the signal off — wrong in the direction nobody
    // notices, because the symptom is missing data rather than an error.
    setSignal('doNotTrack', '0')
    const m = await load({ mode: 'notice' })

    expect(m.browserRefusesTracking()).toBe(false)
    expect(m.shouldLoadTracker()).toBe(true)
  })

  it('treats globalPrivacyControl false as NOT a refusal', async () => {
    setSignal('globalPrivacyControl', false)
    const m = await load({ mode: 'notice' })
    expect(m.browserRefusesTracking()).toBe(false)
  })
})

describe('an unconfigured deployment sends nothing', () => {
  it('never loads and never prompts without a tracker id', async () => {
    const m = await load({ mode: 'consent', appId: '' })

    expect(m.visitorTrackingConfigured).toBe(false)
    expect(m.shouldLoadTracker()).toBe(false)
    // ⚠ And no bar. Asking a preview-deploy visitor to consent to tracking
    // that cannot happen is a consent record for nothing, and it trains the
    // next reader to think the bar is decorative.
    expect(m.needsConsentPrompt()).toBe(false)

    m.recordChoice('accepted')
    m.maybeLoadVisitorTracker()
    expect(injected()).toHaveLength(0)
  })
})

describe('the injected script', () => {
  it('points at Apollo, async and deferred', async () => {
    const m = await load({ mode: 'notice' })
    m.maybeLoadVisitorTracker()

    const [el] = injected()
    // The url is transcribed from Apollo's own install snippet rather than
    // fetched at build time, so it is pinned here — a typo would otherwise
    // 404 in the browser and look exactly like "nobody visited".
    expect(el.src).toContain(
      'https://assets.apollo.io/micro/website-tracker/tracker.iife.js',
    )
    expect(el.async).toBe(true)
    expect(el.defer).toBe(true)
  })

  it('hands the app id to the tracker on load', async () => {
    const m = await load({ mode: 'notice' })
    m.maybeLoadVisitorTracker()

    const onLoad = vi.fn()
    ;(window as Window).trackingFunctions = { onLoad }
    injected()[0].onload?.(new Event('load'))

    // The second half of the transcription: a script that loads and is never
    // handed its app id collects nothing, with no error anywhere.
    expect(onLoad).toHaveBeenCalledWith({ appId: APP_ID })
  })

  it('does not throw when the tracker never defines its callback', async () => {
    const m = await load({ mode: 'notice' })
    m.maybeLoadVisitorTracker()
    delete (window as Window).trackingFunctions

    // A blocked or failed tracker must not take the page down with it. This
    // runs on the front door, where an exception costs a prospect.
    expect(() => injected()[0].onload?.(new Event('load'))).not.toThrow()
  })

  it('injects exactly once per page load', async () => {
    // Apollo's placement rules require one injection per load, and this is
    // called from both the initial mount and the bar's accept handler — so
    // the idempotence is the thing that lets both call sites exist.
    const m = await load({ mode: 'notice' })
    m.maybeLoadVisitorTracker()
    m.maybeLoadVisitorTracker()
    m.maybeLoadVisitorTracker()

    expect(injected()).toHaveLength(1)
  })
})

describe('storage that refuses to answer', () => {
  it('reads a blocked localStorage as "not asked", not as either answer', async () => {
    const m = await load({ mode: 'consent' })
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })

    try {
      // Not "accepted" — that would load the tracker for a visitor who never
      // consented, which is the failure this module exists to prevent. Not
      // "declined" either, which would make the bar unaskable forever in a
      // private window.
      expect(m.storedChoice()).toBeNull()
      expect(m.shouldLoadTracker()).toBe(false)
      expect(m.needsConsentPrompt()).toBe(true)
    } finally {
      spy.mockRestore()
    }
  })

  it('does not throw when a choice cannot be stored', async () => {
    const m = await load({ mode: 'consent' })
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })

    try {
      expect(() => m.recordChoice('declined')).not.toThrow()
    } finally {
      spy.mockRestore()
    }
  })

  it('ignores a stored value that is neither answer', async () => {
    const m = await load({ mode: 'consent' })
    localStorage.setItem('occupella_visitor_tracking_consent', 'yes-please')

    // Anything unrecognised is "not asked". A gate that accepted arbitrary
    // truthy strings could be opened by any other script on the page writing
    // to the same key.
    expect(m.storedChoice()).toBeNull()
    expect(m.shouldLoadTracker()).toBe(false)
  })
})

describe('the two opt-outs stay separate', () => {
  it('declining visitor tracking does not touch the PostHog opt-out key', async () => {
    const m = await load({ mode: 'notice' })
    m.recordChoice('declined')

    // They govern different things: one is our own anonymous page count, the
    // other is a third party being told which company is reading. Collapsing
    // them onto one key means declining one silently switches off the other,
    // which nobody asked for in either direction.
    expect(localStorage.getItem('occupella_analytics_opt_out')).toBeNull()
  })
})
